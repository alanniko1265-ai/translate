import { useCallback, useEffect, useMemo, useState, type PointerEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../../stores/appStore";
import { useI18n } from "../../hooks/useI18n";
import { LANGUAGES } from "../../types";
import { resolveChatBubbleColors } from "../../utils/chatBubbleThemes";
import type { PointerPlacement } from "../../utils/smartPosition";
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

interface PointerUpdatePayload {
  pointerPlacement: string;
  pointerOffset: number;
}

export function ChatBubble() {
  const [payload, setPayload] = useState<TranslationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const settings = useAppStore((s) => s.settings);
  const { t } = useI18n();

  const searchParams = new URLSearchParams(window.location.search);
  const waitForResult = searchParams.get("loading") === "1";
  const initialPlacement =
    (searchParams.get("pointer_placement") as PointerPlacement) || "none";
  const initialOffset = parseInt(searchParams.get("pointer_offset") || "0", 10);

  const [pointerPlacement, setPointerPlacement] =
    useState<PointerPlacement>(initialPlacement);
  const [pointerOffset, setPointerOffset] = useState(initialOffset);

  const colors = useMemo(() => {
    return resolveChatBubbleColors(settings.chatBubbleTheme, {
      bgColor: settings.chatBubbleBgColor,
      textColor: settings.chatBubbleTextColor,
      accentColor: settings.chatBubbleAccentColor,
    });
  }, [
    settings.chatBubbleTheme,
    settings.chatBubbleBgColor,
    settings.chatBubbleTextColor,
    settings.chatBubbleAccentColor,
  ]);

  const bubbleOpacity = settings.chatBubbleOpacity / 100;

  const bgWithOpacity = useMemo(() => {
    const match = colors.bg.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/,
    );
    if (match) {
      const [, r, g, b] = match;
      return `rgba(${r}, ${g}, ${b}, ${bubbleOpacity})`;
    }
    return colors.bg;
  }, [colors.bg, bubbleOpacity]);

  const applyPayload = useCallback((data: TranslationPayload) => {
    setPayload(data);
    setLoading(false);
    setError(null);
    setShowOriginal(true);
  }, []);

  const loadPendingTranslation = useCallback(async () => {
    try {
      const data = await invoke<TranslationPayload | null>(
        "get_pending_translation",
      );
      if (data) {
        applyPayload(data);
        return;
      }

      if (waitForResult) {
        setPayload(null);
        setLoading(true);
        setError(null);
        return;
      }

      setLoading(false);
      setError("No translation content was received. Please trigger translation again.");
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [applyPayload, waitForResult]);

  const handleStartDrag = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    void getCurrentWindow().startDragging().catch(() => {});
  }, []);

  const anim =
    settings.chatBubbleAnimation === "none"
      ? {
          initial: {},
          animate: {},
          exit: {},
          transition: {},
        }
      : settings.chatBubbleAnimation === "gentle"
        ? {
            initial: { opacity: 0, y: 12 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 8 },
            transition: { duration: 0.4, ease: "easeOut" as const },
          }
        : {
            initial: { opacity: 0, scale: 0.85, y: 20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.95, y: 8 },
            transition: {
              type: "spring" as const,
              stiffness: 350,
              damping: 28,
              mass: 0.8,
            },
          };

  useEffect(() => {
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";

    void loadPendingTranslation();

    const resultUnlisten = listen<TranslationPayload>(
      "translation-result",
      (event) => {
        applyPayload(event.payload);
      },
    );

    const updateUnlisten = listen<PointerUpdatePayload>(
      "pointer-placement-update",
      (event) => {
        setPointerPlacement(
          (event.payload.pointerPlacement as PointerPlacement) || "none",
        );
        setPointerOffset(event.payload.pointerOffset || 0);
      },
    );

    const loadingUnlisten = listen("translation-loading", () => {
      setPayload(null);
      setLoading(true);
      setError(null);
      setShowOriginal(true);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        getCurrentWindow().hide().catch(() => {});
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      resultUnlisten.then((fn) => fn());
      updateUnlisten.then((fn) => fn());
      loadingUnlisten.then((fn) => fn());
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.background = "";
      document.documentElement.style.background = "";
    };
  }, [applyPayload, loadPendingTranslation]);

  const handleClose = async () => {
    await getCurrentWindow().hide().catch(() => {});
  };

  const handleCopy = async () => {
    if (!payload) return;
    try {
      const { writeText } = await import(
        "@tauri-apps/plugin-clipboard-manager"
      );
      await writeText(payload.translatedText);
    } catch {
      await navigator.clipboard.writeText(payload.translatedText);
    }
    toast.success(t("chatBubble.copied"));
  };

  const handleSpeak = () => {
    if (!payload) return;
    const utterance = new SpeechSynthesisUtterance(payload.translatedText);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const pointerStyle: React.CSSProperties =
    pointerPlacement !== "none"
      ? {
          position: "absolute",
          width: 0,
          height: 0,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          ...(pointerPlacement === "left" && {
            left: -8,
            top: pointerOffset,
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: `8px solid ${colors.accent}`,
          }),
          ...(pointerPlacement === "right" && {
            right: -8,
            top: pointerOffset,
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderLeft: `8px solid ${colors.accent}`,
          }),
          ...(pointerPlacement === "top" && {
            top: -8,
            left: pointerOffset,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: `8px solid ${colors.accent}`,
          }),
          ...(pointerPlacement === "bottom" && {
            bottom: -8,
            left: pointerOffset,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: `8px solid ${colors.accent}`,
          }),
        }
      : { display: "none" };

  return (
    <div className="h-screen w-screen overflow-hidden bg-transparent">
      <motion.div
        className="relative flex h-full w-full flex-col overflow-hidden"
        style={{
          width: "100%",
        }}
        {...anim}
      >
        {/* Pointer arrow */}
        <div style={pointerStyle} />

        <div
          className="flex h-full min-h-0 flex-col overflow-hidden"
          style={{
            borderRadius: `${settings.popupBorderRadius}px`,
            background: bgWithOpacity,
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: `1px solid ${colors.accent}22`,
            boxShadow: `0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px ${colors.accent}11, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 select-none group/header">
            <div
              onPointerDown={handleStartDrag}
              className="flex items-center gap-2 flex-1 cursor-grab active:cursor-grabbing"
              style={{ color: colors.text }}
            >
              <GripHorizontal
                size={14}
                className="opacity-40 group-hover/header:opacity-70 transition-opacity shrink-0"
              />
              <Languages size={14} className="shrink-0" style={{ color: colors.accent }} />
              <span
                className="text-xs font-medium tracking-wide opacity-60"
                style={{ color: colors.text }}
              >
                TransLens
              </span>
            </div>
            <motion.button
              onClick={handleClose}
              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              style={{ color: colors.text }}
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
                className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {/* Typing indicator */}
                <div className="flex items-center gap-1.5">
                  <motion.span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: colors.accent }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  />
                  <motion.span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: colors.accent }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.4,
                      ease: "easeInOut",
                      delay: 0.2,
                    }}
                  />
                  <motion.span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: colors.accent }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.4,
                      ease: "easeInOut",
                      delay: 0.4,
                    }}
                  />
                </div>
                <p
                  className="text-xs tracking-wide"
                  style={{ color: colors.text, opacity: 0.5 }}
                >
                  {t("chatBubble.translating")}
                </p>
              </motion.div>
            )}

            {/* Error State */}
            {error && !loading && (
              <motion.div
                key="error"
                className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: `${colors.accent}18` }}
                >
                  <X size={18} style={{ color: colors.accent }} />
                </div>
                <p
                  className="text-sm text-center"
                  style={{ color: colors.text, opacity: 0.7 }}
                >
                  {error}
                </p>
                <button
                  onClick={handleClose}
                  className="btn-ghost text-xs mt-1"
                  style={{ color: colors.text, borderColor: `${colors.accent}33` }}
                >
                  {t("chatBubble.close")}
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
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                {/* Language badges */}
                <div className="flex items-center justify-center gap-2 px-4 py-3">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium border"
                    style={{
                      background: `${colors.accent}18`,
                      color: colors.accent,
                      borderColor: `${colors.accent}33`,
                      boxShadow: `0 0 12px ${colors.accent}22`,
                    }}
                  >
                    {LANGUAGES[payload.sourceLang] || payload.sourceLang}
                  </span>
                  <motion.span
                    className="text-xs"
                    style={{ color: colors.text, opacity: 0.5 }}
                    animate={{ x: [0, 4, 0], opacity: [0.5, 0.8, 0.5] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.5,
                      ease: "easeInOut",
                      repeatDelay: 3,
                    }}
                  >
                    →
                  </motion.span>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium border"
                    style={{
                      background: `${colors.accent}18`,
                      color: colors.accent,
                      borderColor: `${colors.accent}33`,
                      boxShadow: `0 0 12px ${colors.accent}22`,
                    }}
                  >
                    {LANGUAGES[payload.targetLang] || payload.targetLang}
                  </span>
                </div>

                {/* Source Text */}
                <div className="px-4 pb-1">
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="flex items-center gap-1.5 text-xs transition-colors mb-1.5 group/source"
                    style={{ color: colors.text, opacity: 0.5 }}
                  >
                    {showOriginal ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                    <span className="tracking-wide">{t("chatBubble.original")}</span>
                    <span className="opacity-30 text-[10px]">
                      — {payload.originalText.length} {t("chatBubble.chars")}
                    </span>
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
                        <div
                          className="p-3 rounded-lg border"
                          style={{
                            background: `${colors.accent}08`,
                            borderColor: `${colors.accent}15`,
                          }}
                        >
                          <p
                            className="text-xs leading-relaxed whitespace-pre-wrap break-words select-text"
                            style={{ color: colors.text, opacity: 0.7 }}
                          >
                            {payload.originalText}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Divider */}
                <div
                  className="mx-4 border-t"
                  style={{ borderColor: `${colors.accent}15` }}
                />

                {/* Translated Text */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 scrollbar-hide">
                  <motion.p
                    className="leading-relaxed whitespace-pre-wrap break-words select-text"
                    style={{
                      fontFamily: settings.fontFamily,
                      fontSize: `${settings.chatBubbleFontSize}px`,
                      fontWeight: settings.fontWeight,
                      lineHeight: settings.lineHeight,
                      letterSpacing: `${settings.letterSpacing}px`,
                      textAlign: settings.textAlign,
                      color: colors.text,
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.3 }}
                  >
                    {payload.translatedText}
                  </motion.p>
                </div>

                {/* Footer Actions */}
                <div
                  className="flex items-center justify-end gap-0.5 px-3 py-2.5 border-t"
                  style={{ borderColor: `${colors.accent}15` }}
                >
                  <ActionBtn
                    icon={Copy}
                    label={t("chatBubble.copy")}
                    onClick={handleCopy}
                    color={colors.text}
                  />
                  <ActionBtn
                    icon={Volume2}
                    label={t("chatBubble.speak")}
                    onClick={handleSpeak}
                    color={colors.text}
                  />
                  <ActionBtn
                    icon={X}
                    label={t("chatBubble.close")}
                    onClick={handleClose}
                    color={colors.text}
                  />
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
  color,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
      style={{ color }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      title={label}
    >
      <Icon size={14} />
      <span className="text-[11px] font-medium tracking-wide">{label}</span>
    </motion.button>
  );
}
