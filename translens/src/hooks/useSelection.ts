import { useCallback, useRef, useEffect } from "react";
import { useAppStore } from "../stores/appStore";
import type { Selection } from "../types";

export function useSelection() {
  const isSelectingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const { setSelection, setShowPopover, showPopover, selection } =
    useAppStore();

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return;
      isSelectingRef.current = true;
      startRef.current = { x: e.clientX, y: e.clientY };
      setSelection({
        startX: e.clientX,
        startY: e.clientY,
        endX: e.clientX,
        endY: e.clientY,
      });
    },
    [setSelection]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isSelectingRef.current) return;
      setSelection({
        startX: startRef.current.x,
        startY: startRef.current.y,
        endX: e.clientX,
        endY: e.clientY,
      });
    },
    [setSelection]
  );

  const handleMouseUp = useCallback(() => {
    if (!isSelectingRef.current) return;
    isSelectingRef.current = false;

    const text = window.getSelection()?.toString()?.trim();
    if (text && text.length > 0) {
      setShowPopover(true);
    } else {
      setSelection(null);
    }
  }, [setSelection, setShowPopover]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setShowPopover(false);
    window.getSelection()?.removeAllRanges();
  }, [setSelection, setShowPopover]);

  useEffect(() => {
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  return { selection, showPopover, clearSelection };
}
