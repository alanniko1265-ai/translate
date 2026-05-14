import { invoke } from "@tauri-apps/api/core";
import { emitTo, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Loader2, ScanSearch } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

interface Point {
  x: number;
  y: number;
}

interface OverlayTextPayload {
  text: string;
  rect: OcrRect;
}

interface OcrResult {
  text: string;
}

interface OverlayScreenshot {
  imageBase64: string;
  width: number;
  height: number;
}

interface OcrRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Ignore tiny movements (mis-clicks). */
const ACCIDENTAL_DRAG_MAX_PX = 8;

export function ScreenshotOverlay() {
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshot, setScreenshot] = useState<OverlayScreenshot | null>(null);

  const selection = useMemo(() => {
    if (!startPoint || !currentPoint) return null;
    return getSelectionRect(startPoint, currentPoint);
  }, [startPoint, currentPoint]);

  const refreshScreenshot = useCallback(async () => {
    setStartPoint(null);
    setCurrentPoint(null);
    setIsCapturing(false);

    try {
      const result = await invoke<OverlayScreenshot | null>("get_pending_screenshot");
      setScreenshot(result);
    } catch (error) {
      console.error("[ScreenshotOverlay] Failed to load pending screenshot:", error);
      setScreenshot(null);
    }
  }, []);

  useEffect(() => {
    const previousBodyBackground = document.body.style.background;
    const previousBodyCursor = document.body.style.cursor;
    const previousHtmlBackground = document.documentElement.style.background;

    document.body.style.background = "transparent";
    document.body.style.cursor = "crosshair";
    document.documentElement.style.background = "transparent";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void cancelOverlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.background = previousBodyBackground;
      document.body.style.cursor = previousBodyCursor;
      document.documentElement.style.background = previousHtmlBackground;
    };
  }, []);

  useEffect(() => {
    void refreshScreenshot();

    const unlisten = listen("screenshot-overlay-refresh", () => {
      void refreshScreenshot();
    });

    return () => {
      unlisten.then((fn) => fn()).catch(() => {});
    };
  }, [refreshScreenshot]);

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (isCapturing || event.button !== 0) return;
    const point = { x: event.clientX, y: event.clientY };
    setStartPoint(point);
    setCurrentPoint(point);
  };

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!startPoint || isCapturing) return;
    setCurrentPoint({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = async (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!startPoint || isCapturing) return;

    const endPoint = { x: event.clientX, y: event.clientY };
    const rect = getSelectionRect(startPoint, endPoint);

    if (rect.width < ACCIDENTAL_DRAG_MAX_PX || rect.height < ACCIDENTAL_DRAG_MAX_PX) {
      setStartPoint(null);
      setCurrentPoint(null);
      return;
    }

    setCurrentPoint(endPoint);
    setIsCapturing(true);

    try {
      const dpr = window.devicePixelRatio || 1;
      const scaledRect: OcrRect = {
        x: Math.round(rect.x * dpr),
        y: Math.round(rect.y * dpr),
        width: Math.round(rect.width * dpr),
        height: Math.round(rect.height * dpr),
      };
      const logicalRect: OcrRect = {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };

      const result = await invokeOcrWithFallback(scaledRect, logicalRect);
      const text = result.text.trim();

      if (!text) {
        throw new Error(
          "未能识别到文字。请将选区拖大一些，包住字迹清晰的区域后再试。"
        );
      }

      const payload: OverlayTextPayload = {
        text,
        rect: scaledRect,
      };
      await emitTo("main", "overlay-text-selected", payload);
    } catch (error) {
      console.error("[ScreenshotOverlay] OCR/translation error:", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : JSON.stringify(error) || "Screenshot translation failed.";
      await emitOverlayError(message);
    } finally {
      await closeOverlayWindow();
    }
  };

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black/20"
      onContextMenu={(event) => {
        event.preventDefault();
        void cancelOverlay();
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={(event) => {
        void handleMouseUp(event);
      }}
    >
      {screenshot && (
        <img
          src={`data:image/png;base64,${screenshot.imageBase64}`}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
          draggable={false}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_48%)]" />

      <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full border border-white/20 bg-slate-950/75 px-5 py-2 text-sm text-slate-100 shadow-2xl backdrop-blur-md">
        拖拽框选要识别的文字区域。Esc 取消。
      </div>

      {selection && (
        <div
          className="pointer-events-none absolute border-2 border-dashed border-indigo-400 bg-indigo-500/10 shadow-[0_0_0_9999px_rgba(2,6,23,0.38)]"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.width,
            height: selection.height,
          }}
        />
      )}

      {isCapturing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="glass-card flex items-center gap-3 px-5 py-4">
            <Loader2 size={20} className="animate-spin text-primary-light" />
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <ScanSearch size={16} className="text-primary-light" />
              Detecting text from the screenshot...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getSelectionRect(startPoint: Point, endPoint: Point) {
  const x = Math.min(startPoint.x, endPoint.x);
  const y = Math.min(startPoint.y, endPoint.y);
  const width = Math.abs(startPoint.x - endPoint.x);
  const height = Math.abs(startPoint.y - endPoint.y);

  return { x, y, width, height };
}

async function cancelOverlay() {
  await emitTo("main", "overlay-cancelled").catch(() => {});
  await closeOverlayWindow();
}

async function emitOverlayError(message: string) {
  await emitTo("main", "overlay-error", { message }).catch((e) => {
    console.error("[ScreenshotOverlay] Failed to emit overlay-error:", e);
  });
}

async function closeOverlayWindow() {
  await invoke("clear_pending_screenshot").catch(() => {});
  await getCurrentWindow().hide().catch(() => {});
}

async function invokeOcrWithFallback(
  primaryRect: OcrRect,
  fallbackRect: OcrRect
): Promise<OcrResult> {
  try {
    return await invoke<OcrResult>("ocr_pending_screenshot_region", { ...primaryRect });
  } catch (primaryError) {
    if (isSameRect(primaryRect, fallbackRect)) {
      throw primaryError;
    }

    try {
      return await invoke<OcrResult>("ocr_pending_screenshot_region", { ...fallbackRect });
    } catch {
      throw primaryError;
    }
  }
}

function isSameRect(left: OcrRect, right: OcrRect) {
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
  );
}
