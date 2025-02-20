import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const PageTitle = ({ title }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography 
        variant="h4" 
        sx={{ 
          fontWeight: 600,
          color: 'text.primary',
          mb: 1.5
        }}
      >
        {title}
      </Typography>
      <Divider 
        sx={{ 
          borderColor: (theme) => theme.palette.primary.main,
          borderWidth: 2,
          width: '60px',
          borderRadius: 1
        }} 
      />
    </Box>
  );
};

export default PageTitle; 