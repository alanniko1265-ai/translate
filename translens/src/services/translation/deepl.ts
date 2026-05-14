const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

interface DeeplResponse {
  translations: Array<{
    detected_source_language: string;
    text: string;
  }>;
}

export async function translateWithDeepl(
  text: string,
  targetLang: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<{ translatedText: string; detectedSourceLang: string }> {
  const body = new URLSearchParams({ text, target_lang: targetLang });

  const response = await fetch(DEEPL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepL 翻译失败: ${response.status} ${errorText}`);
  }

  const data: DeeplResponse = await response.json();
  return {
    translatedText: data.translations[0].text,
    detectedSourceLang: data.translations[0].detected_source_language,
  };
}
