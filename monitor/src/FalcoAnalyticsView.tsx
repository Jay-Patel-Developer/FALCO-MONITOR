import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CircularProgress, useTheme, Grid } from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Treemap
} from 'recharts';

const COLORS = ['#1976d2', '#ff9800', '#e53935', '#43a047', '#8e24aa', '#00bcd4', '#fbc02d'];

export default function FalcoAnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    // For demo: load analytics from static JSON file
    fetch('/sample_charts_data.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress /></Box>;
  }

  // Defensive: ensure all expected arrays exist and are arrays
  const safe = (arr: any) => Array.isArray(arr) ? arr : [];
  const alertsOverTime = safe(data.alerts_over_time);
  const alertsByPriority = safe(data.alerts_by_priority);
  const topRules = safe(data.top_rules);
  const alertsByRuleOverTime = safe(data.alerts_by_rule_over_time);
  const alertsByHost = safe(data.alerts_by_host);
  const alertsHeatmap = safe(data.alerts_heatmap);
  const alertStatus = safe(data.alert_status);
  const topUsers = safe(data.top_users);
  const alertsByRegion = safe(data.alerts_by_region);
  const alertCorrelation = safe(data.alert_correlation); // fix: handle null
  const alertDuration = safe(data.alert_duration);
  const dashboardStats = data.dashboard_stats || {};

  // Helper for AreaChart: group by rule
  const rules = Array.from(new Set(alertsByRuleOverTime.map((d: any) => d.rule))) as string[];
  const areaChartData = alertsByRuleOverTime.reduce((acc: any[], cur: any) => {
    let found = acc.find(a => a.timestamp === cur.timestamp);
    if (!found) {
      found = { timestamp: cur.timestamp };
      acc.push(found);
    }
    found[cur.rule] = cur.count;
    return acc;
  }, []);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight={900} mb={3} sx={{ letterSpacing: 1, color: theme.palette.primary.main, textAlign: 'center', textShadow: '0 2px 8px rgba(25,118,210,0.10)', fontFamily: 'inherit' }}>Falco Analytics</Typography>
      <Grid container spacing={4} justifyContent="center">
        {/* Each row: two charts side by side, always xs=12 sm=6 md=6 for each */}
        {/* Only 2 charts per row, robust layout for all screen sizes */}
        {/* 1. Alerts Over Time */}
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6} sx={{ display: 'flex' }}>
          <Card sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            bgcolor: theme.palette.background.default,
            borderRadius: 2, // 8px
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}`,
            boxShadow: '0 1.5px 4px 0 rgba(31,41,55,0.07), 0 1.5px 4px 0 rgba(31,41,55,0.13)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: '0 4px 16px 0 rgba(31,41,55,0.18)',
              borderColor: theme.palette.primary.main,
            },
          }}>
            <Typography variant="h5" mb={2} sx={{ fontWeight: 900, letterSpacing: 0.5, color: theme.palette.primary.main, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(25,118,210,0.10)' }}>Alert Volume Over Time</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={alertsOverTime} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="timestamp" tickFormatter={(t: string) => t.slice(11,16)} stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <YAxis stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <RechartsTooltip contentStyle={{ background: theme.palette.background.default, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 24px 0 rgba(30,41,59,0.18)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }} itemStyle={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: 'inherit' }} labelStyle={{ fontWeight: 700, color: theme.palette.secondary.main, fontFamily: 'inherit' }} />
                <Legend wrapperStyle={{ fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }} />
                <Line type="monotone" dataKey="count" stroke={theme.palette.primary.main} strokeWidth={3} dot={{ r: 5, stroke: theme.palette.secondary.main, strokeWidth: 2 }} activeDot={{ r: 8, fill: theme.palette.secondary.main }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        {/* 2. Alerts by Priority */}
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6} sx={{ display: 'flex' }}>
          <Card sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}`,
            boxShadow: '0 1.5px 4px 0 rgba(31,41,55,0.07), 0 1.5px 4px 0 rgba(31,41,55,0.13)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: '0 4px 16px 0 rgba(31,41,55,0.18)',
              borderColor: theme.palette.primary.main,
            },
          }}>
            <Typography variant="h5" mb={2} sx={{ fontWeight: 900, letterSpacing: 0.5, color: theme.palette.primary.main, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(25,118,210,0.10)' }}>Alerts by Priority</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={alertsByPriority} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={80} label style={{ fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }}>
                  {alertsByPriority.map((_: any, idx: number) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ background: theme.palette.background.default, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 24px 0 rgba(30,41,59,0.18)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }} itemStyle={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: 'inherit' }} labelStyle={{ fontWeight: 700, color: theme.palette.secondary.main, fontFamily: 'inherit' }} />
                <Legend wrapperStyle={{ fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        {/* 3. Top Triggered Rules */}
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6} sx={{ display: 'flex' }}>
          <Card sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}`,
            boxShadow: '0 1.5px 4px 0 rgba(31,41,55,0.07), 0 1.5px 4px 0 rgba(31,41,55,0.13)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: '0 4px 16px 0 rgba(31,41,55,0.18)',
              borderColor: theme.palette.primary.main,
            },
          }}>
            <Typography variant="h5" mb={2} sx={{ fontWeight: 900, letterSpacing: 0.5, color: theme.palette.primary.main, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(25,118,210,0.10)' }}>Top Triggered Rules</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topRules} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis type="number" stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <YAxis dataKey="rule" type="category" width={120} stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <RechartsTooltip contentStyle={{ background: theme.palette.background.default, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 24px 0 rgba(30,41,59,0.18)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }} itemStyle={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: 'inherit' }} labelStyle={{ fontWeight: 700, color: theme.palette.secondary.main, fontFamily: 'inherit' }} />
                <Legend wrapperStyle={{ fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }} />
                <Bar dataKey="count" fill={theme.palette.primary.main} barSize={18} radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        {/* 4. Alerts by Rule Over Time */}
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6} sx={{ display: 'flex' }}>
          <Card sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}`,
            boxShadow: '0 1.5px 4px 0 rgba(31,41,55,0.07), 0 1.5px 4px 0 rgba(31,41,55,0.13)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: '0 4px 16px 0 rgba(31,41,55,0.18)',
              borderColor: theme.palette.primary.main,
            },
          }}>
            <Typography variant="h5" mb={2} sx={{ fontWeight: 900, letterSpacing: 0.5, color: theme.palette.primary.main, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(25,118,210,0.10)' }}>Alerts by Rule Over Time</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={areaChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="timestamp" tickFormatter={(t: string) => t.slice(11,16)} stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <YAxis stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <RechartsTooltip contentStyle={{ background: theme.palette.background.default, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 24px 0 rgba(30,41,59,0.18)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }} itemStyle={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: 'inherit' }} labelStyle={{ fontWeight: 700, color: theme.palette.secondary.main, fontFamily: 'inherit' }} />
                <Legend wrapperStyle={{ fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }} />
                {rules.map((rule: string, idx: number) => (
                  <Area key={rule} type="monotone" dataKey={rule} name={rule} stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} strokeWidth={3} activeDot={{ r: 7, fill: theme.palette.secondary.main }} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        {/* 5. Alerts by Host */}
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6} sx={{ display: 'flex' }}>
          <Card sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}`,
            boxShadow: '0 1.5px 4px 0 rgba(31,41,55,0.07), 0 1.5px 4px 0 rgba(31,41,55,0.13)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: '0 4px 16px 0 rgba(31,41,55,0.18)',
              borderColor: theme.palette.primary.main,
            },
          }}>
            <Typography variant="h5" mb={2} sx={{ fontWeight: 900, letterSpacing: 0.5, color: theme.palette.primary.main, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(25,118,210,0.10)' }}>Alerts by Host</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={alertsByHost} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="host" stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <YAxis stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <RechartsTooltip contentStyle={{ background: theme.palette.background.default, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 24px 0 rgba(30,41,59,0.18)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }} itemStyle={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: 'inherit' }} labelStyle={{ fontWeight: 700, color: theme.palette.secondary.main, fontFamily: 'inherit' }} />
                <Legend wrapperStyle={{ fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }} />
                <Bar dataKey="count" fill={theme.palette.success.main} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        {/* 6. Alert Heatmap (as Treemap for demo) */}
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6} sx={{ display: 'flex' }}>
          <Card sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}`,
            boxShadow: '0 1.5px 4px 0 rgba(31,41,55,0.07), 0 1.5px 4px 0 rgba(31,41,55,0.13)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: '0 4px 16px 0 rgba(31,41,55,0.18)',
              borderColor: theme.palette.primary.main,
            },
          }}>
            <Typography variant="h5" mb={2} sx={{ fontWeight: 900, letterSpacing: 0.5, color: theme.palette.primary.main, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(25,118,210,0.10)' }}>Alert Heatmap (by Day/Hour)</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <Treemap data={alertsHeatmap} dataKey="count" nameKey="day" aspectRatio={4/3} stroke={theme.palette.divider} />
            </ResponsiveContainer>
          </Card>
        </Grid>
        {/* 7. Alert Resolution Status */}
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6} sx={{ display: 'flex' }}>
          <Card sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}`,
            boxShadow: '0 1.5px 4px 0 rgba(31,41,55,0.07), 0 1.5px 4px 0 rgba(31,41,55,0.13)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: '0 4px 16px 0 rgba(31,41,55,0.18)',
              borderColor: theme.palette.primary.main,
            },
          }}>
            <Typography variant="h5" mb={2} sx={{ fontWeight: 900, letterSpacing: 0.5, color: theme.palette.primary.main, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(25,118,210,0.10)' }}>Alert Resolution Status</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={alertStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {alertStatus.map((_: any, idx: number) => (
                    <Cell key={`cell-status-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ background: theme.palette.background.default, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 24px 0 rgba(30,41,59,0.18)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }} itemStyle={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: 'inherit' }} labelStyle={{ fontWeight: 700, color: theme.palette.secondary.main, fontFamily: 'inherit' }} />
                <Legend wrapperStyle={{ fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        {/* 8. Top Alerted Users */}
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6} sx={{ display: 'flex' }}>
          <Card sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}`,
            boxShadow: '0 1.5px 4px 0 rgba(31,41,55,0.07), 0 1.5px 4px 0 rgba(31,41,55,0.13)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: '0 4px 16px 0 rgba(31,41,55,0.18)',
              borderColor: theme.palette.primary.main,
            },
          }}>
            <Typography variant="h5" mb={2} sx={{ fontWeight: 900, letterSpacing: 0.5, color: theme.palette.primary.main, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(25,118,210,0.10)' }}>Top Alerted Users</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topUsers} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis type="number" stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <YAxis dataKey="user" type="category" width={120} stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <RechartsTooltip contentStyle={{ background: theme.palette.background.default, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 24px 0 rgba(30,41,59,0.18)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }} itemStyle={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: 'inherit' }} labelStyle={{ fontWeight: 700, color: theme.palette.secondary.main, fontFamily: 'inherit' }} />
                <Legend wrapperStyle={{ fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }} />
                <Bar dataKey="count" fill={theme.palette.secondary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        {/* 9. Alerts by Region */}
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6} sx={{ display: 'flex' }}>
          <Card sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}`,
            boxShadow: '0 1.5px 4px 0 rgba(31,41,55,0.07), 0 1.5px 4px 0 rgba(31,41,55,0.13)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: '0 4px 16px 0 rgba(31,41,55,0.18)',
              borderColor: theme.palette.primary.main,
            },
          }}>
            <Typography variant="h5" mb={2} sx={{ fontWeight: 900, letterSpacing: 0.5, color: theme.palette.primary.main, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(25,118,210,0.10)' }}>Alerts by Region</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={alertsByRegion} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="region" stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <YAxis stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <RechartsTooltip contentStyle={{ background: theme.palette.background.default, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 24px 0 rgba(30,41,59,0.18)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }} itemStyle={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: 'inherit' }} labelStyle={{ fontWeight: 700, color: theme.palette.secondary.main, fontFamily: 'inherit' }} />
                <Legend wrapperStyle={{ fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }} />
                <Bar dataKey="count" fill={theme.palette.info.main} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        {/* 10. Alert Correlation */}
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6} sx={{ display: 'flex' }}>
          <Card sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}`,
            boxShadow: '0 1.5px 4px 0 rgba(31,41,55,0.07), 0 1.5px 4px 0 rgba(31,41,55,0.13)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: '0 4px 16px 0 rgba(31,41,55,0.18)',
              borderColor: theme.palette.primary.main,
            },
          }}>
            <Typography variant="h5" mb={2} sx={{ fontWeight: 900, letterSpacing: 0.5, color: theme.palette.primary.main, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(25,118,210,0.10)' }}>Alert Correlation</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={alertCorrelation} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="rule1" stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <YAxis stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <RechartsTooltip contentStyle={{ background: theme.palette.background.default, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 24px 0 rgba(30,41,59,0.18)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }} itemStyle={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: 'inherit' }} labelStyle={{ fontWeight: 700, color: theme.palette.secondary.main, fontFamily: 'inherit' }} />
                <Legend wrapperStyle={{ fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }} />
                <Bar dataKey="count" fill={theme.palette.warning.main} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        {/* 11. Alert Duration */}
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6} sx={{ display: 'flex' }}>
          <Card sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}`,
            boxShadow: '0 1.5px 4px 0 rgba(31,41,55,0.07), 0 1.5px 4px 0 rgba(31,41,55,0.13)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: '0 4px 16px 0 rgba(31,41,55,0.18)',
              borderColor: theme.palette.primary.main,
            },
          }}>
            <Typography variant="h5" mb={2} sx={{ fontWeight: 900, letterSpacing: 0.5, color: theme.palette.primary.main, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'inherit', textShadow: '0 2px 8px rgba(25,118,210,0.10)' }}>Alert Duration (Minutes)</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={alertDuration} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="duration_minutes" stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <YAxis stroke={theme.palette.text.primary} style={{ fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }} />
                <RechartsTooltip contentStyle={{ background: theme.palette.background.default, color: theme.palette.text.primary, borderRadius: 8, boxShadow: '0 4px 24px 0 rgba(30,41,59,0.18)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }} itemStyle={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: 'inherit' }} labelStyle={{ fontWeight: 700, color: theme.palette.secondary.main, fontFamily: 'inherit' }} />
                <Legend wrapperStyle={{ fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }} />
                <Bar dataKey="count" fill={theme.palette.error.main} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        {/* 12. Dashboard Stats */}
        <Grid item xs={12} sm={6} md={6} lg={6} xl={6} sx={{ display: 'flex' }}>
          <Card sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 250,
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}`,
            boxShadow: '0 1.5px 4px 0 rgba(31,41,55,0.07), 0 1.5px 4px 0 rgba(31,41,55,0.13)',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: '0 4px 16px 0 rgba(31,41,55,0.18)',
              borderColor: theme.palette.primary.main,
            },
          }}>
            <Typography variant="h6" mb={2} sx={{ fontWeight: 900, fontFamily: 'inherit', letterSpacing: 0.5 }}>Key Metrics</Typography>
            <Grid container spacing={2} justifyContent="center">
              {Object.entries(dashboardStats).map(([k, v]: [string, any]) => (
                <Grid item key={k}>
                  <Card sx={{ p: 2, minWidth: 120, textAlign: 'center', bgcolor: theme.palette.mode === 'dark' ? '#181f2a' : '#f5f6fa', borderRadius: 2, border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(31,41,55,0.08)'}` }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, fontFamily: 'inherit', letterSpacing: 0.2 }}>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'inherit' }}>{v as number}</Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
