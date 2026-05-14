import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppStore } from "../stores/appStore";
import {
  ENGINE_LABELS,
  normalizeShortcut,
  performTranslation,
} from "../services/translation/workflow";
import { computeSmartPosition } from "../utils/smartPosition";
import type { AnchorRect, BubbleSize } from "../utils/smartPosition";
import { getTranslationOverlaySize } from "../utils/overlayWindow";
import type { UserSettings } from "../types";
import toast from "react-hot-toast";

type ShortcutHandler = (event: { state: string }) => void;

interface OverlayErrorPayload {
  message?: string;
}

interface OverlayTextPayload {
  text: string;
  rect: { x: number; y: number; width: number; height: number };
}

interface TranslationResultPayload {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

interface CursorPosition {
  x: number;
  y: number;
}

interface ScreenSize {
  width: number;
  height: number;
}

interface CaptureResult {
  imageBase64: string;
  width: number;
  height: number;
}

export function useGlobalShortcuts(enabled = true) {
  const shortcuts = useAppStore((state) => state.settings.shortcuts);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;

    async function setup() {
      await invoke("cleanup_old_instances").catch(() => {});
      await unregisterAll().catch(() => {});

      const shortcutConfig = useAppStore.getState().settings.shortcuts;
      const seenShortcuts = new Map<string, string>();

      const registerShortcut = async (
        shortcut: string,
        label: string,
        handler: ShortcutHandler,
      ) => {
        const normalizedShortcut = normalizeShortcut(shortcut);
        if (!normalizedShortcut) {
          toast.error(`${label} shortcut cannot be empty.`);
          return;
        }

        const previousLabel = seenShortcuts.get(normalizedShortcut.toLowerCase());
        if (previousLabel) {
          toast.error(`${label} conflicts with ${previousLabel}.`);
          return;
        }

        seenShortcuts.set(normalizedShortcut.toLowerCase(), label);

        try {
          await register(normalizedShortcut, handler);
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error("Shortcut registration failed", normalizedShortcut, msg);
          if (msg.includes("already registered") || msg.includes("Already registered")) {
            toast(`快捷键 ${normalizedShortcut} 已被占用，请关闭其他 TransLens 实例`, { icon: "⚠️" });
          } else {
            toast.error(`Failed to register ${normalizedShortcut}: ${msg}`);
          }
        }
      };

      const toggleHandler: ShortcutHandler = async (event) => {
        if (event.state !== "Pressed") return;

        const currentWindow = getCurrentWindow();
        const visible = await currentWindow.isVisible();

        if (visible) {
          await currentWindow.hide();
          return;
        }

        await showMainWindow();
      };

      const translateHandler: ShortcutHandler = async (event) => {
        if (event.state !== "Pressed") return;

        let cursorPos: CursorPosition = { x: 300, y: 300 };
        let text = "";

        try {
          const posResult = await invoke<CursorPosition>("get_cursor_position");
          cursorPos = posResult;
        } catch {
          // continue with default cursor position
        }

        try {
          text = (await invoke<string>("read_selected_text")).trim().slice(0, 2000);
        } catch (error) {
          toast.error(getErrorMessage(error, "Selection translation failed."));
          return;
        }

        if (!text) {
          toast.error("No text selected.");
          return;
        }

        // Smart positioning
        const settings = useAppStore.getState().settings;
        let screenSize: ScreenSize = { width: 1920, height: 1080 };
        try {
          screenSize = await invoke<ScreenSize>("get_screen_size");
        } catch {
          // use default
        }

        const anchorRect: AnchorRect = {
          x: cursorPos.x,
          y: cursorPos.y,
          width: 1,
          height: 1,
        };
        await showTranslationLoading(anchorRect, screenSize, settings).catch(() => {});

        let translationResult: TranslationResultPayload;
        try {
          translationResult = await translateAndGetResult(text);
        } catch (error) {
          await invoke("close_translation_overlay").catch(() => {});
          toast.error(getErrorMessage(error, "Translation failed."));
          return;
        }

        try {
          await showTranslationResult(
            translationResult,
            anchorRect,
            screenSize,
            settings,
          );
        } catch (error) {
          toast.error(getErrorMessage(error, "Failed to create overlay."));
        }
      };

      const screenshotHandler: ShortcutHandler = async (event) => {
        if (event.state !== "Pressed") return;

        let extractedText: string | null = null;
        let overlayRect: { x: number; y: number; width: number; height: number } | null = null;

        try {
          const result = await captureTextFromScreenshot();
          extractedText = result.text;
          overlayRect = result.rect;
        } catch (error) {
          toast.error(getErrorMessage(error, "Screenshot OCR failed."));
          return;
        }

        if (!extractedText) return;

        // Smart positioning
        const settings = useAppStore.getState().settings;
        let screenSize: ScreenSize = { width: 1920, height: 1080 };
        try {
          screenSize = await invoke<ScreenSize>("get_screen_size");
        } catch {
          // use default
        }

        const anchorRect: AnchorRect = overlayRect
          ? { x: overlayRect.x, y: overlayRect.y, width: overlayRect.width, height: overlayRect.height }
          : { x: 400, y: 300, width: 1, height: 1 };
        await showTranslationLoading(anchorRect, screenSize, settings).catch(() => {});

        let translationResult: TranslationResultPayload;
        try {
          translationResult = await translateAndGetResult(extractedText);
        } catch (error) {
          await invoke("close_translation_overlay").catch(() => {});
          toast.error(getErrorMessage(error, "Translation failed."));
          return;
        }

        try {
          await showTranslationResult(
            translationResult,
            anchorRect,
            screenSize,
            settings,
          );
        } catch (error) {
          toast.error(getErrorMessage(error, "Failed to create overlay."));
        }
      };

      if (disposed) return;

      await registerShortcut(shortcutConfig.toggle, "Toggle window", toggleHandler);
      await registerShortcut(shortcutConfig.translate, "Text translation", translateHandler);
      await registerShortcut(
        shortcutConfig.screenshot,
        "Screenshot translation",
        screenshotHandler,
      );
    }

    void setup();

    return () => {
      disposed = true;
      void unregisterAll().catch(() => {});
    };
  }, [enabled, shortcuts.screenshot, shortcuts.toggle, shortcuts.translate]);
}

