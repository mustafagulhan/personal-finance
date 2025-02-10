import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#991b1b', // Daha koyu kırmızı
      light: '#dc2626',
      dark: '#7f1d1d',
      contrastText: '#fff',
    },
    secondary: {
      main: '#334155', // Koyu gri
      light: '#475569',
      dark: '#1e293b',
      contrastText: '#fff',
    },
    background: {
      default: '#1e293b', // Koyu gri arka plan
      paper: '#334155', // Grimsi siyah kart arka planı
    },
    text: {
      primary: '#f1f5f9', // Açık gri yazı
      secondary: '#cbd5e1', // Daha açık gri yazı
    },
    success: {
      main: '#22c55e',
      light: '#4ade80',
      dark: '#16a34a',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
    },
    divider: 'rgba(255, 255, 255, 0.12)', // Daha belirgin ayraçlar
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      color: '#f1f5f9',
    },
    h2: {
      fontWeight: 600,
      color: '#f1f5f9',
    },
    h3: {
      fontWeight: 600,
      color: '#f1f5f9',
    },
    h4: {
      fontWeight: 600,
      color: '#f1f5f9',
    },
    h5: {
      fontWeight: 600,
      color: '#f1f5f9',
    },
    h6: {
      fontWeight: 600,
      color: '#f1f5f9',
    },
    body1: {
      color: '#f1f5f9',
    },
    body2: {
      color: '#cbd5e1',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#334155', // Grimsi siyah kartlar
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#334155', // Grimsi siyah paper
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b', // Koyu gri navbar
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#f1f5f9',
        },
        head: {
          color: '#cbd5e1',
          fontWeight: 600,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#cbd5e1',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#f1f5f9',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.23)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.4)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#991b1b',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#cbd5e1',
          '&.Mui-focused': {
            color: '#991b1b',
          },
        },
      },
    },
  },
});

export default theme; 