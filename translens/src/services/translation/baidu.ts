import { md5 } from "./md5";

const BAIDU_API_URL = "https://fanyi-api.baidu.com/api/trans/vip/translate";

interface BaiduResponse {
  from: string;
  to: string;
  trans_result: Array<{ src: string; dst: string }>;
  error_code?: string;
  error_msg?: string;
}

export async function translateWithBaidu(
  text: string,
  targetLang: string,
  apiKey: string, // format: "appid:secret"
  signal?: AbortSignal
): Promise<{ translatedText: string; detectedSourceLang: string }> {
  const [appid, secret] = apiKey.split(":");
  if (!appid || !secret) {
    throw new Error(
      "百度翻译需要 APP ID 和密钥，格式：APPID:密钥。请在设置中百度翻译处分别填写 APP ID 和密钥"
    );
  }

  const salt = Date.now().toString();
  const sign = md5(appid + text + salt + secret);

  const body = new URLSearchParams({
    q: text,
    from: "auto",
    to: targetLang.toLowerCase(),
    appid,
    salt,
    sign,
  });

  const response = await fetch(BAIDU_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal,
  });

  if (!response.ok) {
    throw new Error(`百度翻译失败: ${response.status}`);
  }

  const data: BaiduResponse = await response.json();

  if (data.error_code) {
    throw new Error(`百度翻译错误 [${data.error_code}]: ${data.error_msg}`);
  }

  return {
    translatedText: data.trans_result[0].dst,
    detectedSourceLang: data.from,
  };
}
