use hmac::{Hmac, Mac};
use md5::{Digest, Md5};
use reqwest::header::AUTHORIZATION;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha1::Sha1;
use sha2::Sha256;
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TranslationEngine {
    Google,
    Deepl,
    Baidu,
    Tencent,
    Volcengine,
    Aliyun,
    Zhipu,
    Azure,
    Openai,
    Deepseek,
    Yandex,
    Kimi,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslateRequest {
    pub text: String,
    pub source_lang: String,
    pub target_lang: String,
    pub engine: TranslationEngine,
    pub api_key: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslateResponse {
    pub translated_text: String,
    pub detected_source_lang: String,
}

// --- Response structs ---

#[derive(Debug, Deserialize)]
struct GoogleTranslateEnvelope {
    data: GoogleTranslateData,
}

#[derive(Debug, Deserialize)]
struct GoogleTranslateData {
    translations: Vec<GoogleTranslation>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoogleTranslation {
    translated_text: String,
    detected_source_language: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DeepLTranslateEnvelope {
    translations: Vec<DeepLTranslation>,
}

#[derive(Debug, Deserialize)]
struct DeepLTranslation {
    text: String,
    detected_source_language: String,
}

#[derive(Debug, Deserialize)]
struct BaiduTranslateEnvelope {
    from: Option<String>,
    trans_result: Option<Vec<BaiduTranslation>>,
    error_code: Option<String>,
    error_msg: Option<String>,
}

#[derive(Debug, Deserialize)]
struct BaiduTranslation {
    dst: String,
}

#[derive(Debug, Deserialize)]
struct TencentResponse {
    #[serde(rename = "Response")]
    response: TencentResponseBody,
}

#[derive(Debug, Deserialize)]
struct TencentResponseBody {
    #[serde(rename = "TargetText")]
    target_text: Option<String>,
    #[serde(rename = "Source")]
    source: Option<String>,
    #[serde(rename = "Error")]
    error: Option<TencentError>,
    #[serde(rename = "RequestId")]
    _request_id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TencentError {
    #[serde(rename = "Code")]
    code: String,
    #[serde(rename = "Message")]
    message: String,
}

#[derive(Debug, Deserialize)]
struct VolcengineResponse {
    #[serde(rename = "ResponseMetadata")]
    _metadata: Option<Value>,
    #[serde(rename = "TranslationList")]
    translation_list: Option<Vec<VolcengineTranslation>>,
    #[serde(rename = "ResponseMetadataError")]
    error: Option<VolcengineError>,
}

#[derive(Debug, Deserialize)]
struct VolcengineTranslation {
    #[serde(rename = "Translation")]
    translation: String,
    #[serde(rename = "DetectedSourceLanguage")]
    detected_source_language: Option<String>,
}

#[derive(Debug, Deserialize)]
struct VolcengineError {
    #[serde(rename = "Code")]
    code: Option<String>,
    #[serde(rename = "Message")]
    message: Option<String>,
}

#[derive(Debug, Deserialize)]
struct AliyunResponse {
    #[serde(rename = "Code")]
    code: String,
    #[serde(rename = "Data")]
    data: Option<AliyunData>,
    #[serde(rename = "Message")]
    message: Option<String>,
}

#[derive(Debug, Deserialize)]
struct AliyunData {
    #[serde(rename = "Translated")]
    translated: String,
    #[serde(rename = "DetectedLanguage")]
    detected_language: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ZhipuResponse {
    choices: Option<Vec<ZhipuChoice>>,
    error: Option<ZhipuError>,
}

#[derive(Debug, Deserialize)]
struct ZhipuChoice {
    message: ZhipuMessage,
}

#[derive(Debug, Deserialize)]
struct ZhipuMessage {
    content: String,
}

#[derive(Debug, Deserialize)]
struct ZhipuError {
    code: Option<String>,
    message: Option<String>,
}

// Azure response is a JSON array: [{"translations":[{"text":"...","to":"..."}],"detectedLanguage":{"language":"...","score":1.0}}]

#[derive(Debug, Deserialize)]
struct AzureTranslateItem {
    translations: Vec<AzureTranslation>,
    #[serde(rename = "detectedLanguage")]
    detected_language: Option<AzureDetectedLanguage>,
}

#[derive(Debug, Deserialize)]
struct AzureTranslation {
    text: String,
}

#[derive(Debug, Deserialize)]
struct AzureDetectedLanguage {
    language: String,
}

#[derive(Debug, Deserialize)]
struct YandexResponse {
    translations: Option<Vec<YandexTranslation>>,
    #[serde(rename = "errorMessage")]
    error_message: Option<String>,
    #[serde(rename = "errorCode")]
    error_code: Option<i32>,
}

#[derive(Debug, Deserialize)]
struct YandexTranslation {
    text: String,
    #[serde(rename = "detectedLanguageCode")]
    detected_language_code: Option<String>,
}

// --- Main dispatch ---

#[tauri::command]
pub async fn translate_text(request: TranslateRequest) -> Result<TranslateResponse, String> {
    let text = request.text.trim();
    if text.is_empty() {
        return Err("Text to translate cannot be empty.".into());
    }

    let mut api_key = request.api_key.trim().to_string();
    if api_key.is_empty() {
        api_key = get_default_api_key(request.engine).unwrap_or_default();
    }
    if api_key.is_empty() {
        return Err("Missing API key for the selected translation engine.".into());
    }

    match request.engine {
        TranslationEngine::Google => {
            translate_with_google(text, &request.target_lang, &api_key).await
        }
        TranslationEngine::Deepl => {
            translate_with_deepl(text, &request.target_lang, &api_key).await
        }
        TranslationEngine::Baidu => {
            translate_with_baidu(text, &request.target_lang, &api_key).await
        }
        TranslationEngine::Tencent => {
            translate_with_tencent(text, &request.target_lang, &api_key).await
        }
        TranslationEngine::Volcengine => {
            translate_with_volcengine(text, &request.target_lang, &api_key).await
        }
        TranslationEngine::Aliyun => {
            translate_with_aliyun(text, &request.target_lang, &api_key).await
        }
        TranslationEngine::Zhipu => {
            translate_with_zhipu(text, &request.target_lang, &api_key).await
        }
        TranslationEngine::Azure => {
            translate_with_azure(text, &request.target_lang, &api_key).await
        }
        TranslationEngine::Openai => {
            translate_with_openai_compat(
                text,
                &request.target_lang,
                &api_key,
                "https://api.openai.com/v1/chat/completions",
                "gpt-4o-mini",
                "OpenAI",
            )
            .await
        }
        TranslationEngine::Deepseek => {
            translate_with_openai_compat(
                text,
                &request.target_lang,
                &api_key,
                "https://api.deepseek.com/v1/chat/completions",
                "deepseek-chat",
                "DeepSeek",
            )
            .await
        }
        TranslationEngine::Yandex => {
            translate_with_yandex(text, &request.target_lang, &api_key).await
        }
        TranslationEngine::Kimi => {
            translate_with_openai_compat(
                text,
                &request.target_lang,
                &api_key,
                "https://api.moonshot.cn/v1/chat/completions",
                "moonshot-v1-8k",
                "Kimi",
            )
            .await
        }
    }
}

// --- Default API Keys ---

fn get_default_api_key(engine: TranslationEngine) -> Option<String> {
    // Users must configure their own API keys in Settings.
    // No default keys are provided — get your own from the respective service.
    match engine {
        TranslationEngine::Google => None,
        TranslationEngine::Deepl => None,
        TranslationEngine::Baidu => None,
        TranslationEngine::Tencent => None,
        TranslationEngine::Volcengine => None,
        TranslationEngine::Aliyun => None,
        TranslationEngine::Zhipu => None,
        TranslationEngine::Azure => None,
        TranslationEngine::Openai => None,
        TranslationEngine::Deepseek => None,
        TranslationEngine::Yandex => None,
        TranslationEngine::Kimi => None,
    }
}

// --- Google ---

async fn translate_with_google(
    text: &str,
    target_lang: &str,
    api_key: &str,
) -> Result<TranslateResponse, String> {
    let target = map_target_lang(TranslationEngine::Google, target_lang)?;
    let client = reqwest::Client::new();
    let response = client
        .post("https://translation.googleapis.com/language/translate/v2")
        .query(&[("key", api_key)])
        .form(&[
            ("q", text.to_string()),
            ("target", target),
            ("format", "text".to_string()),
        ])
        .send()
        .await
        .map_err(|err| format!("Google request failed: {}", err))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|err| format!("Google response read failed: {}", err))?;

    if !status.is_success() {
        return Err(extract_http_error("Google failed", status.as_u16(), &body));
    }

    let payload: GoogleTranslateEnvelope = serde_json::from_str(&body)
        .map_err(|err| format!("Google response parse failed: {}", err))?;
    let translation = payload
        .data
        .translations
        .into_iter()
        .next()
        .ok_or_else(|| "Google returned no translation result.".to_string())?;

    Ok(TranslateResponse {
        translated_text: translation.translated_text,
        detected_source_lang: translation
            .detected_source_language
            .unwrap_or_else(|| "auto".to_string()),
    })
}

// --- DeepL ---

async fn translate_with_deepl(
    text: &str,
    target_lang: &str,
    api_key: &str,
) -> Result<TranslateResponse, String> {
    let target = map_target_lang(TranslationEngine::Deepl, target_lang)?;
    let endpoint = if api_key.ends_with(":fx") {
        "https://api-free.deepl.com/v2/translate"
    } else {
        "https://api.deepl.com/v2/translate"
    };

    let client = reqwest::Client::new();
    let response = client
        .post(endpoint)
        .header(AUTHORIZATION, format!("DeepL-Auth-Key {}", api_key))
        .form(&[("text", text.to_string()), ("target_lang", target)])
        .send()
        .await
        .map_err(|err| format!("DeepL request failed: {}", err))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|err| format!("DeepL response read failed: {}", err))?;

    if !status.is_success() {
        return Err(extract_http_error("DeepL failed", status.as_u16(), &body));
    }

    let payload: DeepLTranslateEnvelope = serde_json::from_str(&body)
        .map_err(|err| format!("DeepL response parse failed: {}", err))?;
    let translation = payload
        .translations
        .into_iter()
        .next()
        .ok_or_else(|| "DeepL returned no translation result.".to_string())?;

    Ok(TranslateResponse {
        translated_text: translation.text,
        detected_source_lang: translation.detected_source_language,
    })
}

// --- Baidu ---

async fn translate_with_baidu(
    text: &str,
    target_lang: &str,
    api_key: &str,
) -> Result<TranslateResponse, String> {
    let (appid, secret) = api_key
        .split_once(':')
        .map(|(appid, secret)| (appid.trim(), secret.trim()))
        .ok_or_else(|| "Baidu requires APP ID and secret in APPID:SECRET format.".to_string())?;

    if appid.is_empty() || secret.is_empty() {
        return Err("Baidu requires APP ID and secret in APPID:SECRET format.".into());
    }

    let target = map_target_lang(TranslationEngine::Baidu, target_lang)?;
    let salt = timestamp_millis();
    let sign = md5_hex(&format!("{}{}{}{}", appid, text, salt, secret));
    let client = reqwest::Client::new();
    let response = client
        .post("https://fanyi-api.baidu.com/api/trans/vip/translate")
        .form(&[
            ("q", text.to_string()),
            ("from", "auto".to_string()),
            ("to", target),
            ("appid", appid.to_string()),
            ("salt", salt),
            ("sign", sign),
        ])
        .send()
        .await
        .map_err(|err| format!("Baidu request failed: {}", err))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|err| format!("Baidu response read failed: {}", err))?;

    if !status.is_success() {
        return Err(extract_http_error("Baidu failed", status.as_u16(), &body));
    }

    let payload: BaiduTranslateEnvelope = serde_json::from_str(&body)
        .map_err(|err| format!("Baidu response parse failed: {}", err))?;

    if let Some(code) = payload.error_code {
        let message = payload
            .error_msg
            .unwrap_or_else(|| "unknown error".to_string());
        return Err(format_baidu_error(&code, &message));
    }

    let translation = payload
        .trans_result
        .and_then(|items| items.into_iter().next())
        .ok_or_else(|| "Baidu returned no translation result.".to_string())?;

    Ok(TranslateResponse {
        translated_text: translation.dst,
        detected_source_lang: payload.from.unwrap_or_else(|| "auto".to_string()),
    })
}

// --- Tencent Cloud TMT ---

async fn translate_with_tencent(
    text: &str,
    target_lang: &str,
    api_key: &str,
) -> Result<TranslateResponse, String> {
    let (secret_id, secret_key) = api_key
        .split_once(':')
        .map(|(id, key)| (id.trim(), key.trim()))
        .ok_or_else(|| {
            "Tencent Cloud requires SecretId and SecretKey in SecretId:SecretKey format."
                .to_string()
        })?;

    if secret_id.is_empty() || secret_key.is_empty() {
        return Err(
            "Tencent Cloud requires SecretId and SecretKey in SecretId:SecretKey format.".into(),
        );
    }

    let target = map_target_lang(TranslationEngine::Tencent, target_lang)?;
    let service = "tmt";
    let host = "tmt.tencentcloudapi.com";
    let action = "TextTranslate";
    let version = "2018-03-21";
    let region = "ap-guangzhou";
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let payload = serde_json::json!({
        "SourceText": text,
        "Source": "auto",
        "Target": target,
        "ProjectId": 0,
    })
    .to_string();

    let authorization = tc3_sign(
        secret_id, secret_key, service, host, action, version, region, &payload, timestamp,
    );

    let client = reqwest::Client::new();
    let response = client
        .post(format!("https://{}", host))
        .header("Authorization", &authorization)
        .header("Content-Type", "application/json")
        .header("Host", host)
        .header("X-TC-Action", action)
        .header("X-TC-Version", version)
        .header("X-TC-Timestamp", timestamp.to_string())
        .header("X-TC-Region", region)
        .body(payload)
        .send()
        .await
        .map_err(|err| format!("Tencent request failed: {}", err))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|err| format!("Tencent response read failed: {}", err))?;

    if !status.is_success() {
        return Err(extract_http_error("Tencent failed", status.as_u16(), &body));
    }

    let payload: TencentResponse = serde_json::from_str(&body)
        .map_err(|err| format!("Tencent response parse failed: {}", err))?;

    if let Some(error) = payload.response.error {
        return Err(format!("Tencent error [{}]: {}", error.code, error.message));
    }

    let translated = payload
        .response
        .target_text
        .ok_or_else(|| "Tencent returned no translation result.".to_string())?;
    let source = payload
        .response
        .source
        .unwrap_or_else(|| "auto".to_string());

    Ok(TranslateResponse {
        translated_text: translated,
        detected_source_lang: source,
    })
}

fn tc3_sign(
    secret_id: &str,
    secret_key: &str,
    service: &str,
    host: &str,
    _action: &str,
    _version: &str,
    _region: &str,
    payload: &str,
    timestamp: i64,
) -> String {
    let date = format_utc_date(timestamp);
    let credential_scope = format!("{}/{}/tc3_request", date, service);

    // Canonical request
    let hashed_payload = sha256_hex(payload.as_bytes());
    let canonical_headers = format!("content-type:application/json\nhost:{}\n", host);
    let signed_headers = "content-type;host";
    let canonical_request = format!(
        "POST\n/\n\n{}\n{}\n{}",
        canonical_headers, signed_headers, hashed_payload
    );
    let hashed_canonical_request = sha256_hex(canonical_request.as_bytes());

    // String to sign
    let string_to_sign = format!(
        "TC3-HMAC-SHA256\n{}\n{}\n{}",
        timestamp, credential_scope, hashed_canonical_request
    );

    // Signature
    let secret_key_bytes = format!("TC3{}", secret_key);
    let secret_date = hmac_sha256_bytes(secret_key_bytes.as_bytes(), date.as_bytes());
    let secret_service = hmac_sha256_bytes(&secret_date, service.as_bytes());
    let secret_signing = hmac_sha256_bytes(&secret_service, b"tc3_request");
    let signature = hmac_sha256_hex(&secret_signing, string_to_sign.as_bytes());

    format!(
        "TC3-HMAC-SHA256 Credential={}/{}, SignedHeaders={}, Signature={}",
        secret_id, credential_scope, signed_headers, signature
    )
}

fn format_utc_date(timestamp: i64) -> String {
    // timestamp is seconds since epoch
    let secs = timestamp;
    let days = secs / 86400;
    // Simple date calculation from Unix epoch
    let (y, m, d) = civil_from_days(days as i64);
    format!("{:04}-{:02}-{:02}", y, m, d)
}

fn civil_from_days(days: i64) -> (i64, u32, u32) {
    // Algorithm from Howard Hinnant
    let z = days + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = (z - era * 146097) as u32;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}

// --- Volcengine ---

async fn translate_with_volcengine(
    text: &str,
    target_lang: &str,
    api_key: &str,
) -> Result<TranslateResponse, String> {
    let (access_key, secret_key) = api_key
        .split_once(':')
        .map(|(id, key)| (id.trim(), key.trim()))
        .ok_or_else(|| {
            "Volcengine requires AccessKey and SecretKey in AccessKey:SecretKey format.".to_string()
        })?;

    if access_key.is_empty() || secret_key.is_empty() {
        return Err(
            "Volcengine requires AccessKey and SecretKey in AccessKey:SecretKey format.".into(),
        );
    }

    let target = map_target_lang(TranslationEngine::Volcengine, target_lang)?;
    let service = "translate";
    let region = "cn-north-1";
    let host = "translate.volcengineapi.com";
    let action = "TranslateText";
    let version = "2020-06-01";

    let payload = serde_json::json!({
        "SourceLanguage": "auto",
        "TargetLanguage": target,
        "TextList": [text],
    })
    .to_string();

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap();
    let timestamp_secs = now.as_secs();
    let date_str = format_utc_date(timestamp_secs as i64);
    let datetime_str = format_utc_datetime(timestamp_secs);

    let authorization = volcengine_sign(
        access_key,
        secret_key,
        service,
        region,
        host,
        action,
        version,
        &payload,
        &date_str,
        &datetime_str,
    );

    let client = reqwest::Client::new();
    let response = client
        .post(format!(
            "https://{}?Action={}&Version={}",
            host, action, version
        ))
        .header("Authorization", &authorization)
        .header("Content-Type", "application/json")
        .header("Host", host)
        .header("X-Date", &datetime_str)
        .header("X-Content-Sha256", &sha256_hex(payload.as_bytes()))
        .body(payload)
        .send()
        .await
        .map_err(|err| format!("Volcengine request failed: {}", err))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|err| format!("Volcengine response read failed: {}", err))?;

    if !status.is_success() {
        return Err(extract_http_error(
            "Volcengine failed",
            status.as_u16(),
            &body,
        ));
    }

    let result: VolcengineResponse = serde_json::from_str(&body).map_err(|err| {
        format!(
            "Volcengine response parse failed: {} body: {}",
            err,
            &body[..body.len().min(500)]
        )
    })?;

    if let Some(error) = result.error {
        let code = error.code.unwrap_or_else(|| "Unknown".to_string());
        let message = error.message.unwrap_or_else(|| "unknown error".to_string());
        return Err(format!("Volcengine error [{}]: {}", code, message));
    }

    let translations = result
        .translation_list
        .ok_or_else(|| "Volcengine returned no translation result.".to_string())?;
    let first = translations
        .into_iter()
        .next()
        .ok_or_else(|| "Volcengine returned empty translation list.".to_string())?;

    Ok(TranslateResponse {
        translated_text: first.translation,
        detected_source_lang: first
            .detected_source_language
            .unwrap_or_else(|| "auto".to_string()),
    })
}

fn volcengine_sign(
    access_key: &str,
    secret_key: &str,
    service: &str,
    region: &str,
    host: &str,
    _action: &str,
    _version: &str,
    payload: &str,
    date_str: &str,
    datetime_str: &str,
) -> String {
    let credential_scope = format!("{}/{}/{}/request", date_str, region, service);

    // Canonical request
    let hashed_payload = sha256_hex(payload.as_bytes());
    let canonical_headers = format!(
        "content-type:application/json\nhost:{}\nx-content-sha256:{}\nx-date:{}\n",
        host, hashed_payload, datetime_str
    );
    let signed_headers = "content-type;host;x-content-sha256;x-date";
    let canonical_request = format!(
        "POST\n/\n\n{}\n{}\n{}",
        canonical_headers, signed_headers, hashed_payload
    );
    let hashed_canonical_request = sha256_hex(canonical_request.as_bytes());

    // String to sign
    let algorithm = "HMAC-SHA256";
    let string_to_sign = format!(
        "{}\n{}\n{}\n{}",
        algorithm, datetime_str, credential_scope, hashed_canonical_request
    );

    // Signing key derivation
    let k_date = hmac_sha256_bytes(
        format!("HMAC{}", secret_key).as_bytes(),
        date_str.as_bytes(),
    );
    let k_region = hmac_sha256_bytes(&k_date, region.as_bytes());
    let k_service = hmac_sha256_bytes(&k_region, service.as_bytes());
    let k_signing = hmac_sha256_bytes(&k_service, b"request");

    let signature = hmac_sha256_hex(&k_signing, string_to_sign.as_bytes());

    format!(
        "HMAC-SHA256 Credential={}/{}, SignedHeaders={}, Signature={}",
        access_key, credential_scope, signed_headers, signature
    )
}

fn format_utc_datetime(timestamp_secs: u64) -> String {
    let secs = timestamp_secs;
    let days = (secs / 86400) as i64;
    let day_secs = (secs % 86400) as u32;
    let (y, m, d) = civil_from_days(days);
    let h = day_secs / 3600;
    let min = (day_secs % 3600) / 60;
    let s = day_secs % 60;
    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", y, m, d, h, min, s)
}

// --- Aliyun ---

async fn translate_with_aliyun(
    text: &str,
    target_lang: &str,
    api_key: &str,
) -> Result<TranslateResponse, String> {
    let (access_key_id, access_key_secret) = api_key
        .split_once(':')
        .map(|(id, key)| (id.trim(), key.trim()))
        .ok_or_else(|| {
            "Aliyun requires AccessKey ID and Secret in AccessKeyId:Secret format.".to_string()
        })?;

    if access_key_id.is_empty() || access_key_secret.is_empty() {
        return Err("Aliyun requires AccessKey ID and Secret in AccessKeyId:Secret format.".into());
    }

    let target = map_target_lang(TranslationEngine::Aliyun, target_lang)?;
    let source = "auto";

    let timestamp = format_utc_datetime_aliyun();

    let mut params = BTreeMap::new();
    params.insert("AccessKeyId", access_key_id.to_string());
    params.insert("Action", "TranslateGeneral".to_string());
    params.insert("Format", "JSON".to_string());
    params.insert("FormatType", "text".to_string());
    params.insert("Region", "cn-hangzhou".to_string());
    params.insert("SignatureMethod", "HMAC-SHA1".to_string());
    params.insert("SignatureNonce", timestamp_nonce());
    params.insert("SignatureVersion", "1.0".to_string());
    params.insert("SourceLanguage", source.to_string());
    params.insert("SourceText", text.to_string());
    params.insert("TargetLanguage", target);
    params.insert("Timestamp", timestamp);
    params.insert("Version", "2018-10-12".to_string());

    let canonical_query = build_aliyun_canonical_query(&params);
    let string_to_sign = format!(
        "GET&{}&{}",
        percent_encode("/"),
        percent_encode(&canonical_query)
    );
    let signature = hmac_sha1_base64(access_key_secret, &string_to_sign);
    let signature_encoded = percent_encode(&signature);

    let url = format!(
        "https://mt.aliyuncs.com/?{}&Signature={}",
        canonical_query, signature_encoded
    );

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|err| format!("Aliyun request failed: {}", err))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|err| format!("Aliyun response read failed: {}", err))?;

    if !status.is_success() {
        return Err(extract_http_error("Aliyun failed", status.as_u16(), &body));
    }

    let result: AliyunResponse = serde_json::from_str(&body)
        .map_err(|err| format!("Aliyun response parse failed: {}", err))?;

    if result.code != "200" {
        let message = result
            .message
            .unwrap_or_else(|| "unknown error".to_string());
        return Err(format!("Aliyun error [{}]: {}", result.code, message));
    }

    let data = result
        .data
        .ok_or_else(|| "Aliyun returned no translation result.".to_string())?;

    Ok(TranslateResponse {
        translated_text: data.translated,
        detected_source_lang: data.detected_language.unwrap_or_else(|| "auto".to_string()),
    })
}

