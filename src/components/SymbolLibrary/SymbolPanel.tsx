import React, { useState } from 'react';
import { useAtom } from 'jotai';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { filteredSymbolsAtom, symbolSearchQueryAtom } from '../../stores/symbolStore';
import { useSymbols } from '../../hooks/useSymbols';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Switches', value: 'switches' },
  { label: 'Lights', value: 'lights' },
  { label: 'Outlets', value: 'outlets' },
  { label: 'Protection', value: 'protection' },
  { label: 'Distribution', value: 'distribution' },
];

const SymbolPanel: React.FC = () => {
  const { loading, error } = useSymbols();
  const [symbols] = useAtom(filteredSymbolsAtom);
  const [search, setSearch] = useAtom(symbolSearchQueryAtom);
  const [category, setCategory] = useState('');

  // Filter by category
  const filtered = category
    ? symbols.filter((s) => s.category === category)
    : symbols;

  return (
    <Paper elevation={1} sx={{
      p: 2,
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      bgcolor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      transition: 'box-shadow 0.2s',
      '&:hover::-webkit-scrollbar-thumb': {
        background: '#b0b6bc',
      },
      '&::-webkit-scrollbar-thumb': {
        transition: 'background 0.2s',
      },
    }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
        Symbol Library
      </Typography>
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="symbol-category-label">Category</InputLabel>
        <Select
          labelId="symbol-category-label"
          value={category}
          label="Category"
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        size="small"
        fullWidth
        placeholder="Search symbols..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 2, bgcolor: '#f8fafc', borderRadius: 1 }}
        inputProps={{ style: { minHeight: 36 } }}
      />
      <Box sx={{ flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            ))}
          </Box>
        ) : error ? (
          <Box sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <InfoOutlinedIcon color="error" />
            <Typography variant="body2">Error: {error}</Typography>
          </Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 2,
            p: 1,
          }}>
            {filtered.length === 0 && (
              <Box sx={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                color: 'text.secondary',
                py: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
              }}>
                <InfoOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  No symbols found
                </Typography>
                <Typography variant="body2">
                  Try a different search or category.
                </Typography>
              </Box>
            )}
            {filtered.map(symbol => (
              <Tooltip key={symbol.id} title={symbol.name} arrow placement="right">
                <Paper
                  elevation={2}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'grab',
                    userSelect: 'none',
                    borderRadius: 2,
                    transition: 'box-shadow 0.2s, background 0.2s, border 0.2s',
                    border: '2px solid transparent',
                    '&:hover': {
                      boxShadow: 8,
                      background: '#f0f4ff',
                      border: '2px solid #1976d2',
                    },
                    '&:active': {
                      cursor: 'grabbing',
                    },
                  }}
                  draggable
                  aria-label={`Drag ${symbol.name}`}
                  onDragStart={e => {
                    e.dataTransfer.setData('application/json', JSON.stringify(symbol));
                  }}
                >
                  <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span dangerouslySetInnerHTML={{ __html: symbol.svg }} />
                  </span>
                  <Box sx={{ mt: 1, fontSize: 14, textAlign: 'center', color: 'text.primary', fontWeight: 500, wordBreak: 'break-word' }}>
                    {symbol.name}
                  </Box>
                </Paper>
              </Tooltip>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default SymbolPanel; 