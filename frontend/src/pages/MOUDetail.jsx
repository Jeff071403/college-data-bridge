import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Grid, Card, CardContent, Typography, Button, IconButton, 
  Chip, Divider, Avatar, CircularProgress, Alert, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Checkbox, 
  FormControlLabel, FormGroup, Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import FolderIcon from '@mui/icons-material/Folder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckIcon from '@mui/icons-material/Check';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';

import { getMOU, approveRejectMOU, renewMOU, submitSignedMOU } from '../services/mouApi';
import { useAuth } from '../context/AuthContext';
import StatusPill from '../components/StatusPill';

const TIMELINE_STEPS = [
  { key: 'Folder Created', label: 'Folder Created', desc: 'MOU Organization Folder created' },
  { key: 'Original Uploaded', label: 'Original Uploaded', desc: 'Initial draft MOU document attached' },
  { key: 'Shared', label: 'Shared with Department', desc: 'Distributed to department coordinators' },
  { key: 'Signed Uploaded', label: 'Signed MOU Uploaded', desc: 'Executed signed document submitted' },
  { key: 'Approved', label: 'Approved & Active', desc: 'Verified by legal compliance' },
  { key: 'Renewed', label: 'Renewed', desc: 'Agreement extended into new term' },
];

const BENEFICIARY_OPTIONS = ['Students', 'Faculty', 'Researchers', 'Institution', 'Others'];
const OPPORTUNITY_OPTIONS = ['Internship', 'Placement', 'Workshop', 'Training', 'Industrial Visit', 'Research', 'Student Exchange', 'Consultancy', 'Guest Lecture', 'Others'];

const MOUDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mou, setMou] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Department User Upload Signed State
  const [signedUploadOpen, setSignedUploadOpen] = useState(false);
  const [signedDate, setSignedDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState(12);
  const [summary, setSummary] = useState('');
  const [purpose, setPurpose] = useState('');
  const [objectives, setObjectives] = useState('');
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState(['Students', 'Faculty']);
  const [selectedOpportunities, setSelectedOpportunities] = useState(['Internship', 'Placement']);
  const [submittingSigned, setSubmittingSigned] = useState(false);

  // Admin Approval Dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState('approve');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchMou = async () => {
    setLoading(true);
    try {
      const data = await getMOU(id);
      setMou(data);
      setSignedDate(data.signed_date || new Date().toISOString().split('T')[0]);
      setDurationMonths(data.duration_months || 12);
      setSummary(data.summary || '');
      setPurpose(data.purpose || '');
      setObjectives(data.objectives || '');
      if (data.beneficiaries?.length) setSelectedBeneficiaries(data.beneficiaries);
      if (data.opportunities?.length) setSelectedOpportunities(data.opportunities);
    } catch (err) {
      console.error('Failed to load folder details:', err);
      setError('MOU Folder not found or permission denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMou();
  }, [id]);

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

  const handleSubmitSigned = async () => {
    setSubmittingSigned(true);
    try {
      await submitSignedMOU(id, {
        signed_date: signedDate,
        duration_months: durationMonths,
        summary,
        purpose,
        objectives,
        beneficiaries: selectedBeneficiaries,
        opportunities: selectedOpportunities,
      });
      setSignedUploadOpen(false);
      fetchMou();
    } catch (err) {
      console.error('Submit signed failed:', err);
    } finally {
      setSubmittingSigned(false);
    }
  };

  const handleApproveReject = async () => {
    setProcessing(true);
    try {
      await approveRejectMOU(id, approvalAction, remarks);
      setApproveDialogOpen(false);
      fetchMou();
    } catch (err) {
      console.error('Approval action failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRenew = async () => {
    if (window.confirm('Execute One-Click Renewal for this MOU Folder?')) {
      try {
        const renewed = await renewMOU(id, 'Renewed from folder details page.');
        navigate(`/mou/${renewed.id}`);
      } catch (err) {
        console.error('Renewal failed:', err);
      }
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );

  if (error || !mou) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Alert severity="error" sx={{ mb: 2 }}>{error || 'Folder not found.'}</Alert>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/mou-repository')}>
        Back to Repository
      </Button>
    </Box>
  );

  const daysLeft = mou.days_left;
  const isAdmin = user?.role?.name === 'Super Admin' || user?.role?.name === 'Admin' || user?.role?.name === 'Lawyer / MOU Administrator';

  return (
    <Box sx={{ flexGrow: 1 }} className="animate-fade-slide-up">
      
      {/* ── Back Navigation ── */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/mou-repository')}
          sx={{ fontWeight: 700, color: 'text.secondary' }}
        >
          Back to Folder Repository
        </Button>
      </Box>

      {/* ── Folder Details Header ── */}
      <Card sx={{ p: 3.5, mb: 3.5, borderRadius: '24px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
            <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: 'primary.main', width: 64, height: 64, borderRadius: '18px' }}>
              <FolderIcon sx={{ fontSize: 38 }} />
            </Avatar>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                <Chip label={mou.mou_number} sx={{ fontWeight: 800, bgcolor: 'rgba(79,70,229,0.1)', color: 'primary.main', borderRadius: '8px' }} />
                <StatusPill status={mou.status} size="medium" />
                {daysLeft !== null && (
                  <Chip
                    label={daysLeft < 0 ? 'Expired' : `${daysLeft} Days Remaining`}
                    color={daysLeft <= 30 ? 'error' : 'success'}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                )}
              </Box>

              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
                Folder: {mou.title}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, color: 'text.secondary', mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Partner: <strong>{mou.partner_organization}</strong>
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Department: <strong>{mou.department_name || 'Engineering'}</strong>
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Owner: <strong>{mou.created_by_details?.name || 'System'}</strong>
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Department Upload Signed Copy */}
            {(!isAdmin || mou.status === 'Draft' || mou.status === 'Shared') && (
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={() => setSignedUploadOpen(true)}
                sx={{ borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
              >
                Upload Signed Copy
              </Button>
            )}

            {/* Admin Verification Actions */}
            {isAdmin && mou.status === 'Pending Verification' && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => { setApprovalAction('approve'); setApproveDialogOpen(true); }}
                  sx={{ borderRadius: '12px', fontWeight: 700 }}
                >
                  Approve MOU Folder
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => { setApprovalAction('reject'); setApproveDialogOpen(true); }}
                  sx={{ borderRadius: '12px', fontWeight: 700 }}
                >
                  Reject / Request Changes
                </Button>
              </>
            )}

            {(mou.status === 'Active' || mou.status === 'Expired') && (
              <Button
                variant="contained"
                onClick={handleRenew}
                startIcon={<AutorenewIcon />}
                sx={{ borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
              >
                One-Click Renewal
              </Button>
            )}
          </Box>
        </Box>
      </Card>

      <Grid container spacing={3}>
        {/* ═══════════════ LEFT COLUMN (Summary, Purpose, Beneficiaries, Documents) ═══════════════ */}
        <Grid item xs={12} md={8}>

          {/* Summary Section */}
          <Card sx={{ p: 3, mb: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
              Folder Summary
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
              {mou.summary || 'No summary entered yet.'}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Purpose of Agreement
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
              {mou.purpose || 'No purpose detailed.'}
            </Typography>
          </Card>

          {/* Checkbox Summary: Beneficiaries & Opportunities */}
          <Card sx={{ p: 3, mb: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Target Beneficiaries & Opportunities
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
              Beneficiaries
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
              {(mou.beneficiaries || []).map((b, i) => (
                <Chip key={i} label={b} size="small" icon={<CheckIcon fontSize="small" />} sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: '#10B981', fontWeight: 800 }} />
              ))}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
              Opportunities
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(mou.opportunities || []).map((o, i) => (
                <Chip key={i} label={o} size="small" icon={<CheckIcon fontSize="small" />} sx={{ bgcolor: 'rgba(79,70,229,0.12)', color: '#4F46E5', fontWeight: 800 }} />
              ))}
            </Box>
          </Card>

          {/* Documents Section */}
          <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Folder Documents & Files
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ p: 2, borderRadius: '14px', bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <DescriptionIcon sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Original Draft MOU</Typography>
                    <Typography variant="caption" color="text.secondary">Uploaded by Administrator</Typography>
                  </Box>
                </Box>
                {mou.original_mou_details?.file_field ? (
                  <Button size="small" startIcon={<CloudDownloadIcon />} href={mou.original_mou_details.file_field} download>
                    Download Original
                  </Button>
                ) : (
                  <Chip label="Attached in Folder" size="small" variant="outlined" />
                )}
              </Box>

              <Box sx={{ p: 2, borderRadius: '14px', bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <DescriptionIcon sx={{ color: '#10B981' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Executed Signed Copy</Typography>
                    <Typography variant="caption" color="text.secondary">Submitted with Signed Date</Typography>
                  </Box>
                </Box>
                {mou.signed_mou_details?.file_field ? (
                  <Button size="small" color="success" startIcon={<CloudDownloadIcon />} href={mou.signed_mou_details.file_field} download>
                    Download Signed
                  </Button>
                ) : (
                  <Button size="small" variant="contained" startIcon={<CloudUploadIcon />} onClick={() => setSignedUploadOpen(true)}>
                    Upload Signed Copy
                  </Button>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* ═══════════════ RIGHT COLUMN (Dates, Timeline & Coordinators) ═══════════════ */}
        <Grid item xs={12} md={4}>

          {/* Dates Card */}
          <Card sx={{ p: 3, mb: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Agreement Dates & Expiry
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Signed Date</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{mou.signed_date || 'Not Signed Yet'}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Duration</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{mou.duration_months} Months</Typography>
            </Box>

            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.18)' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Calculated Expiry Date</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>{mou.expiry_date || 'N/A'}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Formula: Signed Date + {mou.duration_months} Months</Typography>
            </Box>
          </Card>

          {/* Activity Timeline */}
          <Card sx={{ p: 3, mb: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.5 }}>
              Activity Timeline
            </Typography>

            <Box sx={{ position: 'relative', pl: 2 }}>
              {TIMELINE_STEPS.map((step) => (
                <Box key={step.key} sx={{ position: 'relative', mb: 2.5, pl: 2 }}>
                  <Box sx={{
                    position: 'absolute', left: -14, top: 2, width: 22, height: 22,
                    borderRadius: '50%', bgcolor: 'primary.main', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <CheckIcon sx={{ fontSize: '0.8rem' }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.84rem' }}>
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem' }}>
                    {step.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Dialog: Department Upload Signed Copy & Summary Form ── */}
      <Dialog
        open={signedUploadOpen}
        onClose={() => setSignedUploadOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Upload Signed MOU & Fill Details</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Submit executed agreement details. Expiry date will update live based on the selected Signed Date.
          </Typography>

          <Grid container spacing={2.5}>
            {/* 1. Scanned Signed MOU Document Upload Box */}
            <Grid item xs={12}>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: '16px',
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'rgba(79, 70, 229, 0.04)',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.08)' }
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Upload Scanned Signed MOU File
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Drag & drop or click to choose PDF / scanned image document file
                </Typography>
                <Button variant="outlined" size="small" component="label" sx={{ mt: 1.5, borderRadius: '10px', fontWeight: 700 }}>
                  Choose Scanned File
                  <input type="file" hidden accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
                </Button>
              </Box>
            </Grid>

            {/* 2. Signed Date Picker */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Signed Date"
                value={signedDate}
                onChange={(e) => setSignedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Defaults to today's date, fully editable"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (Months - Read Only)"
                value={`${durationMonths} Months`}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Live Calculated Expiry Date Preview */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, borderRadius: '14px', bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Live Calculated Expiry Date
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#10B981' }}>
                  {calculateExpiryPreview(signedDate, durationMonths)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Formula: Signed Date ({signedDate}) + {durationMonths} Months
                </Typography>
              </Box>
            </Grid>

            {/* 3. Short Summary Textarea */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="MOU Short Summary"
                placeholder="Enter a brief summary of the signed agreement..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSignedUploadOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitSigned}
            disabled={submittingSigned}
            sx={{ borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
          >
            {submittingSigned ? 'Submitting...' : 'Submit & Verify Folder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin Approval Remarks Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {approvalAction === 'approve' ? 'Approve MOU Folder' : 'Reject / Request Changes'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Verification Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add compliance notes..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={approvalAction === 'approve' ? 'success' : 'error'}
            onClick={handleApproveReject}
            disabled={processing}
            sx={{ borderRadius: '12px', fontWeight: 700 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default MOUDetail;
