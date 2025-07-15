import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import MemoryIcon from '@mui/icons-material/Memory'; // chip icon
import SchemaIcon from '@mui/icons-material/Schema'; // schematic icon
import HistoryIcon from '@mui/icons-material/History';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import { useAtom } from 'jotai';
import { saveStatusAtom, isOnlineAtom } from '../../stores/appStore';
import { titleBlockAtom } from '../../stores/titleBlockStore';

const HeaderBar: React.FC = () => {
  const [saveStatus] = useAtom(saveStatusAtom);
  const [isOnline] = useAtom(isOnlineAtom);
  const [titleBlock, setTitleBlock] = useAtom(titleBlockAtom);
  const [editing, setEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when editing
  React.useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleBlock({ ...titleBlock, project: e.target.value });
  };

  const handleTitleBlur = () => setEditing(false);
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') setEditing(false);
  };

  let statusContent: React.ReactNode = null;
  if (saveStatus === 'saving') {
    statusContent = (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} color="inherit" />
        <Typography variant="body2">Saving...</Typography>
      </Box>
    );
  } else if (saveStatus === 'saved') {
    statusContent = (
      <Box display="flex" alignItems="center" gap={1}>
        <CloudDoneIcon fontSize="small" color="success" />
        <Typography variant="body2">Saved</Typography>
      </Box>
    );
  } else if (saveStatus === 'error') {
    statusContent = (
      <Typography variant="body2" color="error">Save Error</Typography>
    );
  } else {
    statusContent = (
      <Typography variant="body2">Idle</Typography>
    );
  }

  return (
    <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: 1201 }}>
      <Toolbar sx={{ minHeight: 56, display: 'flex', justifyContent: 'space-between', bgcolor: '#fafbfc' }}>
        {/* Left Section */}
        <Box display="flex" alignItems="center" gap={2}>
          <MemoryIcon sx={{ color: '#1976d2', fontSize: 28 }} />
          <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 700, mr: 2 }}>
            Muriel
          </Typography>
          <SchemaIcon sx={{ color: 'grey.500', fontSize: 22, mr: 1 }} />
          {editing ? (
            <InputBase
              inputRef={inputRef}
              value={titleBlock.project}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              sx={{ fontSize: 18, fontWeight: 500, color: 'text.secondary', bgcolor: '#fff', px: 1, borderRadius: 1, boxShadow: 1, minWidth: 180 }}
              fullWidth={false}
            />
          ) : (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {titleBlock.project || 'Untitled Project'}
              </Typography>
              <IconButton size="small" onClick={() => setEditing(true)} sx={{ ml: 0.5 }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
        {/* Right Section */}
        <Box display="flex" alignItems="center" gap={1.5}>
          <Button variant="outlined" startIcon={<HistoryIcon />} sx={{ textTransform: 'none', borderColor: '#1976d2', color: '#1976d2', fontWeight: 500 }}>
            Version History
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} sx={{ bgcolor: '#a020f0', color: '#fff', fontWeight: 500, '&:hover': { bgcolor: '#8e1ed6' } }}>
            Save
          </Button>
          <Button variant="contained" startIcon={<FolderOpenIcon />} sx={{ bgcolor: '#1976d2', color: '#fff', fontWeight: 500, '&:hover': { bgcolor: '#125ea2' } }}>
            Load
          </Button>
          <Button variant="contained" startIcon={<PlayArrowIcon />} sx={{ bgcolor: '#2e7d32', color: '#fff', fontWeight: 500, '&:hover': { bgcolor: '#27642a' } }}>
            Simulate
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderBar; 