import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, Typography, Button, Divider,
  CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Avatar, LinearProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BusinessIcon from '@mui/icons-material/Business';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';
import { getMOUReports } from '../services/mouApi';

/* ── Custom tooltip for bar chart ─────────────────── */
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '10px', p: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.8rem', color: '#4F46E5', fontWeight: 800 }}>{payload[0].value} MOUs</Typography>
    </Box>
  );
};

/* ── Custom tooltip for pie chart ─────────────────── */
const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '10px', p: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: payload[0].payload.color }}>{payload[0].name}</Typography>
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>{payload[0].value} MOUs</Typography>
    </Box>
  );
};

/* ── Stat card ────────────────────────────────────── */
const StatCard = ({ label, value, icon, gradient, lightBg, textColor, sub }) => (
  <Card sx={{
    p: 0, borderRadius: '20px', overflow: 'hidden',
    border: '1px solid', borderColor: 'divider', boxShadow: 'none',
    transition: 'transform 0.22s ease, box-shadow 0.22s ease',
    '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 10px 30px ${textColor}22` },
  }}>
    {/* Gradient top strip */}
    <Box sx={{ height: 5, background: gradient }} />
    <Box sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'text.secondary', mb: 0.5 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: '2.6rem', fontWeight: 900, lineHeight: 1, color: textColor }}>
            {value}
          </Typography>
          {sub && (
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.75, fontWeight: 500 }}>
              {sub}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: lightBg, color: textColor, width: 46, height: 46, borderRadius: '14px' }}>
          {icon}
        </Avatar>
      </Box>
    </Box>
  </Card>
);

