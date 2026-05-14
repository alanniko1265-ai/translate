import { useCallback, useRef } from "react";
import { useAppStore } from "../stores/appStore";
import {
  ENGINE_LABELS,
  performTranslation,
} from "../services/translation/workflow";
import toast from "react-hot-toast";

let abortController: AbortController | null = null;

export function useTranslation() {
  const requestIdRef = useRef(0);
  const {
    settings,
    currentTranslation,
    isTranslating,
    setTranslation,
    addToHistory,
    setIsTranslating,
  } = useAppStore();

  const translate = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      if (abortController) abortController.abort();
      abortController = new AbortController();
      const requestId = ++requestIdRef.current;

      setIsTranslating(true);

      try {
        const { translation, engine, autoSwitched } = await performTranslation(
          text,
          settings,
          abortController.signal
        );

        if (requestId !== requestIdRef.current) return;

        if (autoSwitched) {
          toast(`Auto-switched to ${ENGINE_LABELS[engine]}`);
        }

        setTranslation(translation);
        addToHistory(translation);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error(getErrorMessage(error, "Translation failed."));
      } finally {
        if (requestId === requestIdRef.current) {
          setIsTranslating(false);
        }
      }
    },
    [settings, setTranslation, addToHistory, setIsTranslating]
  );

  const clear = useCallback(() => {
    if (abortController) abortController.abort();
    requestIdRef.current += 1;
    setTranslation(null);
    setIsTranslating(false);
  }, [setTranslation, setIsTranslating]);

  return {
    result: currentTranslation,
    isLoading: isTranslating,
    translate,
    clear,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}
