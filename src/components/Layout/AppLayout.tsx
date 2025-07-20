import React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Drawer from '@mui/material/Drawer';
import SymbolPanel from '../SymbolLibrary/SymbolPanel';
import FabricCanvas from '../Canvas/FabricCanvas';
import TitleBlockPanel from '../../TitleBlock/TitleBlockPanel';
import PropertyPanel from '../Toolbar/PropertyPanel';
import StatusBar from './StatusBar';
import { useAtom } from 'jotai';
import HeaderBar from './HeaderBar';
import { canvasViewportAtom, canvasElementsAtom, selectedElementsAtom, showMajorGridAtom, showMinorGridAtom, canvasHistoryAtom, canvasFutureAtom } from '../../stores/canvasStore';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import TitleIcon from '@mui/icons-material/Title';
import MainToolbar from '../Toolbar/MainToolbar';
import type { CanvasTool } from '../Toolbar/MainToolbar';
import GlobalSnackbar from './GlobalSnackbar';
import jsPDF from 'jspdf';
import { snackbarAtom } from '../../stores/appStore';

const drawerWidth = 320;

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;

const SidebarPanel: React.FC = () => {
  const [expanded, setExpanded] = React.useState<'properties' | 'titleBlock'>('properties');

  const handleChange = (panel: 'properties' | 'titleBlock') => (_: React.SyntheticEvent, isExpanded: boolean) => {
    if (isExpanded) setExpanded(panel);
    else setExpanded(panel === 'properties' ? 'titleBlock' : 'properties');
  };

  return (
    <Box sx={{
      width: '100%',
      overflowY: 'auto',
      height: '100%',
      boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.08)',
      borderLeft: '1px solid #e0e0e0',
      bgcolor: '#fff',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Properties Section */}
      <Accordion
        expanded={expanded === 'properties'}
        onChange={handleChange('properties')}
        sx={{
          boxShadow: 'none',
          borderBottom: '1px solid #f0f0f0',
          '& .MuiAccordionSummary-root': expanded === 'properties' ? {
            borderBottom: '2px solid #1976d2',
            bgcolor: '#f5faff',
          } : {},
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <SettingsIcon sx={{ color: '#1976d2', mr: 1 }} />
          <Box component="span" sx={{ fontWeight: 600, color: '#1976d2', flex: 1 }}>Component Properties</Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, py: 1, bgcolor: '#fafbfc', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <PropertyPanel />
        </AccordionDetails>
      </Accordion>
      {/* Title Block Section */}
      <Accordion
        expanded={expanded === 'titleBlock'}
        onChange={handleChange('titleBlock')}
        sx={{
          boxShadow: 'none',
          borderBottom: '1px solid #f0f0f0',
          '& .MuiAccordionSummary-root': expanded === 'titleBlock' ? {
            borderBottom: '2px solid #1976d2',
            bgcolor: '#f5faff',
          } : {},
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <TitleIcon sx={{ color: '#1976d2', mr: 1 }} />
          <Box component="span" sx={{ fontWeight: 600, color: '#1976d2', flex: 1 }}>Title Block</Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, py: 1, bgcolor: '#fafbfc', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <TitleBlockPanel />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

const AppLayout: React.FC = () => {
  const [selectedTool, setSelectedTool] = React.useState<CanvasTool>('select');
  // Toolbar/canvas state
  const [viewport, setViewport] = useAtom(canvasViewportAtom);
  const [elements, setElements] = useAtom(canvasElementsAtom);
  const [selected, setSelected] = useAtom(selectedElementsAtom);
  const [showMajorGrid, setShowMajorGrid] = useAtom(showMajorGridAtom);
  const [showMinorGrid, setShowMinorGrid] = useAtom(showMinorGridAtom);
  const [, setHistory] = useAtom(canvasHistoryAtom);
  const [, setFuture] = useAtom(canvasFutureAtom);
  const [, setSnackbar] = useAtom(snackbarAtom);
  // Delete handler
  const handleDelete = () => {
    if (selected.length === 0) return;
    setElements(prev => prev.filter(el => !selected.includes(el.id)));
    setSelected([]);
  };
  const isHistoryAction = React.useRef(false);
  // Track changes to elements for undo/redo
  React.useEffect(() => {
    if (isHistoryAction.current) {
      isHistoryAction.current = false;
      return;
    }
    setHistory(prev => {
      if (prev.length === 0 || prev[prev.length - 1] !== elements) {
        return [...prev, elements];
      }
      return prev;
    });
    setFuture([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements]);

  const handleUndo = () => {
    setHistory(prev => {
      if (prev.length <= 1) return prev;
      isHistoryAction.current = true;
      setFuture(f => [prev[prev.length - 1], ...f]);
      setElements(prev[prev.length - 2]);
      return prev.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setFuture(f => {
      if (f.length === 0) return f;
      isHistoryAction.current = true;
      setHistory(h => [...h, f[0]]);
      setElements(f[0]);
      return f.slice(1);
    });
  };
  // Zoom handlers
  const handleZoomIn = () => {
    setViewport(v => {
      const newZoom = Math.min(MAX_ZOOM, v.zoom + ZOOM_STEP);
      return { ...v, zoom: newZoom };
    });
  };
  const handleZoomOut = () => {
    setViewport(v => {
      const newZoom = Math.max(MIN_ZOOM, v.zoom - ZOOM_STEP);
      return { ...v, zoom: newZoom };
    });
  };
  const handleResetView = () => {
    setViewport(v => ({ ...v, zoom: 1, pan: { x: 0, y: 0 } }));
  };
  const fabricCanvasRef = React.useRef<any>(null);

  // Export handlers
  const handleExportSVG = () => {
    const fabricInstance = fabricCanvasRef.current;
    if (!fabricInstance) return;
    const svg = fabricInstance.toSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: 'Exported as SVG!', severity: 'success' });
  };

  const handleExportPNG = () => {
    const fabricInstance = fabricCanvasRef.current;
    if (!fabricInstance) return;
    const dataUrl = fabricInstance.toDataURL({ format: 'png' });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'diagram.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setSnackbar({ open: true, message: 'Exported as PNG!', severity: 'success' });
  };

  const handleExportPDF = () => {
    const fabricInstance = fabricCanvasRef.current;
    if (!fabricInstance) return;
    const dataUrl = fabricInstance.toDataURL({ format: 'png' });
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [fabricInstance.width, fabricInstance.height] });
    pdf.addImage(dataUrl, 'PNG', 0, 0, fabricInstance.width, fabricInstance.height);
    pdf.save('diagram.pdf');
    setSnackbar({ open: true, message: 'Exported as PDF!', severity: 'success' });
  };
  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <CssBaseline />
      {/* Unified HeaderBar */}
      <HeaderBar />
      {/* Left Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#fff',
            borderRight: '1px solid #e0e0e0',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            p: 0,
          },
        }}
        anchor="left"
      >
        <Toolbar />
        {/* SymbolPanel goes here */}
        <SymbolPanel />
      </Drawer>

      {/* Main Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '94vh',
          bgcolor: '#222',
        }}
      >
        {/* Spacer for header height */}
        <Toolbar />
        {/* Toolbar at the top of main area */}
          <MainToolbar
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDelete={handleDelete}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            zoomLevel={viewport.zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            showMajorGrid={showMajorGrid}
            showMinorGrid={showMinorGrid}
            onToggleMajorGrid={() => setShowMajorGrid(v => !v)}
            onToggleMinorGrid={() => setShowMinorGrid(v => !v)}
            onExportSVG={handleExportSVG}
            onExportPNG={handleExportPNG}
            onExportPDF={handleExportPDF}
          />
        {/* Canvas area centered */}
        <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <Paper
            elevation={2}
            sx={{
              borderRadius: 2,
              boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
              p: 0,
            }}
          >
            <FabricCanvas ref={fabricCanvasRef} selectedTool={selectedTool} />
          </Paper>
        </Box>
      </Box>

      {/* Right Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#fff',
            borderLeft: '1px solid #e0e0e0',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            p: 0,
            overflowY: 'auto', // Add this for subtle scrollbar
          },
        }}
        anchor="right"
      >
        <Toolbar />
        {/* SidebarPanel goes here */}
        <SidebarPanel />
      </Drawer>

      {/* StatusBar at the bottom */}
      <StatusBar />
      {/* Global Snackbar for notifications */}
      <GlobalSnackbar />
    </Box>
  );
};

export default AppLayout; 