import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../../stores/appStore";
import { LANGUAGES } from "../../types";
import {
  Copy,
  Volume2,
  X,
  GripHorizontal,
  Languages,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";

interface TranslationPayload {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export function TranslationOverlay() {
  const [payload, setPayload] = useState<TranslationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const settings = useAppStore((s) => s.settings);

  useEffect(() => {
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";

    const unlisten = listen<TranslationPayload>("translation-result", (event) => {
      setPayload(event.payload);
      setLoading(false);
      setError(null);
    });

    const errorUnlisten = listen<{ message: string }>("translation-error", (event) => {
      setLoading(false);
      setError(event.payload.message);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        getCurrentWindow().close().catch(() => {});
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      unlisten.then((fn) => fn());
      errorUnlisten.then((fn) => fn());
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.background = "";
      document.documentElement.style.background = "";
    };
  }, []);

  const handleClose = async () => {
    await getCurrentWindow().close().catch(() => {});
  };

  const handleCopy = async () => {
    if (!payload) return;
    try {
      const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
      await writeText(payload.translatedText);
    } catch {
      await navigator.clipboard.writeText(payload.translatedText);
    }
    toast.success("已复制");
  };

  const handleSpeak = () => {
    if (!payload) return;
    const utterance = new SpeechSynthesisUtterance(payload.translatedText);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const cardBg = `rgba(15, 23, 42, ${(settings.popupOpacity / 100) * 0.9})`;

  return (
    <div className="h-screen w-screen flex items-center justify-center p-3 bg-transparent">
      <motion.div
        className="flex flex-col overflow-hidden"
        style={{
          width: settings.popupWidth,
        }}
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 28,
          mass: 0.8,
        }}
      >
        <div
          className="overflow-hidden flex flex-col"
          style={{
            borderRadius: `${settings.popupBorderRadius}px`,
            background: cardBg,
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow:
              "0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Drag Handle / Header */}
          <div
            data-tauri-drag-region
            className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 select-none group/header"
          >
            <div className="flex items-center gap-2 text-text-muted">
              <GripHorizontal size={14} className="opacity-40 group-hover/header:opacity-70 transition-opacity" />
              <Languages size={14} className="text-primary-light" />
              <span className="text-xs font-medium tracking-wide opacity-60">TransLens</span>
            </div>
            <motion.button
              onClick={handleClose}
              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors text-text-muted hover:text-text-secondary cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={14} />
            </motion.button>
          </div>

          {/* Loading State */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                className="p-8 flex flex-col items-center justify-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                  className="w-12 h-12 rounded-full border-[3px] border-primary/20"
                  style={{ borderTopColor: "var(--color-primary)" }}
                />
                <div className="space-y-2.5 w-full">
                  <div className="h-3 w-2/5 mx-auto rounded-full bg-white/5 animate-pulse" />
                  <div className="h-3 w-3/5 mx-auto rounded-full bg-white/5 animate-pulse" />
                  <div className="h-3 w-1/3 mx-auto rounded-full bg-white/5 animate-pulse" />
                </div>
                <p className="text-xs text-text-muted tracking-wide">翻译中...</p>
              </motion.div>
            )}

            {/* Error State */}
            {error && !loading && (
              <motion.div
                key="error"
                className="p-6 flex flex-col items-center justify-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X size={18} className="text-red-400" />
                </div>
                <p className="text-sm text-text-secondary text-center">{error}</p>
                <button
                  onClick={handleClose}
                  className="btn-ghost text-xs mt-1"
                >
                  关闭
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {!loading && !error && payload && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.35, ease: "easeOut" }}
                className="flex flex-col overflow-hidden"
              >
                {/* Language badges */}
                <div className="flex items-center justify-center gap-2 px-4 py-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary-light font-medium border border-primary/20 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
                    {LANGUAGES[payload.sourceLang] || payload.sourceLang}
                  </span>
                  <motion.span
                    className="text-text-muted text-xs"
                    animate={{ x: [0, 4, 0], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 3 }}
                  >
                    →
                  </motion.span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.12)]">
                    {LANGUAGES[payload.targetLang] || payload.targetLang}
                  </span>
                </div>

                {/* Source Text */}
                <div className="px-4 pb-1">
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors mb-1.5 group/source"
                  >
                    {showOriginal ? (
                      <ChevronUp size={13} className="group-hover/source:text-primary-light transition-colors" />
                    ) : (
                      <ChevronDown size={13} className="group-hover/source:text-primary-light transition-colors" />
                    )}
                    <span className="tracking-wide">原文</span>
                    <span className="opacity-30 text-[10px]">— {payload.originalText.length} 字符</span>
                  </button>
                  <AnimatePresence>
                    {showOriginal && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: "auto", opacity: 1, marginBottom: 8 }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap break-words select-text">
                            {payload.originalText}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Divider */}
                <div className="mx-4 border-t border-white/[0.06]" />

                {/* Translated Text */}
                <div className="px-4 py-3 flex-1 overflow-y-auto max-h-[220px] scrollbar-hide">
                  <motion.p
                    className="leading-relaxed whitespace-pre-wrap break-words select-text"
                    style={{
                      fontFamily: settings.fontFamily,
                      fontSize: `${settings.fontSize}px`,
                      fontWeight: settings.fontWeight,
                      lineHeight: settings.lineHeight,
                      letterSpacing: `${settings.letterSpacing}px`,
                      textAlign: settings.textAlign,
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.3 }}
                  >
                    {payload.translatedText}
                  </motion.p>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-0.5 px-3 py-2.5 border-t border-white/[0.06]">
                  <ActionBtn icon={Copy} label="复制" onClick={handleCopy} />
                  <ActionBtn icon={Volume2} label="朗读" onClick={handleSpeak} />
                  <ActionBtn icon={X} label="关闭" onClick={handleClose} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function ActionBtn({
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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-text-muted hover:text-text-secondary"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      title={label}
    >
      <Icon size={14} />
      <span className="text-[11px] font-medium tracking-wide">{label}</span>
    </motion.button>
  );
}
