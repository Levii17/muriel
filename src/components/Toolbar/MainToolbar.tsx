import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import PanToolAltIcon from '@mui/icons-material/PanToolAlt';
import MouseIcon from '@mui/icons-material/Mouse';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import Divider from '@mui/material/Divider';
import GridOnIcon from '@mui/icons-material/GridOn';
import GridViewIcon from '@mui/icons-material/GridView';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import BrushIcon from '@mui/icons-material/Brush';
import Chip from '@mui/material/Chip';

export type CanvasTool = 'select' | 'hand';

interface MainToolbarProps {
  selectedTool: CanvasTool;
  onSelectTool: (tool: CanvasTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  zoomLevel?: number;
  minZoom?: number;
  maxZoom?: number;
}

const MainToolbar: React.FC<MainToolbarProps> = ({
  selectedTool,
  onSelectTool,
  onUndo,
  onRedo,
  onDelete,
  onZoomIn,
  onZoomOut,
  onResetView,
  zoomLevel,
  minZoom,
  maxZoom,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', bgcolor: '#fff', px: 1, py: 0.5, boxShadow: 1 }}>
      {/* Tool group 1 */}
      <Tooltip title="Select Tool"><IconButton aria-label="Select Tool" color={selectedTool === 'select' ? 'primary' : 'default'} onClick={() => onSelectTool('select')} sx={selectedTool === 'select' ? { boxShadow: 3, border: '2px solid #1976d2', bgcolor: '#f5faff' } : {}}><MouseIcon /></IconButton></Tooltip>
      <Tooltip title="Hand/Move Tool"><IconButton aria-label="Hand/Move Tool" color={selectedTool === 'hand' ? 'primary' : 'default'} onClick={() => onSelectTool('hand')} sx={selectedTool === 'hand' ? { boxShadow: 3, border: '2px solid #1976d2', bgcolor: '#f5faff' } : {}}><PanToolAltIcon /></IconButton></Tooltip>
      <Tooltip title="Wire Tool"><IconButton aria-label="Wire Tool" color="default"><ShowChartIcon /></IconButton></Tooltip>
      <Tooltip title="Text Tool"><IconButton aria-label="Text Tool" color="default"><TextFieldsIcon /></IconButton></Tooltip>
      <Tooltip title="Delete"><IconButton aria-label="Delete" onClick={onDelete}><DeleteIcon /></IconButton></Tooltip>
      <Tooltip title="Undo"><IconButton aria-label="Undo" onClick={onUndo}><UndoIcon /></IconButton></Tooltip>
      <Tooltip title="Redo"><IconButton aria-label="Redo" onClick={onRedo}><RedoIcon /></IconButton></Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      {/* Tool group 2: Grid toggles */}
      <Tooltip title="Major Grid"><IconButton aria-label="Major Grid" color="primary"><GridOnIcon /></IconButton></Tooltip>
      <Tooltip title="Minor Grid"><IconButton aria-label="Minor Grid" color="default"><GridViewIcon /></IconButton></Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      {/* Tool group 3: Zoom */}
      <Tooltip title="Zoom Out"><span><IconButton aria-label="Zoom Out" size="small" onClick={onZoomOut} disabled={zoomLevel !== undefined && minZoom !== undefined && zoomLevel <= minZoom}><ZoomOutIcon /></IconButton></span></Tooltip>
      {zoomLevel !== undefined && (
        <Chip
          label={`${Math.round(zoomLevel * 100)}%`}
          color="primary"
          size="small"
          sx={{ fontWeight: 700, fontSize: 15, mx: 0.5 }}
          aria-label="Zoom Level"
        />
      )}
      <Tooltip title="Zoom In"><span><IconButton aria-label="Zoom In" size="small" onClick={onZoomIn} disabled={zoomLevel !== undefined && maxZoom !== undefined && zoomLevel >= maxZoom}><ZoomInIcon /></IconButton></span></Tooltip>
      <Tooltip title="Fit to Screen"><IconButton aria-label="Fit to Screen" size="small" onClick={onResetView}><CenterFocusStrongIcon /></IconButton></Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      {/* Spacer to push export/extra tools right */}
      <Box sx={{ flexGrow: 1 }} />
      {/* Tool group 4: Export */}
      <Tooltip title="Export PDF"><IconButton aria-label="Export PDF" color="default"><CloudDownloadIcon /></IconButton></Tooltip>
      <Tooltip title="Export SVG"><IconButton aria-label="Export SVG" color="default"><CloudDownloadIcon /></IconButton></Tooltip>
      <Tooltip title="Export PNG"><IconButton aria-label="Export PNG" color="default"><CloudDownloadIcon /></IconButton></Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      {/* Tool group 5: Extra tool */}
      <Tooltip title="Extra Tool"><IconButton aria-label="Extra Tool" color="default"><BrushIcon /></IconButton></Tooltip>
    </Box>
  );
};

export default MainToolbar;