fn build_aliyun_canonical_query(params: &BTreeMap<&str, String>) -> String {
    params
        .iter()
        .map(|(k, v)| format!("{}={}", percent_encode(k), percent_encode(v)))
        .collect::<Vec<_>>()
        .join("&")
}

fn percent_encode(s: &str) -> String {
    let mut result = String::with_capacity(s.len() * 3);
    for byte in s.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                result.push(byte as char);
            }
            _ => {
                result.push_str(&format!("%{:02X}", byte));
            }
        }
    }
    result
}

fn hmac_sha1_base64(secret: &str, data: &str) -> String {
    type HmacSha1 = Hmac<Sha1>;
    let key = format!("{}&", secret);
    let mut mac = HmacSha1::new_from_slice(key.as_bytes()).expect("HMAC-SHA1 key");
    mac.update(data.as_bytes());
    let result = mac.finalize().into_bytes();
    base64_encode(&result)
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();
    let chunks = data.chunks(3);
    for chunk in chunks {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

fn format_utc_datetime_aliyun() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap();
    let secs = now.as_secs();
    let days = (secs / 86400) as i64;
    let day_secs = (secs % 86400) as u32;
    let (y, m, d) = civil_from_days(days);
    let h = day_secs / 3600;
    let min = (day_secs % 3600) / 60;
    let s = day_secs % 60;
    let ms = now.subsec_millis();
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
        y, m, d, h, min, s, ms
    )
}