/* ─────────────────────────────────────────────────── */
const Reports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMOUReports().then(data => { setReports(data); setLoading(false); });
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 14, gap: 2 }}>
      <CircularProgress size={48} thickness={4} />
      <Typography variant="body2" color="text.secondary">Loading analytics…</Typography>
    </Box>
  );

  const totalMous   = reports?.total_mous || 0;
  const active      = reports?.status_breakdown?.Active || 0;
  const expiring30  = reports?.expiring_30_days || 0;
  const expiring7   = reports?.expiring_7_days || 0;
  const expired     = reports?.expired_total || 0;
  const pending     = reports?.status_breakdown?.['Pending Verification'] || 0;
  const draft       = reports?.status_breakdown?.Draft || 0;

  const statusData = [
    { name: 'Active',   value: active,   color: '#10B981' },
    { name: 'Pending',  value: pending,  color: '#F59E0B' },
    { name: 'Draft',    value: draft,    color: '#94A3B8' },
    { name: 'Expired',  value: expired,  color: '#F43F5E' },
  ];

  const BAR_COLORS = ['#4F46E5', '#14B8A6', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6'];
  const deptData = (reports?.department_breakdown || []).map((d, i) => ({
    name: d.department_name || `Dept ${i + 1}`,
    count: d.total,
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }));

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total MOUs', totalMous],
      ['Active', active],
      ['Expiring in 30 Days', expiring30],
      ['Expiring in 7 Days', expiring7],
      ['Expired Total', expired],
      ['Pending Verification', pending],
      ['Draft', draft],
    ];
    const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `MOU_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ flexGrow: 1 }} className="animate-fade-slide-up">

      {/* ── Page Header ─────────────────────────────── */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            width: 52, height: 52, borderRadius: '16px',
            boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
          }}>
            <AssessmentIcon sx={{ fontSize: '1.6rem' }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
              MOU Executive Reports
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
              Department-wise distribution, status breakdowns &amp; compliance metrics
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ borderRadius: '24px', fontWeight: 700, px: 2.5, borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: 'primary.main' } }}
          >
            Print PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportCSV}
            sx={{ borderRadius: '24px', fontWeight: 700, px: 2.5, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 4px 14px rgba(79,70,229,0.3)', '&:hover': { boxShadow: '0 6px 20px rgba(79,70,229,0.4)' } }}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* ── Stat Cards ──────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Total MOUs" value={totalMous}
            icon={<GavelIcon />}
            gradient="linear-gradient(90deg, #4F46E5, #7C3AED)"
            lightBg="rgba(79,70,229,0.1)" textColor="#4F46E5"
            sub="All registered agreements"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Active Agreements" value={active}
            icon={<CheckCircleIcon />}
            gradient="linear-gradient(90deg, #10B981, #059669)"
            lightBg="rgba(16,185,129,0.1)" textColor="#10B981"
            sub={`${totalMous > 0 ? Math.round((active / totalMous) * 100) : 0}% of total`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Expiring in 30 Days" value={expiring30}
            icon={<WarningAmberIcon />}
            gradient="linear-gradient(90deg, #F97316, #F59E0B)"
            lightBg="rgba(249,115,22,0.1)" textColor="#F97316"
            sub={expiring7 > 0 ? `${expiring7} expiring this week` : 'None this week'}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Expired Total" value={expired}
            icon={<CancelIcon />}
            gradient="linear-gradient(90deg, #F43F5E, #E11D48)"
            lightBg="rgba(244,63,94,0.1)" textColor="#F43F5E"
            sub="Require renewal action"
          />
        </Grid>
      </Grid>

      {/* ── Quick Stats Row ─────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {[
          { label: 'Pending Verification', value: pending, color: '#F59E0B', pct: totalMous > 0 ? (pending / totalMous) * 100 : 0 },
          { label: 'Draft', value: draft, color: '#94A3B8', pct: totalMous > 0 ? (draft / totalMous) * 100 : 0 },
          { label: 'Expiring in 7 Days', value: expiring7, color: '#EF4444', pct: totalMous > 0 ? (expiring7 / totalMous) * 100 : 0 },
        ].map(({ label, value, color, pct }) => (
          <Grid item xs={12} sm={4} key={label}>
            <Card sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</Typography>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color }}>{value}</Typography>
              </Box>
              <LinearProgress
                variant="determinate" value={Math.min(pct, 100)}
                sx={{ borderRadius: 4, height: 6, bgcolor: `${color}20`, '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 } }}
              />
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 0.8 }}>
                {pct.toFixed(1)}% of total agreements
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Charts ──────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Bar Chart */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>Department Distribution</Typography>
                <Typography variant="caption" color="text.secondary">MOUs by department</Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(79,70,229,0.08)', color: 'primary.main', borderRadius: '10px', width: 36, height: 36 }}>
                <BusinessIcon fontSize="small" />
              </Avatar>
            </Box>
            {deptData.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, color: 'text.disabled' }}>
                <Typography>No department data available</Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {deptData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>Status Breakdown</Typography>
                <Typography variant="caption" color="text.secondary">Agreement lifecycle stages</Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(16,185,129,0.08)', color: '#10B981', borderRadius: '10px', width: 36, height: 36 }}>
                <TrendingUpIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box sx={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={82}
                    paddingAngle={3} dataKey="value"
                    strokeWidth={0}
                  >
                    {statusData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            {/* Custom legend */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5, justifyContent: 'center' }}>
              {statusData.map(({ name, value, color }) => (
                <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                    {name} <strong style={{ color: 'text.primary' }}>({value})</strong>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Department Breakdown Table ───────────────── */}
      {deptData.length > 0 && (
        <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>Department Breakdown</Typography>
              <Typography variant="caption" color="text.secondary">Detailed MOU counts by department</Typography>
            </Box>
            <Chip label={`${deptData.length} departments`} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(79,70,229,0.08)', color: 'primary.main' }} />
          </Box>
          <Divider />
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, py: 1.5, color: 'text.secondary', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5, color: 'text.secondary', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, py: 1.5, color: 'text.secondary', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MOUs</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5, color: 'text.secondary', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Share</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deptData.map((row, idx) => {
                  const pct = totalMous > 0 ? (row.count / totalMous) * 100 : 0;
                  return (
                    <TableRow key={row.name} hover>
                      <TableCell sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.8rem' }}>{String(idx + 1).padStart(2, '0')}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: row.fill, flexShrink: 0 }} />
                          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{row.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={row.count} size="small" sx={{ fontWeight: 800, bgcolor: `${row.fill}15`, color: row.fill, minWidth: 40 }} />
                      </TableCell>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <LinearProgress
                            variant="determinate" value={Math.min(pct, 100)}
                            sx={{ flex: 1, borderRadius: 4, height: 6, bgcolor: `${row.fill}20`, '& .MuiLinearProgress-bar': { bgcolor: row.fill, borderRadius: 4 } }}
                          />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', minWidth: 38, textAlign: 'right' }}>
                            {pct.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
};

export default Reports;
