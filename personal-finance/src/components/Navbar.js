import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Drawer,
  List,
  ListItem as MuiListItem,
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
  Logout,
  Person,
  MoneyOff,
} from '@mui/icons-material';

const Navbar = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, user } = useAuth();
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = React.useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleProfileOpen = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

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

  return (
    <Box sx={{ display: 'flex' }}>
      <Box sx={{ height: '80px' }} />

      <AppBar 
        position="fixed"
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ minHeight: '80px !important' }}>
          <IconButton
            edge="start"
            onClick={handleMenuOpen}
            sx={{ 
              mr: 2,
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box 
            component={Link} 
            to="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none',
              color: 'inherit',
              gap: 1,
              flexGrow: 1
            }}
          >
            <img
              src={process.env.PUBLIC_URL + '/logo.png'}
              alt="Öztürk Nakliyat"
              style={{
                height: '45px',
                width: 'auto'
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleProfileOpen}
              sx={{
                padding: 0.5,
                border: '2px solid',
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.main',
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 35, 
                  height: 35,
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                <Person />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <List>
          {menuItems.map((item) => (
            <MuiListItem
              component="div"
              key={item.text}
              onClick={() => handleMenuItemClick(item.path)}
              sx={{
                '&:hover': {
                  backgroundColor: 'background.subtle',
                  cursor: 'pointer'
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </MuiListItem>
          ))}
        </List>
      </Drawer>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 220,
            maxWidth: '100%',
          },
        }}
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.text}
            onClick={() => handleMenuItemClick(item.path)}
            sx={{
              py: 1,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 180,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            color: 'error.main',
            py: 1,
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Çıkış Yap" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Navbar; 