fn timestamp_nonce() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap();
    format!("{}{}", now.as_secs(), now.subsec_nanos())
}

// --- ZhipuAI (GLM) ---

async fn translate_with_zhipu(
    text: &str,
    target_lang: &str,
    api_key: &str,
) -> Result<TranslateResponse, String> {
    let (api_key_id, api_key_secret) = api_key
        .split_once('.')
        .map(|(id, key)| (id.trim(), key.trim()))
        .ok_or_else(|| {
            "ZhipuAI requires API key and secret in APIKey.Secret format.".to_string()
        })?;

    if api_key_id.is_empty() || api_key_secret.is_empty() {
        return Err("ZhipuAI requires API key and secret in APIKey.Secret format.".into());
    }

    let target_name = target_lang_name(target_lang);
    let system_prompt = "你是一个专业的翻译助手。请将用户输入的文本翻译成目标语言，只返回翻译结果，不要添加任何解释或补充内容。";
    let user_prompt = format!("翻译成{}：\n{}", target_name, text);

    let token = generate_zhipu_jwt(api_key_id, api_key_secret);

    let body = serde_json::json!({
        "model": "glm-4",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 4096,
    });

    let client = reqwest::Client::new();
    let response = client
        .post("https://open.bigmodel.cn/api/paas/v4/chat/completions")
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|err| format!("ZhipuAI request failed: {}", err))?;

    let status = response.status();
    let resp_body = response
        .text()
        .await
        .map_err(|err| format!("ZhipuAI response read failed: {}", err))?;

    if !status.is_success() {
        return Err(extract_http_error(
            "ZhipuAI failed",
            status.as_u16(),
            &resp_body,
        ));
    }

    let result: ZhipuResponse = serde_json::from_str(&resp_body)
        .map_err(|err| format!("ZhipuAI response parse failed: {}", err))?;

    if let Some(error) = result.error {
        let code = error.code.unwrap_or_else(|| "unknown".to_string());
        let message = error.message.unwrap_or_else(|| "unknown error".to_string());
        return Err(format!("ZhipuAI error [{}]: {}", code, message));
    }

    let choices = result
        .choices
        .ok_or_else(|| "ZhipuAI returned no translation result.".to_string())?;
    let first = choices
        .into_iter()
        .next()
        .ok_or_else(|| "ZhipuAI returned empty choices.".to_string())?;
    let translated = first.message.content.trim().to_string();

    Ok(TranslateResponse {
        translated_text: translated,
        detected_source_lang: "auto".to_string(),
    })
}

