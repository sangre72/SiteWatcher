import React from 'react';
import { Box, Grid, Typography } from '@mui/material';

function FooterInfo() {
  return (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Typography variant="body2">회사명: XYZ</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body2">연락처: (123) 456-7890</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body2">Email: info@xyz.com</Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default FooterInfo;
