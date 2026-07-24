import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Card, Typography, Button, Divider, 
  CircularProgress, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import { getMOUReports } from '../services/mouApi';

const Reports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMOUReports().then(data => {
      setReports(data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );

  const statusData = [
    { name: 'Active', value: reports?.status_breakdown?.Active || 0, color: '#10B981' },
    { name: 'Pending', value: reports?.status_breakdown?.['Pending Verification'] || 0, color: '#F59E0B' },
    { name: 'Draft', value: reports?.status_breakdown?.Draft || 0, color: '#94A3B8' },
    { name: 'Expired', value: reports?.expired_total || 0, color: '#F43F5E' },
  ];

  const deptData = (reports?.department_breakdown || []).map((d, i) => ({
    name: d.department_name || 'Engineering',
    count: d.total,
    fill: ['#3B82F6', '#14B8A6', '#F59E0B', '#EC4899'][i % 4]
  }));

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total MOUs', reports?.total_mous],
      ['Expiring in 30 Days', reports?.expiring_30_days],
      ['Expiring in 7 Days', reports?.expiring_7_days],
      ['Expired Total', reports?.expired_total],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MOU_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ flexGrow: 1 }} className="animate-fade-slide-up">
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '14px',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <AssessmentIcon />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              MOU Executive Reports & Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Department-wise distribution, status breakdowns, and compliance metrics.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => window.print()} sx={{ borderRadius: '12px', fontWeight: 700 }}>
            Print PDF
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportCSV} sx={{ borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Highlights */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px', borderLeft: '4px solid #4F46E5' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Total MOUs</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5 }}>{reports?.total_mous || 0}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px', borderLeft: '4px solid #10B981' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Active Agreements</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#10B981', mt: 0.5 }}>{reports?.status_breakdown?.Active || 0}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px', borderLeft: '4px solid #F97316' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Expiring in 30 Days</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#F97316', mt: 0.5 }}>{reports?.expiring_30_days || 0}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px', borderLeft: '4px solid #F43F5E' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Expired Total</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#F43F5E', mt: 0.5 }}>{reports?.expired_total || 0}</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Visual Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Department Distribution</Typography>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Status Breakdown</Typography>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                    {statusData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
