import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const PageLayout = ({ title, children }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      pt: 3,
      pb: 6
    }}>
      <Container maxWidth="lg">
        {title && (
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 4, 
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            {title}
          </Typography>
        )}
        {children}
      </Container>
    </Box>
  );
};

export default PageLayout; 