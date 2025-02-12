import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { mode, toggleColorMode } = useTheme();

  const handleLogout = () => {
    logout();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Kişisel Muhasebe
        </Typography>
        {isAuthenticated ? (
          <Box>
            <Button color="inherit" onClick={() => navigate('/')}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={() => navigate('/transactions')}>
              İşlemler
            </Button>
            <Button color="inherit" onClick={() => navigate('/vault')}>
              Kasa
            </Button>
            <Button color="inherit" onClick={() => navigate('/personnel')}>
              Personel
            </Button>
            <Button color="inherit" onClick={() => navigate('/monthly-income')}>
              Aylık Gelir
            </Button>
            <Button color="inherit" onClick={() => navigate('/reports')}>
              Raporlar
            </Button>
            <Button color="inherit" onClick={() => navigate('/documents')}>
              Belgeler
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Çıkış
            </Button>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Giriş
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Kayıt Ol
            </Button>
          </Box>
        )}
        <IconButton 
          onClick={toggleColorMode} 
          color="inherit"
          sx={{ 
            ml: 2,
            bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            '&:hover': {
              bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            }
          }}
        >
          {mode === 'dark' ? (
            <Brightness7 sx={{ color: 'warning.light' }} />
          ) : (
            <Brightness4 sx={{ color: 'primary.main' }} />
          )}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 