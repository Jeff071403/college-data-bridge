import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Grid, Card, CardContent, Typography, Button, IconButton, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, CircularProgress, TextField, MenuItem, Select, FormControl, 
  InputLabel, Chip, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Tooltip, Avatar, ToggleButtonGroup, ToggleButton, Menu
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import DownloadIcon from '@mui/icons-material/Download';
import FolderIcon from '@mui/icons-material/Folder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import PushPinIcon from '@mui/icons-material/PushPin';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutorenewIcon from '@mui/icons-material/Autorenew';

import { getMOUs, getTemplates, submitSignedMOU, renewMOU } from '../services/mouApi';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '../components/SkeletonLoader';

const DEPT_COLORS = {
  'Engineering': '#3B82F6',
  'Medical': '#14B8A6',
  'Commerce': '#F59E0B',
  'Arts': '#EC4899',
  'Science': '#8B5CF6',
  'Law': '#F97316',
};

const getDeptColor = (dept = '') => {
  for (const k of Object.keys(DEPT_COLORS)) {
    if (dept.toLowerCase().includes(k.toLowerCase())) return DEPT_COLORS[k];
  }
  return '#6366F1';
};

const MOURepository = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // Default to Google Drive List View

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState({});

  // Signed MOU Upload Dialog State
  const [signedDialogOpen, setSignedDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [signedDate, setSignedDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState(12);
  const [submittingSigned, setSubmittingSigned] = useState(false);

  // Context Menu
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [contextFolder, setContextFolder] = useState(null);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const data = await getMOUs({
        status: statusFilter,
        type: typeFilter,
        q: searchQuery,
      });
      setFolders(data);
      const tmpls = await getTemplates();
      setTemplates(tmpls);
    } catch (err) {
      console.error('Failed to load MOU folders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [statusFilter, typeFilter, searchQuery]);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenFolder = (folderId) => {
    navigate(`/mou/${folderId}`);
  };

  const handleMenuOpen = (e, folder) => {
    e.stopPropagation();
    setContextFolder(folder);
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setContextFolder(null);
  };

  const calculateExpiryPreview = (sDate, durMonths) => {
    if (!sDate) return 'N/A';
    try {
      const sd = new Date(sDate);
      sd.setMonth(sd.getMonth() + parseInt(durMonths || 12));
      return sd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const handleOpenSignedDialog = (folder) => {
    setSelectedFolder(folder);
    setSignedDate(new Date().toISOString().split('T')[0]);
    setDurationMonths(folder.duration_months || 12);
    setSignedDialogOpen(true);
  };

  const handleSubmitSigned = async () => {
    if (!selectedFolder) return;
    setSubmittingSigned(true);
    try {
      await submitSignedMOU(selectedFolder.id, {
        signed_date: signedDate,
        duration_months: durationMonths,
      });
      setSignedDialogOpen(false);
      fetchFolders();
    } catch (err) {
      console.error('Signed upload failed:', err);
    } finally {
      setSubmittingSigned(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Folder Name', 'Department', 'Partner Organization', 'Status', 'Signed Date', 'Expiry Date', 'Remaining Days', 'Owner'];
    const rows = folders.map(f => [
      `"${f.title}"`, `"${f.department_name || ''}"`, `"${f.partner_organization}"`,
      `"${f.status}"`, `"${f.signed_date || ''}"`, `"${f.expiry_date || ''}"`,
      `"${f.days_left !== null ? f.days_left : 'N/A'}"`, `"${f.created_by_details?.name || 'System'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MOU_Folder_Repository_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ flexGrow: 1 }} className="animate-fade-slide-up">

      {/* ── Page Header ── */}
      <Box sx={{ mb: 3.5, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
            MOU Folder Repository
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Navigate institutional organization folders, inspect compliance files, and manage MOU lifecycles.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={exportCSV}
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: '12px', fontWeight: 700 }}
          >
            Export Directory CSV
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate('/mou/create')}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: '12px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              boxShadow: '0 6px 20px rgba(79,70,229,0.3)'
            }}
          >
            + Create MOU Folder
          </Button>
        </Box>
      </Box>

      {/* ── Search & Filter Controls ── */}
      <Card sx={{ p: 2, mb: 3.5, borderRadius: '18px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search folders by company, department, coordinator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={6} sm={3} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Folder Status</InputLabel>
              <Select
                value={statusFilter}
                label="Folder Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Pending Verification">Pending Verification</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Expired">Expired</MenuItem>
                <MenuItem value="Renewed">Renewed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Template Schema</InputLabel>
              <Select
                value={typeFilter}
                label="Template Schema"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Templates</MenuItem>
                {templates.map(t => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, val) => val && setViewMode(val)}
              size="small"
            >
              <ToggleButton value="list" title="Google Drive List View"><ViewListIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="grid" title="Grid View"><GridViewIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Card>

      {/* ── Main Folder Repository View (List or Grid) ── */}
      {loading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Grid item xs={12} sm={6} md={4} key={n}>
              <Skeleton height={140} radius={18} />
            </Grid>
          ))}
        </Grid>
      ) : folders.length === 0 ? (
        <EmptyState
          illustration="file"
          title="No MOU Folders Found"
          description="No organizational folders match your current search query or status filter."
          action="+ Create MOU Folder"
          onAction={() => navigate('/mou/create')}
        />
      ) : viewMode === 'list' ? (
        /* ── Google Drive Style Table / List View ── */
        <TableContainer component={Paper} sx={{ borderRadius: '20px', boxShadow: 'none', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 1.8 }}>Folder Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Partner Organization</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Signed Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Expiry Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remaining Days</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Owner</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, pr: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {folders.map((folder) => {
                const color = getDeptColor(folder.department_name || '');
                const daysLeft = folder.days_left;
                return (
                  <TableRow
                    key={folder.id}
                    hover
                    onDoubleClick={() => handleOpenFolder(folder.id)}
                    sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <IconButton size="small" onClick={(e) => toggleFavorite(folder.id, e)} sx={{ p: 0.2 }}>
                          {favorites[folder.id] ? <StarIcon sx={{ color: '#F59E0B', fontSize: '1.1rem' }} /> : <StarBorderIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />}
                        </IconButton>

                        <FolderIcon sx={{ color: color, fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />

                        <Box sx={{ overflow: 'hidden' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.88rem' }} noWrap>
                            {folder.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {folder.mou_number}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip label={folder.department_name || 'Engineering'} size="small" sx={{ bgcolor: `${color}15`, color: color, fontWeight: 800, fontSize: '0.7rem', borderRadius: '8px' }} />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem' }}>
                        {folder.partner_organization}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <StatusPill status={folder.status} />
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {folder.signed_date || '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: daysLeft !== null && daysLeft <= 30 ? 'error.main' : 'text.primary' }}>
                        {folder.expiry_date || '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {daysLeft !== null ? (
                        <Chip
                          label={daysLeft < 0 ? 'Expired' : `${daysLeft}d`}
                          size="small"
                          color={daysLeft <= 30 ? (daysLeft <= 7 ? 'error' : 'warning') : 'success'}
                          sx={{ fontWeight: 800, height: 20, fontSize: '0.7rem' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {folder.created_by_details?.name || 'System'}
                      </Typography>
                    </TableCell>

                    <TableCell align="right" sx={{ pr: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Button
                          size="small"
                          startIcon={<FolderOpenIcon />}
                          onClick={() => handleOpenFolder(folder.id)}
                          sx={{ fontWeight: 700, borderRadius: '8px' }}
                        >
                          Open
                        </Button>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, folder)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* ── Grid View ── */
        <Grid container spacing={2.5}>
          {folders.map((folder, idx) => {
            const color = getDeptColor(folder.department_name || '');
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
                <Card
                  className="card-lift"
                  onDoubleClick={() => handleOpenFolder(folder.id)}
                  sx={{
                    p: 2.5,
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: `4px solid ${color}`,
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    position: 'relative',
                    animation: `slideUp 0.3s ease ${idx * 40}ms both`
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <FolderIcon sx={{ color: color, fontSize: 44 }} />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={(e) => toggleFavorite(folder.id, e)}>
                        {favorites[folder.id] ? <StarIcon sx={{ color: '#F59E0B', fontSize: '1.1rem' }} /> : <StarBorderIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />}
                      </IconButton>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, folder)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.92rem', mb: 0.5 }} noWrap>
                    {folder.title}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    {folder.partner_organization} • {folder.department_name || 'Engineering'}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <StatusPill status={folder.status} />
                    <Button size="small" onClick={() => handleOpenFolder(folder.id)} sx={{ fontWeight: 700 }}>
                      Open
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Context Menu for Folders */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: '14px', minWidth: 160 } }}
      >
        <MenuItem onClick={() => { handleOpenFolder(contextFolder?.id); handleMenuClose(); }}>
          Open Folder Details
        </MenuItem>
        <MenuItem onClick={() => { handleOpenSignedDialog(contextFolder); handleMenuClose(); }}>
          Upload Signed Copy
        </MenuItem>
        <MenuItem onClick={() => { renewMOU(contextFolder?.id); handleMenuClose(); }}>
          Execute One-Click Renewal
        </MenuItem>
      </Menu>

      {/* Dialog: Signed Document Upload & Live Expiry Calculator */}
      <Dialog
        open={signedDialogOpen}
        onClose={() => setSignedDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Upload Signed MOU Document</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Upload the scanned executed agreement, signed date, and summary. The system will calculate the Expiry Date automatically.
          </Typography>

          {/* 1. Scanned Signed File Upload Box */}
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: '14px',
              p: 2.5,
              textAlign: 'center',
              bgcolor: 'rgba(79, 70, 229, 0.04)',
              mb: 2
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 36, color: 'primary.main', mb: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
              Upload Scanned Signed MOU Copy
            </Typography>
            <Button variant="outlined" size="small" component="label" sx={{ mt: 1, borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem' }}>
              Choose File
              <input type="file" hidden accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
            </Button>
          </Box>

          {/* 2. Signed Date Picker */}
          <TextField
            fullWidth
            type="date"
            label="Signed Date"
            value={signedDate}
            onChange={(e) => setSignedDate(e.target.value)}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            helperText="Defaults to today's date, fully editable"
          />

          <TextField
            fullWidth
            label="Duration (Months - Read Only)"
            value={`${durationMonths} Months`}
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />

          {/* Live Expiry Preview */}
          <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
              Live Calculated Expiry Date
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#10B981' }}>
              {calculateExpiryPreview(signedDate, durationMonths)}
            </Typography>
          </Box>

          {/* 3. Short Summary */}
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Agreement Short Summary"
            placeholder="Brief summary of the signed agreement..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSignedDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitSigned} disabled={submittingSigned} sx={{ borderRadius: '12px', fontWeight: 700 }}>
            {submittingSigned ? 'Uploading...' : 'Submit & Verify'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MOURepository;
