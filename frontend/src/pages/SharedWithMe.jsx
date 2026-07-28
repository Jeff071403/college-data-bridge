import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Card, Button, Chip, Avatar, 
  CircularProgress, Alert, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, CardContent, Divider
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';

import { getMOUs, getMOUSharedDashboard, submitDepartmentMOU } from '../services/mouApi';
import { useSiteTime } from '../context/SiteTimeContext';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SharedWithMe = () => {
  const navigate = useNavigate();
  const [mous, setMous] = useState([]);
  const [stats, setStats] = useState({
    assigned: 0, pending: 0, completed: 0, expiring: 0, recently_shared: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { siteTime, getFormattedSiteDateTime } = useSiteTime();

  // Helper: add months to ISO date string
  const addMonthsToDate = (dateTimeStr, months) => {
    if (!dateTimeStr) return '';
    const datePart = dateTimeStr.split('T')[0];
    const d = new Date(datePart);
    if (isNaN(d.getTime())) return '';
    d.setMonth(d.getMonth() + parseInt(months || 12));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper: validate dates
  const validateDates = (signedStr, expiryStr) => {
    if (!signedStr || !expiryStr) return null;
    const sDatePart = signedStr.split('T')[0];
    const sDate = new Date(sDatePart);
    const eDate = new Date(expiryStr);
    if (eDate <= sDate) {
      return `Validation Error: Validity End Date (${expiryStr}) must be strictly after the Signed Date (${sDatePart}).`;
    }
    return null;
  };

  // Submission Form State
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedMOU, setSelectedMOU] = useState(null);
  const [signedDateTime, setSignedDateTime] = useState('');
  const [durationMonths, setDurationMonths] = useState('12');
  const [expiryDate, setExpiryDate] = useState('');
  const [dateError, setDateError] = useState(null);
  const [alertSuccess, setAlertSuccess] = useState(null);

  const [mouMonth, setMouMonth] = useState(MONTH_OPTIONS[new Date().getMonth()]);
  const [mouYear, setMouYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState('');
  const [purpose, setPurpose] = useState('');
  const [benefits, setBenefits] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const allMOUs = await getMOUs();
      const dashboardStats = await getMOUSharedDashboard();
      
      // Filter MOUs that are shared with the user's department
      const sharedMOUs = allMOUs.filter(m => m.user_share_details !== null);
      
      setMous(sharedMOUs);
      setStats(dashboardStats);
    } catch (err) {
      console.error('Failed to load shared workspace data:', err);
      setError('Could not retrieve sharing workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenUpload = (mou) => {
    setSelectedMOU(mou);
    const nowDt = getFormattedSiteDateTime();
    setSignedDateTime(nowDt);
    const initialDur = String(mou.duration_months || 12);
    setDurationMonths(initialDur);
    const calcExp = addMonthsToDate(nowDt, initialDur);
    setExpiryDate(calcExp);
    setDateError(validateDates(nowDt, calcExp));
    setSummary(mou.summary || '');
    setPurpose(mou.purpose || '');
    setUploadOpen(true);
  };

  const handleSignedDateTimeChange = (val) => {
    setSignedDateTime(val);
    const newExp = addMonthsToDate(val, durationMonths);
    setExpiryDate(newExp);
    setDateError(validateDates(val, newExp));
  };

  const handleDurationChange = (val) => {
    setDurationMonths(val);
    const newExp = addMonthsToDate(signedDateTime, val);
    setExpiryDate(newExp);
    setDateError(validateDates(signedDateTime, newExp));
  };

  const handleExpiryDateChange = (val) => {
    setExpiryDate(val);
    setDateError(validateDates(signedDateTime, val));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setFileError('Only PDF files are allowed.');
        setFile(null);
      } else {
        setFileError(null);
        setFile(selectedFile);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !selectedMOU.signed_mou_details) {
      setFileError('Signed PDF copy is required.');
      return;
    }

    const err = validateDates(signedDateTime, expiryDate);
    if (err) {
      setDateError(err);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('mou_id', selectedMOU.id);
      formData.append('signed_date', signedDateTime.split('T')[0]);
      formData.append('created_at', signedDateTime);
      formData.append('duration_months', durationMonths);
      formData.append('expiry_date', expiryDate);
      formData.append('mou_month', mouMonth);
      formData.append('mou_year', mouYear);
      formData.append('summary', summary);
      formData.append('purpose', purpose);
      formData.append('benefits', benefits);
      formData.append('remarks', remarks);
      if (file) {
        formData.append('file', file);
      }

      const res = await submitDepartmentMOU(formData);
      setUploadOpen(false);
      setFile(null);
      setRemarks('');
      setBenefits('');

      const signedDateOnly = signedDateTime.split('T')[0];
      setAlertSuccess({
        title: '🎉 Signed MOU Uploaded Successfully!',
        message: `Signed MOU for "${selectedMOU.title}" uploaded! MOU Validity calculated: Active from ${signedDateOnly} to ${expiryDate} (${durationMonths} Months). Status updated to Pending Verification.`
      });

      fetchData();
    } catch (err) {
      console.error('Submission failed:', err);
      setError(err.response?.data?.detail || 'Failed to submit execute copy. Please review entries.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (statusName) => {
    let color = 'default';
    let icon = null;

    switch (statusName) {
      case 'Shared':
        color = 'info';
        icon = <ShareIcon sx={{ fontSize: '14px' }} />;
        break;
      case 'Viewed':
        color = 'primary';
        icon = <VisibilityIcon sx={{ fontSize: '14px' }} />;
        break;
      case 'Pending Upload':
        color = 'warning';
        icon = <HourglassEmptyIcon sx={{ fontSize: '14px' }} />;
        break;
      case 'Signed MOU Uploaded':
        color = 'secondary';
        icon = <CloudUploadIcon sx={{ fontSize: '14px' }} />;
        break;
      case 'Completed':
      case 'Verified by Legal Cell':
        color = 'success';
        icon = <DoneAllIcon sx={{ fontSize: '14px' }} />;
        break;
      case 'Rejected':
        color = 'error';
        icon = <CancelIcon sx={{ fontSize: '14px' }} />;
        break;
      default:
        break;
    }

    return (
      <Chip 
        label={statusName} 
        size="small" 
        color={color} 
        icon={icon} 
        sx={{ fontWeight: 800, borderRadius: '8px' }} 
      />
    );
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }} className="animate-fade-slide-up">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'rgba(79,70,229,0.12)', color: 'primary.main', width: 48, height: 48, borderRadius: '16px' }}>
          <ShareIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Department Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Execute shared agreements, manage signed copy submissions, and track legal approvals.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 4.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(59,130,246,0.1)', color: '#3B82F6', width: 50, height: 50 }}>
                <AssignmentIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Assigned MOUs</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{stats.assigned}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B', width: 50, height: 50 }}>
                <HourglassEmptyIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Pending Uploads</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{stats.pending}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', width: 50, height: 50 }}>
                <DoneAllIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Completed Submissions</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{stats.completed}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444', width: 50, height: 50 }}>
                <CalendarTodayIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Expiring Soon</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{stats.expiring}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Table */}
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.01em' }}>
        Assigned Agreements
      </Typography>

      {mous.length === 0 ? (
        <EmptyState
          illustration="folder"
          title="No Active Collaborations"
          description="Your department has not been assigned any active MOU collaboration workspace folders."
        />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>MOU Reference</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Title / Description</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Partner Organization</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Permission Rights</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mous.map((mou) => {
                const shareDetails = mou.user_share_details || { permission: 'View Only', status: 'Shared' };
                const isViewOnly = shareDetails.permission === 'View Only';
                const isCompleted = shareDetails.status === 'Completed' || shareDetails.status === 'Verified by Legal Cell';
                
                return (
                  <TableRow key={mou.id} hover>
                    <TableCell>
                      <Chip label={mou.mou_number} size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(79,70,229,0.08)', color: 'primary.main', borderRadius: '6px' }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{mou.title}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon sx={{ color: 'text.secondary', fontSize: '18px' }} />
                        <Typography variant="body2">{mou.partner_organization}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={shareDetails.permission} variant="outlined" size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>{renderStatusBadge(shareDetails.status)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button 
                          size="small" 
                          startIcon={<VisibilityIcon />} 
                          onClick={() => navigate(`/mou/${mou.id}`)}
                          sx={{ fontWeight: 700 }}
                        >
                          Details
                        </Button>
                        {!isViewOnly && !isCompleted && (
                          <Button 
                            size="small" 
                            variant="contained" 
                            startIcon={<CloudUploadIcon />} 
                            onClick={() => handleOpenUpload(mou)}
                            sx={{ borderRadius: '8px', fontWeight: 700 }}
                          >
                            Upload Signed
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Success Alert Banner */}
      {alertSuccess && (
        <Alert 
          severity="success" 
          onClose={() => setAlertSuccess(null)}
          sx={{ mb: 3, borderRadius: '14px', border: '1px solid #10B981' }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{alertSuccess.title}</Typography>
          <Typography variant="body2">{alertSuccess.message}</Typography>
        </Alert>
      )}

      {/* Submission Dialog */}
      <Dialog 
        open={uploadOpen} 
        onClose={() => setUploadOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          📜 Signed MOU Submission &amp; Validity Calculation
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {selectedMOU && (
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>AGREEMENT TITLE</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800 }}>{selectedMOU.title}</Typography>
              </Box>
            )}

            {/* Date Validation Alert */}
            {dateError && (
              <Alert severity="error" sx={{ borderRadius: '12px' }}>
                {dateError}
              </Alert>
            )}

            {/* Live Validity Summary Card */}
            {!dateError && signedDateTime && expiryDate && (
              <Box sx={{
                bgcolor: 'rgba(124,58,237,0.06)',
                p: 2,
                borderRadius: '14px',
                border: '1px solid rgba(124,58,237,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#7C3AED', fontWeight: 800, letterSpacing: '0.05em' }}>
                    CALCULATED MOU VALIDITY
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3 }}>
                    Active from <strong>{signedDateTime.split('T')[0]}</strong> to <strong>{expiryDate}</strong> ({durationMonths} Months)
                  </Typography>
                </Box>
                <Chip
                  label="✓ Dates Valid"
                  color="success"
                  size="small"
                  sx={{ fontWeight: 800, borderRadius: '8px' }}
                />
              </Box>
            )}

            {/* ── Date & Validity Calculation Controls ── */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: -1 }}>
              1. Execution Date &amp; Validity Duration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Signed Date &amp; Time"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={signedDateTime}
                  onChange={(e) => handleSignedDateTimeChange(e.target.value)}
                  required
                  helperText="Exact timestamp when MOU was signed"
                />
              </Grid>

              <Grid item xs={12} sm={3.5}>
                <FormControl fullWidth required>
                  <InputLabel>Validity Period</InputLabel>
                  <Select
                    value={durationMonths}
                    label="Validity Period"
                    onChange={(e) => handleDurationChange(e.target.value)}
                  >
                    <MenuItem value="6">6 Months</MenuItem>
                    <MenuItem value="12">12 Months (1 Year)</MenuItem>
                    <MenuItem value="24">24 Months (2 Years)</MenuItem>
                    <MenuItem value="36">36 Months (3 Years)</MenuItem>
                    <MenuItem value="60">60 Months (5 Years)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3.5}>
                <TextField
                  label="Validity End Date (Expiry)"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={expiryDate}
                  onChange={(e) => handleExpiryDateChange(e.target.value)}
                  required
                  error={Boolean(dateError)}
                  helperText="Auto-calculated from signed date"
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: -1, mt: 1 }}>
              2. Additional Execution Metadata
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>MOU Month</InputLabel>
                  <Select
                    value={mouMonth}
                    label="MOU Month"
                    onChange={(e) => setMouMonth(e.target.value)}
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="MOU Year"
                  type="number"
                  fullWidth
                  value={mouYear}
                  onChange={(e) => setMouYear(e.target.value)}
                  required
                />
              </Grid>
            </Grid>

            <TextField
              label="Short Summary"
              multiline
              rows={2}
              fullWidth
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Provide a brief summary of the agreed partnership details..."
              required
            />

            <TextField
              label="Purpose of MOU"
              multiline
              rows={2}
              fullWidth
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What is the primary purpose and objective of this agreement?"
              required
            />

            <TextField
              label="Expected Benefits"
              fullWidth
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="e.g. Internships, Placements, Joint Workshops (comma separated)"
              required
            />

            <TextField
              label="Remarks / Upload Notes"
              multiline
              rows={2}
              fullWidth
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any extra notes or remarks (optional)..."
            />

            <Divider />

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>
                Signed MOU Document (PDF Only) *
              </Typography>
              <Button 
                variant="outlined" 
                component="label" 
                startIcon={<CloudUploadIcon />} 
                fullWidth
                sx={{ height: '70px', borderStyle: 'dashed', borderRadius: '14px', borderWidth: 2 }}
              >
                {file ? file.name : 'Choose Signed PDF File'}
                <input 
                  type="file" 
                  hidden 
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
              </Button>
              {fileError && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>{fileError}</Typography>}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setUploadOpen(false)} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting || Boolean(dateError)}
            sx={{
              borderRadius: '10px',
              fontWeight: 700,
              background: dateError ? 'none' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Executed MOU'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SharedWithMe;