fn generate_zhipu_jwt(api_key: &str, secret: &str) -> String {
    let header = serde_json::json!({
        "alg": "HS256",
        "sign_type": "SIGN"
    });
    let now_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;
    let exp = now_ms / 1000 + 3600; // 1 hour expiry
    let payload = serde_json::json!({
        "api_key": api_key,
        "exp": exp,
        "timestamp": now_ms
    });

    let header_b64 = base64url_encode(header.to_string().as_bytes());
    let payload_b64 = base64url_encode(payload.to_string().as_bytes());
    let signing_input = format!("{}.{}", header_b64, payload_b64);
    let signature = hmac_sha256_bytes(secret.as_bytes(), signing_input.as_bytes());
    let signature_b64 = base64url_encode(&signature);

    format!("{}.{}.{}", header_b64, payload_b64, signature_b64)
}

fn base64url_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let mut result = String::new();
    let chunks = data.chunks(3);
    for chunk in chunks {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        }
        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        }
    }
    result
}

fn target_lang_name(code: &str) -> &str {
    match code.trim().to_uppercase().as_str() {
        "ZH" => "中文",
        "EN" => "English",
        "JA" => "日本語",
        "KO" => "한국어",
        "FR" => "Français",
        "DE" => "Deutsch",
        "ES" => "Español",
        "RU" => "Русский",
        "PT" => "Português",
        "IT" => "Italiano",
        "AR" => "العربية",
        "TH" => "ไทย",
        "VI" => "Tiếng Việt",
        "ID" => "Bahasa Indonesia",
        "TR" => "Türkçe",
        "NL" => "Nederlands",
        "PL" => "Polski",
        "SV" => "Svenska",
        "DA" => "Dansk",
        "FI" => "Suomi",
        _ => "English",
    }
}

