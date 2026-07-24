import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, Avatar, 
  CircularProgress, Button, Divider, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, IconButton, Tooltip, LinearProgress
} from '@mui/material';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningIcon from '@mui/icons-material/Warning';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import StorageIcon from '@mui/icons-material/Storage';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PaletteIcon from '@mui/icons-material/Palette';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FilePreviewModal from '../components/FilePreviewModal';
import StatusPill from '../components/StatusPill';

/* ─── Helpers ────────────────────────────────────────────────── */
const fmtBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const pct = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

/* Department Colors Map */
const DEPT_CONFIG = {
  'Engineering': { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', icon: <SchoolIcon /> },
  'Medical': { color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.12)', icon: <LocalHospitalIcon /> },
  'Commerce': { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', icon: <BusinessCenterIcon /> },
  'Arts': { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', icon: <PaletteIcon /> },
  'Default': { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', icon: <FolderIcon /> },
};

const getDeptStyle = (name = '') => {
  for (const k of Object.keys(DEPT_CONFIG)) {
    if (name.toLowerCase().includes(k.toLowerCase())) return DEPT_CONFIG[k];
  }
  return DEPT_CONFIG.Default;
};

/* ── Animated Count Up ── */
const CountUp = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count}</span>;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [checkedPopup, setCheckedPopup] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/dashboard/stats/');
      setStats(res.data);
      const unread = res.data.latest_notifications || [];
      if (unread.length > 0 && !checkedPopup) { 
        setShowPopup(true); 
        setCheckedPopup(true); 
      }
    } catch (err) {
      console.error('Dashboard stats failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
      <CircularProgress sx={{ color: 'primary.main' }} />
    </Box>
  );

  const storage = stats?.storage || {};
  const diskTotal = storage.disk_total_bytes || 0;
  const diskUsed = storage.disk_used_bytes || 0;
  const diskFree = storage.disk_free_bytes || 0;
  const breakdown = storage.breakdown || {};

  const recentUploads = stats?.recent_uploads || [];
  const recentFolders = stats?.recent_folders || [];

  // Chart Mock Data for Trends & Distributions
  const trendData = [
    { month: 'Jan', Active: 12, Pending: 4, Expiring: 2 },
    { month: 'Feb', Active: 15, Pending: 6, Expiring: 3 },
    { month: 'Mar', Active: 18, Pending: 5, Expiring: 1 },
    { month: 'Apr', Active: 24, Pending: 8, Expiring: 4 },
    { month: 'May', Active: 28, Pending: 9, Expiring: 5 },
    { month: 'Jun', Active: 35, Pending: 7, Expiring: 2 },
  ];

  const distributionData = [
    { name: 'Engineering', value: 42, color: '#3B82F6' },
    { name: 'Medical', value: 25, color: '#14B8A6' },
    { name: 'Commerce', value: 18, color: '#F59E0B' },
    { name: 'Arts', value: 15, color: '#EC4899' },
  ];

  const getFileIcon = (ft) => {
    if (!ft) return { icon: <InsertDriveFileIcon />, color: '#64748b', bg: 'rgba(100,116,139,0.12)' };
    if (ft.includes('pdf')) return { icon: <PictureAsPdfIcon />, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
    if (ft.includes('image')) return { icon: <ImageIcon />, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
    if (ft.includes('word') || ft.includes('doc')) return { icon: <DescriptionIcon />, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' };
    if (ft.includes('sheet') || ft.includes('xls')) return { icon: <TableChartIcon />, color: '#10B981', bg: 'rgba(16,185,129,0.12)' };
    if (ft.includes('presentation') || ft.includes('ppt')) return { icon: <SlideshowIcon />, color: '#F97316', bg: 'rgba(249,115,22,0.12)' };
    if (ft.includes('video')) return { icon: <VideoFileIcon />, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' };
    if (ft.includes('audio')) return { icon: <AudiotrackIcon />, color: '#EC4899', bg: 'rgba(236,72,153,0.12)' };
    return { icon: <InsertDriveFileIcon />, color: '#64748b', bg: 'rgba(100,116,139,0.12)' };
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }} className="animate-fade-slide-up">

      {/* ── Top Header Hero Banner ── */}
      <Box 
        sx={{ 
          p: { xs: 2.5, md: 3.5 }, 
          mb: 4, 
          borderRadius: '24px', 
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.95) 0%, rgba(124, 58, 237, 0.9) 100%)',
          color: '#fff',
          boxShadow: '0 12px 32px -4px rgba(79, 70, 229, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
              Welcome back, {user?.name || 'Administrator'}! 👋
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 600, fontSize: '0.92rem' }}>
              MOU Lifecycle & Executive Document Hub. Track agreements, monitor compliance, and review pending departmental sign-offs.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/explorer')}
              sx={{
                bgcolor: '#ffffff',
                color: '#4F46E5',
                fontWeight: 700,
                px: 2.5,
                py: 1.2,
                borderRadius: '14px',
                '&:hover': { bgcolor: '#f8fafc', transform: 'translateY(-2px)' }
              }}
              startIcon={<CloudUploadIcon />}
            >
              Upload Document
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/system-map')}
              sx={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: '#ffffff',
                fontWeight: 700,
                px: 2.5,
                py: 1.2,
                borderRadius: '14px',
                '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
              startIcon={<InfoOutlinedIcon />}
            >
              Lifecycle Guide
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Stat Highlights Bar (4 Distinct Colored Glowing Cards) ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {[
          { title: 'Active MOUs', count: stats?.total_files || 42, label: 'Fully Verified & Active', color: '#10B981', glow: 'card-glow-active', icon: <CheckCircleIcon />, bg: 'rgba(16, 185, 129, 0.12)', border: 'border-accent-emerald' },
          { title: 'Pending Approval', count: 7, label: 'Requires Admin Verification', color: '#F59E0B', glow: 'card-glow-pending', icon: <HourglassTopIcon />, bg: 'rgba(245, 158, 11, 0.12)', border: 'border-accent-amber' },
          { title: 'Expiring Soon', count: 3, label: 'Expires within 30 Days', color: '#F97316', glow: 'card-glow-expiring', icon: <WarningIcon />, bg: 'rgba(249, 115, 22, 0.12)', border: 'border-accent-orange' },
          { title: 'Total Repositories', count: stats?.total_folders || 18, label: 'Department Folders', color: '#4F46E5', glow: 'card-glow-primary', icon: <AssignmentIcon />, bg: 'rgba(79, 70, 229, 0.12)', border: 'border-accent-indigo' },
        ].map((item, idx) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Card 
              className={`animate-slide-up ${item.border} ${item.glow}`}
              sx={{ 
                p: 2.5, 
                borderRadius: '20px', 
                animationDelay: `${idx * 80}ms`,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'background.paper'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem' }}>
                    {item.title}
                  </Typography>
                  <Tooltip title="Hover to explain: Click to filter records by status">
                    <Typography variant="h3" sx={{ fontWeight: 900, color: item.color, mt: 0.5, letterSpacing: '-0.02em' }}>
                      <CountUp end={item.count} />
                    </Typography>
                  </Tooltip>
                </Box>
                <Avatar sx={{ bgcolor: item.bg, color: item.color, width: 46, height: 46, borderRadius: '14px' }}>
                  {item.icon}
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                {item.label}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Main Layout: Left Column & Right Widgets ── */}
      <Grid container spacing={3}>
        
        {/* ═══════════════ LEFT COLUMN (Charts, Folders, Table) ═══════════════ */}
        <Grid item xs={12} lg={8.5}>

          {/* ── Interactive Recharts Analytics ── */}
          <Card sx={{ p: 3, mb: 3.5, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }} className="section-header-gradient">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>MOU Execution & Growth Trend</Typography>
              </Box>
              <Chip label="2026 Overview" size="small" sx={{ bgcolor: 'rgba(79,70,229,0.1)', color: 'primary.main', fontWeight: 700 }} />
            </Box>
            
            <Box sx={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }} />
                  <Area type="monotone" dataKey="Active" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                  <Area type="monotone" dataKey="Pending" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorPending)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          {/* ── Department Repositories (Colored Signature Cards) ── */}
          <Box sx={{ mb: 3.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>Department Repositories</Typography>
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/explorer')} sx={{ fontWeight: 700 }}>
                View All
              </Button>
            </Box>

            {recentFolders.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No department folders found.</Typography>
            ) : (
              <Grid container spacing={2}>
                {recentFolders.map((folder, i) => {
                  const style = getDeptStyle(folder.name);
                  return (
                    <Grid item xs={6} sm={3} key={folder.id}>
                      <Card
                        onClick={() => navigate(`/explorer?folder=${folder.id}`)}
                        className="card-lift"
                        sx={{
                          p: 2.2,
                          borderRadius: '18px',
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderLeft: `4px solid ${style.color}`,
                          bgcolor: 'background.paper',
                          textAlign: 'center',
                          transition: 'all 0.25s ease',
                          '&:hover': {
                            bgcolor: style.bg,
                            borderColor: style.color
                          }
                        }}
                      >
                        <Avatar sx={{ bgcolor: style.bg, color: style.color, mx: 'auto', mb: 1.2, width: 44, height: 44, borderRadius: '12px' }}>
                          {style.icon}
                        </Avatar>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }} noWrap>
                          {folder.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', display: 'block', mt: 0.3 }}>
                          {folder.file_count ?? 0} Documents
                        </Typography>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>

          {/* ── Recent Organizational MOU Folders ── */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>Recent Organizational MOU Folders</Typography>
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/mou-repository')} sx={{ fontWeight: 700 }}>
                View Folder Directory
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: '18px', boxShadow: 'none', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Folder Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Owner</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, pr: 2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentFolders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No recent organizational folders available.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentFolders.map((folder) => {
                      const style = getDeptStyle(folder.name);
                      return (
                        <TableRow
                          key={folder.id}
                          hover
                          onClick={() => navigate(`/explorer?folder=${folder.id}`)}
                          sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                        >
                          <TableCell sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <FolderIcon sx={{ color: style.color, fontSize: 26 }} />
                              <Box sx={{ overflow: 'hidden' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem' }} noWrap>
                                  {folder.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                  {folder.file_count ?? 0} Files
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={folder.name.split(' ')[0]} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: '0.7rem' }} />
                          </TableCell>
                          <TableCell>
                            <StatusPill status="Active" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {folder.created_by?.name || 'System Admin'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ pr: 2 }}>
                            <Button size="small" onClick={() => navigate(`/explorer?folder=${folder.id}`)} sx={{ fontWeight: 700 }}>
                              Open Folder
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Grid>

        {/* ═══════════════ RIGHT COLUMN (Distribution & Storage) ═══════════════ */}
        <Grid item xs={12} lg={3.5}>

          {/* ── Category / Department Distribution Pie Chart ── */}
          <Card sx={{ p: 2.5, mb: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Department Distribution
            </Typography>
            <Box sx={{ width: '100%', height: 180, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1 }}>
              {distributionData.map((item) => (
                <Chip
                  key={item.name}
                  label={`${item.name} (${item.value}%)`}
                  size="small"
                  sx={{ bgcolor: `${item.color}15`, color: item.color, fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }}
                />
              ))}
            </Box>
          </Card>

          {/* ── System Storage Widget ── */}
          <Card sx={{ p: 2.5, mb: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Server Storage</Typography>
              <StorageIcon sx={{ color: 'primary.main' }} />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Disk Usage</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {fmtBytes(diskUsed)} / {fmtBytes(diskTotal)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={pct(diskUsed, diskTotal) || 25}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(79, 70, 229, 0.12)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
                    borderRadius: 4
                  }
                }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Quick Upload CTA */}
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/explorer')}
              sx={{
                py: 1.2,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                fontWeight: 700,
                boxShadow: '0 6px 20px rgba(79,70,229,0.3)',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
              startIcon={<CloudUploadIcon />}
            >
              Upload New MOU
            </Button>
          </Card>

        </Grid>
      </Grid>

      {/* File Preview Modal */}
      <FilePreviewModal
        open={Boolean(previewFile)}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onRefresh={fetchStats}
      />

    </Box>
  );
};

export default Dashboard;
