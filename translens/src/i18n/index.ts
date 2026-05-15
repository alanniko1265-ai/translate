import zhCN from "./locales/zh-CN";
import en from "./locales/en";
import ja from "./locales/ja";
import ko from "./locales/ko";
import fr from "./locales/fr";
import de from "./locales/de";
import es from "./locales/es";
import ru from "./locales/ru";
import pt from "./locales/pt";
import ar from "./locales/ar";
import it from "./locales/it";
import tr from "./locales/tr";
import { autoLocales } from "./auto-locales";

export type LocaleKey = keyof typeof en;

const locales: Record<string, Record<string, string>> = {
  "zh-CN": zhCN,
  "zh-TW": zhCN,
  en,
  ja,
  ko,
  fr,
  de,
  es,
  ru,
  pt,
  ar,
  it,
  tr,
  ...autoLocales,
};

export const SUPPORTED_LANGUAGES = [
  { value: "af", label: "Afrikaans" },
  { value: "am", label: "አማርኛ" },
  { value: "ar", label: "العربية" },
  { value: "az", label: "Azərbaycan" },
  { value: "be", label: "Беларуская" },
  { value: "bg", label: "Български" },
  { value: "bn", label: "বাংলা" },
  { value: "bs", label: "Bosanski" },
  { value: "ca", label: "Català" },
  { value: "cs", label: "Čeština" },
  { value: "cy", label: "Cymraeg" },
  { value: "da", label: "Dansk" },
  { value: "de", label: "Deutsch" },
  { value: "el", label: "Ελληνικά" },
  { value: "en", label: "English" },
  { value: "eo", label: "Esperanto" },
  { value: "es", label: "Español" },
  { value: "et", label: "Eesti" },
  { value: "eu", label: "Euskara" },
  { value: "fa", label: "فارسی" },
  { value: "fi", label: "Suomi" },
  { value: "fr", label: "Français" },
  { value: "ga", label: "Gaeilge" },
  { value: "gl", label: "Galego" },
  { value: "gu", label: "ગુજરાતી" },
  { value: "ha", label: "Hausa" },
  { value: "he", label: "עברית" },
  { value: "hi", label: "हिन्दी" },
  { value: "hr", label: "Hrvatski" },
  { value: "ht", label: "Kreyòl Ayisyen" },
  { value: "hu", label: "Magyar" },
  { value: "hy", label: "Հայերեն" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "ig", label: "Igbo" },
  { value: "is", label: "Íslenska" },
  { value: "it", label: "Italiano" },
  { value: "ja", label: "日本語" },
  { value: "jw", label: "Basa Jawa" },
  { value: "ka", label: "ქართული" },
  { value: "kk", label: "Қазақ" },
  { value: "km", label: "ខ្មែរ" },
  { value: "kn", label: "ಕನ್ನಡ" },
  { value: "ko", label: "한국어" },
  { value: "ku", label: "Kurdî" },
  { value: "ky", label: "Кыргызча" },
  { value: "la", label: "Latina" },
  { value: "lb", label: "Lëtzebuergesch" },
  { value: "lo", label: "ລາວ" },
  { value: "lt", label: "Lietuvių" },
  { value: "lv", label: "Latviešu" },
  { value: "mg", label: "Malagasy" },
  { value: "mi", label: "Māori" },
  { value: "mk", label: "Македонски" },
  { value: "ml", label: "മലയാളം" },
  { value: "mn", label: "Монгол" },
  { value: "mr", label: "मराठी" },
  { value: "ms", label: "Bahasa Melayu" },
  { value: "mt", label: "Malti" },
  { value: "my", label: "မြန်မာ" },
  { value: "ne", label: "नेपाली" },
  { value: "nl", label: "Nederlands" },
  { value: "no", label: "Norsk" },
  { value: "ny", label: "Chichewa" },
  { value: "pa", label: "ਪੰਜਾਬੀ" },
  { value: "pl", label: "Polski" },
  { value: "ps", label: "پښتو" },
  { value: "pt", label: "Português" },
  { value: "ro", label: "Română" },
  { value: "ru", label: "Русский" },
  { value: "rw", label: "Kinyarwanda" },
  { value: "sd", label: "سنڌي" },
  { value: "si", label: "සිංහල" },
  { value: "sk", label: "Slovenčina" },
  { value: "sl", label: "Slovenščina" },
  { value: "sm", label: "Samoan" },
  { value: "sn", label: "Shona" },
  { value: "so", label: "Soomaali" },
  { value: "sq", label: "Shqip" },
  { value: "sr", label: "Српски" },
  { value: "st", label: "Sesotho" },
  { value: "su", label: "Basa Sunda" },
  { value: "sv", label: "Svenska" },
  { value: "sw", label: "Kiswahili" },
  { value: "ta", label: "தமிழ்" },
  { value: "te", label: "తెలుగు" },
  { value: "tg", label: "Тоҷикӣ" },
  { value: "th", label: "ไทย" },
  { value: "tl", label: "Filipino" },
  { value: "tr", label: "Türkçe" },
  { value: "tt", label: "Татар" },
  { value: "ug", label: "ئۇيغۇرچە" },
  { value: "uk", label: "Українська" },
  { value: "ur", label: "اردو" },
  { value: "uz", label: "O'zbek" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "xh", label: "isiXhosa" },
  { value: "yi", label: "ייִדיש" },
  { value: "yo", label: "Yorùbá" },
  { value: "zh-CN", label: "中文（简体）" },
  { value: "zh-TW", label: "中文（繁體）" },
  { value: "zu", label: "isiZulu" },
];

function getLocale(lang: string): Record<string, string> {
  if (locales[lang]) return locales[lang];
  // Try base language code (e.g., "pt-BR" -> "pt")
  const base = lang.split("-")[0];
  if (locales[base]) return locales[base];
  return locales["en"];
}

/**
 * Get translated text by key.
 * Supports simple interpolation: t("key", { count: 5 }) replaces {count} with 5.
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  lang?: string
): string {
  const locale = lang || getCurrentLanguage();
  const messages = getLocale(locale);
  let text = messages[key] || locales["en"][key] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    });
  }

  return text;
}

let currentLanguage = "en";

export function setCurrentLanguage(lang: string) {
  currentLanguage = lang;
}

export function getCurrentLanguage(): string {
  return currentLanguage;
}