// --- Azure ---

async fn translate_with_azure(
    text: &str,
    target_lang: &str,
    api_key: &str,
) -> Result<TranslateResponse, String> {
    let (key, region) = api_key
        .split_once(':')
        .map(|(k, r)| (k.trim(), r.trim()))
        .ok_or_else(|| "Azure requires API key and region in key:region format.".to_string())?;

    if key.is_empty() || region.is_empty() {
        return Err("Azure requires API key and region in key:region format.".into());
    }

    let target = map_target_lang(TranslationEngine::Azure, target_lang)?;
    let url = format!(
        "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to={}",
        target
    );

    let body = serde_json::json!([{"Text": text}]);

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("Ocp-Apim-Subscription-Key", key)
        .header("Ocp-Apim-Subscription-Region", region)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|err| format!("Azure request failed: {}", err))?;

    let status = response.status();
    let resp_body = response
        .text()
        .await
        .map_err(|err| format!("Azure response read failed: {}", err))?;

    if !status.is_success() {
        return Err(extract_http_error(
            "Azure failed",
            status.as_u16(),
            &resp_body,
        ));
    }

    let items: Vec<AzureTranslateItem> = serde_json::from_str(&resp_body)
        .map_err(|err| format!("Azure response parse failed: {}", err))?;

    let first_item = items
        .into_iter()
        .next()
        .ok_or_else(|| "Azure returned no translation result.".to_string())?;

    let translation = first_item
        .translations
        .into_iter()
        .next()
        .ok_or_else(|| "Azure returned empty translations.".to_string())?;

    let detected = first_item
        .detected_language
        .map(|d| d.language)
        .unwrap_or_else(|| "auto".to_string());

    Ok(TranslateResponse {
        translated_text: translation.text,
        detected_source_lang: detected,
    })
}

