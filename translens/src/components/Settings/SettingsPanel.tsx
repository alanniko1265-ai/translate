import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../../stores/appStore";
import { LANGUAGES, FONT_PRESETS } from "../../types";
import type { TranslationEngine, UserSettings } from "../../types";
import {
  Globe,
  Palette,
  Keyboard,
  Monitor,
  ChevronRight,
  Eye,
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

const engineOptions = [
  { value: "google", label: "Google 翻译" },
  { value: "deepl", label: "DeepL" },
  { value: "baidu", label: "百度翻译" },
  { value: "zhipu", label: "智谱AI (GLM)" },
  { value: "azure", label: "Microsoft Azure" },
  { value: "openai", label: "OpenAI (GPT)" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "yandex", label: "Yandex Translate" },
  { value: "kimi", label: "Kimi (月之暗面)" },
  { value: "tencent", label: "腾讯云翻译" },
  { value: "volcengine", label: "火山翻译" },
  { value: "aliyun", label: "阿里云翻译" },
];

const borderStyleOptions = [
  { value: "dashed", label: "虚线" },
  { value: "solid", label: "实线" },
  { value: "dotted", label: "点线" },
];

const themeOptions = [
  { value: "dark", label: "深色" },
  { value: "light", label: "浅色" },
  { value: "system", label: "跟随系统" },
];

const textAlignOptions = [
  { value: "left", label: "左对齐" },
  { value: "center", label: "居中" },
];

export function SettingsPanel() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [activeGroup, setActiveGroup] = useState<string>("translate");

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) =>
    updateSettings({ [key]: value });

  const groups = [
    { id: "translate", icon: Globe, label: "翻译设置" },
    { id: "appearance", icon: Palette, label: "外观设置" },
    { id: "shortcuts", icon: Keyboard, label: "快捷键" },
    { id: "chatBubble", icon: MessageCircle, label: "聊天框设置" },
    { id: "system", icon: Monitor, label: "系统设置" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <motion.div
        className="px-4 pt-4 pb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-lg font-semibold">设置</h2>
      </motion.div>

      {/* Group Tabs */}
      <div className="flex gap-1 px-4 mb-4 overflow-x-auto scrollbar-hide">
        {groups.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveGroup(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              activeGroup === id
                ? "bg-primary/15 text-primary-light"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Scrollable Settings Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4 scrollbar-hide">
        {activeGroup === "translate" && (
          <>
            <SettingSection title="翻译引擎" icon={Globe}>
              <SelectField
                label="默认引擎"
                value={settings.engine}
                options={engineOptions}
                onChange={(v) => set("engine", v as TranslationEngine)}
              />
              <SelectField
                label="目标语言"
                value={settings.targetLang}
                options={Object.entries(LANGUAGES).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
                onChange={(v) => set("targetLang", v)}
              />
              <ToggleField
                label="翻译后自动复制"
                description="翻译完成后自动将译文复制到剪贴板"
                value={settings.autoCopy}
                onChange={(v) => set("autoCopy", v)}
              />
            </SettingSection>

            <SettingSection title="API 密钥" icon={Globe}>
              <ApiKeyManager
                apiKeys={settings.apiKeys}
                onChange={(apiKeys) => set("apiKeys", apiKeys)}
              />
            </SettingSection>
          </>
        )}

        {activeGroup === "appearance" && (
          <>
            <SettingSection title="翻译浮窗" icon={Layers}>
              <SliderField
                label="浮窗宽度"
                description="控制翻译结果浮窗的宽度"
                value={settings.popupWidth}
                min={240}
                max={480}
                step={10}
                unit="px"
                onChange={(v) => set("popupWidth", v)}
              />
              <SliderField
                label="浮窗圆角"
                description="翻译浮窗的边角圆润程度"
                value={settings.popupBorderRadius}
                min={8}
                max={24}
                step={2}
                unit="px"
                onChange={(v) => set("popupBorderRadius", v)}
              />
              <SliderField
                label="浮窗透明度"
                description="翻译浮窗的整体透明度"
                value={settings.popupOpacity}
                min={60}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => set("popupOpacity", v)}
              />
            </SettingSection>

            <SettingSection title="译文排版" icon={Type}>
              <SelectField
                label="字体族"
                description="译文显示使用的字体"
                value={settings.fontFamily}
                options={FONT_PRESETS.map((f) => ({
                  value: f.fontFamily,
                  label: f.name,
                }))}
                onChange={(v) => set("fontFamily", v)}
              />
              <SliderField
                label="字号"
                description="译文文字大小"
                value={settings.fontSize}
                min={14}
                max={24}
                step={1}
                unit="px"
                onChange={(v) => set("fontSize", v)}
              />
              <SliderField
                label="字重"
                description="译文文字粗细 (400-700)"
                value={settings.fontWeight}
                min={400}
                max={700}
                step={100}
                onChange={(v) => set("fontWeight", v)}
              />
              <SliderField
                label="行高"
                description="译文行间距"
                value={settings.lineHeight}
                min={1.4}
                max={2.0}
                step={0.1}
                onChange={(v) => set("lineHeight", v)}
              />
              <SliderField
                label="字间距"
                description="译文字符间距"
                value={settings.letterSpacing}
                min={0}
                max={2}
                step={0.25}
                unit="px"
                onChange={(v) => set("letterSpacing", v)}
              />
              <SelectField
                label="对齐方式"
                description="译文文本对齐"
                value={settings.textAlign}
                options={textAlignOptions}
                onChange={(v) => set("textAlign", v as "left" | "center")}
              />
            </SettingSection>

            <SettingSection title="划词框样式" icon={Box}>
              <ColorField
                label="背景色"
                value={settings.selectionBgColor}
                onChange={(v) => set("selectionBgColor", v)}
              />
              <ColorField
                label="边框色"
                value={settings.selectionBorderColor}
                onChange={(v) => set("selectionBorderColor", v)}
              />
              <SelectField
                label="边框样式"
                value={settings.selectionBorderStyle}
                options={borderStyleOptions}
                onChange={(v) =>
                  set("selectionBorderStyle", v as UserSettings["selectionBorderStyle"])
                }
              />
              <SliderField
                label="边框宽度"
                value={settings.selectionBorderWidth}
                min={1}
                max={6}
                step={1}
                unit="px"
                onChange={(v) => set("selectionBorderWidth", v)}
              />
              <SliderField
                label="圆角"
                value={settings.selectionBorderRadius}
                min={0}
                max={16}
                step={2}
                unit="px"
                onChange={(v) => set("selectionBorderRadius", v)}
              />
            </SettingSection>

            <SettingSection title="主题" icon={Palette}>
              <SelectField
                label="主题模式"
                value={settings.theme}
                options={themeOptions}
                onChange={(v) => set("theme", v as UserSettings["theme"])}
              />
            </SettingSection>
          </>
        )}

        {activeGroup === "shortcuts" && (
          <SettingSection title="快捷键配置" icon={Keyboard}>
            <ShortcutField
              label="划词翻译"
              value={settings.shortcuts.translate}
              onChange={(v) =>
                set("shortcuts", { ...settings.shortcuts, translate: v })
              }
              placeholder="Ctrl+Shift+T"
            />
            <ShortcutField
              label="截图翻译"
              value={settings.shortcuts.screenshot}
              onChange={(v) =>
                set("shortcuts", { ...settings.shortcuts, screenshot: v })
              }
              placeholder="Ctrl+Shift+S"
            />
            <ShortcutField
              label="显示/隐藏"
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
          <SettingSection title="系统设置" icon={Monitor}>
            <ToggleField
              label="开机自启"
              description="系统启动时自动运行 TransLens"
              value={settings.launchOnStartup}
              onChange={(v) => set("launchOnStartup", v)}
            />
            <ToggleField
              label="静默模式"
              description="隐藏窗口，仅通过快捷键响应"
              value={settings.silentMode}
              onChange={(v) => set("silentMode", v)}
            />
            <div className="mt-4 p-3 glass-card-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">TransLens</p>
                  <p className="text-xs text-text-muted">版本 1.0.0</p>
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
          placeholder="搜索 API..."
          className="input-field pl-9"
        />
      </div>
      {filtered.length === 0 && (
        <p className="text-xs text-text-muted text-center py-4">无匹配结果</p>
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
          {isConfigured ? "可用" : "未配置"}
        </span>
        {config.hasDefault && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary-light">
            默认
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
