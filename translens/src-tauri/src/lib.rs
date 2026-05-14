mod commands;

#[cfg(debug_assertions)]
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .manage(commands::state::PendingTranslation::new())
        .manage(commands::screen::PendingScreenshot::new())
        .setup(|_app| {
            if let Err(error) = commands::window::prewarm_overlay_windows(_app.handle()) {
                eprintln!("Failed to prewarm overlay windows: {}", error);
            }

            #[cfg(debug_assertions)]
            {
                let window = _app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::clipboard::read_clipboard,
            commands::clipboard::read_selected_text,
            commands::clipboard::write_clipboard,
            commands::screen::get_screen_size,
            commands::screen::capture_screen,
            commands::screen::capture_screenshot_for_overlay,
            commands::screen::get_pending_screenshot,
            commands::screen::clear_pending_screenshot,
            commands::screen::ocr_screen_region,
            commands::screen::ocr_pending_screenshot_region,
            commands::translation::translate_text,
            commands::window::cleanup_old_instances,
            commands::window::create_overlay,
            commands::window::close_overlay,
            commands::window::get_cursor_position,
            commands::window::create_translation_overlay,
            commands::window::close_translation_overlay,
            commands::window::set_always_on_top,
            commands::state::store_pending_translation,
            commands::state::take_pending_translation,
            commands::state::get_pending_translation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running TransLens");
}
