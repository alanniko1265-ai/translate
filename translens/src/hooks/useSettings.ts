import { useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import type { UserSettings } from "../types";
import { DEFAULT_SETTINGS } from "../types";

export function useSettings() {
  const { settings, updateSettings } = useAppStore();

  const setSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      updateSettings({ [key]: value });
    },
    [updateSettings]
  );

  const resetSettings = useCallback(() => {
    updateSettings(DEFAULT_SETTINGS);
  }, [updateSettings]);

  return { settings, setSetting, resetSettings };
}
