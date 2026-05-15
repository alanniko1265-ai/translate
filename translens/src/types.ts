export interface Selection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  engine: TranslationEngine;
  timestamp: number;
}

export type TranslationEngine = "deepl" | "google" | "baidu" | "tencent" | "volcengine" | "aliyun" | "zhipu" | "azure" | "openai" | "deepseek" | "yandex" | "kimi";

export interface UserSettings {
  targetLang: string;
  engine: TranslationEngine;
  apiKeys: Record<TranslationEngine, string>;
  autoCopy: boolean;
  popupWidth: number;
  popupBorderRadius: number;
  popupOpacity: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: "left" | "center";
  selectionBgColor: string;
  selectionBorderColor: string;
  selectionBorderStyle: "dashed" | "solid" | "dotted";
  selectionBorderWidth: number;
  selectionBorderRadius: number;
  selectionBoxShadow: string;
  chatBubbleTheme: string;
  chatBubbleBgColor: string;
  chatBubbleTextColor: string;
  chatBubbleAccentColor: string;
  chatBubbleFontSize: number;
  chatBubbleAnimation: "spring" | "gentle" | "none";
  chatBubbleMaxWidth: number;
  chatBubbleOpacity: number;
  theme: "dark" | "light" | "system";
  launchOnStartup: boolean;
  silentMode: boolean;
  language: string;
  shortcuts: {
    translate: string;
    screenshot: string;
    toggle: string;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  targetLang: "ZH",
  engine: "google",
  apiKeys: { deepl: "", google: "", baidu: "", tencent: "", volcengine: "", aliyun: "", zhipu: "", azure: "", openai: "", deepseek: "", yandex: "", kimi: "" },
  autoCopy: false,
  popupWidth: 320,
  popupBorderRadius: 16,
  popupOpacity: 100,
  fontFamily: "system-ui",
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 1.6,
  letterSpacing: 0,
  textAlign: "left",
  selectionBgColor: "rgba(99, 102, 241, 0.15)",
  selectionBorderColor: "rgba(99, 102, 241, 0.8)",
  selectionBorderStyle: "dashed",
  selectionBorderWidth: 2,
  selectionBorderRadius: 4,
  selectionBoxShadow: "none",
  chatBubbleTheme: "dark-glass",
  chatBubbleBgColor: "rgba(15, 23, 42, 0.92)",
  chatBubbleTextColor: "#F8FAFC",
  chatBubbleAccentColor: "#6366F1",
  chatBubbleFontSize: 15,
  chatBubbleAnimation: "spring",
  chatBubbleMaxWidth: 380,
  chatBubbleOpacity: 92,
  theme: "dark",
  launchOnStartup: false,
  silentMode: false,
  language: "en",
  shortcuts: {
    translate: "Control+Shift+T",
    screenshot: "Control+Shift+S",
    toggle: "Control+Shift+H",
  },
};

export const LANGUAGES: Record<string, string> = {
  AF: "Afrikaans",
  AM: "አማርኛ",
  AR: "العربية",
  AZ: "Azərbaycan",
  BE: "Беларуская",
  BG: "Български",
  BN: "বাংলা",
  BS: "Bosanski",
  CA: "Català",
  CEB: "Cebuano",
  CS: "Čeština",
  CY: "Cymraeg",
  DA: "Dansk",
  DE: "Deutsch",
  EL: "Ελληνικά",
  EN: "English",
  EO: "Esperanto",
  ES: "Español",
  ET: "Eesti",
  EU: "Euskara",
  FA: "فارسی",
  FI: "Suomi",
  FR: "Français",
  GA: "Gaeilge",
  GL: "Galego",
  GU: "ગુજરાતી",
  HA: "Hausa",
  HE: "עברית",
  HI: "हिन्दी",
  HMN: "Hmong",
  HR: "Hrvatski",
  HT: "Kreyòl Ayisyen",
  HU: "Magyar",
  HY: "Հայերեն",
  ID: "Bahasa Indonesia",
  IG: "Igbo",
  IS: "Íslenska",
  IT: "Italiano",
  JA: "日本語",
  JW: "Basa Jawa",
  KA: "ქართული",
  KK: "Қазақ",
  KM: "ខ្មែរ",
  KN: "ಕನ್ನಡ",
  KO: "한국어",
  KU: "Kurdî",
  KY: "Кыргызча",
  LA: "Latina",
  LB: "Lëtzebuergesch",
  LO: "ລາວ",
  LT: "Lietuvių",
  LV: "Latviešu",
  MG: "Malagasy",
  MI: "Māori",
  MK: "Македонски",
  ML: "മലയാളം",
  MN: "Монгол",
  MR: "मराठी",
  MS: "Bahasa Melayu",
  MT: "Malti",
  MY: "မြန်မာ",
  NE: "नेपाली",
  NL: "Nederlands",
  NO: "Norsk",
  NY: "Chichewa",
  PA: "ਪੰਜਾਬੀ",
  PL: "Polski",
  PS: "پښتو",
  PT: "Português",
  RO: "Română",
  RU: "Русский",
  RW: "Kinyarwanda",
  SD: "سنڌي",
  SI: "සිංහල",
  SK: "Slovenčina",
  SL: "Slovenščina",
  SM: "Samoan",
  SN: "Shona",
  SO: "Soomaali",
  SQ: "Shqip",
  SR: "Српски",
  ST: "Sesotho",
  SU: "Basa Sunda",
  SV: "Svenska",
  SW: "Kiswahili",
  TA: "தமிழ்",
  TE: "తెలుగు",
  TG: "Тоҷикӣ",
  TH: "ไทย",
  TL: "Filipino",
  TR: "Türkçe",
  TT: "Татар",
  UG: "ئۇيغۇرچە",
  UK: "Українська",
  UR: "اردو",
  UZ: "O'zbek",
  VI: "Tiếng Việt",
  XH: "isiXhosa",
  YI: "ייִדיש",
  YO: "Yorùbá",
  ZH: "中文",
  ZU: "isiZulu",
};

export const FONT_PRESETS = [
  { name: "系统默认", fontFamily: "system-ui" },
  { name: "思源黑体", fontFamily: '"Noto Sans SC"' },
  { name: "苹方", fontFamily: '"PingFang SC"' },
  { name: "微软雅黑", fontFamily: '"Microsoft YaHei"' },
  { name: "楷体（文学风）", fontFamily: '"KaiTi"' },
];
