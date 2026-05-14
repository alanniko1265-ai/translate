use std::{
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use tauri_plugin_clipboard_manager::ClipboardExt;

#[cfg(target_os = "windows")]
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS, KEYEVENTF_KEYUP,
    VIRTUAL_KEY, VK_C, VK_CONTROL, VK_LWIN, VK_MENU, VK_RWIN, VK_SHIFT,
};

#[tauri::command]
pub async fn read_clipboard(app: tauri::AppHandle) -> Result<String, String> {
    app.clipboard()
        .read_text()
        .map_err(|e| format!("Failed to read clipboard: {}", e))
}

#[tauri::command]
pub async fn write_clipboard(app: tauri::AppHandle, text: String) -> Result<(), String> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| format!("Failed to write clipboard: {}", e))
}

#[tauri::command]
pub async fn read_selected_text(app: tauri::AppHandle) -> Result<String, String> {
    let previous_text = app.clipboard().read_text().ok();
    let marker = selection_marker();

    app.clipboard()
        .write_text(marker.clone())
        .map_err(|e| format!("Failed to prepare clipboard for selection copy: {}", e))?;
    thread::sleep(Duration::from_millis(30));

    send_copy_shortcut()?;
    thread::sleep(Duration::from_millis(120));

    let selected_text = read_clipboard_with_retry(&app, &marker, 24, Duration::from_millis(45))?;

    if let Some(previous_text) = previous_text {
        let _ = app.clipboard().write_text(previous_text);
    } else if selected_text == marker {
        let _ = app.clipboard().write_text(String::new());
    }

    let selected_text = selected_text.trim().to_string();
    if selected_text.is_empty() || selected_text == marker {
        return Err(
            "No selected text was copied. Select text first, then trigger the shortcut again."
                .into(),
        );
    }

    Ok(selected_text)
}

fn selection_marker() -> String {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();

    format!(
        "__TRANSLENS_SELECTION_MARKER_{}_{}__",
        std::process::id(),
        timestamp
    )
}

fn read_clipboard_with_retry(
    app: &tauri::AppHandle,
    marker: &str,
    attempts: usize,
    delay: Duration,
) -> Result<String, String> {
    let mut last_error = None;
    let mut last_text = None;

    for _ in 0..attempts {
        match app.clipboard().read_text() {
            Ok(text) => {
                if text != marker {
                    return Ok(text);
                }
                last_text = Some(text);
            }
            Err(error) => {
                last_error = Some(error.to_string());
            }
        }
        thread::sleep(delay);
    }

    if let Some(text) = last_text {
        return Ok(text);
    }

    Err(format!(
        "Failed to read selected text from clipboard: {}",
        last_error.unwrap_or_else(|| "unknown clipboard error".into())
    ))
}

#[cfg(target_os = "windows")]
fn send_copy_shortcut() -> Result<(), String> {
    let inputs = [
        keyboard_input(VK_SHIFT, KEYEVENTF_KEYUP),
        keyboard_input(VK_MENU, KEYEVENTF_KEYUP),
        keyboard_input(VK_LWIN, KEYEVENTF_KEYUP),
        keyboard_input(VK_RWIN, KEYEVENTF_KEYUP),
        keyboard_input(VK_CONTROL, KEYEVENTF_KEYUP),
        keyboard_input(VK_CONTROL, KEYBD_EVENT_FLAGS(0)),
        keyboard_input(VK_C, KEYBD_EVENT_FLAGS(0)),
        keyboard_input(VK_C, KEYEVENTF_KEYUP),
        keyboard_input(VK_CONTROL, KEYEVENTF_KEYUP),
    ];

    let sent = unsafe { SendInput(&inputs, std::mem::size_of::<INPUT>() as i32) };
    if sent != inputs.len() as u32 {
        return Err("Failed to send Ctrl+C to the active application.".into());
    }

    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn send_copy_shortcut() -> Result<(), String> {
    Err("Selection translation is currently only supported on Windows.".into())
}

#[cfg(target_os = "windows")]
fn keyboard_input(key: VIRTUAL_KEY, flags: KEYBD_EVENT_FLAGS) -> INPUT {
    INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: key,
                wScan: 0,
                dwFlags: flags,
                time: 0,
                dwExtraInfo: 0,
            },
        },
    }
}
