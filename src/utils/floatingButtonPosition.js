export const BUTTON_WIDTH = 184;
export const BUTTON_HEIGHT = 58;
const MARGIN = 16;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const buttonBounds = ({ width, height, buttonWidth = BUTTON_WIDTH, buttonHeight = BUTTON_HEIGHT }) => ({
  minX: Math.min(MARGIN, Math.max(0, width - buttonWidth)),
  maxX: Math.max(MARGIN, width - buttonWidth - MARGIN),
  minY: Math.min(MARGIN, Math.max(0, height - buttonHeight)),
  maxY: Math.max(MARGIN, height - buttonHeight - MARGIN),
});
export const constrainPosition = (point, size) => {
  const b = buttonBounds(size);
  return {
    x: clamp(point.x, b.minX, b.maxX),
    y: clamp(point.y, b.minY, b.maxY),
  };
};
export const restorePosition = (saved, size) => {
  const b = buttonBounds(size);
  const ratio = Number.isFinite(saved?.yRatio) ? clamp(saved.yRatio, 0, 1) : 1;
  return {
    x: saved?.side === 'left' ? b.minX : b.maxX,
    y: b.minY + ratio * (b.maxY - b.minY),
  };
};
export const snapPosition = (point, size) => {
  const b = buttonBounds(size);
  const bounded = constrainPosition(point, size);
  const side = bounded.x <= (b.minX + b.maxX) / 2 ? 'left' : 'right';
  const saved = {
    side,
    yRatio: b.maxY > b.minY ? (bounded.y - b.minY) / (b.maxY - b.minY) : 1,
  };
  return { point: restorePosition(saved, size), saved };
};
