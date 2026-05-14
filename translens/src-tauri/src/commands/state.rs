use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TranslationData {
    pub original_text: String,
    pub translated_text: String,
    pub source_lang: String,
    pub target_lang: String,
}

pub struct PendingTranslation(pub Mutex<Option<TranslationData>>);

impl PendingTranslation {
    pub fn new() -> Self {
        Self(Mutex::new(None))
    }
}

#[tauri::command]
pub fn store_pending_translation(
    state: State<PendingTranslation>,
    data: TranslationData,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = Some(data);
    Ok(())
}

#[tauri::command]
pub fn take_pending_translation(
    state: State<PendingTranslation>,
) -> Result<Option<TranslationData>, String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    Ok(guard.take())
}

#[tauri::command]
pub fn get_pending_translation(
    state: State<PendingTranslation>,
) -> Result<Option<TranslationData>, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    Ok(guard.clone())
}
