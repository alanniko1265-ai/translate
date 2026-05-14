import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import { LANGUAGES } from "../types";
import {
  Trash2,
  Search,
  Copy,
  Clock,
  Star,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

export function HistoryPanel() {
  const { translationHistory, clearHistory } = useAppStore();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? translationHistory.filter(
        (h) =>
          h.originalText.toLowerCase().includes(search.toLowerCase()) ||
          h.translatedText.toLowerCase().includes(search.toLowerCase())
      )
    : translationHistory;

  const handleCopy = async (text: string) => {
    try {
      const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
      await writeText(text);
    } catch {
      await navigator.clipboard.writeText(text);
    }
    toast.success("已复制");
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return d.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-lg font-semibold">翻译历史</h2>
        {translationHistory.length > 0 && (
          <motion.button
            onClick={clearHistory}
            className="btn-ghost flex items-center gap-1.5 text-xs text-error"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Trash2 size={14} />
            清空全部
          </motion.button>
        )}
      </motion.div>

      {/* Search */}
      {translationHistory.length > 0 && (
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索翻译记录..."
            className="input-field pl-9"
          />
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
        {filtered.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center h-full text-text-muted gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Clock size={40} className="opacity-30" />
            <p className="text-sm">
              {translationHistory.length === 0
                ? "暂无翻译记录"
                : "没有匹配的记录"}
            </p>
            {translationHistory.length === 0 && (
              <p className="text-xs text-text-muted/50">
                翻译内容将自动保存在这里
              </p>
            )}
          </motion.div>
        ) : (
          <AnimatePresence>
            {filtered.map((item, i) => (
              <motion.div
                key={item.timestamp + "-" + i}
                className="glass-card-sm p-4 hover:bg-white/[0.04] transition-colors group"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary-light shrink-0">
                      {LANGUAGES[item.sourceLang] || item.sourceLang}
                    </span>
                    <span className="text-xs text-text-muted">→</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 shrink-0">
                      {LANGUAGES[item.targetLang] || item.targetLang}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">
                    {formatTime(item.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-text-muted mb-1.5 line-clamp-2">
                  {item.originalText}
                </p>
                <p className="text-sm text-text-primary leading-relaxed">
                  {item.translatedText}
                </p>

                <div className="flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(item.translatedText)}
                    className="p-1.5 rounded-md hover:bg-white/5 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => handleCopy(item.originalText)}
                    className="p-1.5 rounded-md hover:bg-white/5 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <ExternalLink size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {translationHistory.length > 0 && (
        <p className="text-xs text-text-muted text-center mt-3">
          共 {translationHistory.length} 条记录，最多保留 500 条
        </p>
      )}
    </div>
  );
}
