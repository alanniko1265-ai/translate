import { useAppStore } from "../../stores/appStore";
import { CHAT_BUBBLE_THEMES } from "../../utils/chatBubbleThemes";
import { SettingSection } from "./SettingSection";
import { SelectField } from "./SelectField";
import { SliderField } from "./SliderField";
import { ColorField } from "./ColorField";
import { MessageCircle } from "lucide-react";

const themeOptions = [
  ...CHAT_BUBBLE_THEMES.map((t) => ({ value: t.id, label: t.name })),
  { value: "custom", label: "自定义" },
];

const animationOptions = [
  { value: "spring", label: "弹性动画" },
  { value: "gentle", label: "柔和淡入" },
  { value: "none", label: "无动画" },
];

export function ChatBubbleSettings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const set = (key: string, value: unknown) => updateSettings({ [key]: value });

  return (
    <>
      <SettingSection title="聊天框主题" icon={MessageCircle}>
        <SelectField
          label="预设主题"
          description="选择聊天框的配色方案"
          value={settings.chatBubbleTheme}
          options={themeOptions}
          onChange={(v) => {
            set("chatBubbleTheme", v);
            if (v !== "custom") {
              const preset = CHAT_BUBBLE_THEMES.find((t) => t.id === v);
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
          label="背景颜色"
          value={settings.chatBubbleBgColor}
          onChange={(v) => set("chatBubbleBgColor", v)}
        />
        <ColorField
          label="文字颜色"
          value={settings.chatBubbleTextColor}
          onChange={(v) => set("chatBubbleTextColor", v)}
        />
        <ColorField
          label="强调色"
          value={settings.chatBubbleAccentColor}
          onChange={(v) => set("chatBubbleAccentColor", v)}
        />
      </SettingSection>

      <SettingSection title="聊天框样式" icon={MessageCircle}>
        <SliderField
          label="最大宽度"
          description="聊天框的最大宽度"
          value={settings.chatBubbleMaxWidth}
          min={240}
          max={480}
          step={10}
          unit="px"
          onChange={(v) => set("chatBubbleMaxWidth", v)}
        />
        <SliderField
          label="背景透明度"
          description="聊天框背景的不透明度"
          value={settings.chatBubbleOpacity}
          min={50}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => set("chatBubbleOpacity", v)}
        />
        <SliderField
          label="字体大小"
          description="聊天框译文的字体大小"
          value={settings.chatBubbleFontSize}
          min={14}
          max={24}
          step={1}
          unit="px"
          onChange={(v) => set("chatBubbleFontSize", v)}
        />
        <SelectField
          label="动画风格"
          description="聊天框出现时的动画效果"
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
