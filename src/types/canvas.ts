export interface CanvasElement {
  id: string;
  symbolId: string;
  position: { x: number; y: number };
  rotation: number;
  properties: Record<string, any>;
  width?: number;
  height?: number;
}

export interface Viewport {
  zoom: number;
  pan: { x: number; y: number };
}