// --- Yandex ---

async fn translate_with_yandex(
    text: &str,
    target_lang: &str,
    api_key: &str,
) -> Result<TranslateResponse, String> {
    let key = api_key.trim();
    if key.is_empty() {
        return Err("Yandex requires an API key.".into());
    }

    let target = map_target_lang(TranslationEngine::Yandex, target_lang)?;

    let body = serde_json::json!({
        "sourceLanguageCode": "auto",
        "targetLanguageCode": target,
        "texts": [text],
    });

    let client = reqwest::Client::new();
    let response = client
        .post("https://translate.api.cloud.yandex.net/translate/v2/translate")
        .header("Authorization", format!("Api-Key {}", key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|err| format!("Yandex request failed: {}", err))?;

    let status = response.status();
    let resp_body = response
        .text()
        .await
        .map_err(|err| format!("Yandex response read failed: {}", err))?;

    if !status.is_success() {
        return Err(extract_http_error(
            "Yandex failed",
            status.as_u16(),
            &resp_body,
        ));
    }

    let result: YandexResponse = serde_json::from_str(&resp_body)
        .map_err(|err| format!("Yandex response parse failed: {}", err))?;

    if let Some(msg) = result.error_message {
        let code = result.error_code.unwrap_or(0);
        return Err(format!("Yandex error [{}]: {}", code, msg));
    }

    let translations = result
        .translations
        .ok_or_else(|| "Yandex returned no translation result.".to_string())?;
    let first = translations
        .into_iter()
        .next()
        .ok_or_else(|| "Yandex returned empty translations.".to_string())?;

    Ok(TranslateResponse {
        translated_text: first.text,
        detected_source_lang: first
            .detected_language_code
            .unwrap_or_else(|| "auto".to_string()),
    })
}

// --- OpenAI-compatible LLM translation (OpenAI / DeepSeek / Kimi) ---

async fn translate_with_openai_compat(
    text: &str,
    target_lang: &str,
    api_key: &str,
    endpoint: &str,
    model: &str,
    provider: &str,
) -> Result<TranslateResponse, String> {
    let key = api_key.trim();
    if key.is_empty() {
        return Err(format!("{} requires an API key.", provider));
    }

    let target_name = target_lang_name(target_lang);
    let system_prompt = "你是一个专业的翻译助手。请将用户输入的文本翻译成目标语言，只返回翻译结果，不要添加任何解释或补充内容。";
    let user_prompt = format!("翻译成{}：\n{}", target_name, text);

    let body = serde_json::json!({
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 4096,
    });

    let client = reqwest::Client::new();
    let response = client
        .post(endpoint)
        .header("Authorization", format!("Bearer {}", key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|err| format!("{} request failed: {}", provider, err))?;

    let status = response.status();
    let resp_body = response
        .text()
        .await
        .map_err(|err| format!("{} response read failed: {}", provider, err))?;

    if !status.is_success() {
        return Err(extract_http_error(
            &format!("{} failed", provider),
            status.as_u16(),
            &resp_body,
        ));
    }

    // Reuse ZhipuResponse since the format is the same (OpenAI-compatible)
    let result: ZhipuResponse = serde_json::from_str(&resp_body)
        .map_err(|err| format!("{} response parse failed: {}", provider, err))?;

    if let Some(error) = result.error {
        let code = error.code.unwrap_or_else(|| "unknown".to_string());
        let message = error.message.unwrap_or_else(|| "unknown error".to_string());
        return Err(format!("{} error [{}]: {}", provider, code, message));
    }

    let choices = result
        .choices
        .ok_or_else(|| format!("{} returned no translation result.", provider))?;
    let first = choices
        .into_iter()
        .next()
        .ok_or_else(|| format!("{} returned empty choices.", provider))?;
    let translated = first.message.content.trim().to_string();

    Ok(TranslateResponse {
        translated_text: translated,
        detected_source_lang: "auto".to_string(),
    })
}

// --- Crypto helpers ---

type HmacSha256 = Hmac<Sha256>;

fn hmac_sha256_bytes(key: &[u8], data: &[u8]) -> Vec<u8> {
    let mut mac = HmacSha256::new_from_slice(key).expect("HMAC-SHA256 key");
    mac.update(data);
    mac.finalize().into_bytes().to_vec()
}

fn hmac_sha256_hex(key: &[u8], data: &[u8]) -> String {
    hex::encode(hmac_sha256_bytes(key, data))
}

fn sha256_hex(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hex::encode(hasher.finalize())
}

// --- Language mapping ---

fn map_target_lang(engine: TranslationEngine, target_lang: &str) -> Result<String, String> {
    let normalized = target_lang.trim().to_uppercase();
    let mapped = match engine {
        TranslationEngine::Google => match normalized.as_str() {
            "ZH" => "zh-CN",
            "EN" => "en",
            "JA" => "ja",
            "KO" => "ko",
            "FR" => "fr",
            "DE" => "de",
            "ES" => "es",
            "RU" => "ru",
            "PT" => "pt",
            "IT" => "it",
            "AR" => "ar",
            "TH" => "th",
            "VI" => "vi",
            "ID" => "id",
            "TR" => "tr",
            "NL" => "nl",
            "PL" => "pl",
            "SV" => "sv",
            "DA" => "da",
            "FI" => "fi",
            _ => {
                return Err(format!(
                    "Google does not support target language: {}",
                    target_lang
                ))
            }
        },
        TranslationEngine::Deepl => match normalized.as_str() {
            "ZH" => "ZH",
            "EN" => "EN-US",
            "JA" => "JA",
            "KO" => "KO",
            "FR" => "FR",
            "DE" => "DE",
            "ES" => "ES",
            "RU" => "RU",
            "PT" => "PT-PT",
            "IT" => "IT",
            "AR" => "AR",
            "TH" => "TH",
            "VI" => "VI",
            "ID" => "ID",
            "TR" => "TR",
            "NL" => "NL",
            "PL" => "PL",
            "SV" => "SV",
            "DA" => "DA",
            "FI" => "FI",
            _ => {
                return Err(format!(
                    "DeepL does not support target language: {}",
                    target_lang
                ))
            }
        },
        TranslationEngine::Baidu => match normalized.as_str() {
            "ZH" => "zh",
            "EN" => "en",
            "JA" => "jp",
            "KO" => "kor",
            "FR" => "fra",
            "DE" => "de",
            "ES" => "spa",
            "RU" => "ru",
            "PT" => "pt",
            "IT" => "it",
            "AR" => "ara",
            "TH" => "th",
            "VI" => "vie",
            "ID" => "id",
            "TR" => "tr",
            "NL" => "nl",
            "PL" => "pl",
            "SV" => "swe",
            "DA" => "dan",
            "FI" => "fin",
            _ => {
                return Err(format!(
                    "Baidu does not support target language: {}",
                    target_lang
                ))
            }
        },
        TranslationEngine::Tencent => match normalized.as_str() {
            "ZH" => "zh",
            "EN" => "en",
            "JA" => "ja",
            "KO" => "ko",
            "FR" => "fr",
            "DE" => "de",
            "ES" => "es",
            "RU" => "ru",
            "PT" => "pt",
            "IT" => "it",
            "AR" => "ar",
            "TH" => "th",
            "VI" => "vi",
            "ID" => "id",
            "TR" => "tr",
            "NL" => "nl",
            "PL" => "pl",
            "SV" => "sv",
            "DA" => "da",
            "FI" => "fi",
            _ => {
                return Err(format!(
                    "Tencent does not support target language: {}",
                    target_lang
                ))
            }
        },
        TranslationEngine::Volcengine => match normalized.as_str() {
            "ZH" => "zh",
            "EN" => "en",
            "JA" => "ja",
            "KO" => "ko",
            "FR" => "fr",
            "DE" => "de",
            "ES" => "es",
            "RU" => "ru",
            "PT" => "pt",
            "IT" => "it",
            "AR" => "ar",
            "TH" => "th",
            "VI" => "vi",
            "ID" => "id",
            "TR" => "tr",
            "NL" => "nl",
            "PL" => "pl",
            "SV" => "sv",
            "DA" => "da",
            "FI" => "fi",
            _ => {
                return Err(format!(
                    "Volcengine does not support target language: {}",
                    target_lang
                ))
            }
        },
        TranslationEngine::Aliyun => match normalized.as_str() {
            "ZH" => "zh",
            "EN" => "en",
            "JA" => "ja",
            "KO" => "ko",
            "FR" => "fr",
            "DE" => "de",
            "ES" => "es",
            "RU" => "ru",
            "PT" => "pt",
            "IT" => "it",
            "AR" => "ar",
            "TH" => "th",
            "VI" => "vi",
            "ID" => "id",
            "TR" => "tr",
            "NL" => "nl",
            "PL" => "pl",
            "SV" => "sv",
            "DA" => "da",
            "FI" => "fi",
            _ => {
                return Err(format!(
                    "Aliyun does not support target language: {}",
                    target_lang
                ))
            }
        },
        TranslationEngine::Zhipu => match normalized.as_str() {
            "ZH" | "EN" | "JA" | "KO" | "FR" | "DE" | "ES" | "RU" | "PT" | "IT" | "AR" | "TH"
            | "VI" | "ID" | "TR" | "NL" | "PL" | "SV" | "DA" | "FI" => normalized.as_str(),
            _ => {
                return Err(format!(
                    "ZhipuAI does not support target language: {}",
                    target_lang
                ))
            }
        },
        TranslationEngine::Azure => match normalized.as_str() {
            "ZH" => "zh-Hans",
            "EN" => "en",
            "JA" => "ja",
            "KO" => "ko",
            "FR" => "fr",
            "DE" => "de",
            "ES" => "es",
            "RU" => "ru",
            "PT" => "pt",
            "IT" => "it",
            "AR" => "ar",
            "TH" => "th",
            "VI" => "vi",
            "ID" => "id",
            "TR" => "tr",
            "NL" => "nl",
            "PL" => "pl",
            "SV" => "sv",
            "DA" => "da",
            "FI" => "fi",
            _ => {
                return Err(format!(
                    "Azure does not support target language: {}",
                    target_lang
                ))
            }
        },
        TranslationEngine::Openai | TranslationEngine::Deepseek | TranslationEngine::Kimi => {
            match normalized.as_str() {
                "ZH" | "EN" | "JA" | "KO" | "FR" | "DE" | "ES" | "RU" | "PT" | "IT" | "AR"
                | "TH" | "VI" | "ID" | "TR" | "NL" | "PL" | "SV" | "DA" | "FI" => {
                    normalized.as_str()
                }
                _ => {
                    return Err(format!(
                        "{} does not support target language: {}",
                        "LLM", target_lang
                    ))
                }
            }
        }
        TranslationEngine::Yandex => match normalized.as_str() {
            "ZH" => "zh",
            "EN" => "en",
            "JA" => "ja",
            "KO" => "ko",
            "FR" => "fr",
            "DE" => "de",
            "ES" => "es",
            "RU" => "ru",
            "PT" => "pt",
            "IT" => "it",
            "AR" => "ar",
            "TH" => "th",
            "VI" => "vi",
            "ID" => "id",
            "TR" => "tr",
            "NL" => "nl",
            "PL" => "pl",
            "SV" => "sv",
            "DA" => "da",
            "FI" => "fi",
            _ => {
                return Err(format!(
                    "Yandex does not support target language: {}",
                    target_lang
                ))
            }
        },
    };

    Ok(mapped.to_string())
}

// --- Error helpers ---

fn extract_http_error(prefix: &str, status: u16, body: &str) -> String {
    let detail = serde_json::from_str::<Value>(body)
        .ok()
        .and_then(|value| {
            value
                .get("error")
                .and_then(|error| {
                    error
                        .get("message")
                        .and_then(Value::as_str)
                        .or_else(|| error.as_str())
                })
                .map(str::to_owned)
                .or_else(|| {
                    value
                        .get("message")
                        .and_then(Value::as_str)
                        .map(str::to_owned)
                })
        })
        .unwrap_or_else(|| body.trim().to_string());

    if detail.is_empty() {
        format!("{}: HTTP {}", prefix, status)
    } else {
        format!("{}: HTTP {} {}", prefix, status, detail)
    }
}

fn format_baidu_error(code: &str, message: &str) -> String {
    let hint = match code {
        "52003" => Some(
            "Use the APPID and secret from Baidu Translate Open Platform, and make sure General Translation API is enabled.",
        ),
        "54001" => Some("The signature is invalid. Check whether the APPID and secret belong to the same Baidu Translate app."),
        "54003" => Some("The request rate is limited. Try again later or reduce shortcut trigger frequency."),
        "54004" => Some("The Baidu account balance is insufficient."),
        "58000" => Some("The client IP is not allowed. Clear or update the IP whitelist in Baidu Translate settings."),
        "58001" => Some("The target language is not supported by Baidu for this request."),
        _ => None,
    };

    match hint {
        Some(hint) => format!("Baidu error [{}]: {}. {}", code, message, hint),
        None => format!("Baidu error [{}]: {}", code, message),
    }
}

// --- Utility ---

fn md5_hex(input: &str) -> String {
    let mut hasher = Md5::new();
    hasher.update(input.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn timestamp_millis() -> String {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis().to_string())
        .unwrap_or_else(|_| "0".to_string())
}
