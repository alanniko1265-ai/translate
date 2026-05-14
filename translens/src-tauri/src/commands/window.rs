use serde::Serialize;
use std::time::Duration;
use tauri::{Emitter, Manager, WebviewWindow, WebviewWindowBuilder};

use super::state::{PendingTranslation, TranslationData};

const DEFAULT_TRANSLATION_OVERLAY_WIDTH: f64 = 360.0;
const DEFAULT_TRANSLATION_OVERLAY_HEIGHT: f64 = 180.0;

#[derive(Serialize)]
pub struct CursorPosition {
    pub x: i32,
    pub y: i32,
}

fn build_overlay_url(pointer_placement: &str, pointer_offset: i32, loading: bool) -> String {
    let mut params = vec!["mode=translation-overlay".to_string()];

    if !pointer_placement.is_empty() && pointer_placement != "none" {
        params.push(format!("pointer_placement={}", pointer_placement));
        params.push(format!("pointer_offset={}", pointer_offset));
    }

    if loading {
        params.push("loading=1".to_string());
    }

    format!("index.html?{}", params.join("&"))
}

fn clone_pending_translation(
    pending: &PendingTranslation,
) -> Result<Option<TranslationData>, String> {
    let guard = pending.0.lock().map_err(|e| e.to_string())?;
    Ok(guard.clone())
}

fn emit_pointer_update(
    window: &WebviewWindow,
    pointer_placement: &str,
    pointer_offset: i32,
) -> Result<(), String> {
    window
        .emit(
            "pointer-placement-update",
            serde_json::json!({
                "pointerPlacement": pointer_placement,
                "pointerOffset": pointer_offset,
            }),
        )
        .map_err(|e| format!("Failed to emit pointer update: {}", e))
}

fn emit_translation_result(
    window: &WebviewWindow,
    pending: &PendingTranslation,
) -> Result<(), String> {
    if let Some(data) = clone_pending_translation(pending)? {
        window
            .emit("translation-result", data)
            .map_err(|e| format!("Failed to emit translation result: {}", e))?;
    }

    Ok(())
}

fn emit_translation_loading(window: &WebviewWindow) -> Result<(), String> {
    window
        .emit("translation-loading", serde_json::json!({}))
        .map_err(|e| format!("Failed to emit translation loading state: {}", e))
}

fn emit_screenshot_refresh(window: &WebviewWindow) -> Result<(), String> {
    window
        .emit("screenshot-overlay-refresh", serde_json::json!({}))
        .map_err(|e| format!("Failed to refresh screenshot overlay: {}", e))
}

fn build_screenshot_overlay(
    app: &tauri::AppHandle,
    visible: bool,
) -> Result<WebviewWindow, String> {
    WebviewWindowBuilder::new(
        app,
        "overlay",
        tauri::WebviewUrl::App("index.html?mode=overlay".into()),
    )
    .title("TransLens Screenshot Overlay")
    .fullscreen(true)
    .resizable(false)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .shadow(false)
    .focused(false)
    .focusable(false)
    .visible(visible)
    .build()
    .map_err(|e| format!("Failed to create overlay window: {}", e))
}

#[allow(clippy::too_many_arguments)]
fn build_translation_overlay(
    app: &tauri::AppHandle,
    x: i32,
    y: i32,
    width: f64,
    height: f64,
    pointer_placement: &str,
    pointer_offset: i32,
    loading: bool,
    visible: bool,
) -> Result<WebviewWindow, String> {
    let url = build_overlay_url(pointer_placement, pointer_offset, loading);

    WebviewWindowBuilder::new(
        app,
        "translation-overlay",
        tauri::WebviewUrl::App(url.into()),
    )
    .title("TransLens Translation")
    .inner_size(width, height)
    .min_inner_size(280.0, 160.0)
    .position(x as f64, y as f64)
    .resizable(false)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .shadow(true)
    .focused(false)
    .focusable(false)
    .visible(visible)
    .build()
    .map_err(|e| format!("Failed to create translation overlay: {}", e))
}

fn make_non_activating(window: &WebviewWindow) -> Result<(), String> {
    window
        .set_focusable(false)
        .map_err(|e| format!("Failed to keep window non-activating: {}", e))?;

    #[cfg(target_os = "windows")]
    {
        apply_no_activate_style(window)?;
    }

    Ok(())
}

