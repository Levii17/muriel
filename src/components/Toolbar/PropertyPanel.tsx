import React from 'react';
import { useAtom } from 'jotai';
import { selectedElementsAtom, canvasElementsAtom } from '../../stores/canvasStore';
import { symbolLibraryAtom } from '../../stores/symbolStore';
import { Box, Typography, TextField, Divider } from '@mui/material';

const PropertyPanel: React.FC = () => {
  const [selected] = useAtom(selectedElementsAtom);
  const [elements, setElements] = useAtom(canvasElementsAtom);
  const [symbolLibrary] = useAtom(symbolLibraryAtom);

  if (!selected.length) {
    return (
      <Box p={3}>
        <Typography variant="h6" gutterBottom>Properties</Typography>
        <Typography variant="body2" color="text.secondary">Select a symbol to edit its properties.</Typography>
      </Box>
    );
  }

  const element = elements.find(el => el.id === selected[0]);
  if (!element) {
    return null;
  }
  const symbol = symbolLibrary.find(s => s.id === element.symbolId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setElements(prev => prev.map(el =>
      el.id === element.id ? { ...el, properties: { ...el.properties, [name]: value } } : el
    ));
  };

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>Component Properties</Typography>
      {symbol && (
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          {symbol.name}
        </Typography>
      )}
      <Divider sx={{ mb: 2 }} />
      {Object.keys(element.properties).length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No editable properties for this symbol.
        </Typography>
      )}
      {Object.entries(element.properties).map(([key, value]) => (
        <TextField
          key={key}
          name={key}
          label={key}
          value={value}
          onChange={handleChange}
          margin="normal"
          fullWidth
          size="small"
        />
      ))}
    </Box>
  );
};

export default PropertyPanel;
