import React from 'react';
import { useAtom } from 'jotai';
import { titleBlockAtom } from '../stores/titleBlockStore';
import { TextField, Box, Typography } from '@mui/material';

const fields = [
  { name: 'company', label: 'Organization' },
  { name: 'project', label: 'Project Name' },
  { name: 'designer', label: 'Name' },
  { name: 'date', label: 'Date' },
  { name: 'scale', label: 'Scale' },
  { name: 'drawingTitle', label: 'Drawing Title(s)' },
  { name: 'details', label: 'Details' },
];

const TitleBlockPanel: React.FC = () => {
  const [titleBlock, setTitleBlock] = useAtom(titleBlockAtom);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTitleBlock((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>Title Block</Typography>
      {fields.map((field) => (
        <TextField
          key={field.name}
          name={field.name}
          label={field.label}
          value={titleBlock[field.name as keyof typeof titleBlock] || ''}
          onChange={handleChange}
          margin="normal"
          fullWidth
          size="small"
        />
      ))}
    </Box>
  );
};

export default TitleBlockPanel; 