import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Switch,
  FormControlLabel, Button, TextField, MenuItem, Select,
  FormControl, InputLabel, Divider, Alert, Avatar, Chip,
  Tabs, Tab, Slider, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress,
  Tooltip, Badge, InputAdornment
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import StorageIcon from '@mui/icons-material/Storage';
import PaletteIcon from '@mui/icons-material/Palette';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DescriptionIcon from '@mui/icons-material/Description';
import HandshakeIcon from '@mui/icons-material/Handshake';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

import { useThemeMode } from '../context/ThemeContext';
import MailIcon from '@mui/icons-material/Mail';
import SendIcon from '@mui/icons-material/Send';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  getMasterDeptCategories, createMasterDeptCategory, updateMasterDeptCategory, deleteMasterDeptCategory,
  getMasterDepartments, createMasterDepartment, updateMasterDepartment, deleteMasterDepartment,
  getMasterCollabTypes, createMasterCollabType, updateMasterCollabType, deleteMasterCollabType,
  getMasterOrgTypes, createMasterOrgType, updateMasterOrgType, deleteMasterOrgType,
  getMasterDocTypes, createMasterDocType, updateMasterDocType, deleteMasterDocType,
  getMasterTags, createMasterTag, updateMasterTag, deleteMasterTag,
  getMasterCategories, createMasterCategory, updateMasterCategory, deleteMasterCategory
} from '../services/templateApi';

// ── Tab Panel Wrapper ──────────────────────────────────────────────────────────
function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

// ── Master Data Config sub-tab config ────────────────────────────────────────
const MASTER_TABS = [
  { label: 'Template Categories', fetch: getMasterCategories,     create: createMasterCategory,     update: updateMasterCategory,     del: deleteMasterCategory     },
  { label: 'Organization Types',  fetch: getMasterOrgTypes,       create: createMasterOrgType,       update: updateMasterOrgType,       del: deleteMasterOrgType       },
  { label: 'Collaboration Types', fetch: getMasterCollabTypes,    create: createMasterCollabType,    update: updateMasterCollabType,    del: deleteMasterCollabType    },
  { label: 'Document Types',      fetch: getMasterDocTypes,       create: createMasterDocType,       update: updateMasterDocType,       del: deleteMasterDocType       },
  { label: 'Tags',                fetch: getMasterTags,           create: createMasterTag,           update: updateMasterTag,           del: deleteMasterTag           },
  { label: 'Dept. Categories',    fetch: getMasterDeptCategories, create: createMasterDeptCategory,  update: updateMasterDeptCategory,  del: deleteMasterDeptCategory  },
  { label: 'Departments',         fetch: getMasterDepartments,    create: createMasterDepartment,    update: updateMasterDepartment,    del: deleteMasterDepartment    },
];

