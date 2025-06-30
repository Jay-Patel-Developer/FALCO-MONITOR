import React, { useEffect, useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, TextField, Dialog, DialogTitle, DialogContent, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Grid, Card, Button, AppBar, Toolbar
} from "@mui/material";
import IconButton from '@mui/material/IconButton';
import InfoIcon from "@mui/icons-material/Info";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import TableSortLabel from '@mui/material/TableSortLabel';
import SecurityIcon from '@mui/icons-material/Security';
import Stack from '@mui/material/Stack';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const priorityColor: Record<string, "error" | "warning" | "secondary" | "info" | "primary" | "default"> = {
  critical: "error",
  warning: "warning",
  error: "secondary",
  notice: "info",
  info: "primary"
};

type Alert = {
  time: string;
  priority: string;
  rule: string;
  output: string;
  output_fields: Record<string, any>;
};

function AlertDetailsDialog({ open, alert, onClose }: { open: boolean, alert: Alert | null, onClose: () => void }) {
  const handleCopy = () => {
    if (alert) {
      navigator.clipboard.writeText(JSON.stringify(alert, null, 2));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{
      sx: { borderRadius: 3, boxShadow: 8, bgcolor: 'background.paper' }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2, pb: 1, borderBottom: theme => `1.5px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1 }}>
            {alert?.rule || 'Alert Details'}
          </Typography>
          {alert && (
            <Chip
              label={alert.priority}
              color={priorityColor[alert.priority] || 'default'}
              size="small"
              sx={{ fontWeight: 700, textTransform: 'capitalize', letterSpacing: 0.5 }}
            />
          )}
        </Box>
        <IconButton onClick={onClose} aria-label="close" sx={{ ml: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.secondary' }}>×</Typography>
        </IconButton>
      </Box>
      <DialogContent sx={{ px: 3, pt: 2, pb: 3 }}>
        {alert && (
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700 }}>Output</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{alert.output}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700 }}>Time</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>{alert.time}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700 }}>Priority</Typography>
              <Chip
                label={alert.priority}
                color={priorityColor[alert.priority] || 'default'}
                size="small"
                sx={{ fontWeight: 700, textTransform: 'capitalize', letterSpacing: 0.5, mt: 0.5 }}
              />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700 }}>Output Fields</Typography>
                <Tooltip title="Copy JSON">
                  <IconButton onClick={handleCopy} size="small" sx={{ ml: 1 }}>
                    <FileCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? '#181f2a' : '#f5f6fa', p: 2, borderRadius: 2, fontFamily: 'monospace', fontSize: 14, overflowX: 'auto', boxShadow: 1 }}>
                <pre style={{ margin: 0, background: 'none', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}>
                  {JSON.stringify(alert.output_fields, null, 2)}
                </pre>
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function FalcoAlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<string[]>([]); // Multi-select
  const [rule, setRule] = useState<string[]>([]); // Multi-select
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [rules, setRules] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [sortBy, setSortBy] = useState<'time' | 'priority' | 'rule'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [mode, setMode] = useState<'light' | 'dark'>('light');

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

  useEffect(() => {
    fetch("/sample_alerts.json")
      .then(res => res.json())
      .then((data: Alert[]) => {
        setAlerts(data);
        // Extract unique rules for filter dropdown
        setRules(Array.from(new Set(data.map(a => a.rule))).sort());
      });
  }, []);

  // Securely filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesPriority = priority.length > 0 ? priority.includes(alert.priority) : true;
    const matchesRule = rule.length > 0 ? rule.includes(alert.rule) : true;
    const matchesSearch =
      alert.rule.toLowerCase().includes(search.toLowerCase()) ||
      alert.output.toLowerCase().includes(search.toLowerCase()) ||
      alert.priority.toLowerCase().includes(search.toLowerCase());
    let matchesDate = true;
    if (startDate && endDate) {
      const alertTime = dayjs(alert.time);
      matchesDate = alertTime.isAfter(startDate.startOf('day').subtract(1, 'ms')) && alertTime.isBefore(endDate.endOf('day').add(1, 'ms'));
    } else if (startDate) {
      const alertTime = dayjs(alert.time);
      matchesDate = alertTime.isAfter(startDate.startOf('day').subtract(1, 'ms'));
    } else if (endDate) {
      const alertTime = dayjs(alert.time);
      matchesDate = alertTime.isBefore(endDate.endOf('day').add(1, 'ms'));
    }
    return matchesPriority && matchesRule && matchesSearch && matchesDate;
  });

  // Sorting
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'time') {
      cmp = dayjs(a.time).valueOf() - dayjs(b.time).valueOf();
    } else if (sortBy === 'priority') {
      const order = ['critical', 'error', 'warning', 'notice', 'info'];
      cmp = order.indexOf(a.priority) - order.indexOf(b.priority);
    } else if (sortBy === 'rule') {
      cmp = a.rule.localeCompare(b.rule);
    }
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  const handleCopy = (alert: Alert) => {
    navigator.clipboard.writeText(JSON.stringify(alert, null, 2));
  };

  const handleResetFilters = () => {
    setPriority([]);
    setRule([]);
    setStartDate(null);
    setEndDate(null);
    setSearch("");
  };

  // Summary counts by priority
  const summary = ["critical", "warning", "error", "notice", "info"].map(p => ({
    label: p.charAt(0).toUpperCase() + p.slice(1),
    value: alerts.filter(a => a.priority === p).length,
    color: priorityColor[p] || "default"
  }));

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ width: '100vw', px: 0, pt: 0, bgcolor: 'background.default', minHeight: '100vh' }}>
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
            <Stack direction="row" spacing={1} sx={{ mr: 2, alignItems: 'center' }}>
              {summary.map(s => (
                <Chip
                  key={s.label}
                  label={<><b>{s.label}</b>: {s.value}</>}
                  color={priorityColor[s.label.toLowerCase()] || 'default'}
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
        <Box sx={{ pt: 1, mt: 1, width: '100vw', px: 0 }}>
          <Card elevation={3} sx={{ mb: 3, p: 2, borderRadius: 3, bgcolor: 'background.paper', boxShadow: 3, width: { xs: '98vw', sm: '98vw', md: '100vw' }, maxWidth: '100vw' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap" alignItems="center" justifyContent="flex-start">
              <FormControl sx={{ minWidth: 160, maxWidth: 240, flex: 2 }} size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  multiple
                  value={priority}
                  label="Priority"
                  onChange={e => setPriority(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                  renderValue={(selected) => (selected as string[]).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="notice">Notice</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 160, maxWidth: 240, flex: 2 }} size="small">
                <InputLabel>Rule</InputLabel>
                <Select
                  multiple
                  value={rule}
                  label="Rule"
                  onChange={e => setRule(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                  renderValue={(selected) => (selected as string[]).join(', ')}
                >
                  <MenuItem value="">All</MenuItem>
                  {rules.map(r => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: 110, maxWidth: 140 } } }}
                />
              </LocalizationProvider>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: 110, maxWidth: 140 } } }}
                />
              </LocalizationProvider>
              <TextField
                label="Search alerts"
                variant="outlined"
                size="small"
                value={search}
                onChange={e => setSearch(e.target.value)}
                sx={{ minWidth: 140, maxWidth: 220, flex: 2 }}
              />
              <Button variant="contained" color="secondary" onClick={handleResetFilters} sx={{ height: 40, fontWeight: 600, minWidth: 120 }}>
                Reset Filters
              </Button>
            </Stack>
          </Card>
          <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', width: '100vw', maxWidth: '100vw' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.paper : '#f3f6fa',
                  '& .MuiTableCell-root': {
                    color: (theme) => theme.palette.text.primary,
                    background: 'inherit',
                    borderBottom: (theme) => `2px solid ${theme.palette.divider}`,
                  }
                }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}> 
                      <TableSortLabel
                        active={sortBy === 'time'}
                        direction={sortBy === 'time' ? sortDirection : 'asc'}
                        onClick={() => {
                          setSortBy('time');
                          setSortDirection(sortBy === 'time' && sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Time
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel
                        active={sortBy === 'priority'}
                        direction={sortBy === 'priority' ? sortDirection : 'asc'}
                        onClick={() => {
                          setSortBy('priority');
                          setSortDirection(sortBy === 'priority' && sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Priority
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel
                        active={sortBy === 'rule'}
                        direction={sortBy === 'rule' ? sortDirection : 'asc'}
                        onClick={() => {
                          setSortBy('rule');
                          setSortDirection(sortBy === 'rule' && sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Rule
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Output</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No alerts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedAlerts.map((alert, idx) => (
                      <TableRow key={idx} hover sx={{ transition: 'background 0.2s', '&:hover': { bgcolor: 'grey.50' } }}>
                        <TableCell>{alert.time}</TableCell>
                        <TableCell>
                          <Chip
                            label={alert.priority}
                            color={priorityColor[alert.priority] || "default"}
                            size="small"
                            sx={{ fontWeight: 600, letterSpacing: 0.5 }}
                          />
                        </TableCell>
                        <TableCell>{alert.rule}</TableCell>
                        <TableCell sx={{ maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.output}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton onClick={() => setSelectedAlert(alert)}>
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy JSON">
                            <IconButton onClick={() => handleCopy(alert)}>
                              <FileCopyIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          <AlertDetailsDialog
            open={!!selectedAlert}
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