async function translateAndGetResult(text: string): Promise<TranslationResultPayload> {
  const { settings, addToHistory } = useAppStore.getState();

  const { translation, engine, autoSwitched } = await performTranslation(
    text,
    settings,
  );

  if (autoSwitched) {
    toast(`Auto-switched to ${ENGINE_LABELS[engine]}`);
  }

  addToHistory(translation);

  return {
    originalText: translation.originalText,
    translatedText: translation.translatedText,
    sourceLang: translation.sourceLang,
    targetLang: translation.targetLang,
  };
}

async function showTranslationLoading(
  anchorRect: AnchorRect,
  screenSize: ScreenSize,
  settings: UserSettings,
) {
  const bubbleSize = getLoadingOverlaySize(settings);
  const position = computeSmartPosition(anchorRect, screenSize, bubbleSize);

  await invoke("create_translation_overlay", {
    x: position.x,
    y: position.y,
    width: bubbleSize.width,
    height: bubbleSize.height,
    pointerPlacement: position.pointerPlacement,
    pointerOffset: position.pointerOffset,
    loading: true,
  });
}

async function showTranslationResult(
  translationResult: TranslationResultPayload,
  anchorRect: AnchorRect,
  screenSize: ScreenSize,
  settings: UserSettings,
) {
  const bubbleSize: BubbleSize = getTranslationOverlaySize(
    translationResult,
    settings,
  );
  const position = computeSmartPosition(anchorRect, screenSize, bubbleSize);

  await invoke("store_pending_translation", {
    data: {
      originalText: translationResult.originalText,
      translatedText: translationResult.translatedText,
      sourceLang: translationResult.sourceLang,
      targetLang: translationResult.targetLang,
    },
  });
  await invoke("create_translation_overlay", {
    x: position.x,
    y: position.y,
    width: bubbleSize.width,
    height: bubbleSize.height,
    pointerPlacement: position.pointerPlacement,
    pointerOffset: position.pointerOffset,
    loading: false,
  });
}

function getLoadingOverlaySize(settings: UserSettings): BubbleSize {
  const width = Math.min(Math.max(settings.chatBubbleMaxWidth, 300), 520);
  return {
    width,
    height: 180,
  };
}

function captureTextFromScreenshot() {
  const currentWindow = getCurrentWindow();

  return new Promise<{ text: string; rect: { x: number; y: number; width: number; height: number } }>(
    (resolve, reject) => {
      let settled = false;
      const cleanups: Array<() => Promise<void> | void> = [];

      const settle = async (callback: () => Promise<void> | void) => {
        if (settled) return;
        settled = true;
        await Promise.all(cleanups.map((cleanup) => cleanup())).catch(() => {});
        await invoke("close_overlay").catch(() => {});
        await invoke("clear_pending_screenshot").catch(() => {});
        await callback();
      };

      void (async () => {
        cleanups.push(
          await currentWindow.listen<OverlayTextPayload>(
            "overlay-text-selected",
            (event) => {
              void settle(() =>
                resolve({
                  text: event.payload.text,
                  rect: event.payload.rect,
                }),
              );
            },
          ),
        );
        cleanups.push(
          await currentWindow.listen<OverlayErrorPayload>("overlay-error", (event) => {
            const msg = event.payload?.message;
            void settle(() => reject(toError(msg ?? "Screenshot OCR failed.")));
          }),
        );
        cleanups.push(
          await currentWindow.listen("overlay-cancelled", () => {
            void settle(() => reject(new Error("Overlay cancelled.")));
          }),
        );

        const mainVisible = await currentWindow.isVisible().catch(() => true);
        if (mainVisible) {
          await currentWindow.hide();
          await sleep(50);
        }

        try {
          await invoke<CaptureResult>("capture_screenshot_for_overlay");
          await invoke("create_overlay");
        } catch (error) {
          void settle(() => reject(toError(error, "Unable to open the screenshot overlay.")));
        }
      })().catch((error) => {
        void settle(() => reject(toError(error, "Screenshot translation failed.")));
      });
    },
  );
}

async function showMainWindow() {
  const currentWindow = getCurrentWindow();
  await currentWindow.show().catch(() => {});
  await currentWindow.setFocus().catch(() => {});
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error.trim()) return error.trim();
  return fallback;
}

function toError(error: unknown, fallback?: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string" && error.trim()) return new Error(error.trim());
  return new Error(fallback ?? "Unknown error.");
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
