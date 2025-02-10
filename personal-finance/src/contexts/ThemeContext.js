import React, { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { grey, blue, orange } from '@mui/material/colors';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // localStorage'dan tema tercihini al, yoksa 'light' kullan
    return localStorage.getItem('themeMode') || 'light';
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          // Tema tercihini localStorage'a kaydet
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Açık tema
                primary: {
                  main: blue[700],
                  light: blue[400],
                  dark: blue[800],
                },
                secondary: {
                  main: orange[700],
                  light: orange[500],
                  dark: orange[800],
                },
                background: {
                  default: grey[50],
                  paper: '#ffffff',
                },
                text: {
                  primary: grey[900],
                  secondary: grey[700],
                },
                divider: grey[200],
              }
            : {
                // Koyu tema
                primary: {
                  main: blue[300],
                  light: blue[200],
                  dark: blue[400],
                },
                secondary: {
                  main: orange[300],
                  light: orange[200],
                  dark: orange[400],
                },
                background: {
                  default: '#1a1a1a',
                  paper: '#2d2d2d',
                },
                text: {
                  primary: grey[100],
                  secondary: grey[300],
                },
                divider: grey[800],
              }),
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: { 
            fontWeight: 600,
            fontSize: '2.5rem',
            color: mode === 'light' ? grey[900] : grey[100],
          },
          h2: { 
            fontWeight: 600,
            fontSize: '2rem',
            color: mode === 'light' ? grey[900] : grey[100],
          },
          h3: { 
            fontWeight: 600,
            fontSize: '1.75rem',
            color: mode === 'light' ? grey[900] : grey[100],
          },
          h4: { 
            fontWeight: 600,
            fontSize: '1.5rem',
            color: mode === 'light' ? grey[900] : grey[100],
          },
          h5: { 
            fontWeight: 600,
            fontSize: '1.25rem',
            marginBottom: '1rem',
            color: mode === 'light' ? grey[900] : grey[100],
          },
          h6: { 
            fontWeight: 600,
            fontSize: '1rem',
            color: mode === 'light' ? grey[900] : grey[100],
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                ...(mode === 'dark' && {
                  boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.5)',
                }),
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: `1px solid ${mode === 'light' ? grey[200] : grey[800]}`,
              },
            },
          },
          MuiTableHead: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? grey[100] : grey[900],
                '& .MuiTableCell-root': {
                  color: mode === 'light' ? grey[900] : grey[100],
                  fontWeight: 600,
                },
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? blue[700] : '#2d2d2d',
                boxShadow: mode === 'light' 
                  ? '0px 2px 4px -1px rgba(0,0,0,0.2)'
                  : '0px 2px 4px -1px rgba(0,0,0,0.3)',
              },
            },
          },
          MuiTypography: {
            styleOverrides: {
              root: {
                '&.page-title': {
                  position: 'relative',
                  paddingBottom: '0.5rem',
                  marginBottom: '1.5rem',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '60px',
                    height: '4px',
                    backgroundColor: mode === 'light' ? blue[700] : blue[300],
                    borderRadius: '2px',
                  },
                },
                '&.section-title': {
                  position: 'relative',
                  paddingBottom: '0.5rem',
                  marginBottom: '1rem',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '40px',
                    height: '3px',
                    backgroundColor: mode === 'light' ? orange[700] : orange[300],
                    borderRadius: '1.5px',
                  },
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 