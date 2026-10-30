import { createTheme } from '@mui/material/styles';

// Cool paper background, deep ink text, one teal accent used for actions and the median marker.
const theme = createTheme({
  palette: {
    primary: { main: '#0b6b63' },
    secondary: { main: '#b4531a' },
    background: { default: '#eef1f3', paper: '#ffffff' },
    text: { primary: '#14212b', secondary: '#55636e' },
    divider: '#d5dce1',
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    h1: { fontSize: '1.5rem', fontWeight: 600 },
    h2: { fontSize: '1.125rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiPaper: { defaultProps: { elevation: 0, variant: 'outlined' } },
    MuiTableCell: { styleOverrides: { root: { fontVariantNumeric: 'tabular-nums' } } },
  },
});
export default theme;
