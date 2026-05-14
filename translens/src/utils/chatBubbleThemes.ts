export interface ChatBubbleThemePreset {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

export const CHAT_BUBBLE_THEMES: ChatBubbleThemePreset[] = [
  {
    id: "dark-glass",
    name: "深色玻璃",
    bgColor: "rgba(15, 23, 42, 0.92)",
    textColor: "#F8FAFC",
    accentColor: "#6366F1",
  },
  {
    id: "light-glass",
    name: "浅色玻璃",
    bgColor: "rgba(248, 250, 252, 0.92)",
    textColor: "#0F172A",
    accentColor: "#4F46E5",
  },
  {
    id: "indigo",
    name: "靛蓝渐变",
    bgColor: "rgba(49, 46, 129, 0.92)",
    textColor: "#E0E7FF",
    accentColor: "#A5B4FC",
  },
  {
    id: "emerald",
    name: "翡翠绿",
    bgColor: "rgba(6, 78, 59, 0.92)",
    textColor: "#D1FAE5",
    accentColor: "#34D399",
  },
  {
    id: "sunset",
    name: "日落暖橙",
    bgColor: "rgba(124, 45, 18, 0.92)",
    textColor: "#FEF3C7",
    accentColor: "#F97316",
  },
];

export function resolveChatBubbleColors(
  theme: string,
  overrides: { bgColor: string; textColor: string; accentColor: string },
) {
  if (theme !== "custom") {
    const preset = CHAT_BUBBLE_THEMES.find((t) => t.id === theme);
    if (preset) {
      return {
        bg: overrides.bgColor !== preset.bgColor ? overrides.bgColor : preset.bgColor,
        text: overrides.textColor !== preset.textColor ? overrides.textColor : preset.textColor,
        accent: overrides.accentColor !== preset.accentColor ? overrides.accentColor : preset.accentColor,
      };
    }
  }
  return {
    bg: overrides.bgColor,
    text: overrides.textColor,
    accent: overrides.accentColor,
  };
}
