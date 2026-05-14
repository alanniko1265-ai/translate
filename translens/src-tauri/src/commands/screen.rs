use std::{
    fs,
    path::Path,
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};

use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Serialize;
use tauri::State;

type ScreenImage = image::ImageBuffer<image::Rgba<u8>, Vec<u8>>;

struct PendingScreenshotData {
    image: ScreenImage,
    image_base64: String,
    width: u32,
    height: u32,
}

pub struct PendingScreenshot(Mutex<Option<PendingScreenshotData>>);

impl PendingScreenshot {
    pub fn new() -> Self {
        Self(Mutex::new(None))
    }
}

#[derive(Serialize)]
pub struct ScreenSize {
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub async fn get_screen_size() -> Result<ScreenSize, String> {
    match xcap::Monitor::all() {
        Ok(monitors) => {
            if let Some(primary) = monitors.first() {
                Ok(ScreenSize {
                    width: primary.width().map_err(|e| e.to_string())?,
                    height: primary.height().map_err(|e| e.to_string())?,
                })
            } else {
                Err("No monitors found".into())
            }
        }
        Err(e) => Err(format!("Failed to get monitors: {}", e)),
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureResult {
    pub image_base64: String,
    pub width: u32,
    pub height: u32,
}

#[derive(Serialize)]
pub struct OcrResult {
    pub text: String,
}

#[tauri::command]
pub async fn capture_screen(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<CaptureResult, String> {
    let cropped = capture_cropped_image(x, y, width, height)?;
    let cropped_width = cropped.width();
    let cropped_height = cropped.height();

    Ok(CaptureResult {
        image_base64: encode_png_base64(&cropped)?,
        width: cropped_width,
        height: cropped_height,
    })
}

#[tauri::command]
pub async fn capture_screenshot_for_overlay(
    state: State<'_, PendingScreenshot>,
) -> Result<CaptureResult, String> {
    let image = capture_primary_monitor_image()?;
    let width = image.width();
    let height = image.height();
    let image_base64 = encode_png_base64(&image)?;

    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = Some(PendingScreenshotData {
        image,
        image_base64: image_base64.clone(),
        width,
        height,
    });

    Ok(CaptureResult {
        image_base64,
        width,
        height,
    })
}

#[tauri::command]
pub fn get_pending_screenshot(
    state: State<'_, PendingScreenshot>,
) -> Result<Option<CaptureResult>, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;

    Ok(guard.as_ref().map(|data| CaptureResult {
        image_base64: data.image_base64.clone(),
        width: data.width,
        height: data.height,
    }))
}

#[tauri::command]
pub fn clear_pending_screenshot(state: State<'_, PendingScreenshot>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}

#[tauri::command]
pub async fn ocr_screen_region(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<OcrResult, String> {
    let cropped = capture_cropped_image(x, y, width, height)?;
    recognize_image(cropped).await
}

#[tauri::command]
pub async fn ocr_pending_screenshot_region(
    state: State<'_, PendingScreenshot>,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<OcrResult, String> {
    let cropped = {
        let guard = state.0.lock().map_err(|e| e.to_string())?;
        let data = guard
            .as_ref()
            .ok_or("No pending screenshot is available for OCR")?;
        crop_image(&data.image, x, y, width, height)?
    };

    recognize_image(cropped).await
}

async fn recognize_image(cropped: ScreenImage) -> Result<OcrResult, String> {
    let path = temporary_ocr_image_path();

    cropped
        .save(&path)
        .map_err(|e| format!("Failed to save screenshot for OCR: {}", e))?;

    let path_for_task = path.clone();
    let ocr_join = tokio::task::spawn_blocking(move || run_windows_ocr_sync(&path_for_task))
        .await
        .map_err(|e| format!("Screenshot OCR task failed: {}", e))?;
    let ocr_text = ocr_join;
    let _ = fs::remove_file(&path);

    let text = ocr_text?.trim().to_string();
    if text.is_empty() {
        return Err(
            "未能从截图中识别到文字。请拖大选区或框住更清晰、更完整的一段文字后再试。".into(),
        );
    }

    Ok(OcrResult { text })
}

fn capture_cropped_image(x: i32, y: i32, width: u32, height: u32) -> Result<ScreenImage, String> {
    let image = capture_primary_monitor_image()?;
    crop_image(&image, x, y, width, height)
}

fn capture_primary_monitor_image() -> Result<ScreenImage, String> {
    let monitors = xcap::Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    monitors
        .first()
        .ok_or("No monitor found")?
        .capture_image()
        .map_err(|e| format!("Failed to capture screen: {}", e))
}

fn crop_image(
    image: &ScreenImage,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<ScreenImage, String> {
    let crop_x = x.max(0) as u32;
    let crop_y = y.max(0) as u32;
    let crop_width = width.min(image.width().saturating_sub(crop_x));
    let crop_height = height.min(image.height().saturating_sub(crop_y));

    if crop_width == 0 || crop_height == 0 {
        return Err("Capture bounds are outside of the current screen".into());
    }

    Ok(image::imageops::crop_imm(image, crop_x, crop_y, crop_width, crop_height).to_image())
}

fn encode_png_base64(image: &ScreenImage) -> Result<String, String> {
    let mut buffer = std::io::Cursor::new(Vec::new());
    image::DynamicImage::ImageRgba8(image.clone())
        .write_to(&mut buffer, image::ImageFormat::Png)
        .map_err(|e| format!("Failed to encode image: {}", e))?;

    Ok(STANDARD.encode(buffer.into_inner()))
}

fn temporary_ocr_image_path() -> std::path::PathBuf {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default();

    std::env::temp_dir().join(format!(
        "translens-ocr-{}-{}.png",
        std::process::id(),
        timestamp
    ))
}

#[cfg(target_os = "windows")]
fn run_windows_ocr_sync(path: &Path) -> Result<String, String> {
    use windows::core::HSTRING;
    use windows::Graphics::Imaging::BitmapDecoder;
    use windows::Media::Ocr::OcrEngine;
    use windows::Storage::{FileAccessMode, StorageFile};
    use windows::Win32::System::Com::{CoInitializeEx, COINIT_APARTMENTTHREADED};

    // WinRT OCR expects COM on the calling OS thread. Tokio may hop threads, so initialize per call.
    let hr = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) };
    const S_OK: i32 = 0;
    const S_FALSE: i32 = 1;
    const RPC_E_CHANGED_MODE: i32 = 0x80010106_u32 as i32;
    match hr.0 {
        S_OK | S_FALSE | RPC_E_CHANGED_MODE => {}
        code => {
            return Err(format!(
                "Failed to initialize COM for OCR (HRESULT 0x{:08X}).",
                code as u32
            ));
        }
    }

    let path_string = path.to_string_lossy().to_string();
    let hpath = HSTRING::from(path_string);

    let file = StorageFile::GetFileFromPathAsync(&hpath)
        .map_err(|e| format!("Windows OCR (open file): {}", e))?
        .get()
        .map_err(|e| format!("Windows OCR (open file wait): {}", e))?;

    let stream = file
        .OpenAsync(FileAccessMode::Read)
        .map_err(|e| format!("Windows OCR (OpenAsync): {}", e))?
        .get()
        .map_err(|e| format!("Windows OCR (OpenAsync wait): {}", e))?;

    let decoder = BitmapDecoder::CreateAsync(&stream)
        .map_err(|e| format!("Windows OCR (decoder): {}", e))?
        .get()
        .map_err(|e| format!("Windows OCR (decoder wait): {}", e))?;

    let bitmap = decoder
        .GetSoftwareBitmapAsync()
        .map_err(|e| format!("Windows OCR (bitmap): {}", e))?
        .get()
        .map_err(|e| format!("Windows OCR (bitmap wait): {}", e))?;

    let engine = OcrEngine::TryCreateFromUserProfileLanguages().map_err(|e| {
        format!(
            "Windows OCR is not available ({e}). Please install a language pack with OCR support in Windows Settings."
        )
    })?;

    let recognized = engine
        .RecognizeAsync(&bitmap)
        .map_err(|e| format!("Windows OCR (recognize): {}", e))?
        .get()
        .map_err(|e| format!("Windows OCR (recognize wait): {}", e))?;

    recognized
        .Text()
        .map_err(|e| format!("Windows OCR (text): {}", e))
        .map(|s| s.to_string())
}

#[cfg(not(target_os = "windows"))]
fn run_windows_ocr_sync(_path: &Path) -> Result<String, String> {
    Err("Screenshot OCR is currently only supported on Windows.".into())
}
