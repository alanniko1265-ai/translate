const GOOGLE_API_URL = "https://translation.googleapis.com/language/translate/v2";

interface GoogleResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage: string;
    }>;
  };
}

export async function translateWithGoogle(
  text: string,
  targetLang: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<{ translatedText: string; detectedSourceLang: string }> {
  const response = await fetch(`${GOOGLE_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, target: targetLang, source: "auto" }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google 翻译失败: ${response.status} ${errorText}`);
  }

  const data: GoogleResponse = await response.json();
  return {
    translatedText: data.data.translations[0].translatedText,
    detectedSourceLang: data.data.translations[0].detectedSourceLanguage,
  };
}
