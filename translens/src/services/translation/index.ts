import { invoke } from "@tauri-apps/api/core";
import type { TranslationEngine } from "../../types";

export interface TranslateParams {
  text: string;
  sourceLang: string;
  targetLang: string;
  engine: TranslationEngine;
}

export interface TranslateResult {
  translatedText: string;
  detectedSourceLang: string;
}

export async function translateText(
  params: TranslateParams,
  apiKeys: Record<TranslationEngine, string>,
  signal?: AbortSignal
): Promise<TranslateResult> {
  if (signal?.aborted) {
    throw createAbortError();
  }

  const apiKey = apiKeys[params.engine]?.trim() ?? "";

  let result: TranslateResult;
  try {
    result = await invoke<TranslateResult>("translate_text", {
      request: {
        ...params,
        apiKey,
      },
    });
  } catch (error) {
    throw normalizeInvokeError(error);
  }

  if (signal?.aborted) {
    throw createAbortError();
  }

  return {
    ...result,
    translatedText:
      params.engine === "google"
        ? decodeHtmlEntities(result.translatedText)
        : result.translatedText,
  };
}

function decodeHtmlEntities(text: string) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function createAbortError() {
  return new DOMException("The translation request was aborted.", "AbortError");
}

function normalizeInvokeError(error: unknown) {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);

  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string") return new Error(message);
  }

  return new Error("Translation failed.");
}
