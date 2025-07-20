import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
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
import { titleBlockAtom } from '../../stores/titleBlockStore';
import { canvasElementsAtom, canvasViewportAtom } from '../../stores/canvasStore';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { saveDiagram, listDiagrams, loadDiagram, deleteDiagram } from '../../data/db/database';
import { snackbarAtom } from '../../stores/appStore';

const HeaderBar: React.FC = () => {
  const [titleBlock, setTitleBlock] = useAtom(titleBlockAtom);
  const [editing, setEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [elements, setElements] = useAtom(canvasElementsAtom);
  const [viewport, setViewport] = useAtom(canvasViewportAtom);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [diagramName, setDiagramName] = useState('');
  const [diagrams, setDiagrams] = useState<any[]>([]);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, setSnackbar] = useAtom(snackbarAtom);

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

  // Save Dialog
  const openSaveDialog = () => {
    setDiagramName(titleBlock.project || 'Untitled Diagram');
    setSaveDialogOpen(true);
  };
  const closeSaveDialog = () => setSaveDialogOpen(false);
  const confirmSave = async () => {
    await saveDiagram({
      name: diagramName || 'Untitled Diagram',
      elements,
      titleBlock,
      viewport,
    });
    setSaveDialogOpen(false);
    setSnackbar({ open: true, message: 'Diagram saved!', severity: 'success' });
  };

  // Load Dialog
  const openLoadDialog = async () => {
    const all = await listDiagrams();
    setDiagrams(all);
    setLoadDialogOpen(true);
  };
  const closeLoadDialog = () => setLoadDialogOpen(false);
  const handleLoadDiagram = async (id: string) => {
    const diagram = await loadDiagram(id);
    if (diagram) {
      setElements(diagram.elements);
      setTitleBlock(diagram.titleBlock);
      setViewport(diagram.viewport);
      setLoadDialogOpen(false);
      setSnackbar({ open: true, message: 'Diagram loaded!', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: 'Failed to load diagram.', severity: 'error' });
    }
  };

  // Delete support
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = async () => {
    if (deleteId) {
      await deleteDiagram(deleteId);
      setDiagrams(await listDiagrams());
      setDeleteDialogOpen(false);
      setDeleteId(null);
      setSnackbar({ open: true, message: 'Diagram deleted!', severity: 'warning' });
    }
  };
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  // Rename support
  const handleRenameClick = (id: string, currentName: string) => {
    setRenameId(id);
    setRenameValue(currentName);
    setRenameDialogOpen(true);
  };
  const confirmRename = async () => {
    if (renameId && renameValue.trim()) {
      const diagram = await loadDiagram(renameId);
      if (diagram) {
        await saveDiagram({ ...diagram, name: renameValue });
        setDiagrams(await listDiagrams());
        setSnackbar({ open: true, message: 'Diagram renamed!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to rename diagram.', severity: 'error' });
      }
      setRenameDialogOpen(false);
      setRenameId(null);
      setRenameValue('');
    }
  };
  const cancelRename = () => {
    setRenameDialogOpen(false);
    setRenameId(null);
    setRenameValue('');
  };

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
          <Button variant="contained" startIcon={<SaveIcon />} sx={{ bgcolor: '#a020f0', color: '#fff', fontWeight: 500, '&:hover': { bgcolor: '#8e1ed6' } }} onClick={openSaveDialog}>
            Save
          </Button>
          <Button variant="contained" startIcon={<FolderOpenIcon />} sx={{ bgcolor: '#1976d2', color: '#fff', fontWeight: 500, '&:hover': { bgcolor: '#125ea2' } }} onClick={openLoadDialog}>
            Load
          </Button>
          <Button variant="contained" startIcon={<PlayArrowIcon />} sx={{ bgcolor: '#2e7d32', color: '#fff', fontWeight: 500, '&:hover': { bgcolor: '#27642a' } }}>
            Simulate
          </Button>
        </Box>
        {/* Save Dialog */}
        <Dialog open={saveDialogOpen} onClose={closeSaveDialog}>
          <DialogTitle>Save Diagram</DialogTitle>
          <DialogContent>
            <InputBase
              value={diagramName}
              onChange={e => setDiagramName(e.target.value)}
              placeholder="Diagram name"
              fullWidth
              sx={{ fontSize: 18, fontWeight: 500, bgcolor: '#f5f5f5', px: 1, borderRadius: 1, mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeSaveDialog}>Cancel</Button>
            <Button onClick={confirmSave} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
        {/* Load Dialog */}
        <Dialog open={loadDialogOpen} onClose={closeLoadDialog}>
          <DialogTitle>Load Diagram</DialogTitle>
          <DialogContent>
            <List>
              {diagrams.length === 0 && <ListItem><ListItemText primary="No diagrams saved." /></ListItem>}
              {diagrams.map((d) => (
                <ListItem key={d.id} disablePadding secondaryAction={
                  <Box>
                    <IconButton edge="end" aria-label="rename" size="small" onClick={() => handleRenameClick(d.id, d.name)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" size="small" onClick={() => handleDeleteClick(d.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }>
                  <ListItemButton onClick={() => handleLoadDiagram(d.id)}>
                    <ListItemText primary={d.name} secondary={d.updatedAt} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeLoadDialog}>Close</Button>
          </DialogActions>
        </Dialog>
        {/* Rename Dialog */}
        <Dialog open={renameDialogOpen} onClose={cancelRename}>
          <DialogTitle>Rename Diagram</DialogTitle>
          <DialogContent>
            <InputBase
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              placeholder="New diagram name"
              fullWidth
              sx={{ fontSize: 18, fontWeight: 500, bgcolor: '#f5f5f5', px: 1, borderRadius: 1, mt: 1 }}
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelRename}>Cancel</Button>
            <Button onClick={confirmRename} variant="contained">Rename</Button>
          </DialogActions>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
          <DialogTitle>Delete Diagram</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this diagram?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDelete}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderBar; 