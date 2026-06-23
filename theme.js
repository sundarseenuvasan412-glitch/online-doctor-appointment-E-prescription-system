import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily:
      '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h3: { fontWeight: 700, letterSpacing: '-0.03em' },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  palette: {
    primary: {
      main: '#0f766e', // softer teal
      light: '#5eead4',
      dark: '#115e59',
    },
    secondary: {
      main: '#14b8a6', // teal accent
    },
    background: {
      default: '#f3f4f6',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background:
            'linear-gradient(120deg, rgba(15,118,110,0.96), rgba(20,184,166,0.96))',
        },
      },
    },
  },
});

export default theme;

