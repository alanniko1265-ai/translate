import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../../stores/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { useI18n } from "../../hooks/useI18n";
import { LANGUAGES } from "../../types";
import { getTranslationReadiness } from "../../services/translation/workflow";
import { invoke } from "@tauri-apps/api/core";
import { computeSmartPosition } from "../../utils/smartPosition";
import type { AnchorRect, BubbleSize } from "../../utils/smartPosition";
import { getTranslationOverlaySize } from "../../utils/overlayWindow";
import {
  Copy,
  Volume2,
  Star,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

export function TranslationPop() {
  const [inputText, setInputText] = useState("");
  const [showOriginal, setShowOriginal] = useState(true);
  const { result, isLoading, translate, clear } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const readiness = getTranslationReadiness(settings);
  const { t } = useI18n();

  const handleTranslate = () => {
    if (inputText.trim()) {
      if (!readiness.ready) {
        toast.error(readiness.message);
        setActiveTab("settings");
        return;
      }
      translate(inputText);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
      await writeText(result.translatedText);
    } catch {
      await navigator.clipboard.writeText(result.translatedText);
    }
    toast.success(t("translate.copied"));
  };

  const handleSpeak = () => {
    if (!result) return;
    const utterance = new SpeechSynthesisUtterance(result.translatedText);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const handlePopOut = async () => {
    if (!result) return;
    const bubbleSettings = useAppStore.getState().settings;
    let screenSize = { width: 1920, height: 1080 };
    try {
      screenSize = await invoke<{ width: number; height: number }>("get_screen_size");
    } catch { /* use default */ }

    const anchorRect: AnchorRect = { x: screenSize.width / 2 - 50, y: screenSize.height / 2 - 20, width: 100, height: 40 };
    const bubbleSize: BubbleSize = getTranslationOverlaySize(result, bubbleSettings);
    const position = computeSmartPosition(anchorRect, screenSize, bubbleSize);

    try {
      await invoke("store_pending_translation", {
        data: {
          originalText: result.originalText,
          translatedText: result.translatedText,
          sourceLang: result.sourceLang,
          targetLang: result.targetLang,
        },
      });
      await invoke("create_translation_overlay", {
        x: position.x,
        y: position.y,
        width: bubbleSize.width,
        height: bubbleSize.height,
        pointerPlacement: position.pointerPlacement,
        pointerOffset: position.pointerOffset,
      });
      toast.success(t("translate.popout"));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`${t("translate.popoutFail")}: ${msg}`);
    }
  };

  return (
    <div className="w-full max-w-[480px] flex flex-col gap-3">
      {/* Input Area */}
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Globe size={14} />
            <span>{t("translate.inputLabel")}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-text-muted">
              {LANGUAGES[settings.targetLang] || settings.targetLang}
            </span>
          </div>
        </div>

        <div
          className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
            readiness.ready
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/25 bg-amber-500/10 text-amber-200"
          }`}
        >
          {readiness.message}
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleTranslate();
            }
          }}
          placeholder={t("translate.placeholder")}
          className="w-full min-h-[80px] bg-transparent text-text-primary text-sm resize-none outline-none placeholder:text-text-muted"
          rows={3}
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-text-muted">
            {inputText.length} {t("translate.chars")}
          </span>
          <div className="flex gap-2">
            {inputText.trim() && (
              <button onClick={() => setInputText("")} className="btn-ghost text-xs">
                {t("translate.clear")}
              </button>
            )}
            <motion.button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isLoading}
              className="btn-primary flex items-center gap-2 text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              {t("translate.button")}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Result Area */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="result"
            className="glass-card overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-light font-medium">
                  {LANGUAGES[result.sourceLang] || result.sourceLang}
                </span>
                <span className="text-xs text-text-muted">→</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                  {LANGUAGES[result.targetLang] || result.targetLang}
                </span>
              </div>
              <button
                onClick={clear}
                className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X size={14} className="text-text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Original Text (collapsible) */}
              <div className="mb-2">
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors mb-2"
                >
                  {showOriginal ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {t("translate.original")}
                </button>
                <AnimatePresence>
                  {showOriginal && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-sm text-text-secondary leading-relaxed overflow-hidden"
                    >
                      {result.originalText}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Translated Text */}
              <motion.p
                className="text-base leading-relaxed"
                style={{
                  fontFamily: settings.fontFamily,
                  fontSize: `${settings.fontSize}px`,
                  fontWeight: settings.fontWeight,
                  lineHeight: settings.lineHeight,
                  letterSpacing: `${settings.letterSpacing}px`,
                  textAlign: settings.textAlign,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {result.translatedText}
              </motion.p>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-1 px-4 py-3 border-t border-white/5">
              <ActionButton icon={Copy} label={t("translate.copy")} onClick={handleCopy} />
              <ActionButton icon={Volume2} label={t("translate.speak")} onClick={handleSpeak} />
              <ActionButton icon={ExternalLink} label={t("translate.popoutBtn")} onClick={handlePopOut} />
              <ActionButton icon={Star} label={t("translate.favorite")} onClick={() => toast.success(t("translate.favorited"))} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && !result && (
          <motion.div
            className="glass-card p-8 flex flex-col items-center justify-center gap-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 size={28} className="text-primary-light" />
            </motion.div>
            <p className="text-sm text-text-muted">{t("translate.translating")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-muted hover:text-text-secondary"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={label}
    >
      <Icon size={15} />
      <span className="text-xs">{label}</span>
    </motion.button>
  );
}
