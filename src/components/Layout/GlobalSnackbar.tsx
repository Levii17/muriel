import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { useAtom } from 'jotai';
import { snackbarAtom } from '../../stores/appStore';

const Alert = React.forwardRef(function Alert(props: any, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const GlobalSnackbar: React.FC = () => {
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  const handleClose = (_: any, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={2500}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={handleClose} severity={snackbar.severity || 'info'} sx={{ width: '100%' }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar; 