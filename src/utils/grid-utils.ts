export const GRID_SIZE = 10;
export const MAJOR_GRID_SIZE = 50;

export function snapToGrid(x: number, y: number, gridSize = GRID_SIZE): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

// Drawing format constants (1mm = 4px)
export const MM_TO_PX = 4;
export const PAPER_A3 = { width: 290 * MM_TO_PX, height: 150 * MM_TO_PX };
export const MARGIN_MM = 10;
export const MARGIN_PX = MARGIN_MM * MM_TO_PX;
export const TITLE_BLOCK_HEIGHT_MM = 10;
export const TITLE_BLOCK_HEIGHT_PX = TITLE_BLOCK_HEIGHT_MM * MM_TO_PX;
export const DRAWING_AREA = {
  width: 290 * MM_TO_PX,
  height: 150 * MM_TO_PX,
};
