import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import GridOnIcon from '@mui/icons-material/GridOn';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { useAtom } from 'jotai';
import { canvasViewportAtom } from '../../stores/canvasStore';
import { isOnlineAtom, saveStatusAtom, selectedToolAtom } from '../../stores/appStore';

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2];

const StatusBar: React.FC = () => {
  const [viewport, setViewport] = useAtom(canvasViewportAtom);
  const currentZoomIdx = ZOOM_LEVELS.findIndex(z => z === viewport.zoom);

  const handleZoomIn = () => {
    if (currentZoomIdx < ZOOM_LEVELS.length - 1) {
      setViewport(v => ({ ...v, zoom: ZOOM_LEVELS[currentZoomIdx + 1] }));
    }
  };
  const handleZoomOut = () => {
    if (currentZoomIdx > 0) {
      setViewport(v => ({ ...v, zoom: ZOOM_LEVELS[currentZoomIdx - 1] }));
    }
  };
  // Placeholder for grid toggle
  const [gridOn, setGridOn] = React.useState(true);
  const [isOnline] = useAtom(isOnlineAtom);
  const [saveStatus] = useAtom(saveStatusAtom);
  const [selectedTool] = useAtom(selectedToolAtom);

  let saveStatusContent: React.ReactNode = null;
  if (saveStatus === 'saving') {
    saveStatusContent = <Box display="flex" alignItems="center" gap={0.5}><CircularProgress size={14} color="inherit" /><Typography variant="body2">Saving...</Typography></Box>;
  } else if (saveStatus === 'saved') {
    saveStatusContent = <Box display="flex" alignItems="center" gap={0.5}><CloudDoneIcon fontSize="small" color="success" /><Typography variant="body2">Saved</Typography></Box>;
  } else if (saveStatus === 'error') {
    saveStatusContent = <Typography variant="body2" color="error">Save Error</Typography>;
  } else {
    saveStatusContent = <Typography variant="body2">Idle</Typography>;
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        height: 40,
        zIndex: 1201,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 0.5,
        borderRadius: 0,
        justifyContent: 'space-between',
        borderTop: '1.5px solid #e0e0e0',
        bgcolor: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(2px)',
      }}
      aria-label="Status Bar"
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Tooltip title="Zoom Out"><span><IconButton size="small" onClick={handleZoomOut} disabled={currentZoomIdx === 0} aria-label="Zoom Out"><ZoomOutIcon /></IconButton></span></Tooltip>
        <Typography variant="body2" sx={{ minWidth: 48, textAlign: 'center', fontWeight: 600 }}>{Math.round(viewport.zoom * 100)}%</Typography>
        <Tooltip title="Zoom In"><span><IconButton size="small" onClick={handleZoomIn} disabled={currentZoomIdx === ZOOM_LEVELS.length - 1} aria-label="Zoom In"><ZoomInIcon /></IconButton></span></Tooltip>
        <Tooltip title={gridOn ? 'Hide Grid' : 'Show Grid'}><IconButton size="small" color={gridOn ? 'primary' : 'default'} onClick={() => setGridOn(g => !g)} aria-label="Toggle Grid"><GridOnIcon /></IconButton></Tooltip>
      </Box>
      <Box display="flex" alignItems="center" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          {isOnline ? (
            <Tooltip title="Online"><CloudDoneIcon fontSize="small" color="primary" aria-label="Online" /></Tooltip>
          ) : (
            <Tooltip title="Offline"><CloudOffIcon fontSize="small" color="error" aria-label="Offline" /></Tooltip>
          )}
          <Typography variant="body2" color={isOnline ? 'primary' : 'error'}>{isOnline ? 'Online' : 'Offline'}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {saveStatusContent}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">Tool: <b>{selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}</b></Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default StatusBar; 