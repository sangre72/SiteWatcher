import React, { useState } from 'react';
import { Box, Button, Alert } from '@mui/material';

interface ResponseLayerProps {
  isOpen: boolean;
  onClose: () => void;
  responseContent: string;
}

const GPTResponseLayerProps: React.FC<ResponseLayerProps> = ({ isOpen, onClose, responseContent }) => {
  const [showResponse, setShowResponse] = useState(isOpen);

  return (
    <Box className="response-layer">
      {showResponse && (
        <Box className="response-content">
          <Alert severity="info" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
            {responseContent}
          </Alert>
          <Button variant="outlined" color="inherit" onClick={() => setShowResponse(false)}>
            Close
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default GPTResponseLayerProps;