const MasterDataTab = () => {
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [mdLoading, setMdLoading] = useState(false);
  const [mdError, setMdError] = useState(null);
  const [mdSuccess, setMdSuccess] = useState(null);
  const [mdData, setMdData] = useState([]);

  useEffect(() => {
    if (mdError) {
      const timer = setTimeout(() => setMdError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [mdError]);

  useEffect(() => {
    if (mdSuccess) {
      const timer = setTimeout(() => setMdSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [mdSuccess]);
  const [deptCategories, setDeptCategories] = useState([]);
  const [mdOpen, setMdOpen] = useState(false);
  const [mdEditId, setMdEditId] = useState(null);
  const [mdName, setMdName] = useState('');
  const [mdSelectedCat, setMdSelectedCat] = useState('');
  const [mdSaving, setMdSaving] = useState(false);

  // Helper to extract error message from API response
  const extractError = (err) =>
    err?.response?.data?.detail ||
    err?.response?.data?.name?.[0] ||
    err?.message ||
    'An unexpected error occurred.';

  const currentMdTab = MASTER_TABS[activeSubTab];
  const isDeptTab = activeSubTab === 6;

  const loadMdData = async () => {
    setMdLoading(true); setMdError(null);
    try {
      const result = await currentMdTab.fetch();
      setMdData(result);
      if (isDeptTab) {
        const cats = await getMasterDeptCategories();
        setDeptCategories(cats);
      }
    } catch (err) {
      console.error(err);
      setMdError('Failed to load lookup data.');
    } finally {
      setMdLoading(false);
    }
  };

  useEffect(() => { loadMdData(); }, [activeSubTab]);

  const openMdDialog = (item = null) => {
    setMdEditId(item ? item.id : null);
    setMdName(item ? item.name : '');
    setMdSelectedCat(item ? (item.category || '') : '');
    setMdOpen(true);
  };

  const closeMdDialog = () => { setMdOpen(false); setMdName(''); setMdSelectedCat(''); };

  const handleMdSave = async () => {
    if (!mdName.trim()) return;
    const payload = { name: mdName.trim() };
    if (isDeptTab) payload.category = mdSelectedCat;
    setMdSaving(true);
    try {
      if (mdEditId) await currentMdTab.update(mdEditId, { ...payload, is_active: true });
      else await currentMdTab.create(payload);
      closeMdDialog();
      loadMdData();
    } catch (err) {
      console.error(err);
      setMdError(extractError(err));
    } finally {
      setMdSaving(false);
    }
  };

  const handleMdToggle = async (item) => {
    try {
      const payload = { name: item.name, is_active: !item.is_active };
      if (isDeptTab) payload.category = item.category;
      await currentMdTab.update(item.id, payload);
      loadMdData();
    } catch (err) { setMdError(extractError(err)); }
  };

  const handleMdDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? Items linked to active records cannot be removed — deactivate them instead.`)) return;
    try {
      await currentMdTab.del(id);
      setMdSuccess(`"${name}" deleted successfully.`);
      loadMdData();
    }
    catch (err) { setMdError(extractError(err)); }
  };

  return (
    <Box>
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>Master Data Configuration</Typography>
          <Typography variant="caption" color="text.secondary">
            Add, update, or deactivate dropdown options used across MOU forms and user management.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openMdDialog()}
          sx={{ borderRadius: '20px', px: 2.5, fontWeight: 700, flexShrink: 0 }}>
          Add Option
        </Button>
      </Box>

      {mdError && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: '12px' }}
          onClose={() => setMdError(null)}
        >
          {mdError}
        </Alert>
      )}

      {mdSuccess && (
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: '12px' }}
          onClose={() => setMdSuccess(null)}
        >
          {mdSuccess}
        </Alert>
      )}

      <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Tabs value={activeSubTab} onChange={(_, v) => setActiveSubTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { fontWeight: 700, py: 1.8, fontSize: '0.8rem' } }}>
          {MASTER_TABS.map((t, i) => <Tab key={i} label={t.label} />)}
        </Tabs>

        {mdLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: '0 0 16px 16px' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Lookup Value</TableCell>
                  {isDeptTab && <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>}
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mdData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isDeptTab ? 5 : 4} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No lookup values added yet.</Typography>
                    </TableCell>
                  </TableRow>
                ) : mdData.map(item => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.id}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{item.name}</TableCell>
                    {isDeptTab && <TableCell><Chip label={item.category_name || 'Unassigned'} size="small" color="primary" variant="outlined" /></TableCell>}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch size="small" checked={item.is_active} onChange={() => handleMdToggle(item)} />
                        <Chip label={item.is_active ? 'Active' : 'Disabled'} size="small"
                          color={item.is_active ? 'success' : 'default'} sx={{ fontWeight: 800, height: 20 }} />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openMdDialog(item)} sx={{ mr: 1, color: 'primary.main' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleMdDelete(item.id, item.name)} sx={{ color: 'error.main' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={mdOpen} onClose={closeMdDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {mdEditId ? `Edit ${currentMdTab.label}` : `Add New ${currentMdTab.label}`}
        </DialogTitle>
        <DialogContent dividers>
          <TextField autoFocus margin="dense" label="Name / Value" fullWidth required variant="outlined"
            value={mdName} onChange={e => setMdName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleMdSave()} sx={{ mb: 2 }} />
          {isDeptTab && (
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Category</InputLabel>
              <Select value={mdSelectedCat} label="Category" onChange={e => setMdSelectedCat(e.target.value)}>
                {deptCategories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeMdDialog} sx={{ fontWeight: 700 }} disabled={mdSaving}>Cancel</Button>
          <Button onClick={handleMdSave} variant="contained" sx={{ borderRadius: '12px', fontWeight: 700 }}
            disabled={mdSaving} startIcon={mdSaving ? <CircularProgress size={14} color="inherit" /> : null}>
            {mdSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Color Swatch Picker ───────────────────────────────────────────────────────
const PRESET_COLORS = [
  { label: 'Indigo (Default)', primary: '#4F46E5', secondary: '#7C3AED' },
  { label: 'Blue Ocean',       primary: '#0EA5E9', secondary: '#0284C7' },
  { label: 'Emerald Green',    primary: '#10B981', secondary: '#059669' },
  { label: 'Rose Red',         primary: '#F43F5E', secondary: '#E11D48' },
  { label: 'Amber Gold',       primary: '#F59E0B', secondary: '#D97706' },
  { label: 'Teal Cyan',        primary: '#14B8A6', secondary: '#0D9488' },
  { label: 'Purple Violet',    primary: '#8B5CF6', secondary: '#7C3AED' },
  { label: 'Slate Gray',       primary: '#64748B', secondary: '#475569' },
];

const FONT_OPTIONS = [
  { label: 'Plus Jakarta Sans (Default)', value: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" },
  { label: 'Inter',         value: "'Inter', system-ui, sans-serif" },
  { label: 'Roboto',        value: "'Roboto', system-ui, sans-serif" },
  { label: 'Poppins',       value: "'Poppins', system-ui, sans-serif" },
  { label: 'DM Sans',       value: "'DM Sans', system-ui, sans-serif" },
  { label: 'Outfit',        value: "'Outfit', system-ui, sans-serif" },
  { label: 'Nunito',        value: "'Nunito', system-ui, sans-serif" },
];

// ── Inline MasterData List Component ─────────────────────────────────────────
const MasterList = ({ icon, title, color, fetchFn, createFn, updateFn, deleteFn, extraField }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [nameVal, setNameVal] = useState('');
  const [extraVal, setExtraVal] = useState('');
  const [extraOptions, setExtraOptions] = useState([]);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFn();
      setItems(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [fetchFn]);

  useEffect(() => {
    load();
    if (extraField?.fetchOptions) {
      extraField.fetchOptions().then(setExtraOptions).catch(() => {});
    }
  }, [load]);

  const openCreate = () => { setEditItem(null); setNameVal(''); setExtraVal(''); setErr(''); setDialogOpen(true); };
  const openEdit = (item) => { setEditItem(item); setNameVal(item.name); setExtraVal(item[extraField?.key] || ''); setErr(''); setDialogOpen(true); };

  const handleSave = async () => {
    if (!nameVal.trim()) { setErr('Name is required.'); return; }
    const payload = { name: nameVal.trim() };
    if (extraField) payload[extraField.key] = extraVal;
    try {
      if (editItem) { await updateFn(editItem.id, { ...payload, is_active: true }); }
      else { await createFn(payload); }
      setDialogOpen(false);
      load();
    } catch (e) {
      setErr(e?.response?.data?.name?.[0] || 'Save failed. Value may be a duplicate.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item? Items linked to active records cannot be removed.')) return;
    try { await deleteFn(id); load(); }
    catch { setErr('Cannot delete — item is currently in use.'); }
  };

  return (
    <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, borderRadius: '10px', bgcolor: `${color}18` }}>
              {React.cloneElement(icon, { sx: { fontSize: '1rem', color } })}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1 }}>{title}</Typography>
              <Typography variant="caption" color="text.secondary">{items.length} items</Typography>
            </Box>
          </Box>
          <Tooltip title={`Add ${title}`}>
            <IconButton
              size="small"
              onClick={openCreate}
              sx={{ bgcolor: `${color}15`, color, '&:hover': { bgcolor: `${color}25` }, borderRadius: '10px' }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
            {items.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="caption" color="text.secondary">No items yet. Click + to add.</Typography>
              </Box>
            ) : (
              items.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    px: 2.5, py: 1.2,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid', borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background 0.15s',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        bgcolor: item.is_active !== false ? color : '#94A3B8',
                        flexShrink: 0
                      }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </Typography>
                      {extraField && item[`${extraField.key}_name`] && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {item[`${extraField.key}_name`]}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => openEdit(item)} sx={{ color: 'primary.main', p: 0.5 }}>
                      <EditIcon sx={{ fontSize: '0.85rem' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(item.id)} sx={{ color: 'error.main', p: 0.5 }}>
                      <DeleteIcon sx={{ fontSize: '0.85rem' }} />
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          {editItem ? `Edit ${title}` : `Add ${title}`}
        </DialogTitle>
        <DialogContent>
          {err && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{err}</Alert>}
          <TextField
            autoFocus
            label="Name / Value"
            fullWidth
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            sx={{ mt: 1 }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          {extraField && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>{extraField.label}</InputLabel>
              <Select value={extraVal} label={extraField.label} onChange={e => setExtraVal(e.target.value)}>
                {extraOptions.map(opt => (
                  <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ borderRadius: '12px', fontWeight: 700 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};


// ── Email Settings Component for Super Admin ─────────────────────────────────
const EmailSettingsTab = () => {
  const [smtpList, setSmtpList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [host, setHost] = useState('');
  const [port, setPort] = useState(587);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [useTls, setUseTls] = useState(true);
  const [useSsl, setUseSsl] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');

  // Test connection state
  const [testEmail, setTestEmail] = useState('');
  const [testingId, setTestingId] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authRequired, setAuthRequired] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/users/smtp-settings/');
      setSmtpList(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load SMTP configurations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setHost('smtp.gmail.com');
    setPort(587);
    setUsername('');
    setPassword('');
    setUseTls(true);
    setUseSsl(false);
    setSenderEmail('');
    setAuthRequired(true);
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (smtp) => {
    setEditingId(smtp.id);
    setHost(smtp.host);
    setPort(smtp.port);
    setUsername(smtp.username || '');
    setPassword(smtp.password || '');
    setUseTls(smtp.use_tls);
    setUseSsl(smtp.use_ssl);
    setSenderEmail(smtp.sender_email);
    setAuthRequired(smtp.auth_required ?? true);
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!host || !port || !senderEmail || (authRequired && (!username || (!editingId && !password)))) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    setSuccess(null);
    const payload = {
      host,
      port: parseInt(port),
      username: authRequired ? username : '',
      auth_required: authRequired,
      use_tls: useTls,
      use_ssl: useSsl,
      sender_email: senderEmail,
    };
    if (authRequired && password) {
      payload.password = password;
    } else if (!authRequired) {
      payload.password = '';
    }

    try {
      if (editingId) {
        await api.put(`/api/users/smtp-settings/${editingId}/`, payload);
        setSuccess('SMTP configuration updated successfully.');
      } else {
        // If it's the first config, default to active
        await api.post('/api/users/smtp-settings/', { ...payload, is_active: smtpList.length === 0 });
        setSuccess('SMTP configuration created successfully.');
      }
      setDialogOpen(false);
      fetchSettings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save SMTP configuration.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/api/users/smtp-settings/${id}/`);
      setSuccess('SMTP configuration deleted successfully.');
      fetchSettings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete SMTP configuration.');
    }
  };

  const handleToggleActive = async (smtp) => {
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/api/users/smtp-settings/${smtp.id}/`, { is_active: !smtp.is_active });
      setSuccess(smtp.is_active ? 'SMTP configuration deactivated.' : 'SMTP configuration activated successfully.');
      fetchSettings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to toggle activation.');
    }
  };

  const handleOpenTest = (id) => {
    setTestingId(id);
    setTestEmail('');
    setTestDialogOpen(true);
  };

  const handleTestConnection = async () => {
    if (!testEmail) return;
    setTestingConnection(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post(`/api/users/smtp-settings/${testingId}/test-connection/`, { test_email: testEmail });
      setSuccess(response.data.detail || 'Test email sent successfully.');
      setTestDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Test connection failed.');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Custom SMTP Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure custom outgoing SMTP mail servers. Active configurations will override standard env settings.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: '12px', fontWeight: 700 }}
        >
          Add SMTP
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : smtpList.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider' }}>
          <MailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>No Custom SMTP Servers</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Currently using default environment-configured mail credentials.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ borderRadius: '10px' }}>
            Configure New SMTP
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Host</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Port</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sender Email</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {smtpList.map((smtp) => (
                <TableRow key={smtp.id} hover>
                  <TableCell>
                    <Chip
                      label={smtp.is_active ? 'Active' : 'Inactive'}
                      color={smtp.is_active ? 'success' : 'default'}
                      size="small"
                      sx={{ fontWeight: 700, borderRadius: '8px' }}
                    />
                  </TableCell>
                  <TableCell>{smtp.host}</TableCell>
                  <TableCell>{smtp.port}</TableCell>
                  <TableCell>{smtp.username}</TableCell>
                  <TableCell>{smtp.sender_email}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant={smtp.is_active ? 'outlined' : 'contained'}
                        color={smtp.is_active ? 'warning' : 'primary'}
                        onClick={() => handleToggleActive(smtp)}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                      >
                        {smtp.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(smtp)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="info" onClick={() => handleOpenTest(smtp.id)}>
                        <SendIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(smtp.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingId ? 'Edit SMTP Configuration' : 'Add SMTP Configuration'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
          {/* Host & Port Row */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              sx={{ flex: 2 }}
              label="SMTP Host"
              required
              value={host}
              onChange={e => setHost(e.target.value)}
            />
            <TextField
              sx={{ flex: 1 }}
              type="number"
              label="Port"
              required
              value={port}
              onChange={e => setPort(e.target.value)}
            />
          </Box>

          {/* Sender Email */}
          <TextField
            fullWidth
            label="Sender Email (From Email)"
            required
            type="email"
            value={senderEmail}
            onChange={e => setSenderEmail(e.target.value)}
            helperText="Email address that will appear in the 'From' header."
          />

          {/* Requires Authentication Switch */}
          <FormControlLabel
            control={<Switch checked={authRequired} onChange={e => setAuthRequired(e.target.checked)} />}
            label="SMTP Server Requires Authentication"
            sx={{ mb: 0.5 }}
          />

          {authRequired && (
            <>
              {/* SMTP Username */}
              <TextField
                fullWidth
                label="SMTP Username"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
              />

              {/* SMTP Password */}
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="SMTP Password"
                required={!editingId}
                value={password}
                onChange={e => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </>
          )}

          {/* SSL/TLS Toggles */}
          <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
            <FormControlLabel
              control={<Switch checked={useTls} onChange={e => {
                setUseTls(e.target.checked);
                if (e.target.checked) setUseSsl(false);
              }} />}
              label="Use TLS"
            />
            <FormControlLabel
              control={<Switch checked={useSsl} onChange={e => {
                setUseSsl(e.target.checked);
                if (e.target.checked) setUseTls(false);
              }} />}
              label="Use SSL"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ borderRadius: '10px', fontWeight: 700 }}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Test SMTP Connection</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Send a test MCC invitation email to verify this outgoing SMTP mail server configuration.
          </Typography>
          <TextField
            fullWidth
            required
            label="Recipient Email Address"
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            disabled={testingConnection}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setTestDialogOpen(false)} disabled={testingConnection}>Cancel</Button>
          <Button
            onClick={handleTestConnection}
            variant="contained"
            disabled={testingConnection || !testEmail}
            sx={{ borderRadius: '10px', fontWeight: 700 }}
          >
            {testingConnection ? 'Sending...' : 'Send Test Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};


// ── Google Drive Settings Component for Super Admin ───────────────────────────
const GoogleDriveSettingsTab = () => {
  const [driveList, setDriveList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [privateKeyId, setPrivateKeyId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientId, setClientId] = useState('');
  const [rootFolderId, setRootFolderId] = useState('');
  const [type, setType] = useState('service_account');
  const [authUri, setAuthUri] = useState('https://accounts.google.com/o/oauth2/auth');
  const [tokenUri, setTokenUri] = useState('https://oauth2.googleapis.com/token');
  const [authProviderCertUrl, setAuthProviderCertUrl] = useState('https://www.googleapis.com/oauth2/v1/certs');
  const [clientCertUrl, setClientCertUrl] = useState('');
  const [universeDomain, setUniverseDomain] = useState('googleapis.com');

  // Test connection state
  const [testingId, setTestingId] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/users/google-drive-settings/');
      setDriveList(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load Google Drive configurations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setProjectId('');
    setPrivateKeyId('');
    setPrivateKey('');
    setClientEmail('');
    setClientId('');
    setRootFolderId('');
    setType('service_account');
    setAuthUri('https://accounts.google.com/o/oauth2/auth');
    setTokenUri('https://oauth2.googleapis.com/token');
    setAuthProviderCertUrl('https://www.googleapis.com/oauth2/v1/certs');
    setClientCertUrl('');
    setUniverseDomain('googleapis.com');
    setShowPrivateKey(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (drive) => {
    setEditingId(drive.id);
    setProjectId(drive.project_id);
    setPrivateKeyId(drive.private_key_id);
    setPrivateKey('');
    setClientEmail(drive.client_email);
    setClientId(drive.client_id);
    setRootFolderId(drive.root_folder_id);
    setType(drive.type);
    setAuthUri(drive.auth_uri);
    setTokenUri(drive.token_uri);
    setAuthProviderCertUrl(drive.auth_provider_x509_cert_url);
    setClientCertUrl(drive.client_x509_cert_url || '');
    setUniverseDomain(drive.universe_domain || 'googleapis.com');
    setShowPrivateKey(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!projectId || !privateKeyId || (!editingId && !privateKey) || !clientEmail || !clientId || !rootFolderId) {
      setError('Please fill in all required configuration fields.');
      return;
    }
    setError(null);
    setSuccess(null);
    const payload = {
      project_id: projectId.trim(),
      private_key_id: privateKeyId.trim(),
      client_email: clientEmail.trim(),
      client_id: clientId.trim(),
      root_folder_id: rootFolderId.trim(),
      type,
      auth_uri: authUri,
      token_uri: tokenUri,
      auth_provider_x509_cert_url: authProviderCertUrl,
      client_x509_cert_url: clientCertUrl.trim() || null,
      universe_domain: universeDomain,
    };
    if (privateKey) {
      payload.private_key = privateKey;
    }

    try {
      if (editingId) {
        await api.put(`/api/users/google-drive-settings/${editingId}/`, payload);
        setSuccess('Google Drive configuration updated successfully.');
      } else {
        await api.post('/api/users/google-drive-settings/', { ...payload, is_active: driveList.length === 0 });
        setSuccess('Google Drive configuration created successfully.');
      }
      setDialogOpen(false);
      fetchSettings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save Google Drive configuration.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/api/users/google-drive-settings/${id}/`);
      setSuccess('Google Drive configuration deleted successfully.');
      fetchSettings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete Google Drive configuration.');
    }
  };

  const handleToggleActive = async (drive) => {
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/api/users/google-drive-settings/${drive.id}/`, { is_active: !drive.is_active });
      setSuccess(drive.is_active ? 'Google Drive configuration deactivated.' : 'Google Drive configuration activated successfully.');
      fetchSettings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to toggle activation.');
    }
  };

  const handleOpenTest = (id) => {
    setTestingId(id);
    setTestDialogOpen(true);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post(`/api/users/google-drive-settings/${testingId}/test-connection/`);
      setSuccess(response.data.detail || 'Google Drive connection test succeeded.');
      setTestDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Google Drive connection test failed.');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Dynamic Google Drive Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure custom Google Drive Service Account credentials. Active configurations will override standard env settings.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, var(--indigo), var(--violet))' }}
        >
          Add Drive Config
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : driveList.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider', mb: 4 }}>
          <StorageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>No Custom Google Drive Configs</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Currently using default environment-configured service account credentials.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ borderRadius: '10px' }}>
            Configure New Drive API
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 4 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Project ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Client Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Root Folder ID</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {driveList.map((drive) => (
                <TableRow key={drive.id} hover>
                  <TableCell>
                    <Chip
                      label={drive.is_active ? 'Active' : 'Inactive'}
                      color={drive.is_active ? 'success' : 'default'}
                      size="small"
                      sx={{ fontWeight: 700, borderRadius: '8px' }}
                    />
                  </TableCell>
                  <TableCell>{drive.project_id}</TableCell>
                  <TableCell>{drive.client_email}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{drive.root_folder_id}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant={drive.is_active ? 'outlined' : 'contained'}
                        color={drive.is_active ? 'warning' : 'primary'}
                        onClick={() => handleToggleActive(drive)}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                      >
                        {drive.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(drive)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="info" onClick={() => handleOpenTest(drive.id)}>
                        <SendIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(drive.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Guidelines Section */}
      <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', bgcolor: 'action.hover', p: 3.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsSuggestIcon color="primary" /> Google Drive Service Account Configuration Guide
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
          MCC Legal Document Registry uses a Google Cloud service account with API credentials to securely synchronize folders and files with Google Drive. Follow these steps to generate and connect a service account:
        </Typography>
        <Box component="ol" sx={{ pl: 2.5, m: 0, '& li': { mb: 1.5, fontSize: '0.82rem', lineHeight: 1.6, color: 'text.secondary' } }}>
          <li>
            <strong>Access Google Cloud Console:</strong> Sign in to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: 'var(--indigo)' }}>Google Cloud Console</a> using your administrator credentials.
          </li>
          <li>
            <strong>Create or Select a GCP Project:</strong> Click the project selector drop-down and choose your existing project or click "New Project" to create a dedicated one.
          </li>
          <li>
            <strong>Enable Google Drive API:</strong> Navigate to the APIs Library, search for <em>"Google Drive API"</em>, click it, and click <strong>Enable</strong>.
          </li>
          <li>
            <strong>Generate Service Account:</strong> Go to <strong>IAM &amp; Admin</strong> &gt; <strong>Service Accounts</strong>. Click <strong>+ Create Service Account</strong>. Give it a name (e.g. <code>mcc-drive-sync</code>), describe it, and click Create.
          </li>
          <li>
            <strong>Download Credentials JSON Key:</strong> Select the created Service Account, open the <strong>Keys</strong> tab, click <strong>Add Key</strong> &gt; <strong>Create New Key</strong>, choose <strong>JSON</strong>, and download the key file securely to your local machine.
          </li>
          <li>
            <strong>Configure Folder &amp; Share Permissions:</strong> Open <a href="https://drive.google.com/" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: 'var(--indigo)' }}>Google Drive</a>, select or create your root folder (e.g. <code>MOU Repository</code>), right-click and choose <strong>Share</strong>. Copy the <code>client_email</code> address from your downloaded JSON file, paste it as a new recipient, assign the role <strong>Editor</strong> or <strong>Organizer</strong>, and click Send.
          </li>
          <li>
            <strong>Enter Settings Above:</strong> Add a new configuration above, open your downloaded JSON key file, and copy-paste the corresponding parameters directly into the form fields.
          </li>
        </Box>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingId ? 'Edit Google Drive Config' : 'Add Google Drive Config'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              sx={{ flex: 1 }}
              label="Project ID"
              required
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              placeholder="e.g. mcc-drive-sync"
            />
            <TextField
              sx={{ flex: 1 }}
              label="Private Key ID"
              required
              value={privateKeyId}
              onChange={e => setPrivateKeyId(e.target.value)}
            />
          </Box>

          <TextField
            fullWidth
            label="Client Email"
            required
            type="email"
            value={clientEmail}
            onChange={e => setClientEmail(e.target.value)}
            placeholder="e.g. mcc-sync@project-id.iam.gserviceaccount.com"
          />

          <TextField
            fullWidth
            label="Client ID"
            required
            value={clientId}
            onChange={e => setClientId(e.target.value)}
          />

          <TextField
            fullWidth
            label="Google Drive Root Folder ID"
            required
            value={rootFolderId}
            onChange={e => setRootFolderId(e.target.value)}
            placeholder="e.g. 1SUGWdsJ3JWBT0UYQ7o0iJSfanyXOivXx"
            helperText="The shared folder's unique ID from the Google Drive URL."
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            type={showPrivateKey ? 'text' : 'password'}
            label="Private Key"
            required={!editingId}
            placeholder={editingId ? "••••••••••••••••••••••••" : "-----BEGIN PRIVATE KEY-----\n..."}
            value={privateKey}
            onChange={e => setPrivateKey(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle key visibility"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    edge="end"
                  >
                    {showPrivateKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, var(--indigo), var(--violet))' }}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Test Connection</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to test the Google Drive integration? The system will authenticate and verify accessibility for the configured root folder.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setTestDialogOpen(false)} disabled={testingConnection} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button
            onClick={handleTestConnection}
            variant="contained"
            disabled={testingConnection}
            sx={{ borderRadius: '10px', fontWeight: 700, background: 'linear-gradient(135deg, var(--indigo), var(--violet))' }}
          >
            {testingConnection ? 'Testing...' : 'Start Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};


// ── Main Settings Component ───────────────────────────────────────────────────
const Settings = () => {
  const { mode, toggleTheme, primaryColor, secondaryColor, fontFamily, borderRadius: themeBorderRadius, applyAppearance } = useThemeMode();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [savedSuccess, setSavedSuccess] = useState('');

  // ── Appearance State ──
  const [selectedPreset, setSelectedPreset] = useState(() => {
    const saved = localStorage.getItem('app_primary_color');
    const preset = PRESET_COLORS.find(p => p.primary === saved);
    return preset ? preset.label : 'Indigo (Default)';
  });
  const [customPrimary, setCustomPrimary] = useState(() => localStorage.getItem('app_primary_color') || '#4F46E5');
  const [customSecondary, setCustomSecondary] = useState(() => localStorage.getItem('app_secondary_color') || '#7C3AED');
  const [selectedFont, setSelectedFont] = useState(() => localStorage.getItem('app_font_family') || FONT_OPTIONS[0].value);
  const [radiusValue, setRadiusValue] = useState(() => parseInt(localStorage.getItem('app_border_radius') || '14'));

  // ── Notification State ──
  const [emailAlerts, setEmailAlerts] = useState(() => JSON.parse(localStorage.getItem('notify_email') ?? 'true'));
  const [inAppAlerts, setInAppAlerts] = useState(() => JSON.parse(localStorage.getItem('notify_inapp') ?? 'true'));
  const [reminder30Days, setReminder30Days] = useState(() => JSON.parse(localStorage.getItem('remind_30') ?? 'true'));
  const [reminder15Days, setReminder15Days] = useState(() => JSON.parse(localStorage.getItem('remind_15') ?? 'true'));
  const [reminder7Days, setReminder7Days] = useState(() => JSON.parse(localStorage.getItem('remind_7') ?? 'true'));
  const [reminder1Day, setReminder1Day] = useState(() => JSON.parse(localStorage.getItem('remind_1') ?? 'true'));

  // ── Storage State ──
  const [storageThreshold, setStorageThreshold] = useState(() => parseInt(localStorage.getItem('storage_threshold') || '85'));

  // ── Apply preset ──
  const applyPreset = (preset) => {
    setSelectedPreset(preset.label);
    setCustomPrimary(preset.primary);
    setCustomSecondary(preset.secondary);
  };

  // ── Save Appearance ──
  const handleSaveAppearance = () => {
    localStorage.setItem('app_primary_color', customPrimary);
    localStorage.setItem('app_secondary_color', customSecondary);
    localStorage.setItem('app_font_family', selectedFont);
    localStorage.setItem('app_border_radius', String(radiusValue));
    applyAppearance({ primary: customPrimary, secondary: customSecondary, font: selectedFont, radius: radiusValue });
    setSavedSuccess('Appearance settings applied! Reload if colors don\'t update immediately.');
    setTimeout(() => setSavedSuccess(''), 4000);
  };

  const handleResetAppearance = () => {
    const def = PRESET_COLORS[0];
    applyPreset(def);
    setSelectedFont(FONT_OPTIONS[0].value);
    setRadiusValue(14);
  };

  // ── Save Notifications ──
  const handleSaveNotifications = () => {
    localStorage.setItem('notify_email', JSON.stringify(emailAlerts));
    localStorage.setItem('notify_inapp', JSON.stringify(inAppAlerts));
    localStorage.setItem('remind_30', JSON.stringify(reminder30Days));
    localStorage.setItem('remind_15', JSON.stringify(reminder15Days));
    localStorage.setItem('remind_7', JSON.stringify(reminder7Days));
    localStorage.setItem('remind_1', JSON.stringify(reminder1Day));
    setSavedSuccess('Notification preferences saved successfully!');
    setTimeout(() => setSavedSuccess(''), 4000);
  };

  // ── Save Storage ──
  const handleSaveStorage = () => {
    localStorage.setItem('storage_threshold', String(storageThreshold));
    setSavedSuccess('Storage threshold updated successfully!');
    setTimeout(() => setSavedSuccess(''), 4000);
  };

  const tabSx = {
    fontWeight: 700,
    fontSize: '0.82rem',
    textTransform: 'none',
    minHeight: 48,
    '&.Mui-selected': { color: 'primary.main' }
  };

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 1100, mx: 'auto' }} className="animate-fade-slide-up">
      {/* Header */}
      <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ background: 'linear-gradient(135deg, var(--indigo), var(--violet))', width: 48, height: 48, borderRadius: '14px' }}>
          <SettingsIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Site Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage appearance, dropdown content, notifications and system preferences.
          </Typography>
        </Box>
      </Box>

      {savedSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '14px', fontWeight: 700 }}>
          {savedSuccess}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{ sx: { height: 3, borderRadius: '3px 3px 0 0' } }}
          >
            <Tab icon={<PaletteIcon fontSize="small" />} iconPosition="start" label="Appearance" sx={tabSx} />
            <Tab icon={<SettingsSuggestIcon fontSize="small" />} iconPosition="start" label="Master Data Config" sx={tabSx} />
             <Tab icon={<NotificationsActiveIcon fontSize="small" />} iconPosition="start" label="Notifications" sx={tabSx} />
            <Tab icon={<StorageIcon fontSize="small" />} iconPosition="start" label="Storage" sx={tabSx} />
            {user?.role?.name === 'Super Admin' && (
              <Tab icon={<MailIcon fontSize="small" />} iconPosition="start" label="Email Settings" sx={tabSx} />
            )}
            {user?.role?.name === 'Super Admin' && (
              <Tab icon={<StorageIcon fontSize="small" />} iconPosition="start" label="Google Drive" sx={tabSx} />
            )}
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>

          {/* ════════════════════════ TAB 1: APPEARANCE ════════════════════════ */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {/* Color Presets */}
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>Color Scheme</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Choose a preset or pick custom colors below. Changes apply to the entire site.
                </Typography>

                <Grid container spacing={1.5} sx={{ mb: 3 }}>
                  {PRESET_COLORS.map(preset => (
                    <Grid item xs={6} sm={3} key={preset.label}>
                      <Box
                        onClick={() => applyPreset(preset)}
                        sx={{
                          p: 1.5,
                          borderRadius: '12px',
                          border: '2px solid',
                          borderColor: selectedPreset === preset.label ? customPrimary : 'divider',
                          cursor: 'pointer',
                          transition: 'all 0.18s',
                          '&:hover': { borderColor: preset.primary, transform: 'translateY(-2px)' },
                          textAlign: 'center'
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mb: 1 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '6px', bgcolor: preset.primary }} />
                          <Box sx={{ width: 20, height: 20, borderRadius: '6px', bgcolor: preset.secondary }} />
                        </Box>
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, display: 'block', lineHeight: 1.2 }}>
                          {preset.label}
                        </Typography>
                        {selectedPreset === preset.label && (
                          <CheckCircleIcon sx={{ fontSize: '0.75rem', color: preset.primary, mt: 0.5 }} />
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Custom Color Pickers */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>Custom Colors</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          sx={{
                            width: 40, height: 40, borderRadius: '10px',
                            bgcolor: customPrimary, cursor: 'pointer',
                            boxShadow: `0 0 0 3px ${customPrimary}40`
                          }}
                        />
                        <input
                          type="color"
                          value={customPrimary}
                          onChange={e => { setCustomPrimary(e.target.value); setSelectedPreset(''); }}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>Primary Color</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{customPrimary.toUpperCase()}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          sx={{
                            width: 40, height: 40, borderRadius: '10px',
                            bgcolor: customSecondary, cursor: 'pointer',
                            boxShadow: `0 0 0 3px ${customSecondary}40`
                          }}
                        />
                        <input
                          type="color"
                          value={customSecondary}
                          onChange={e => { setCustomSecondary(e.target.value); setSelectedPreset(''); }}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>Secondary Color</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{customSecondary.toUpperCase()}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Panel: Font & Radius & Preview */}
              <Grid item xs={12} md={5}>
                {/* Font */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Font Family</Typography>
                <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                  <Select value={selectedFont} onChange={e => setSelectedFont(e.target.value)}>
                    {FONT_OPTIONS.map(f => (
                      <MenuItem key={f.value} value={f.value} sx={{ fontFamily: f.value }}>
                        {f.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Border Radius */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  Border Radius — <span style={{ color: customPrimary, fontFamily: 'monospace' }}>{radiusValue}px</span>
                </Typography>
                <Box sx={{ px: 1, mb: 3 }}>
                  <Slider
                    value={radiusValue}
                    onChange={(_, v) => setRadiusValue(v)}
                    min={0} max={28} step={2}
                    marks={[{ value: 0, label: 'Sharp' }, { value: 14, label: 'Default' }, { value: 28, label: 'Round' }]}
                    sx={{ color: customPrimary }}
                  />
                </Box>

                {/* Live Preview Card */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>Live Preview</Typography>
                <Box sx={{
                  p: 2.5, borderRadius: `${radiusValue}px`, border: '2px solid', borderColor: customPrimary,
                  background: `linear-gradient(135deg, ${customPrimary}08, ${customSecondary}08)`,
                  fontFamily: selectedFont
                }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                    <Box sx={{
                      px: 2, py: 0.7, borderRadius: `${Math.max(radiusValue - 4, 4)}px`,
                      background: `linear-gradient(135deg, ${customPrimary}, ${customSecondary})`,
                      color: '#fff', fontSize: '0.8rem', fontWeight: 700, fontFamily: selectedFont
                    }}>
                      Primary Button
                    </Box>
                    <Box sx={{
                      px: 2, py: 0.7, borderRadius: `${Math.max(radiusValue - 4, 4)}px`,
                      border: `2px solid ${customPrimary}`, color: customPrimary,
                      fontSize: '0.8rem', fontWeight: 700, fontFamily: selectedFont
                    }}>
                      Outlined
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {['Active', 'Pending', 'Expired'].map((label, i) => (
                      <Box key={label} sx={{
                        px: 1.2, py: 0.3, borderRadius: `${Math.max(radiusValue - 6, 4)}px`,
                        bgcolor: [customPrimary, `${customPrimary}40`, '#94A3B820'][i],
                        color: i === 0 ? '#fff' : customPrimary,
                        fontSize: '0.7rem', fontWeight: 700, fontFamily: selectedFont
                      }}>
                        {label}
                      </Box>
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.secondary', fontFamily: selectedFont }}>
                    College Data Bridge — MOU Management System
                  </Typography>
                </Box>

                {/* Dark Mode Toggle */}
                <Box sx={{
                  mt: 2.5, p: 2, borderRadius: '12px', bgcolor: 'action.hover',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Theme Mode</Typography>
                    <Typography variant="caption" color="text.secondary">Currently {mode.toUpperCase()} mode</Typography>
                  </Box>
                  <Button variant="outlined" onClick={toggleTheme} size="small" sx={{ borderRadius: '10px', fontWeight: 700 }}>
                    Toggle {mode === 'light' ? '🌙 Dark' : '☀️ Light'}
                  </Button>
                </Box>
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Divider sx={{ mb: 2.5 }} />
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<RestartAltIcon />}
                    onClick={handleResetAppearance}
                    sx={{ borderRadius: '12px', fontWeight: 700 }}
                  >
                    Reset to Defaults
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleSaveAppearance}
                    sx={{
                      borderRadius: '12px', fontWeight: 700,
                      background: `linear-gradient(135deg, ${customPrimary}, ${customSecondary})`
                    }}
                  >
                    Apply Appearance
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* ════════════════════════ TAB 2: MASTER DATA CONFIG ════════════════════════ */}
          <TabPanel value={activeTab} index={1}>
            <MasterDataTab />
          </TabPanel>

          {/* ════════════════════════ TAB 3: NOTIFICATIONS ════════════════════════ */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <NotificationsActiveIcon sx={{ color: 'primary.main' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Alert Channels</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>
                      The system checks active MOUs daily at midnight and triggers alerts for assigned users.
                    </Typography>
                    <FormControlLabel
                      control={<Switch checked={emailAlerts} onChange={e => setEmailAlerts(e.target.checked)} color="primary" />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Send Email Reminders to Owners</Typography>}
                      sx={{ mb: 1, display: 'block' }}
                    />
                    <FormControlLabel
                      control={<Switch checked={inAppAlerts} onChange={e => setInAppAlerts(e.target.checked)} color="primary" />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700 }}>In-App Notifications Bar Alerts</Typography>}
                      sx={{ mb: 1, display: 'block' }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 2 }}>
                      Reminder Intervals Before MOU Expiry
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {[
                        { label: '30 Days Before (Warning)', state: reminder30Days, set: setReminder30Days, color: '#F59E0B' },
                        { label: '15 Days Before (Urgent)', state: reminder15Days, set: setReminder15Days, color: '#F97316' },
                        { label: '7 Days Before (Critical)', state: reminder7Days, set: setReminder7Days, color: '#EF4444' },
                        { label: '1 Day Before (Final Alert)', state: reminder1Day, set: setReminder1Day, color: '#F43F5E' },
                      ].map(({ label, state, set, color }) => (
                        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: '10px', border: '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: state ? color : '#94A3B8' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
                          </Box>
                          <Switch size="small" checked={state} onChange={e => set(e.target.checked)} sx={{ '& .MuiSwitch-thumb': { bgcolor: state ? color : undefined } }} />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleSaveNotifications}
                    sx={{ borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, var(--indigo), var(--violet))' }}
                  >
                    Save Notification Preferences
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* ════════════════════════ TAB 4: STORAGE ════════════════════════ */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} md={7}>
                <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <StorageIcon sx={{ color: 'primary.main' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Server Storage Alert Threshold</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Alert the super admin when disk usage exceeds this percentage. The system checks storage at regular intervals.
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>Warning Threshold</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: storageThreshold > 90 ? 'error.main' : storageThreshold > 75 ? 'warning.main' : 'success.main' }}>
                          {storageThreshold}%
                        </Typography>
                      </Box>
                      <Slider
                        value={storageThreshold}
                        onChange={(_, v) => setStorageThreshold(v)}
                        min={50} max={99} step={5}
                        marks={[
                          { value: 60, label: '60%' },
                          { value: 75, label: '75%' },
                          { value: 85, label: '85%' },
                          { value: 95, label: '95%' },
                        ]}
                        sx={{
                          color: storageThreshold > 90 ? '#F43F5E' : storageThreshold > 75 ? '#F59E0B' : '#10B981'
                        }}
                      />
                    </Box>

                    <TextField
                      fullWidth
                      type="number"
                      label="Disk Storage Warning Threshold (%)"
                      value={storageThreshold}
                      onChange={e => setStorageThreshold(Math.min(99, Math.max(1, parseInt(e.target.value) || 0)))}
                      inputProps={{ min: 1, max: 99 }}
                      helperText="Recommended: 85%. Alert fires when storage exceeds this value."
                      sx={{ mb: 2 }}
                    />

                    {/* Threshold Meaning */}
                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'action.hover' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Alert Levels</Typography>
                      {[
                        { range: '< 75%', label: 'Safe — No alert triggered', color: '#10B981' },
                        { range: '75–89%', label: 'Warning — Yellow alert banner', color: '#F59E0B' },
                        { range: '≥ 90%', label: 'Critical — Red alert, action required', color: '#F43F5E' },
                      ].map(({ range, label, color }) => (
                        <Box key={range} sx={{ display: 'flex', gap: 1.5, mb: 0.5, alignItems: 'center' }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                          <Typography variant="caption">
                            <strong style={{ color }}>{range}</strong> — {label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleSaveStorage}
                        sx={{ borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, var(--indigo), var(--violet))' }}
                      >
                        Save Storage Settings
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
           </TabPanel>
          {user?.role?.name === 'Super Admin' && (
            <TabPanel value={activeTab} index={4}>
              <EmailSettingsTab />
            </TabPanel>
          )}
          {user?.role?.name === 'Super Admin' && (
            <TabPanel value={activeTab} index={5}>
              <GoogleDriveSettingsTab />
            </TabPanel>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default Settings;
