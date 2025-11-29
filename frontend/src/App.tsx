import { AppBar, Toolbar, Typography, Container, Button, Box, Tabs, Tab, Snackbar, Alert, CssBaseline } from '@mui/material'
import { useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import Loader from './components/Loader'
import Tools from './pages/Tools'
import Json from './pages/Json'
import TextTools from './pages/Text'
import Crypto from './pages/Crypto'
import Cert from './pages/Cert'
import IpDomain from './pages/IpDomain'
import { useSelector } from 'react-redux'
import { RootState } from './store'

const theme = createTheme({
  palette: { mode: 'dark', primary: { main: '#7c3aed' }, secondary: { main: '#06b6d4' } },
  shape: { borderRadius: 12 },
  components: {
    MuiTabs: {
      styleOverrides: {
        root: { background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 4 },
        indicator: { height: 3, borderRadius: 3, background: 'linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)' }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          textTransform: 'none',
          color: '#e5e7eb',
          minHeight: 44,
          '&.Mui-selected': { color: '#ffffff' }
        }
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: '#e5e7eb',
          '&.Mui-focused': { color: '#ffffff' },
          '&.Mui-disabled': { color: 'rgba(229,231,235,0.5)' }
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#e5e7eb',
          '&.Mui-focused': { color: '#ffffff' },
          '&.Mui-disabled': { color: 'rgba(229,231,235,0.5)' }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 12,
          color: '#e5e7eb',
          '& .MuiOutlinedInput-input': { color: '#ffffff' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.18)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#a78bfa' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7c3aed', boxShadow: '0 0 0 2px rgba(124,58,237,0.25)' }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          background: 'linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
          fontWeight: 700,
          textTransform: 'none',
          '&:hover': { filter: 'brightness(1.05)' }
        },
        outlined: {
          borderColor: '#7c3aed',
          color: '#e5e7eb',
          fontWeight: 700,
          textTransform: 'none',
          '&:hover': { borderColor: '#06b6d4', background: 'rgba(124,58,237,0.12)' }
        }
      }
    }
  }
})

export default function App() {
  const [tab, setTab] = useState<'tools' | 'json' | 'text' | 'ipdom' | 'crypto' | 'cert'>('tools')
  const snackbar = useSelector((s: RootState) => s.ui.snackbar)
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ position: 'relative', minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 40%, #7c3aed 100%)' }}>
        <AppBar position="static" sx={{ background: 'linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)' }}>
          <Toolbar>
            <img src="/favicon.svg" alt="EngTools" width="24" height="24" style={{ marginRight: 8 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>EngTools</Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Box sx={{ position: 'absolute', top: 40, left: 60, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,.6), transparent 60%)', animation: 'float 6s ease-in-out infinite', '@keyframes float': { '0%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' }, '100%': { transform: 'translateY(0)' } } }} />
          <Box sx={{ position: 'absolute', bottom: 40, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,.6), transparent 60%)', animation: 'float 7s ease-in-out infinite' }} />
        </Box>
        <Loader />
        <Container maxWidth="xl" sx={{ mt: 4, pb: 6 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Tools" value="tools" />
            <Tab label="JSON" value="json" />
            <Tab label="Text" value="text" />
            <Tab label="IP&Domain" value="ipdom" />
            <Tab label="Crypto" value="crypto" />
            <Tab label="Cert" value="cert" />
          </Tabs>
          {tab==='tools'? <Tools/> : tab==='json' ? <Json/> : tab==='text' ? <TextTools/> : tab==='ipdom' ? <IpDomain/> : tab==='crypto' ? <Crypto/> : <Cert/>}
        </Container>
        <Snackbar open={snackbar.open} autoHideDuration={3000}>
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}