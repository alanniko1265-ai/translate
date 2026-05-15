import { useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { t as translate, setCurrentLanguage } from "../i18n";

/**
 * Hook that provides i18n translation function bound to the current language setting.
 */
export function useI18n() {
  const language = useAppStore((s) => s.settings.language);

  // Keep the global language in sync
  setCurrentLanguage(language);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(key, params, language);
    },
    [language]
  );

  return { t, language };
}
