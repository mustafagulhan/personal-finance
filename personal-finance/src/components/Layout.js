import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  IconButton,
  Typography,
  Divider,
  useTheme,
  ListItemButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Receipt,
  Assessment,
  Description,
  People,
  MonetizationOn,
  AccountBalance,
  Note,
  MoneyOff,
  ChevronLeft,
  Logout,
  Person
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;
const closedDrawerWidth = 80;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'İşlemler', icon: <Receipt />, path: '/transactions' },
  { text: 'Raporlar', icon: <Assessment />, path: '/reports' },
  { text: 'Belgeler', icon: <Description />, path: '/documents' },
  { text: 'Personel', icon: <People />, path: '/personnel' },
  { text: 'Aylık Gelir', icon: <MonetizationOn />, path: '/monthly-income' },
  { text: 'Kasa', icon: <AccountBalance />, path: '/vault' },
  { text: 'Notlar', icon: <Note />, path: '/notes' },
  { text: 'Borçlar', icon: <MoneyOff />, path: '/debts' },
];

const Layout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : closedDrawerWidth,
          flexShrink: 0,
          position: 'fixed',
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : closedDrawerWidth,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
          },
        }}
      >
        <Box 
          sx={{ 
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            borderBottom: `1px solid ${theme.palette.divider}`,
            px: open ? 2 : 1
          }}
        >
          {open ? (
            <>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  style={{ 
                    height: 48,
                    width: 'auto',
                  }} 
                />
              </Box>
              <IconButton 
                onClick={handleDrawerToggle}
                sx={{ position: 'absolute', right: 8 }}
              >
                <ChevronLeft />
              </IconButton>
            </>
          ) : (
            <IconButton onClick={handleDrawerToggle}>
              <MenuIcon />
            </IconButton>
          )}
        </Box>
        
        <List sx={{ flex: 1, px: open ? 2 : 1, py: 2 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                borderRadius: 1,
                mb: 0.5,
                px: open ? 2 : 1.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '30',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: location.pathname === item.path ? theme.palette.primary.main : 'inherit'
                }}
              >
                {item.icon}
              </ListItemIcon>
              {open && (
                <ListItemText 
                  primary={item.text} 
                  sx={{
                    color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                    '& .MuiTypography-root': {
                      fontWeight: location.pathname === item.path ? 600 : 400
                    }
                  }}
                />
              )}
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ 
          p: 1,
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <ListItemButton
            onClick={handleProfileClick}
            sx={{
              borderRadius: 1,
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              bgcolor: theme.palette.background.subtle,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 2 : 'auto',
                justifyContent: 'center',
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: theme.palette.primary.main 
                }}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
            </ListItemIcon>
            {open && (
              <ListItemText 
                primary={user?.email?.split('@')[0]}
                primaryTypographyProps={{
                  noWrap: true,
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              />
            )}
          </ListItemButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          PaperProps={{
            sx: {
              mt: -1,
              minWidth: 180,
              boxShadow: theme.shadows[3],
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
              }
            },
          }}
        >
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Çıkış Yap" />
          </MenuItem>
        </Menu>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          paddingLeft: open ? `${drawerWidth + 24}px` : `${closedDrawerWidth + 24}px`,
          transition: theme.transitions.create('padding', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Box 
          sx={{ 
            width: '100%',
            maxWidth: '1600px',
            mx: 'auto',
            position: 'relative',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout; 