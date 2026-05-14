import type { UserSettings } from "../types";
import type { BubbleSize } from "./smartPosition";

interface TranslationPreview {
  originalText: string;
  translatedText: string;
}

export function getTranslationOverlaySize(
  translation: TranslationPreview,
  settings: UserSettings,
): BubbleSize {
  const width = clampNumber(settings.chatBubbleMaxWidth, 300, 520, 380);
  const fontSize = clampNumber(
    settings.chatBubbleFontSize || settings.fontSize,
    12,
    24,
    15,
  );
  const usableWidth = Math.max(width - 52, 220);
  const charsPerLine = Math.max(18, Math.floor(usableWidth / (fontSize * 0.58)));

  const sourceLines = Math.min(
    4,
    Math.max(1, Math.ceil(translation.originalText.length / charsPerLine)),
  );
  const translatedLines = Math.min(
    8,
    Math.max(2, Math.ceil(translation.translatedText.length / charsPerLine)),
  );

  const languageBarHeight = 44;
  const headerHeight = 42;
  const sourceHeight = 36 + sourceLines * fontSize * 1.45;
  const translatedHeight = Math.max(68, translatedLines * fontSize * 1.65);
  const footerHeight = 46;
  const height = headerHeight + languageBarHeight + sourceHeight + translatedHeight + footerHeight;

  return {
    width,
    height: clampNumber(Math.round(height), 240, 430, 320),
  };
}

function clampNumber(
  value: number,
  min: number,
  max: number,
  fallback: number,
) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}
