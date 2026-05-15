import { useAppStore } from "../../stores/appStore";
import { useI18n } from "../../hooks/useI18n";
import { CHAT_BUBBLE_THEMES } from "../../utils/chatBubbleThemes";
import { SettingSection } from "./SettingSection";
import { SelectField } from "./SelectField";
import { SliderField } from "./SliderField";
import { ColorField } from "./ColorField";
import { MessageCircle } from "lucide-react";

export function ChatBubbleSettings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const { t } = useI18n();

  const themeOptions = [
    ...CHAT_BUBBLE_THEMES.map((th) => ({ value: th.id, label: th.name })),
    { value: "custom", label: t("settings.chatBubble.custom") },
  ];

  const animationOptions = [
    { value: "spring", label: t("settings.chatBubble.animSpring") },
    { value: "gentle", label: t("settings.chatBubble.animGentle") },
    { value: "none", label: t("settings.chatBubble.animNone") },
  ];

  const set = (key: string, value: unknown) => updateSettings({ [key]: value });

  return (
    <>
      <SettingSection title={t("settings.chatBubble.themeTitle")} icon={MessageCircle}>
        <SelectField
          label={t("settings.chatBubble.preset")}
          description={t("settings.chatBubble.presetDesc")}
          value={settings.chatBubbleTheme}
          options={themeOptions}
          onChange={(v) => {
            set("chatBubbleTheme", v);
            if (v !== "custom") {
              const preset = CHAT_BUBBLE_THEMES.find((th) => th.id === v);
              if (preset) {
                updateSettings({
                  chatBubbleBgColor: preset.bgColor,
                  chatBubbleTextColor: preset.textColor,
                  chatBubbleAccentColor: preset.accentColor,
                });
              }
            }
          }}
        />
        <ColorField
          label={t("settings.chatBubble.bgColor")}
          value={settings.chatBubbleBgColor}
          onChange={(v) => set("chatBubbleBgColor", v)}
        />
        <ColorField
          label={t("settings.chatBubble.textColor")}
          value={settings.chatBubbleTextColor}
          onChange={(v) => set("chatBubbleTextColor", v)}
        />
        <ColorField
          label={t("settings.chatBubble.accentColor")}
          value={settings.chatBubbleAccentColor}
          onChange={(v) => set("chatBubbleAccentColor", v)}
        />
      </SettingSection>

      <SettingSection title={t("settings.chatBubble.styleTitle")} icon={MessageCircle}>
        <SliderField
          label={t("settings.chatBubble.maxWidth")}
          description={t("settings.chatBubble.maxWidthDesc")}
          value={settings.chatBubbleMaxWidth}
          min={240}
          max={480}
          step={10}
          unit="px"
          onChange={(v) => set("chatBubbleMaxWidth", v)}
        />
        <SliderField
          label={t("settings.chatBubble.opacity")}
          description={t("settings.chatBubble.opacityDesc")}
          value={settings.chatBubbleOpacity}
          min={50}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => set("chatBubbleOpacity", v)}
        />
        <SliderField
          label={t("settings.chatBubble.fontSize")}
          description={t("settings.chatBubble.fontSizeDesc")}
          value={settings.chatBubbleFontSize}
          min={14}
          max={24}
          step={1}
          unit="px"
          onChange={(v) => set("chatBubbleFontSize", v)}
        />
        <SelectField
          label={t("settings.chatBubble.animation")}
          description={t("settings.chatBubble.animationDesc")}
          value={settings.chatBubbleAnimation}
          options={animationOptions}
          onChange={(v) =>
            set("chatBubbleAnimation", v as "spring" | "gentle" | "none")
          }
        />
      </SettingSection>
    </>
  );
}
