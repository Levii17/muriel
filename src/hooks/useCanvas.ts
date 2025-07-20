import { useRef, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { canvasElementsAtom, selectedElementsAtom, canvasViewportAtom, showMajorGridAtom, showMinorGridAtom } from '../stores/canvasStore';
import { symbolLibraryAtom, draggedSymbolAtom } from '../stores/symbolStore';
import { titleBlockAtom } from '../stores/titleBlockStore';
import { parseSVGToFabric, createFallbackShape } from '../utils/svg-utils';
import type { ElectricalSymbol, CanvasElement } from '../types';

const GRID_SIZE = 10;
const MAJOR_GRID_SIZE = 50;

const snapToGrid = (x: number, y: number) => ({
  x: Math.round(x / GRID_SIZE) * GRID_SIZE,
  y: Math.round(y / GRID_SIZE) * GRID_SIZE,
});

export function useCanvas(selectedTool?: 'select' | 'hand' | 'text', fabricInstanceRef?: React.MutableRefObject<any | null>) {
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
  const [showMajorGrid] = useAtom(showMajorGridAtom);
  const [showMinorGrid] = useAtom(showMinorGridAtom);

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
      // Find the symbol definition in the library
      const symbolDef = symbolLibrary.find(s => s.id === symbol.id);
      const newElement: CanvasElement = {
        id: `${symbol.id}-${Date.now()}`,
        symbolId: symbol.id,
        position: snapped,
        rotation: 0,
        properties: symbolDef ? { ...symbolDef.properties } : {},
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

  // Store refs to Fabric.Text objects for title block fields
  const titleBlockTextRefs = useRef<{ [key: string]: any }>({});

  // Store refs to Fabric objects for each symbol element
  const symbolFabricRefs = useRef<{ [id: string]: any }>({});

  // Fabric.js initialization and rendering (grid, title block, etc.)
  useEffect(() => {
    let fabricInstance: any;
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
        if (fabricInstanceRef) fabricInstanceRef.current = fabricInstance;
        // Set initial viewport transform
        fabricInstance.setViewportTransform([
          viewport.zoom, 0, 0, viewport.zoom, viewport.pan.x, viewport.pan.y
        ]);
        // Draw grid
        for (let x = 0; x <= containerSize.width; x += GRID_SIZE) {
          const isMajor = x % MAJOR_GRID_SIZE === 0;
          if ((isMajor && showMajorGrid) || (!isMajor && showMinorGrid)) {
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
        }
        for (let y = 0; y <= containerSize.height; y += GRID_SIZE) {
          const isMajor = y % MAJOR_GRID_SIZE === 0;
          if ((isMajor && showMajorGrid) || (!isMajor && showMinorGrid)) {
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
        // Title block text fields (store refs)
        const tbFields = [
          { key: 'company', value: titleBlock.company || 'Organization', left: x + COL_X[1] + 8, top: y + 8, opts: {} },
          { key: 'project', value: titleBlock.project || 'Project Name', left: x + COL_X[2] + 8, top: y + 8, opts: {} },
          { key: 'date', value: titleBlock.date || '7/15/2025', left: x + COL_X[3] + COL_WIDTHS[3] - 8, top: y + 8, opts: { originX: 'right' as 'right' } },
          { key: 'drawingTitle', value: titleBlock.drawingTitle || 'Drawing Title(s)', left: x + COL_X[2] + COL_WIDTHS[2] / 2, top: y + ROW_HEIGHT + ROW_HEIGHT / 2 + 16, opts: { originX: 'center' as 'center', originY: 'center' as 'center' } },
          { key: 'designer', value: titleBlock.designer || 'Name', left: x + COL_X[1] + 8, top: y + ROW_HEIGHT + 8, opts: {} },
          { key: 'details', value: titleBlock.details || 'Details', left: x + COL_X[1] + 8, top: y + 2 * ROW_HEIGHT + 8, opts: {} },
          { key: 'scale', value: titleBlock.scale || '1:1', left: x + COL_X[3] + COL_WIDTHS[3] - 8, top: y + ROW_HEIGHT + 8, opts: { originX: 'right' as 'right' } },
        ];
        titleBlockTextRefs.current = {};
        tbFields.forEach(field => {
          const textObj = new fabric.Text(field.value, {
            left: field.left,
            top: field.top,
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#222',
          selectable: false,
          evented: false,
            ...field.opts,
          });
          fabricInstance.add(textObj);
          titleBlockTextRefs.current[field.key] = textObj;
        });
        // Page count (static for now)
        const pageCountObj = new fabric.Text('1 / 1', {
          left: x + COL_X[3] + COL_WIDTHS[3] - 8,
          top: y + 2 * ROW_HEIGHT + 8,
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#222',
          selectable: false,
          evented: false,
          originX: 'right',
        });
        fabricInstance.add(pageCountObj);
        // Clear symbol refs
        symbolFabricRefs.current = {};
      }
    });
    return () => {
      if (fabricRef.current) {
        Object.values(symbolFabricRefs.current).forEach(obj => {
          try { fabricRef.current.remove(obj); } catch {}
        });
      }
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, [symbolLibrary, selected, setElements, containerSize, draggedSymbol, ghostPos, showMajorGrid, showMinorGrid]); // REMOVE elements from deps

  // Incremental symbol placement and updates
  useEffect(() => {
    if (!fabricRef.current) return;
    import('fabric').then(async (mod) => {
      const fabric = mod;
      const canvas = fabricRef.current;
      const currentIds = new Set(Object.keys(symbolFabricRefs.current));
      const newIds = new Set(elements.map(el => el.id));
      // Remove deleted symbols
      for (const id of currentIds) {
        if (!newIds.has(id)) {
          canvas.remove(symbolFabricRefs.current[id]);
          delete symbolFabricRefs.current[id];
        }
      }
      // Add new symbols
      for (const el of elements) {
        if (!symbolFabricRefs.current[el.id]) {
          const symbol = symbolLibrary.find(s => s.id === el.symbolId);
            if (!symbol) continue;
            try {
              const svgObjects = await parseSVGToFabric(symbol.svg);
            let objToAdd;
              if (svgObjects && svgObjects.length > 0) {
                if (svgObjects.length === 1 && svgObjects[0].type === 'group') {
                  objToAdd = svgObjects[0];
                } else if (svgObjects.length === 1) {
                  objToAdd = svgObjects[0];
                } else {
                  objToAdd = new fabric.Group(svgObjects as any, {});
                }
                objToAdd.set({
                  left: el.position.x,
                  top: el.position.y,
                  angle: el.rotation,
                  data: { id: el.id },
                  originX: 'left',
                  originY: 'top',
                  selectable: true,
                });
              symbolFabricRefs.current[el.id] = objToAdd;
              canvas.add(objToAdd);
              }
            } catch (error) {
            // fallback
              const fallbackObject = await createFallbackShape(symbol, {
              left: el.position.x,
              top: el.position.y,
              angle: el.rotation,
              dataId: el.id,
            });
            fallbackObject.set({ selectable: true, data: { id: el.id } });
            symbolFabricRefs.current[el.id] = fallbackObject;
            canvas.add(fallbackObject);
          }
        } else {
          // Update existing symbol position/rotation if changed
          const obj = symbolFabricRefs.current[el.id];
          if (obj) {
            obj.set({
              left: el.position.x,
              top: el.position.y,
              angle: el.rotation,
            });
          }
        }
      }
      canvas.requestRenderAll && canvas.requestRenderAll();
    });
  }, [elements, symbolLibrary]);

  // New effect: update title block text objects when titleBlock changes
  useEffect(() => {
    if (!fabricRef.current || !titleBlockTextRefs.current) return;
    const fields = [
      'company', 'project', 'date', 'drawingTitle', 'designer', 'details', 'scale'
    ] as const;
    fields.forEach(key => {
      const obj = titleBlockTextRefs.current[key];
      if (obj && typeof titleBlock[key] !== 'undefined') {
        obj.set({ text: (titleBlock as any)[key] || '' });
      }
    });
    fabricRef.current.requestRenderAll && fabricRef.current.requestRenderAll();
  }, [titleBlock]);

  // New effect: update viewport transform only when viewport changes
  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.setViewportTransform([
        viewport.zoom, 0, 0, viewport.zoom, viewport.pan.x, viewport.pan.y
      ]);
      fabricRef.current.requestRenderAll && fabricRef.current.requestRenderAll();
    }
  }, [viewport]);

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