fn show_non_activating(window: &WebviewWindow) -> Result<(), String> {
    make_non_activating(window)?;
    window
        .show()
        .map_err(|e| format!("Failed to show window: {}", e))?;

    #[cfg(target_os = "windows")]
    {
        place_topmost_without_activation(window)?;
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn apply_no_activate_style(window: &WebviewWindow) -> Result<(), String> {
    use windows::Win32::UI::WindowsAndMessaging::{
        GetWindowLongW, SetWindowLongW, GWL_EXSTYLE, WS_EX_NOACTIVATE,
    };

    let hwnd = window
        .hwnd()
        .map_err(|e| format!("Failed to get native window handle: {}", e))?;

    unsafe {
        let style = GetWindowLongW(hwnd, GWL_EXSTYLE);
        SetWindowLongW(hwnd, GWL_EXSTYLE, style | WS_EX_NOACTIVATE.0 as i32);
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn place_topmost_without_activation(window: &WebviewWindow) -> Result<(), String> {
    use windows::Win32::UI::WindowsAndMessaging::{
        SetWindowPos, HWND_TOPMOST, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE,
    };

    let hwnd = window
        .hwnd()
        .map_err(|e| format!("Failed to get native window handle: {}", e))?;

    unsafe {
        SetWindowPos(
            hwnd,
            Some(HWND_TOPMOST),
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
        )
        .map_err(|e| format!("Failed to keep window topmost without activation: {}", e))?;
    }

    Ok(())
}

pub fn prewarm_overlay_windows(app: &tauri::AppHandle) -> Result<(), String> {
    if app.get_webview_window("overlay").is_none() {
        let window = build_screenshot_overlay(app, false)?;
        make_non_activating(&window)?;
    }

    if app.get_webview_window("translation-overlay").is_none() {
        let window = build_translation_overlay(
            app,
            0,
            0,
            DEFAULT_TRANSLATION_OVERLAY_WIDTH,
            DEFAULT_TRANSLATION_OVERLAY_HEIGHT,
            "none",
            0,
            true,
            false,
        )?;
        make_non_activating(&window)?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_cursor_position() -> Result<CursorPosition, String> {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::POINT;
        use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

        let mut point = POINT::default();
        unsafe {
            GetCursorPos(&mut point)
                .map_err(|e| format!("Failed to get cursor position: {}", e))?;
        }
        Ok(CursorPosition {
            x: point.x,
            y: point.y,
        })
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Cursor position detection is only supported on Windows.".into())
    }
}

#[tauri::command]
pub async fn create_overlay(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(existing) = app.get_webview_window("overlay") {
        emit_screenshot_refresh(&existing)?;
        show_non_activating(&existing)?;
        return Ok(());
    }

    let window = build_screenshot_overlay(&app, true)?;
    make_non_activating(&window)?;

    Ok(())
}

#[tauri::command]
pub async fn close_overlay(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        window
            .hide()
            .map_err(|e| format!("Failed to hide overlay: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn create_translation_overlay(
    app: tauri::AppHandle,
    pending: tauri::State<'_, PendingTranslation>,
    x: i32,
    y: i32,
    width: f64,
    height: f64,
    pointer_placement: String,
    pointer_offset: i32,
    loading: Option<bool>,
) -> Result<(), String> {
    let is_loading = loading.unwrap_or(false);

    if let Some(existing) = app.get_webview_window("translation-overlay") {
        existing
            .set_size(tauri::PhysicalSize::new(width, height))
            .map_err(|e| format!("Failed to resize translation overlay: {}", e))?;
        existing
            .set_position(tauri::PhysicalPosition::new(x, y))
            .map_err(|e| format!("Failed to reposition translation overlay: {}", e))?;
        show_non_activating(&existing)?;
        emit_pointer_update(&existing, &pointer_placement, pointer_offset)?;

        if is_loading {
            emit_translation_loading(&existing)?;
        } else {
            emit_translation_result(&existing, &pending)?;
        }

        return Ok(());
    }

    let window = build_translation_overlay(
        &app,
        x,
        y,
        width,
        height,
        &pointer_placement,
        pointer_offset,
        is_loading,
        true,
    )?;
    make_non_activating(&window)?;

    if is_loading {
        let window_for_event = window.clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(Duration::from_millis(30)).await;
            let _ = window_for_event.emit("translation-loading", serde_json::json!({}));
        });
    } else if let Some(data) = clone_pending_translation(&pending)? {
        let window_for_event = window.clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(Duration::from_millis(30)).await;
            let _ = window_for_event.emit("translation-result", data);
        });
    }

    Ok(())
}

#[tauri::command]
pub async fn close_translation_overlay(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("translation-overlay") {
        window
            .hide()
            .map_err(|e| format!("Failed to hide translation overlay: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn cleanup_old_instances() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let current_pid = std::process::id();
        let output = Command::new("powershell")
            .args([
                "-Command",
                &format!(
                    "Get-Process translens -ErrorAction SilentlyContinue | Where-Object {{ $_.Id -ne {} }} | Stop-Process -Force",
                    current_pid
                ),
            ])
            .output()
            .map_err(|e| format!("Failed to run cleanup: {}", e))?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Cleanup failed: {}", stderr));
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn set_always_on_top(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .set_always_on_top(enabled)
            .map_err(|e| format!("Failed to set always on top: {}", e))?;
    }
    Ok(())
}
