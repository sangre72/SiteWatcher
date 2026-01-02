import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle, Box } from '@mui/material';

const ClickDivInfo: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [clickInfo, setClickInfo] = useState<{ type: string | null, id: string | null }>({ type: null, id: null });

  useEffect(() => {
    document.addEventListener('click', handleMouseClick);
    return () => {
      document.removeEventListener('click', handleMouseClick);
    };
  }, []);

  const handleMouseClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const divElement = target.closest('div');
    if (divElement) {
      const divId = divElement.id;
      const divName = divElement.nodeName;

      setClickInfo({ type: divName, id: divId });
      setShowToast(true);
    }
  };

  return (
    <Box sx={{ width: 200, display: 'flex', flexDirection: 'column' }}>
      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowToast(false)} severity="info">
          <AlertTitle>Clicked Element Info</AlertTitle>
          <Box>Name: {clickInfo.type}</Box>
          <Box>ID: {clickInfo.id}</Box>
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ClickDivInfo;
