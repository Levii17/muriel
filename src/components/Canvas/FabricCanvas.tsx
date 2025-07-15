import React, { useEffect, useRef } from 'react';
import { useSetAtom, useAtom } from 'jotai';
import { canvasElementsAtom } from '../../stores/canvasStore';
import { symbolLibraryAtom } from '../../stores/symbolStore';
import { canvasViewportAtom } from '../../stores/canvasStore';
import { selectedElementsAtom } from '../../stores/canvasStore';
import type { ElectricalSymbol, CanvasElement } from '../../types';

// Remove fixed canvas size; will use parent container size
const GRID_SIZE = 10;
const MAJOR_GRID_SIZE = 50;
const MARGIN_PX = 40; // 10mm * 4px

const snapToGrid = (x: number, y: number) => ({
  x: Math.round(x / GRID_SIZE) * GRID_SIZE,
  y: Math.round(y / GRID_SIZE) * GRID_SIZE,
});

const FabricCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<any>(null);
  const fabricModuleRef = useRef<any>(null); // <-- store fabric module
  const [elements, setElements] = useAtom(canvasElementsAtom);
  const [symbolLibrary] = useAtom(symbolLibraryAtom);
  const [viewport, setViewport] = useAtom(canvasViewportAtom);
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
  // Selection state
  const [selected, setSelected] = useAtom(selectedElementsAtom);
  const [draggedSymbol, setDraggedSymbol] = React.useState<ElectricalSymbol | null>(null);
  const [dragPos, setDragPos] = React.useState<{ x: number; y: number } | null>(null);

  // Helper to find Fabric object by element id
  const symbolObjectMap = React.useRef<Record<string, any>>({});

  // Debug: Log the loaded symbol library on mount
  React.useEffect(() => {
    console.log('Loaded symbol library:', symbolLibrary);
    console.log('Loaded symbol IDs:', symbolLibrary.map(s => s.id));
  }, [symbolLibrary]);

  // Selection and manipulation logic
  useEffect(() => {
    if (!fabricRef.current) return;
    const fabricInstance = fabricRef.current;

    // Deselect all on background click
    const handleBackgroundClick = (opt: any) => {
      if (opt.target === fabricInstance.backgroundImage || opt.target === null) {
        setSelected([]);
      }
    };
    fabricInstance.on('mouse:down', handleBackgroundClick);

    // Symbol selection
    const handleObjectSelected = (opt: any) => {
      const obj = opt.target;
      if (obj && obj.dataId) {
        setSelected([obj.dataId]);
      }
    };
    fabricInstance.on('selection:created', handleObjectSelected);
    fabricInstance.on('selection:updated', handleObjectSelected);

    // Deselect on empty area
    fabricInstance.on('selection:cleared', () => setSelected([]));

    // Drag/move logic
    const handleObjectMoving = (opt: any) => {
      const obj = opt.target;
      if (obj && obj.dataId) {
        // Snap to grid
        obj.set({
          left: snapToGrid(obj.left, 0).x,
          top: snapToGrid(0, obj.top).y,
        });
      }
    };
    fabricInstance.on('object:moving', handleObjectMoving);

    // Resize logic
    const handleObjectScaling = (opt: any) => {
      const obj = opt.target;
      if (obj && obj.dataId) {
        // Snap width/height
        const width = Math.max(10, Math.round(obj.width * obj.scaleX / GRID_SIZE) * GRID_SIZE);
        const height = Math.max(10, Math.round(obj.height * obj.scaleY / GRID_SIZE) * GRID_SIZE);
        obj.set({
          scaleX: 1,
          scaleY: 1,
          width,
          height,
        });
      }
    };
    fabricInstance.on('object:scaling', handleObjectScaling);

    // Update atom state after move/resize
    const handleObjectModified = (opt: any) => {
      const obj = opt.target;
      if (obj && obj.dataId) {
        setElements(prev => prev.map(el =>
          el.id === obj.dataId
            ? {
                ...el,
                position: { x: obj.left + (obj.width / 2), y: obj.top + (obj.height / 2) },
                width: obj.width,
                height: obj.height,
                rotation: obj.angle || 0,
              }
            : el
        ));
      }
    };
    fabricInstance.on('object:modified', handleObjectModified);

    return () => {
      fabricInstance.off('mouse:down', handleBackgroundClick);
      fabricInstance.off('selection:created', handleObjectSelected);
      fabricInstance.off('selection:updated', handleObjectSelected);
      fabricInstance.off('selection:cleared');
      fabricInstance.off('object:moving', handleObjectMoving);
      fabricInstance.off('object:scaling', handleObjectScaling);
      fabricInstance.off('object:modified', handleObjectModified);
    };
  }, [setSelected, setElements]);

  // Responsive container size
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate scale to fit container, but never scale above 1
  // (If you want to keep aspect ratio, you can adjust here)
  const scale = 1;

  // Helper to get drop position relative to canvas
  const getPointerPosition = (evt: React.DragEvent) => {
    const boundingRect = canvasRef.current?.getBoundingClientRect();
    if (!boundingRect) return { x: 0, y: 0 };
    return {
      x: evt.clientX - boundingRect.left,
      y: evt.clientY - boundingRect.top,
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Show ghost preview
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const symbol: ElectricalSymbol = JSON.parse(data);
      setDraggedSymbol(symbol);
      const pos = getPointerPosition(e);
      setDragPos(pos);
    }
  };

  const handleDragLeave = () => {
    setDraggedSymbol(null);
    setDragPos(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedSymbol(null);
    setDragPos(null);
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const symbol: ElectricalSymbol = JSON.parse(data);
      console.log('Dropped symbol:', symbol);
      const pos = getPointerPosition(e);
      const snapped = snapToGrid(pos.x, pos.y);
      setElements((prev) => [
        ...prev,
        {
          id: `${symbol.id}-${Date.now()}`,
          symbolId: symbol.id,
          position: snapped,
          rotation: 0,
          properties: {},
        } as CanvasElement,
      ]);
    }
  };

  // Pan and zoom handlers
  const isPanning = React.useRef(false);
  const lastPointer = React.useRef<{ x: number; y: number } | null>(null);

  // Mouse down for pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      isPanning.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  };
  // Mouse move for pan
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning.current && lastPointer.current) {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      setViewport(v => ({ ...v, pan: { x: v.pan.x + dx, y: v.pan.y + dy } }));
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  };
  // Mouse up to end pan
  const handleMouseUp = () => {
    isPanning.current = false;
    lastPointer.current = null;
  };

  // Only re-create Fabric.js instance if container size changes
  useEffect(() => {
    import('fabric').then((mod) => {
      const fabric = mod;
      fabricModuleRef.current = fabric; // <-- store module
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      if (canvasRef.current && fabric && fabric.Canvas) {
        const fabricInstance = new fabric.Canvas(canvasRef.current, {
          width: containerSize.width,
          height: containerSize.height,
          backgroundColor: '#fff',
          selection: true,
          preserveObjectStacking: true,
        });
        fabricRef.current = fabricInstance;
      }
    });
    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [containerSize.width, containerSize.height]);

  // Redraw grid and elements on relevant changes
  useEffect(() => {
    const fabricInstance = fabricRef.current;
    const fabric = fabricModuleRef.current;
    if (!fabricInstance || !fabric) return;
    // Clear canvas (but not the instance)
    fabricInstance.clear();
    // Set background and viewport
    fabricInstance.backgroundColor = '#fff';
    fabricInstance.renderAll();
    fabricInstance.setViewportTransform([
      viewport.zoom, 0, 0, viewport.zoom, viewport.pan.x, viewport.pan.y
    ]);
    // Draw grid
    for (let x = 0; x <= containerSize.width; x += GRID_SIZE) {
      const isMajor = x % MAJOR_GRID_SIZE === 0;
      const line = new fabric.Line([x, 0, x, containerSize.height], {
        stroke: isMajor ? '#bdbdbd' : '#e0e0e0',
        strokeWidth: isMajor ? 1.2 : 0.7,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      fabricInstance.add(line);
    }
    for (let y = 0; y <= containerSize.height; y += GRID_SIZE) {
      const isMajor = y % MAJOR_GRID_SIZE === 0;
      const line = new fabric.Line([0, y, containerSize.width, y], {
        stroke: isMajor ? '#bdbdbd' : '#e0e0e0',
        strokeWidth: isMajor ? 1.2 : 0.7,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      fabricInstance.add(line);
    }
    // Add all elements (symbols)
    const addSymbols = async () => {
      for (const el of elements) {
        const symbol = symbolLibrary.find(s => s.id === el.symbolId);
        if (!symbol || !fabric || !symbol.svg) {
          console.warn('Skipping symbol:', el.symbolId, 'fabric module or SVG missing');
          continue;
        }
        try {
          await new Promise<void>((resolve) => {
            fabric.loadSVGFromString(symbol.svg, (objects: any[], options: any) => {
              try {
                if (!Array.isArray(objects) || typeof options !== 'object' || !objects.length) {
                  console.error('Malformed SVG or Fabric.js parse error:', { symbolId: el.symbolId, svg: symbol.svg, objects, options });
                  resolve();
                  return;
                }
                const group = fabric.util.groupSVGElements(objects, options);
                group.set({
                  left: el.position.x,
                  top: el.position.y,
                  angle: el.rotation || 0,
                  selectable: true,
                  data: { id: el.id },
                  hasControls: true,
                  hasBorders: true,
                  hoverCursor: 'pointer',
                });
                fabricInstance.add(group);
              } catch (err) {
                console.error('Error adding symbol to canvas:', err, { symbolId: el.symbolId, svg: symbol.svg });
              }
              resolve();
            });
          });
        } catch (err) {
          console.error('Error loading SVG for symbol:', el.symbolId, err);
        }
      }
      fabricInstance.renderAll();
    };
    addSymbols();
  }, [elements, symbolLibrary, viewport, containerSize.width, containerSize.height]);

  // Only update viewport transform on zoom/pan
  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.setViewportTransform([
        viewport.zoom, 0, 0, viewport.zoom, viewport.pan.x, viewport.pan.y
      ]);
      // Always ensure background is white
      fabricRef.current.backgroundColor = '#fff';
      fabricRef.current.renderAll();
    }
  }, [viewport]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleBy = 1.08;
      const oldZoom = viewport.zoom;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pointer = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const mousePointTo = {
        x: (pointer.x - viewport.pan.x) / oldZoom,
        y: (pointer.y - viewport.pan.y) / oldZoom,
      };
      const direction = e.deltaY > 0 ? -1 : 1;
      let newZoom = direction > 0 ? oldZoom * scaleBy : oldZoom / scaleBy;
      newZoom = Math.max(0.25, Math.min(2, newZoom));
      const newPan = {
        x: pointer.x - mousePointTo.x * newZoom,
        y: pointer.y - mousePointTo.y * newZoom,
      };
      setViewport(v => ({ ...v, zoom: newZoom, pan: newPan }));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [viewport, setViewport, canvasRef]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', background: '#222', borderRadius: 0, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)', border: '1.5px solid #e0e0e0' }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      tabIndex={0}
      aria-label="Schematic Canvas"
    >
      <canvas
        ref={canvasRef}
        width={containerSize.width}
        height={containerSize.height}
        style={{
          padding: 0,
          margin: 0,
          border: 0,
          background: '#fff',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
        tabIndex={-1}
        aria-label="Drawing Area"
      />
      {/* Drag ghost preview */}
      {draggedSymbol && dragPos && (
        <div
          style={{
            position: 'absolute',
            left: dragPos.x - 24,
            top: dragPos.y - 24,
            pointerEvents: 'none',
            opacity: 0.6,
            zIndex: 10,
            width: 48,
            height: 48,
            filter: 'drop-shadow(0 2px 8px rgba(30,30,60,0.18))',
          }}
          aria-label={`Preview: ${draggedSymbol.name}`}
        >
          <span dangerouslySetInnerHTML={{ __html: draggedSymbol.svg }} />
        </div>
      )}
      {/* Fallback message for debugging */}
      {false && <div style={{ color: 'red' }}>Canvas or Fabric.js failed to load</div>}
    </div>
  );
};

export default FabricCanvas; 