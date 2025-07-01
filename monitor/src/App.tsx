import React, { useState } from 'react';
import FalcoAlertsDashboard from './FalcoAlertsDashboard';
import FalcoAnalyticsView from './FalcoAnalyticsView';
import './App.css';
import { AppBar, Toolbar, Tabs, Tab, Box, Typography, Stack, Chip, IconButton } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const priorityColor: Record<string, "error" | "warning" | "secondary" | "info" | "primary" | "default"> = {
  critical: "error",
  warning: "warning",
  error: "secondary",
  notice: "info",
  info: "primary"
};

function App() {
  const [tab, setTab] = useState(0);
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [summary, setSummary] = useState([
    { label: 'Critical', value: 0, color: 'error' },
    { label: 'Error', value: 0, color: 'secondary' },
    { label: 'Warning', value: 0, color: 'warning' },
    { label: 'Notice', value: 0, color: 'info' },
    { label: 'Info', value: 0, color: 'primary' }
  ]);

  // Fetch summary from sample_priority_counts.json
  React.useEffect(() => {
    fetch('/sample_priority_counts.json')
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSummary([
            { label: 'Critical', value: data.find((p) => p.priority === 'critical')?.count || 0, color: 'error' },
            { label: 'Error', value: data.find((p) => p.priority === 'error')?.count || 0, color: 'secondary' },
            { label: 'Warning', value: data.find((p) => p.priority === 'warning')?.count || 0, color: 'warning' },
            { label: 'Notice', value: data.find((p) => p.priority === 'notice')?.count || 0, color: 'info' },
            { label: 'Info', value: data.find((p) => p.priority === 'info')?.count || 0, color: 'primary' }
          ]);
        }
      });
  }, []);

  const theme = createTheme({
    palette: {
      mode,
      ...(mode === 'dark'
        ? {
            background: { default: '#101624', paper: '#1e2330' },
            primary: { main: '#1976d2' },
            secondary: { main: '#90caf9' },
          }
        : {
            background: { default: '#f5f6fa', paper: '#fff' },
            primary: { main: '#1976d2' },
            secondary: { main: '#1976d2' },
          }),
    },
    shape: { borderRadius: 10 },
  });

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ width: '100vw', minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="sticky" elevation={4} sx={{
          top: 0,
          left: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          borderRadius: 0,
          mb: 0,
          background: mode === 'dark'
            ? 'linear-gradient(90deg, #101624 0%, #1976d2 100%)'
            : 'linear-gradient(90deg, #1e293b 0%, #1976d2 100%)',
          boxShadow: '0 4px 24px 0 rgba(30,41,59,0.18)'
        }}>
          <Toolbar sx={{ minHeight: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon sx={{ fontSize: 44, color: 'white', mr: 1, filter: 'drop-shadow(0 2px 8px #1976d2)' }} />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  letterSpacing: 2,
                  color: 'white',
                  textShadow: '0 2px 8px rgba(25,118,210,0.25)',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  textAlign: 'center',
                  lineHeight: 1.1
                }}
              >
                FalcoGuard
                <Typography component="span" variant="h5" sx={{ ml: 2, color: 'grey.200', fontWeight: 400, letterSpacing: 1 }}>
                  Real-Time Security Alert Dashboard
                </Typography>
              </Typography>
            </Box>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit" indicatorColor="secondary" sx={{ minHeight: 48, '.MuiTab-root': { color: 'white', fontWeight: 700, fontSize: '1.1rem' } }}>
              <Tab label="Live Alerts" />
              <Tab label="Analytics" />
            </Tabs>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {summary.map(s => (
                <Chip
                  key={s.label}
                  label={<><b>{s.label}</b>: {s.value}</>}
                  color={s.color as any}
                  variant="filled"
                  sx={{ fontWeight: 600, fontSize: '1rem', px: 1.5, bgcolor: s.color + '.main', color: 'white', boxShadow: 1 }}
                />
              ))}
              <IconButton
                sx={{ ml: 2, color: 'white', bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
                aria-label="toggle dark mode"
              >
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>
        <Box sx={{ pt: 2 }}>
          {tab === 0 && <FalcoAlertsDashboard mode={mode} />}
          {tab === 1 && <FalcoAnalyticsView mode={mode} />}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
