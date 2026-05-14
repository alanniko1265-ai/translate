import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserSettings, TranslationResult, Selection } from "../types";
import { DEFAULT_SETTINGS } from "../types";

interface AppState {
  isTranslating: boolean;
  currentTranslation: TranslationResult | null;
  selection: Selection | null;
  showPopover: boolean;
  settings: UserSettings;
  translationHistory: TranslationResult[];
  activeTab: "translate" | "history" | "settings";

  setTranslation: (result: TranslationResult | null) => void;
  setIsTranslating: (v: boolean) => void;
  setSelection: (sel: Selection | null) => void;
  setShowPopover: (v: boolean) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  addToHistory: (result: TranslationResult) => void;
  clearHistory: () => void;
  setActiveTab: (tab: "translate" | "history" | "settings") => void;
}

type PersistedAppState = Partial<Omit<AppState, "settings">> & {
  settings?: Partial<UserSettings> & {
    shortcuts?: Partial<UserSettings["shortcuts"]>;
  };
};

function mergeSettings(settings?: PersistedAppState["settings"]): UserSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(settings ?? {}),
    apiKeys: {
      ...DEFAULT_SETTINGS.apiKeys,
      ...(settings?.apiKeys ?? {}),
    },
    shortcuts: {
      ...DEFAULT_SETTINGS.shortcuts,
      ...(settings?.shortcuts ?? {}),
    },
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isTranslating: false,
      currentTranslation: null,
      selection: null,
      showPopover: false,
      settings: DEFAULT_SETTINGS,
      translationHistory: [],
      activeTab: "translate",

      setTranslation: (result) =>
        set({ currentTranslation: result, isTranslating: false }),

      setIsTranslating: (v) => set({ isTranslating: v }),

      setSelection: (sel) => set({ selection: sel }),

      setShowPopover: (v) => set({ showPopover: v }),

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      addToHistory: (result) =>
        set((s) => {
          const history = [result, ...s.translationHistory].slice(0, 500);
          return { translationHistory: history };
        }),

      clearHistory: () => set({ translationHistory: [] }),

      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: "translens-storage",
      partialize: (state) => ({
        settings: state.settings,
        translationHistory: state.translationHistory,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedAppState | undefined;

        return {
          ...currentState,
          ...(persisted ?? {}),
          settings: mergeSettings(persisted?.settings),
          translationHistory:
            persisted?.translationHistory ?? currentState.translationHistory,
        };
      },
    }
  )
);
