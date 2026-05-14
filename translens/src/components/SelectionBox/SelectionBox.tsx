import { memo } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../../stores/appStore";

export const SelectionBox = memo(function SelectionBox() {
  const selection = useAppStore((s) => s.selection);
  const settings = useAppStore((s) => s.settings);

  if (!selection) return null;

  const left = Math.min(selection.startX, selection.endX);
  const top = Math.min(selection.startY, selection.endY);
  const width = Math.abs(selection.endX - selection.startX);
  const height = Math.abs(selection.endY - selection.startY);

  if (width < 5 && height < 5) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="fixed pointer-events-none z-[9999]"
      style={{
        left,
        top,
        width,
        height,
        background: settings.selectionBgColor,
        border: `${settings.selectionBorderWidth}px ${settings.selectionBorderStyle} ${settings.selectionBorderColor}`,
        borderRadius: `${settings.selectionBorderRadius}px`,
        boxShadow: settings.selectionBoxShadow,
      }}
    >
      {/* Dashed border animation via CSS */}
      {settings.selectionBorderStyle === "dashed" && (
        <style>{`
          @keyframes dash-move {
            0% { border-dash-offset: 0; }
            100% { border-dash-offset: 20; }
          }
        `}</style>
      )}
    </motion.div>
  );
});
