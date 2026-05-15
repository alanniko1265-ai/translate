import { useAppStore } from "../stores/appStore";
import { useI18n } from "../hooks/useI18n";
import { motion } from "framer-motion";
import { Languages, History, Settings } from "lucide-react";

const tabs = [
  { id: "translate" as const, icon: Languages, labelKey: "sidebar.translate" },
  { id: "history" as const, icon: History, labelKey: "sidebar.history" },
  { id: "settings" as const, icon: Settings, labelKey: "sidebar.settings" },
];

export function Sidebar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const { t } = useI18n();

  return (
    <aside className="w-16 h-full flex flex-col items-center py-4 border-r border-white/5 bg-[#0F172A]">
      <div className="mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center neon-glow">
          <span className="text-white font-bold text-sm">TL</span>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {tabs.map(({ id, icon: Icon, labelKey }) => (
          <motion.button
            key={id}
            onClick={() => setActiveTab(id)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{
              background:
                activeTab === id
                  ? "rgba(99,102,241,0.15)"
                  : "transparent",
              color: activeTab === id ? "#818CF8" : "#64748B",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={t(labelKey)}
          >
            <Icon size={20} />
            {activeTab === id && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </nav>

      <div className="mt-auto mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
          U
        </div>
      </div>
    </aside>
  );
}
