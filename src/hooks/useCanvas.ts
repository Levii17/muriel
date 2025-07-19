import { useRef, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { canvasElementsAtom, selectedElementsAtom, canvasViewportAtom } from '../stores/canvasStore';
import { symbolLibraryAtom, draggedSymbolAtom } from '../stores/symbolStore';
import { titleBlockAtom } from '../stores/titleBlockStore';
import { parseSVGToFabric, createSymbolGroup, createFallbackShape } from '../utils/svg-utils';
import type { ElectricalSymbol, CanvasElement } from '../types';

const GRID_SIZE = 10;
const MAJOR_GRID_SIZE = 50;

const snapToGrid = (x: number, y: number) => ({
  x: Math.round(x / GRID_SIZE) * GRID_SIZE,
  y: Math.round(y / GRID_SIZE) * GRID_SIZE,
});

export function useCanvas(selectedTool?: 'select' | 'hand' | 'text') {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<any>(null);
  const [elements, setElements] = useAtom(canvasElementsAtom);
  const [symbolLibrary] = useAtom(symbolLibraryAtom);
  const [viewport, setViewport] = useAtom(canvasViewportAtom);
  const [selected, setSelected] = useAtom(selectedElementsAtom);
  const [draggedSymbol, setDraggedSymbol] = useAtom(draggedSymbolAtom);
  const [titleBlock] = useAtom(titleBlockAtom);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

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

  // Pan and zoom handlers
  const isPanning = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      isPanning.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning.current && lastPointer.current) {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      setViewport(v => ({ ...v, pan: { x: v.pan.x + dx, y: v.pan.y + dy } }));
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  };
  const handleMouseUp = () => {
    isPanning.current = false;
    lastPointer.current = null;
  };

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
      const pos = getPointerPosition(e);
      const snapped = snapToGrid(pos.x, pos.y);
      const newElement: CanvasElement = {
        id: `${symbol.id}-${Date.now()}`,
        symbolId: symbol.id,
        position: snapped,
        rotation: 0,
        properties: {},
      };
      setElements((prev) => [...prev, newElement]);
    }
  };

  const handleDragLeave = () => {
    setGhostPos(null);
  };

  // Add text tool support
  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool !== 'text' || !fabricRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.pan.x) / viewport.zoom;
    const y = (e.clientY - rect.top - viewport.pan.y) / viewport.zoom;
    const fabric = await import('fabric');
    const text = new fabric.Textbox('Text', {
      left: x,
      top: y,
      fontSize: 18,
      fill: '#000',
      fontFamily: 'Arial',
      editable: true,
      width: 120,
      backgroundColor: '#fff',
      borderColor: '#1976d2',
      cornerColor: '#1976d2',
      cornerSize: 8,
      padding: 4,
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();
    // Optionally, focus editing mode
    setTimeout(() => text.enterEditing && text.enterEditing(), 100);
  };

  // Fabric.js initialization and rendering
  useEffect(() => {
    let fabricInstance: any;
    let symbolObjects: any[] = [];
    import('fabric').then((mod) => {
      const fabric = mod;
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
        fabricInstance.setViewportTransform([
          viewport.zoom, 0, 0, viewport.zoom, viewport.pan.x, viewport.pan.y
        ]);
        // Draw grid
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
        // Border and title block
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
        const COL_WIDTHS = [60, 120, 140, 80];
        const ROW_HEIGHT = TITLE_BLOCK_HEIGHT / ROWS;
        const COL_X = COL_WIDTHS.reduce((acc, _, i) => {
          acc.push((acc[i - 1] || 0) + (COL_WIDTHS[i - 1] || 0));
          return acc;
        }, [] as number[]);
        const x = containerSize.width - TITLE_BLOCK_WIDTH;
        const y = containerSize.height - TITLE_BLOCK_HEIGHT;
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
        // Logo
        const logoCellX = x;
        const logoCellY = y;
        const logoCellWidth = COL_WIDTHS[0];
        const logoCellHeight = TITLE_BLOCK_HEIGHT;
        const imgElement = new window.Image();
        imgElement.crossOrigin = 'anonymous';
        imgElement.onload = () => {
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
        setTimeout(() => {
          // Debug: logo loading timeout
        }, 5000);
        // Cell borders
        COL_X.slice(1).forEach((cx) => {
          fabricInstance.add(new fabric.Line([x + cx, y, x + cx, y + TITLE_BLOCK_HEIGHT], {
            stroke: '#000', strokeWidth: 1, selectable: false, evented: false,
          }));
        });
        for (let r = 1; r < ROWS; r++) {
          if (r === 2) {
            fabricInstance.add(new fabric.Line([
              x + COL_WIDTHS[0],
              y + r * ROW_HEIGHT,
              x + COL_X[2],
              y + r * ROW_HEIGHT
            ], {
              stroke: '#000', strokeWidth: 1, selectable: false, evented: false,
            }));
            fabricInstance.add(new fabric.Line([
              x + COL_X[2] + COL_WIDTHS[2],
              y + r * ROW_HEIGHT,
              x + TITLE_BLOCK_WIDTH,
              y + r * ROW_HEIGHT
            ], {
              stroke: '#000', strokeWidth: 1, selectable: false, evented: false,
            }));
          } else {
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
        // Text fields
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
        fabricInstance.add(new fabric.Text(titleBlock.designer || 'Name', {
          left: x + COL_X[1] + 8,
          top: y + ROW_HEIGHT + 8,
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#222',
          selectable: false,
          evented: false,
        }));
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
        // Symbol rendering
        symbolObjects.forEach(obj => fabricInstance.remove(obj));
        symbolObjects = [];
        const renderSymbols = async () => {
          for (const element of elements) {
            const symbol = symbolLibrary.find(s => s.id === element.symbolId);
            if (!symbol) continue;
            try {
              const svgObjects = await parseSVGToFabric(symbol.svg);
              if (svgObjects && svgObjects.length > 0) {
                let objToAdd;
                // If the SVG parser returns a single group, use it directly
                if (svgObjects.length === 1 && svgObjects[0].type === 'group') {
                  objToAdd = svgObjects[0];
                } else if (svgObjects.length === 1) {
                  objToAdd = svgObjects[0];
                } else {
                  const fabric = await import('fabric');
                  // Cast svgObjects to the correct type for Fabric.Group
                  objToAdd = new fabric.Group(svgObjects as any, {});
                }
                // Set only position and metadata, not width/height
                objToAdd.set({
                  left: element.position.x,
                  top: element.position.y,
                  angle: element.rotation,
                  data: { id: element.id }, // Use 'data' for custom metadata
                  originX: 'left',
                  originY: 'top',
                });
                symbolObjects.push(objToAdd);
                fabricInstance.add(objToAdd);
              } else {
                throw new Error('No objects created from SVG');
              }
            } catch (error) {
              console.error('SVG parse error for symbol', symbol.id, error, symbol.svg);
              const fallbackObject = await createFallbackShape(symbol, {
                left: element.position.x,
                top: element.position.y,
                angle: element.rotation,
                dataId: element.id,
              });
              symbolObjects.push(fallbackObject);
              fabricInstance.add(fallbackObject);
            }
          }
          fabricInstance.renderAll();
        };
        renderSymbols().catch(() => {});
      }
    });
    return () => {
      if (fabricRef.current && symbolObjects.length > 0) {
        symbolObjects.forEach(obj => {
          try {
            fabricRef.current.remove(obj);
          } catch {}
        });
      }
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, [elements, symbolLibrary, viewport, selected, setElements, containerSize, draggedSymbol, ghostPos, titleBlock]);

  // Wheel zoom
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

  return {
    containerRef,
    canvasRef,
    ghostPos,
    draggedSymbol,
    handleDragOver,
    handleDrop,
    handleDragLeave,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasClick,
  };
}
