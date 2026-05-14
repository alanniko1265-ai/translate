import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function SettingSection({ title, icon: Icon, children }: Props) {
  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Icon size={15} className="text-primary-light" />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </motion.div>
  );
}
