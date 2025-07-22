import type { Object, Group, Line, Rect, Circle } from 'fabric';

let fabricModule: any = null;

// Initialize Fabric.js module
const getFabric = async (): Promise<any> => {
  if (!fabricModule) {
    fabricModule = await import('fabric');
  }
  return fabricModule;
};

/**
 * Parse SVG string and convert to Fabric.js objects
 * @param svgString - The SVG string to parse
 * @returns Promise that resolves to an array of Fabric.js objects
 */
export const parseSVGToFabric = async (svgString: string): Promise<fabric.Object[]> => {
  const fabric = await getFabric();
  // Await the promise-based API (Fabric.js v5+)
  const result = await fabric.loadSVGFromString(svgString);
  if (!result.objects || result.objects.length === 0) {
    throw new Error('Failed to parse SVG: No objects created');
  }
  return result.objects;
};

/**
 * Create a Fabric.js group from SVG objects with proper positioning
 * @param objects - Array of Fabric.js objects
 * @param options - Positioning and styling options
 * @returns Fabric.js group
 */
export const createSymbolGroup = async (
  objects: fabric.Object[],
  options: {
    left: number;
    top: number;
    angle: number;
    width: number;
    height: number;
    dataId: string;
  }
): Promise<fabric.Group> => {
  const fabric = await getFabric();

  return new fabric.Group(objects, {
    left: options.left,
    top: options.top,
    angle: options.angle,
    width: options.width,
    height: options.height,
    selectable: true,
    evented: true,
    dataId: options.dataId,
    originX: 'center',
    originY: 'center',
    // Do NOT override any visual styles here.
  });
};

/**
 * Fallback method to create simple shapes when SVG parsing fails
 * @param symbol - The symbol data
 * @param options - Positioning options
 * @returns Fabric.js object
 */
export const createFallbackShape = async (
  symbol: any,
  options: {
    left: number;
    top: number;
    angle: number;
    dataId: string;
  }
): Promise<fabric.Object> => {
  const fabric = await getFabric();

  switch (symbol.category) {
    case 'switches':
      return new fabric.Line([0, 25, 40, 25], {
        stroke: '#000',
        strokeWidth: 2,
        left: options.left - 20,
        top: options.top - 12.5,
        angle: options.angle,
        selectable: true,
        evented: true,
        dataId: options.dataId,
      });
    
    case 'outlets':
      return new fabric.Rect({
        left: options.left - 15,
        top: options.top - 15,
        width: 30,
        height: 30,
        stroke: '#000',
        strokeWidth: 2,
        fill: '#fff',
        angle: options.angle,
        selectable: true,
        evented: true,
        dataId: options.dataId,
      });
    
    case 'motors':
      return new fabric.Circle({
        left: options.left - 22,
        top: options.top - 22,
        radius: 22,
        stroke: '#000',
        strokeWidth: 2,
        fill: '#fff',
        angle: options.angle,
        selectable: true,
        evented: true,
        dataId: options.dataId,
      });

    case 'protection':
      // Circuit breakers, fuses, RCDs - use rectangle with vertical lines
      return new fabric.Group([
        new fabric.Line([25, 0, 25, 15], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Rect({ left: 15, top: 15, width: 20, height: 20, stroke: '#000', strokeWidth: 2, fill: '#fff' }),
        new fabric.Line([25, 35, 25, 50], { stroke: '#000', strokeWidth: 2 })
      ], {
        left: options.left - 25,
        top: options.top - 25,
        angle: options.angle,
        selectable: true,
        evented: true,
        dataId: options.dataId,
      });

    case 'distribution':
      // Distribution boards - use rectangle with horizontal lines
      return new fabric.Group([
        new fabric.Rect({ left: 10, top: 10, width: 30, height: 30, stroke: '#000', strokeWidth: 2, fill: '#fff' }),
        new fabric.Line([15, 20, 35, 20], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Line([15, 25, 35, 25], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Line([15, 30, 35, 30], { stroke: '#000', strokeWidth: 2 })
      ], {
        left: options.left - 25,
        top: options.top - 25,
        angle: options.angle,
        selectable: true,
        evented: true,
        dataId: options.dataId,
      });

    case 'lights':
      // Light points and fittings - use circle with cross
      return new fabric.Group([
        new fabric.Circle({ left: 13, top: 13, radius: 12, stroke: '#000', strokeWidth: 2, fill: '#fff' }),
        new fabric.Line([25, 13, 25, 37], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Line([13, 25, 37, 25], { stroke: '#000', strokeWidth: 2 }),
        new fabric.Line([25, 37, 25, 45], { stroke: '#000', strokeWidth: 2 })
      ], {
        left: options.left - 25,
        top: options.top - 25,
        angle: options.angle,
        selectable: true,
        evented: true,
        dataId: options.dataId,
      });
    
    default:
      return new fabric.Rect({
        left: options.left - 25,
        top: options.top - 25,
        width: 50,
        height: 50,
        stroke: '#000',
        strokeWidth: 2,
        fill: '#fff',
        angle: options.angle,
        selectable: true,
        evented: true,
        dataId: options.dataId,
      });
  }
}; 