import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import GridOnIcon from '@mui/icons-material/GridOn';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import { useAtom } from 'jotai';
import { canvasViewportAtom } from '../../stores/canvasStore';

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2];

const StatusBar: React.FC = () => {
  const [viewport, setViewport] = useAtom(canvasViewportAtom);
  const currentZoomIdx = ZOOM_LEVELS.findIndex(z => z === viewport.zoom);
  // Remove: const [showPageLayout, setShowPageLayout] = useAtom(showPageLayoutAtom);

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

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        height: 44,
        zIndex: 1201,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1,
        borderRadius: '12px 12px 0 0',
        bgcolor: 'background.paper',
        borderTop: '1.5px solid #e0e4ea',
        boxShadow: '0 -2px 8px 0 rgba(30,34,44,0.06)',
        justifyContent: 'space-between',
      }}
    >
      <Box display="flex" alignItems="center" gap={1.5}>
        <IconButton size="small" onClick={handleZoomOut} disabled={currentZoomIdx === 0} aria-label="Zoom out">
          <ZoomOutIcon />
        </IconButton>
        <Chip
          label={`${Math.round(viewport.zoom * 100)}%`}
          color="primary"
          size="small"
          sx={{ fontWeight: 700, fontSize: 15, px: 1.5 }}
          aria-live="polite"
        />
        <IconButton size="small" onClick={handleZoomIn} disabled={currentZoomIdx === ZOOM_LEVELS.length - 1} aria-label="Zoom in">
          <ZoomInIcon />
        </IconButton>
        <Chip
          label={gridOn ? 'Snap: On' : 'Snap: Off'}
          color={gridOn ? 'success' : 'default'}
          size="small"
          icon={<GridOnIcon fontSize="small" />}
          sx={{ fontWeight: 500, fontSize: 13, px: 1, ml: 1 }}
        />
      </Box>
      <Box display="flex" alignItems="center" gap={2}>
        {/* Remove: <Tooltip title="Show Page Layout (border & title block)"> */}
          <Switch
            // Remove: checked={showPageLayout}
            // Remove: onChange={e => setShowPageLayout(e.target.checked)}
            color="primary"
            size="small"
            inputProps={{ 'aria-label': 'Show Page Layout' }}
          />
        {/* </Tooltip> */}
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Ctrl+Scroll: Zoom &nbsp;|&nbsp; Middle-drag: Pan
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Tool: Select
        </Typography>
      </Box>
    </Paper>
  );
};

export default StatusBar; 