import type {
  TranslationEngine,
  TranslationResult,
  UserSettings,
} from "../../types";
import { translateText } from "./index";

const ENGINE_ORDER: TranslationEngine[] = ["google", "deepl", "baidu", "zhipu", "azure", "openai", "deepseek", "yandex", "kimi", "tencent", "volcengine", "aliyun"];

export const ENGINE_LABELS: Record<TranslationEngine, string> = {
  google: "Google 翻译",
  deepl: "DeepL",
  baidu: "百度翻译",
  tencent: "腾讯云翻译",
  volcengine: "火山翻译",
  aliyun: "阿里云翻译",
  zhipu: "智谱AI (GLM)",
  azure: "Microsoft Azure",
  openai: "OpenAI (GPT)",
  deepseek: "DeepSeek",
  yandex: "Yandex Translate",
  kimi: "Kimi (月之暗面)",
};

const DETECTED_LANGUAGE_ALIASES: Record<string, string> = {
  auto: "auto",
  zh: "ZH",
  "zh-cn": "ZH",
  "zh-tw": "ZH",
  en: "EN",
  ja: "JA",
  jp: "JA",
  ko: "KO",
  kor: "KO",
  fr: "FR",
  fra: "FR",
  de: "DE",
  es: "ES",
  spa: "ES",
  ru: "RU",
  pt: "PT",
  it: "IT",
  ar: "AR",
  ara: "AR",
  th: "TH",
  vi: "VI",
  vie: "VI",
  id: "ID",
  tr: "TR",
  nl: "NL",
  pl: "PL",
  sv: "SV",
  swe: "SV",
  da: "DA",
  dan: "DA",
  fi: "FI",
  fin: "FI",
};

const HAS_DEFAULT_KEY: Partial<Record<TranslationEngine, boolean>> = {
  baidu: true,
  zhipu: true,
};

export function isApiKeyConfigured(
  engine: TranslationEngine,
  apiKey: string | undefined
): boolean {
  const value = apiKey?.trim() ?? "";
  if (!value) return Boolean(HAS_DEFAULT_KEY[engine]);

  if (engine === "zhipu") {
    const [apikey, secret] = value.split(".", 2);
    return Boolean(apikey?.trim() && secret?.trim());
  }
  if (engine === "baidu" || engine === "tencent" || engine === "volcengine" || engine === "aliyun" || engine === "azure") {
    const [appid, secret] = value.split(":", 2);
    return Boolean(appid?.trim() && secret?.trim());
  }

  return true;
}

export function resolveTranslationEngine(
  settings: UserSettings
): { engine: TranslationEngine; autoSwitched: boolean } {
  if (isApiKeyConfigured(settings.engine, settings.apiKeys[settings.engine])) {
    return { engine: settings.engine, autoSwitched: false };
  }

  const fallbackEngine = ENGINE_ORDER.find((engine) =>
    isApiKeyConfigured(engine, settings.apiKeys[engine])
  );

  if (!fallbackEngine) {
    throw new Error("No available translation API key is configured.");
  }

  return {
    engine: fallbackEngine,
    autoSwitched: fallbackEngine !== settings.engine,
  };
}

export function getTranslationReadiness(settings: UserSettings): {
  ready: boolean;
  engine: TranslationEngine | null;
  message: string;
} {
  try {
    const { engine, autoSwitched } = resolveTranslationEngine(settings);

    return {
      ready: true,
      engine,
      message: autoSwitched
        ? `Using fallback engine: ${ENGINE_LABELS[engine]}`
        : `Using engine: ${ENGINE_LABELS[engine]}`,
    };
  } catch (error) {
    return {
      ready: false,
      engine: null,
      message:
        error instanceof Error
          ? error.message
          : "No available translation API key is configured.",
    };
  }
}

export async function copyTranslatedText(text: string) {
  try {
    const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
    await writeText(text);
  } catch {
    await navigator.clipboard.writeText(text);
  }
}

export async function performTranslation(
  text: string,
  settings: UserSettings,
  signal?: AbortSignal
): Promise<{
  translation: TranslationResult;
  engine: TranslationEngine;
  autoSwitched: boolean;
}> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error("Text to translate cannot be empty.");
  }

  const { engine, autoSwitched } = resolveTranslationEngine(settings);
  const result = await translateText(
    {
      text: trimmedText,
      sourceLang: "auto",
      targetLang: settings.targetLang,
      engine,
    },
    settings.apiKeys,
    signal
  );

  if (settings.autoCopy) {
    await copyTranslatedText(result.translatedText);
  }

  return {
    engine,
    autoSwitched,
    translation: {
      originalText: trimmedText,
      translatedText: result.translatedText,
      sourceLang: normalizeDetectedLanguage(result.detectedSourceLang),
      targetLang: settings.targetLang,
      engine,
      timestamp: Date.now(),
    },
  };
}

function normalizeDetectedLanguage(language: string): string {
  const normalized = language.trim().toLowerCase();
  return DETECTED_LANGUAGE_ALIASES[normalized] ?? language.toUpperCase();
}

export function normalizeShortcut(shortcut: string) {
  return shortcut
    .trim()
    .replace(/\s+/g, "")
    .split("+")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();

      if (lower === "ctrl" || lower === "control") return "Control";
      if (lower === "cmd" || lower === "command") return "Control";
      if (lower === "cmdorctrl" || lower === "commandorcontrol") return "Control";
      if (lower === "shift") return "Shift";
      if (lower === "alt" || lower === "option") return "Alt";
      if (lower === "super" || lower === "meta" || lower === "win") return "Super";
      if (lower === "return" || lower === "enter") return "Enter";
      if (lower === "esc" || lower === "escape") return "Escape";
      if (lower === "del" || lower === "delete") return "Delete";
      if (lower === "space") return "Space";
      if (lower === "tab") return "Tab";
      if (lower === "backspace") return "Backspace";

      if (part.length === 1) {
        return part.toUpperCase();
      }

      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("+");
}
