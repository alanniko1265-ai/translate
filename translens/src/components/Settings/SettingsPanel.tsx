import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../../stores/appStore";
import { useI18n } from "../../hooks/useI18n";
import { LANGUAGES, FONT_PRESETS } from "../../types";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import type { TranslationEngine, UserSettings } from "../../types";
import {
  Globe,
  Palette,
  Keyboard,
  Monitor,
  ChevronRight,
  Type,
  Box,
  Layers,
  MessageCircle,
  Search,
} from "lucide-react";
import { ChatBubbleSettings } from "./ChatBubbleSettings";
import { SettingSection } from "./SettingSection";
import { SelectField } from "./SelectField";
import { SliderField } from "./SliderField";
import { ColorField } from "./ColorField";
import { ToggleField } from "./ToggleField";
import { InputField } from "./InputField";
import { ShortcutField } from "./ShortcutField";

export function SettingsPanel() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [activeGroup, setActiveGroup] = useState<string>("translate");
  const { t } = useI18n();

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) =>
    updateSettings({ [key]: value });

  const engineOptions = [
    { value: "google", label: t("engine.google") },
    { value: "deepl", label: t("engine.deepl") },
    { value: "baidu", label: t("engine.baidu") },
    { value: "zhipu", label: t("engine.zhipu") },
    { value: "azure", label: t("engine.azure") },
    { value: "openai", label: t("engine.openai") },
    { value: "deepseek", label: t("engine.deepseek") },
    { value: "yandex", label: t("engine.yandex") },
    { value: "kimi", label: t("engine.kimi") },
    { value: "tencent", label: t("engine.tencent") },
    { value: "volcengine", label: t("engine.volcengine") },
    { value: "aliyun", label: t("engine.aliyun") },
  ];

  const borderStyleOptions = [
    { value: "dashed", label: t("settings.borderStyle.dashed") },
    { value: "solid", label: t("settings.borderStyle.solid") },
    { value: "dotted", label: t("settings.borderStyle.dotted") },
  ];

  const themeOptions = [
    { value: "dark", label: t("settings.theme.dark") },
    { value: "light", label: t("settings.theme.light") },
    { value: "system", label: t("settings.theme.system") },
  ];

  const textAlignOptions = [
    { value: "left", label: t("settings.textAlign.left") },
    { value: "center", label: t("settings.textAlign.center") },
  ];

  const groups = [
    { id: "translate", icon: Globe, label: t("settings.group.translate") },
    { id: "appearance", icon: Palette, label: t("settings.group.appearance") },
    { id: "shortcuts", icon: Keyboard, label: t("settings.group.shortcuts") },
    { id: "chatBubble", icon: MessageCircle, label: t("settings.group.chatBubble") },
    { id: "system", icon: Monitor, label: t("settings.group.system") },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <motion.div
        className="px-4 pt-4 pb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-lg font-semibold">{t("settings.title")}</h2>
      </motion.div>

      {/* Group Tabs */}
      <div className="flex flex-wrap gap-1 px-4 mb-4">
        {groups.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveGroup(id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
              activeGroup === id
                ? "bg-primary/15 text-primary-light"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Language Selector - always visible */}
      <div className="px-4 mb-3">
        <SelectField
          label={t("settings.system.language")}
          description={t("settings.system.languageDesc")}
          value={settings.language}
          options={SUPPORTED_LANGUAGES}
          onChange={(v) => set("language", v)}
        />
      </div>

      {/* Scrollable Settings Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4 scrollbar-hide">
        {activeGroup === "translate" && (
          <>
            <SettingSection title={t("settings.engine.title")} icon={Globe}>
              <SelectField
                label={t("settings.engine.default")}
                value={settings.engine}
                options={engineOptions}
                onChange={(v) => set("engine", v as TranslationEngine)}
              />
              <SelectField
                label={t("settings.engine.targetLang")}
                value={settings.targetLang}
                options={Object.entries(LANGUAGES).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
                onChange={(v) => set("targetLang", v)}
              />
              <ToggleField
                label={t("settings.engine.autoCopy")}
                description={t("settings.engine.autoCopyDesc")}
                value={settings.autoCopy}
                onChange={(v) => set("autoCopy", v)}
              />
            </SettingSection>

            <SettingSection title={t("settings.apiKeys.title")} icon={Globe}>
              <ApiKeyManager
                apiKeys={settings.apiKeys}
                onChange={(apiKeys) => set("apiKeys", apiKeys)}
              />
            </SettingSection>
          </>
        )}

        {activeGroup === "appearance" && (
          <>
            <SettingSection title={t("settings.popup.title")} icon={Layers}>
              <SliderField
                label={t("settings.popup.width")}
                description={t("settings.popup.widthDesc")}
                value={settings.popupWidth}
                min={240}
                max={480}
                step={10}
                unit="px"
                onChange={(v) => set("popupWidth", v)}
              />
              <SliderField
                label={t("settings.popup.radius")}
                description={t("settings.popup.radiusDesc")}
                value={settings.popupBorderRadius}
                min={8}
                max={24}
                step={2}
                unit="px"
                onChange={(v) => set("popupBorderRadius", v)}
              />
              <SliderField
                label={t("settings.popup.opacity")}
                description={t("settings.popup.opacityDesc")}
                value={settings.popupOpacity}
                min={60}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => set("popupOpacity", v)}
              />
            </SettingSection>

            <SettingSection title={t("settings.typography.title")} icon={Type}>
              <SelectField
                label={t("settings.typography.fontFamily")}
                description={t("settings.typography.fontFamilyDesc")}
                value={settings.fontFamily}
                options={FONT_PRESETS.map((f) => ({
                  value: f.fontFamily,
                  label: f.name,
                }))}
                onChange={(v) => set("fontFamily", v)}
              />
              <SliderField
                label={t("settings.typography.fontSize")}
                description={t("settings.typography.fontSizeDesc")}
                value={settings.fontSize}
                min={14}
                max={24}
                step={1}
                unit="px"
                onChange={(v) => set("fontSize", v)}
              />
              <SliderField
                label={t("settings.typography.fontWeight")}
                description={t("settings.typography.fontWeightDesc")}
                value={settings.fontWeight}
                min={400}
                max={700}
                step={100}
                onChange={(v) => set("fontWeight", v)}
              />
              <SliderField
                label={t("settings.typography.lineHeight")}
                description={t("settings.typography.lineHeightDesc")}
                value={settings.lineHeight}
                min={1.4}
                max={2.0}
                step={0.1}
                onChange={(v) => set("lineHeight", v)}
              />
              <SliderField
                label={t("settings.typography.letterSpacing")}
                description={t("settings.typography.letterSpacingDesc")}
                value={settings.letterSpacing}
                min={0}
                max={2}
                step={0.25}
                unit="px"
                onChange={(v) => set("letterSpacing", v)}
              />
              <SelectField
                label={t("settings.typography.textAlign")}
                description={t("settings.typography.textAlignDesc")}
                value={settings.textAlign}
                options={textAlignOptions}
                onChange={(v) => set("textAlign", v as "left" | "center")}
              />
            </SettingSection>

            <SettingSection title={t("settings.selection.title")} icon={Box}>
              <ColorField
                label={t("settings.selection.bgColor")}
                value={settings.selectionBgColor}
                onChange={(v) => set("selectionBgColor", v)}
              />
              <ColorField
                label={t("settings.selection.borderColor")}
                value={settings.selectionBorderColor}
                onChange={(v) => set("selectionBorderColor", v)}
              />
              <SelectField
                label={t("settings.selection.borderStyle")}
                value={settings.selectionBorderStyle}
                options={borderStyleOptions}
                onChange={(v) =>
                  set("selectionBorderStyle", v as UserSettings["selectionBorderStyle"])
                }
              />
              <SliderField
                label={t("settings.selection.borderWidth")}
                value={settings.selectionBorderWidth}
                min={1}
                max={6}
                step={1}
                unit="px"
                onChange={(v) => set("selectionBorderWidth", v)}
              />
              <SliderField
                label={t("settings.selection.borderRadius")}
                value={settings.selectionBorderRadius}
                min={0}
                max={16}
                step={2}
                unit="px"
                onChange={(v) => set("selectionBorderRadius", v)}
              />
            </SettingSection>

            <SettingSection title={t("settings.theme.title")} icon={Palette}>
              <SelectField
                label={t("settings.theme.mode")}
                value={settings.theme}
                options={themeOptions}
                onChange={(v) => set("theme", v as UserSettings["theme"])}
              />
            </SettingSection>
          </>
        )}

        {activeGroup === "shortcuts" && (
          <SettingSection title={t("settings.shortcuts.title")} icon={Keyboard}>
            <ShortcutField
              label={t("settings.shortcuts.translate")}
              value={settings.shortcuts.translate}
              onChange={(v) =>
                set("shortcuts", { ...settings.shortcuts, translate: v })
              }
              placeholder="Ctrl+Shift+T"
            />
            <ShortcutField
              label={t("settings.shortcuts.screenshot")}
              value={settings.shortcuts.screenshot}
              onChange={(v) =>
                set("shortcuts", { ...settings.shortcuts, screenshot: v })
              }
              placeholder="Ctrl+Shift+S"
            />
            <ShortcutField
              label={t("settings.shortcuts.toggle")}
              value={settings.shortcuts.toggle}
              onChange={(v) =>
                set("shortcuts", { ...settings.shortcuts, toggle: v })
              }
              placeholder="Ctrl+Shift+H"
            />
          </SettingSection>
        )}

        {activeGroup === "chatBubble" && <ChatBubbleSettings />}

        {activeGroup === "system" && (
          <SettingSection title={t("settings.system.title")} icon={Monitor}>
            <SelectField
              label={t("settings.system.language")}
              description={t("settings.system.languageDesc")}
              value={settings.language}
              options={SUPPORTED_LANGUAGES}
              onChange={(v) => set("language", v)}
            />
            <ToggleField
              label={t("settings.system.launchOnStartup")}
              description={t("settings.system.launchOnStartupDesc")}
              value={settings.launchOnStartup}
              onChange={(v) => set("launchOnStartup", v)}
            />
            <ToggleField
              label={t("settings.system.silentMode")}
              description={t("settings.system.silentModeDesc")}
              value={settings.silentMode}
              onChange={(v) => set("silentMode", v)}
            />
            <div className="mt-4 p-3 glass-card-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">TransLens</p>
                  <p className="text-xs text-text-muted">{t("settings.system.version")} 1.0.1</p>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </div>
            </div>
          </SettingSection>
        )}
      </div>
    </div>
  );
}

// ── API Key Manager ──

interface ApiFieldDef {
  part: number;
  label: string;
  placeholder: string;
}

interface ApiKeyConfig {
  engine: TranslationEngine;
  name: string;
  separator: string;
  fields: ApiFieldDef[];
  hasDefault: boolean;
}

const API_KEY_CONFIGS: ApiKeyConfig[] = [
  {
    engine: "google",
    name: "Google 翻译",
    separator: ":",
    fields: [{ part: 0, label: "API Key", placeholder: "Google Cloud Translation API Key" }],
    hasDefault: false,
  },
  {
    engine: "deepl",
    name: "DeepL",
    separator: ":",
    fields: [{ part: 0, label: "API Key", placeholder: "DeepL API Key" }],
    hasDefault: false,
  },
  {
    engine: "baidu",
    name: "百度翻译",
    separator: ":",
    fields: [
      { part: 0, label: "APP ID", placeholder: "百度翻译开放平台 APP ID" },
      { part: 1, label: "密钥", placeholder: "百度翻译开放平台密钥" },
    ],
    hasDefault: true,
  },
  {
    engine: "zhipu",
    name: "智谱AI (GLM-4)",
    separator: ".",
    fields: [
      { part: 0, label: "API Key", placeholder: "智谱AI 开放平台 API Key" },
      { part: 1, label: "Secret", placeholder: "智谱AI 开放平台 Secret" },
    ],
    hasDefault: true,
  },
  {
    engine: "tencent",
    name: "腾讯云翻译",
    separator: ":",
    fields: [
      { part: 0, label: "SecretId", placeholder: "腾讯云访问管理 SecretId" },
      { part: 1, label: "SecretKey", placeholder: "腾讯云访问管理 SecretKey" },
    ],
    hasDefault: false,
  },
  {
    engine: "volcengine",
    name: "火山翻译",
    separator: ":",
    fields: [
      { part: 0, label: "AccessKey", placeholder: "火山引擎 IAM AccessKey" },
      { part: 1, label: "SecretKey", placeholder: "火山引擎 IAM SecretKey" },
    ],
    hasDefault: false,
  },
  {
    engine: "aliyun",
    name: "阿里云翻译",
    separator: ":",
    fields: [
      { part: 0, label: "AccessKey ID", placeholder: "阿里云 RAM AccessKey ID" },
      { part: 1, label: "AccessKey Secret", placeholder: "阿里云 RAM AccessKey Secret" },
    ],
    hasDefault: false,
  },
  {
    engine: "azure",
    name: "Microsoft Azure",
    separator: ":",
    fields: [
      { part: 0, label: "API Key", placeholder: "Azure Translator 订阅密钥" },
      { part: 1, label: "Region", placeholder: "例如 eastasia, global" },
    ],
    hasDefault: false,
  },
  {
    engine: "openai",
    name: "OpenAI (GPT-4o-mini)",
    separator: ":",
    fields: [{ part: 0, label: "API Key", placeholder: "OpenAI API Key (sk-...)" }],
    hasDefault: false,
  },
  {
    engine: "deepseek",
    name: "DeepSeek",
    separator: ":",
    fields: [{ part: 0, label: "API Key", placeholder: "DeepSeek API Key" }],
    hasDefault: false,
  },
  {
    engine: "yandex",
    name: "Yandex Translate",
    separator: ":",
    fields: [{ part: 0, label: "API Key", placeholder: "Yandex Cloud API Key" }],
    hasDefault: false,
  },
  {
    engine: "kimi",
    name: "Kimi (月之暗面)",
    separator: ":",
    fields: [{ part: 0, label: "API Key", placeholder: "Moonshot API Key" }],
    hasDefault: false,
  },
];

function ApiKeyManager({
  apiKeys,
  onChange,
}: {
  apiKeys: Record<TranslationEngine, string>;
  onChange: (keys: Record<TranslationEngine, string>) => void;
}) {
  const [search, setSearch] = useState("");
  const { t } = useI18n();

  const filtered = API_KEY_CONFIGS.filter(
    (c) =>
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.engine.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("settings.apiKeys.search")}
          className="input-field pl-9"
        />
      </div>
      {filtered.length === 0 && (
        <p className="text-xs text-text-muted text-center py-4">{t("settings.apiKeys.noMatch")}</p>
      )}
      {filtered.map((cfg) => (
        <ApiKeyRow
          key={cfg.engine}
          config={cfg}
          value={apiKeys[cfg.engine] ?? ""}
          onChange={(v) => onChange({ ...apiKeys, [cfg.engine]: v })}
        />
      ))}
    </div>
  );
}

function ApiKeyRow({
  config,
  value,
  onChange,
}: {
  config: ApiKeyConfig;
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useI18n();
  const parts = value.split(config.separator, config.fields.length);
  while (parts.length < config.fields.length) parts.push("");

  const updatePart = (index: number, newVal: string) => {
    const next = [...parts];
    next[index] = newVal;
    onChange(next.join(config.separator));
  };

  const isConfigured =
    config.hasDefault || (value.trim().length > 0 && parts.every((p) => p.trim()));

  return (
    <div className="glass-card-sm p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-primary">{config.name}</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            isConfigured
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-amber-500/15 text-amber-400"
          }`}
        >
          {isConfigured ? t("settings.apiKeys.available") : t("settings.apiKeys.notConfigured")}
        </span>
        {config.hasDefault && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary-light">
            {t("settings.apiKeys.default")}
          </span>
        )}
      </div>
      {config.fields.map((field, i) => (
        <InputField
          key={field.label}
          label={field.label}
          value={parts[i] ?? ""}
          onChange={(v) => updatePart(i, v)}
          type={i === 1 && config.fields.length > 1 ? "password" : "text"}
          placeholder={field.placeholder}
        />
      ))}
    </div>
  );
}
