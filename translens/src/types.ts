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
  language: "zh-CN",
  shortcuts: {
    translate: "Control+Shift+T",
    screenshot: "Control+Shift+S",
    toggle: "Control+Shift+H",
  },
};

export const LANGUAGES: Record<string, string> = {
  ZH: "中文",
  EN: "English",
  JA: "日本語",
  KO: "한국어",
  FR: "Français",
  DE: "Deutsch",
  ES: "Español",
  RU: "Русский",
  PT: "Português",
  IT: "Italiano",
  AR: "العربية",
  TH: "ไทย",
  VI: "Tiếng Việt",
  ID: "Bahasa Indonesia",
  TR: "Türkçe",
  NL: "Nederlands",
  PL: "Polski",
  SV: "Svenska",
  DA: "Dansk",
  FI: "Suomi",
};

export const FONT_PRESETS = [
  { name: "系统默认", fontFamily: "system-ui" },
  { name: "思源黑体", fontFamily: '"Noto Sans SC"' },
  { name: "苹方", fontFamily: '"PingFang SC"' },
  { name: "微软雅黑", fontFamily: '"Microsoft YaHei"' },
  { name: "楷体（文学风）", fontFamily: '"KaiTi"' },
];
