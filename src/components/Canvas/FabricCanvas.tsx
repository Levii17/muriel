import React, { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { canvasElementsAtom } from '../../stores/canvasStore';
import { symbolLibraryAtom } from '../../stores/symbolStore';
import { canvasViewportAtom } from '../../stores/canvasStore';
import { selectedElementsAtom } from '../../stores/canvasStore';
import { draggedSymbolAtom } from '../../stores/symbolStore';
import { titleBlockAtom } from '../../stores/titleBlockStore';
import type { ElectricalSymbol, CanvasElement } from '../../types';
import { parseSVGToFabric, createSymbolGroup, createFallbackShape } from '../../utils/svg-utils';

// Remove fixed canvas size; will use parent container size
const GRID_SIZE = 10;
const MAJOR_GRID_SIZE = 50;

const snapToGrid = (x: number, y: number) => ({
  x: Math.round(x / GRID_SIZE) * GRID_SIZE,
  y: Math.round(y / GRID_SIZE) * GRID_SIZE,
});

const FabricCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<any>(null);
  const [elements, setElements] = useAtom(canvasElementsAtom);
  const [symbolLibrary] = useAtom(symbolLibraryAtom);
  const [viewport, setViewport] = useAtom(canvasViewportAtom);
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
  // Selection state
  const [selected, setSelected] = useAtom(selectedElementsAtom);
  const [draggedSymbol, setDraggedSymbol] = useAtom(draggedSymbolAtom);
  const [ghostPos, setGhostPos] = React.useState<{ x: number; y: number } | null>(null);
  const [titleBlock] = useAtom(titleBlockAtom);

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
    if (draggedSymbol) {
      const pos = getPointerPosition(e);
      const snapped = snapToGrid(pos.x, pos.y);
      setGhostPos(snapped);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setGhostPos(null);
    setDraggedSymbol(null);
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const symbol: ElectricalSymbol = JSON.parse(data);
      console.log('Dropped symbol:', symbol);
      const pos = getPointerPosition(e);
      const snapped = snapToGrid(pos.x, pos.y);
      console.log('Drop position:', { original: pos, snapped });
      
      const newElement: CanvasElement = {
          id: `${symbol.id}-${Date.now()}`,
          symbolId: symbol.id,
          position: snapped,
          rotation: 0,
          properties: {},
      };
      
      console.log('Creating new canvas element:', newElement);
      setElements((prev) => {
        const newElements = [...prev, newElement];
        console.log('Updated elements array:', newElements);
        return newElements;
      });
    }
  };

  const handleDragLeave = () => {
    setGhostPos(null);
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

  useEffect(() => {
    let fabricInstance: any;
    // Store references to symbol objects for cleanup
    let symbolObjects: any[] = [];

    import('fabric').then((mod) => {
      const fabric = mod;
      // Dispose previous instance if exists
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      if (canvasRef.current && fabric && fabric.Canvas) {
        fabricInstance = new fabric.Canvas(canvasRef.current, {
          width: containerSize.width,
          height: containerSize.height,
          backgroundColor: '#fff',
          selection: true,
          preserveObjectStacking: true,
        });
        fabricRef.current = fabricInstance;

        // Apply pan/zoom from viewport atom
        fabricInstance.setViewportTransform([
          viewport.zoom, 0, 0, viewport.zoom, viewport.pan.x, viewport.pan.y
        ]);

        // Draw grid (pixel-perfect: offset by 0.5px)
        // Always cover the entire canvas area, edge to edge
        for (let x = 0; x <= containerSize.width; x += GRID_SIZE) {
          const isMajor = x % MAJOR_GRID_SIZE === 0;
          const px = Math.round(x) + 0.5;
          const line = new fabric.Line([px, 0, px, containerSize.height], {
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
          const py = Math.round(y) + 0.5;
          const line = new fabric.Line([0, py, containerSize.width, py], {
            stroke: isMajor ? '#bdbdbd' : '#e0e0e0',
            strokeWidth: isMajor ? 1.2 : 0.7,
            selectable: false,
            evented: false,
            excludeFromExport: true,
          });
          fabricInstance.add(line);
        }

        // Conditionally draw border and title block
        // Drawing border (outer and inner rectangles)
        const outerRect = new fabric.Rect({
          left: 0,
          top: 0,
          width: containerSize.width,
          height: containerSize.height,
          stroke: '#000',
          strokeWidth: 2,
          fill: '',
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        fabricInstance.add(outerRect);

        // Title block (bottom right)
        const TITLE_BLOCK_WIDTH = 400;
        const TITLE_BLOCK_HEIGHT = 100;
        const ROWS = 3;
        const COL_WIDTHS = [60, 120, 140, 80]; // logo, left, center, right
        const ROW_HEIGHT = TITLE_BLOCK_HEIGHT / ROWS;
        const COL_X = COL_WIDTHS.reduce((acc, _, i) => {
          acc.push((acc[i - 1] || 0) + (COL_WIDTHS[i - 1] || 0));
          return acc;
        }, [] as number[]);
        // Change title block position to be flush with the outer border
        const x = containerSize.width - TITLE_BLOCK_WIDTH;
        const y = containerSize.height - TITLE_BLOCK_HEIGHT;
        // Outer border
        fabricInstance.add(new fabric.Rect({
          left: x,
          top: y,
          width: TITLE_BLOCK_WIDTH,
          height: TITLE_BLOCK_HEIGHT,
          stroke: '#000',
          strokeWidth: 1.2,
          fill: '#fff',
          selectable: false,
          evented: false,
        }));
        
        // Add the logo image to the logo cell
        const logoCellX = x;
        const logoCellY = y;
        const logoCellWidth = COL_WIDTHS[0];
        const logoCellHeight = TITLE_BLOCK_HEIGHT;
        
        // Load logo image
        const imgElement = new Image();
        imgElement.crossOrigin = 'anonymous';
        
        imgElement.onload = () => {
          // Convert to Fabric.js image
          const fabricImg = new fabric.Image(imgElement, {
            left: logoCellX + (logoCellWidth - imgElement.width) / 2,
            top: logoCellY + (logoCellHeight - imgElement.height) / 2,
            selectable: false,
            evented: false,
            excludeFromExport: false,
          });
          
          fabricInstance.add(fabricImg);
          fabricInstance.renderAll();
        };
        
        imgElement.onerror = (error) => {
          console.error('Failed to load logo image:', error);
        };
        
        imgElement.src = '/muriel-logo.png';
        
        // Add a timeout to check if the callback never executes
        setTimeout(() => {
          console.log('Logo loading timeout - callback may not have executed');
        }, 5000);
        
        // Draw cell borders (vertical)
        COL_X.slice(1).forEach((cx) => {
          fabricInstance.add(new fabric.Line([x + cx, y, x + cx, y + TITLE_BLOCK_HEIGHT], {
            stroke: '#000', strokeWidth: 1, selectable: false, evented: false,
          }));
        });
        // Draw cell borders (horizontal) - skip logo cell and merge center column for Drawing Title(s)
        for (let r = 1; r < ROWS; r++) {
          // Only draw horizontal lines for left and right columns
          // For center column, skip the line between row 2 and 3
          if (r === 2) {
            // Left of center column
            fabricInstance.add(new fabric.Line([
              x + COL_WIDTHS[0],
              y + r * ROW_HEIGHT,
              x + COL_X[2],
              y + r * ROW_HEIGHT
            ], {
              stroke: '#000', strokeWidth: 1, selectable: false, evented: false,
            }));
            // Right of center column
            fabricInstance.add(new fabric.Line([
              x + COL_X[2] + COL_WIDTHS[2],
              y + r * ROW_HEIGHT,
              x + TITLE_BLOCK_WIDTH,
              y + r * ROW_HEIGHT
            ], {
              stroke: '#000', strokeWidth: 1, selectable: false, evented: false,
            }));
          } else {
            // Full line for other rows
            fabricInstance.add(new fabric.Line([
              x + COL_WIDTHS[0],
              y + r * ROW_HEIGHT,
              x + TITLE_BLOCK_WIDTH,
              y + r * ROW_HEIGHT
            ], {
              stroke: '#000', strokeWidth: 1, selectable: false, evented: false,
            }));
          }
        }
        // --- TEXT FIELDS ---
        // Top row
        fabricInstance.add(new fabric.Text(titleBlock.company || 'Organization', {
          left: x + COL_X[1] + 8,
          top: y + 8,
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#222',
          selectable: false,
          evented: false,
        }));
        fabricInstance.add(new fabric.Text(titleBlock.project || 'Project Name', {
          left: x + COL_X[2] + 8,
          top: y + 8,
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#222',
          selectable: false,
          evented: false,
        }));
        fabricInstance.add(new fabric.Text(titleBlock.date || '7/15/2025', {
          left: x + COL_X[3] + COL_WIDTHS[3] - 8,
          top: y + 8,
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#222',
          selectable: false,
          evented: false,
          originX: 'right',
        }));
        // Second and third row: Drawing Title(s) merged cell (centered vertically and horizontally)
        fabricInstance.add(new fabric.Text(titleBlock.drawingTitle || 'Drawing Title(s)', {
          left: x + COL_X[2] + COL_WIDTHS[2] / 2,
          top: y + ROW_HEIGHT + ROW_HEIGHT / 2 + 16,
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#222',
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
        }));
        // Second row (left and right)
        fabricInstance.add(new fabric.Text(titleBlock.designer || 'Name', {
          left: x + COL_X[1] + 8,
          top: y + ROW_HEIGHT + 8,
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#222',
          selectable: false,
          evented: false,
        }));
        // Third row (left and right)
        fabricInstance.add(new fabric.Text(titleBlock.details || 'Details', {
          left: x + COL_X[1] + 8,
          top: y + 2 * ROW_HEIGHT + 8,
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#222',
          selectable: false,
          evented: false,
        }));
        fabricInstance.add(new fabric.Text(titleBlock.scale || '1:1', {
          left: x + COL_X[3] + COL_WIDTHS[3] - 8,
          top: y + ROW_HEIGHT + 8,
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#222',
          selectable: false,
          evented: false,
          originX: 'right',
        }));
        fabricInstance.add(new fabric.Text('1 / 1', {
          left: x + COL_X[3] + COL_WIDTHS[3] - 8,
          top: y + 2 * ROW_HEIGHT + 8,
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#222',
          selectable: false,
          evented: false,
          originX: 'right',
        }));

        // --- SYMBOL RENDERING LOGIC ---
        // Clear existing symbol objects
        symbolObjects.forEach(obj => fabricInstance.remove(obj));
        symbolObjects = [];

        // Render all canvas elements as symbols
        console.log('Rendering symbols:', { elementsCount: elements.length, symbolLibraryCount: symbolLibrary.length });
        
        // Process elements asynchronously to handle SVG parsing
        const renderSymbols = async () => {
          for (const element of elements) {
            const symbol = symbolLibrary.find(s => s.id === element.symbolId);
            if (!symbol) {
              console.warn(`Symbol not found for element ${element.id} with symbolId ${element.symbolId}`);
              continue;
            }

            try {
              // Try to parse the SVG first
              console.log(`Attempting to parse SVG for symbol: ${symbol.id}`);
              const svgObjects = await parseSVGToFabric(symbol.svg);
              
              if (svgObjects && svgObjects.length > 0) {
                // Create a group from the parsed SVG objects
                const group = await createSymbolGroup(svgObjects, {
                  left: element.position.x - (element.width || symbol.dimensions.width) / 2,
                  top: element.position.y - (element.height || symbol.dimensions.height) / 2,
                  angle: element.rotation,
                  width: element.width || symbol.dimensions.width,
                  height: element.height || symbol.dimensions.height,
                  dataId: element.id,
                });

                // Store reference for cleanup
                symbolObjects.push(group);
                
                // Add to canvas
                fabricInstance.add(group);
                console.log(`Successfully rendered SVG for symbol: ${symbol.id}`);
              } else {
                throw new Error('No objects created from SVG');
              }
            } catch (error) {
              console.warn(`SVG parsing failed for symbol ${symbol.id}, using fallback:`, error);
              
              // Use fallback shape
              const fallbackObject = await createFallbackShape(symbol, {
                left: element.position.x,
                top: element.position.y,
                angle: element.rotation,
                dataId: element.id,
              });

              // Store reference for cleanup
              symbolObjects.push(fallbackObject);
              
              // Add to canvas
              fabricInstance.add(fallbackObject);
              console.log(`Used fallback shape for symbol: ${symbol.id}`);
            }
          }

          // Render all changes
          fabricInstance.renderAll();
          console.log(`Rendering complete. Total symbols: ${symbolObjects.length}`);
        };

        // Execute the async rendering
        renderSymbols().catch(error => {
          console.error('Error during symbol rendering:', error);
        });

      } else {
        if (!canvasRef.current) console.warn('Canvas ref not set');
        if (!fabric || !fabric.Canvas) console.error('Fabric.js not loaded or Canvas missing');
      }
    }).catch((err) => {
      console.error('Failed to load fabric:', err);
    });

    return () => {
      // Remove symbol objects only (not grid lines)
      if (fabricRef.current && symbolObjects.length > 0) {
        symbolObjects.forEach(obj => {
          try {
            fabricRef.current.remove(obj);
          } catch (error) {
            console.warn('Error removing symbol object:', error);
          }
        });
      }
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, [elements, symbolLibrary, viewport, scale, selected, setElements, containerSize, draggedSymbol, ghostPos, titleBlock]);

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
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
      {/* Ghost preview for drag-and-drop */}
      {draggedSymbol && ghostPos && (
        <div
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            left: ghostPos.x - (draggedSymbol.dimensions?.width ?? 25) / 2,
            top: ghostPos.y - (draggedSymbol.dimensions?.height ?? 25) / 2,
            opacity: 0.5,
            zIndex: 10,
            width: draggedSymbol.dimensions?.width ?? 50,
            height: draggedSymbol.dimensions?.height ?? 50,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
          }}
          aria-label="Symbol preview"
        >
          <div
            style={{ width: '100%', height: '100%' }}
            dangerouslySetInnerHTML={{ __html: draggedSymbol.svg }}
          />
        </div>
      )}
      {/* Fallback message for debugging */}
      {false && <div style={{ color: 'red' }}>Canvas or Fabric.js failed to load</div>}
    </div>
  );
};

export default FabricCanvas; 