export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenSize {
  width: number;
  height: number;
}

export interface BubbleSize {
  width: number;
  height: number;
}

export type PointerPlacement = "left" | "right" | "top" | "bottom" | "none";

export interface SmartPositionResult {
  x: number;
  y: number;
  pointerPlacement: PointerPlacement;
  pointerOffset: number;
}

const PADDING = 12;
const POINTER_SIZE = 10;
const ANCHOR_GAP = 14;

export function computeSmartPosition(
  anchorRect: AnchorRect,
  screenSize: ScreenSize,
  bubbleSize: BubbleSize,
): SmartPositionResult {
  const bw = sanitize(bubbleSize.width, 280);
  const bh = sanitize(bubbleSize.height, 200);
  const sw = sanitize(screenSize.width, 1920);
  const sh = sanitize(screenSize.height, 1080);

  const anchorCenterX = sanitize(anchorRect.x, 0) + sanitize(anchorRect.width, 1) / 2;
  const anchorCenterY = sanitize(anchorRect.y, 0) + sanitize(anchorRect.height, 1) / 2;

  // Try right
  const rightX = sanitize(anchorRect.x, 0) + sanitize(anchorRect.width, 1) + ANCHOR_GAP;
  let rightY = anchorCenterY - bh / 2;
  rightY = clamp(rightY, PADDING, sh - bh - PADDING);
  const rightOffset = anchorCenterY - rightY;
  if (rightX + bw + PADDING <= sw) {
    return { x: Math.round(rightX), y: Math.round(rightY), pointerPlacement: "left", pointerOffset: Math.round(rightOffset) };
  }

  // Try left
  const leftX = sanitize(anchorRect.x, 0) - bw - ANCHOR_GAP;
  let leftY = anchorCenterY - bh / 2;
  leftY = clamp(leftY, PADDING, sh - bh - PADDING);
  const leftOffset = anchorCenterY - leftY;
  if (leftX >= PADDING) {
    return { x: Math.round(leftX), y: Math.round(leftY), pointerPlacement: "right", pointerOffset: Math.round(leftOffset) };
  }

  // Try bottom
  let bottomX = anchorCenterX - bw / 2;
  const bottomY = sanitize(anchorRect.y, 0) + sanitize(anchorRect.height, 1) + ANCHOR_GAP;
  bottomX = clamp(bottomX, PADDING, sw - bw - PADDING);
  const bottomOffset = anchorCenterX - bottomX;
  if (bottomY + bh + PADDING <= sh) {
    return { x: Math.round(bottomX), y: Math.round(bottomY), pointerPlacement: "top", pointerOffset: Math.round(bottomOffset) };
  }

  // Try top
  let topX = anchorCenterX - bw / 2;
  const topY = sanitize(anchorRect.y, 0) - bh - ANCHOR_GAP;
  topX = clamp(topX, PADDING, sw - bw - PADDING);
  const topOffset = anchorCenterX - topX;
  if (topY >= PADDING) {
    return { x: Math.round(topX), y: Math.round(topY), pointerPlacement: "bottom", pointerOffset: Math.round(topOffset) };
  }

  // Fallback: center with no pointer
  return {
    x: PADDING,
    y: PADDING,
    pointerPlacement: "none",
    pointerOffset: 0,
  };
}

function sanitize(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
