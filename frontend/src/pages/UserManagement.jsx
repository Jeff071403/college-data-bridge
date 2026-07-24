import React, { useEffect, useState } from 'react';
import { 
  Box, Button, Card, CardContent, Typography, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Select, FormControl, 
  InputLabel, Alert, Grid, Divider, RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SecurityIcon from '@mui/icons-material/Security';
import CircularProgress from '@mui/material/CircularProgress';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // User Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState('Active');

  // Password reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Permissions Override dialog
  const [permsDialogOpen, setPermsDialogOpen] = useState(false);
  const [overrideSettings, setOverrideSettings] = useState({}); // { [permId]: 'inherit' | 'grant' | 'revoke' }

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersRes = await api.get('/api/users/');
      setUsers(usersRes.data);
      
      const rolesRes = await api.get('/api/roles/');
      setRoles(rolesRes.data);
      
      const permsRes = await api.get('/api/permissions/');
      setAllPermissions(permsRes.data);
    } catch (err) {
      console.error("Failed to load user management data:", err);
      setError("Failed to load users list. Please check permission authorization.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open creation dialog
  const handleCreateOpen = () => {
    setIsEditMode(false);
    setSelectedUser(null);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setDesignation('');
    setDepartment('');
    setRoleId('');
    setStatus('Active');
    setUserDialogOpen(true);
  };

  // Open edit dialog
  const handleEditOpen = (userItem) => {
    setIsEditMode(true);
    setSelectedUser(userItem);
    setEmail(userItem.email);
    setName(userItem.name);
    setPhone(userItem.phone || '');
    setDesignation(userItem.designation || '');
    setDepartment(userItem.department || '');
    setRoleId(userItem.role?.id || '');
    setStatus(userItem.status);
    setUserDialogOpen(true);
  };

  // User creation/edit submission
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      email,
      name,
      phone,
      designation,
      department,
      role_id: roleId,
      status
    };

    try {
      if (isEditMode) {
        await api.put(`/api/users/${selectedUser.id}/`, payload);
      } else {
        payload.password = password;
        await api.post('/api/users/', payload);
      }
      setUserDialogOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to save user:", err);
      setError(err.response?.data?.email?.[0] || err.response?.data?.detail || "Failed to save user account details.");
    }
  };

  // Password reset submission
  const handleResetOpen = (userItem) => {
    setSelectedUser(userItem);
    setNewPassword('');
    setResetDialogOpen(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) return;

    try {
      await api.post(`/api/users/${selectedUser.id}/reset-password/`, { password: newPassword });
      setResetDialogOpen(false);
      alert(`Password reset successful for user ${selectedUser.email}`);
    } catch (err) {
      console.error("Failed to reset password:", err);
      setError("Failed to reset password.");
    }
  };

  // Permissions override editor
  const handlePermsOpen = (userItem) => {
    setSelectedUser(userItem);
    
    // Build initial override states map based on user's current overrides
    const initialOverrides = {};
    
    // Prefill defaults to 'inherit' for all system permissions
    allPermissions.forEach((p) => {
      initialOverrides[p.id] = 'inherit';
    });

    // Overwrite with user overrides
    if (userItem.permissions_override) {
      userItem.permissions_override.forEach((ov) => {
        initialOverrides[ov.permission.id] = ov.is_granted ? 'grant' : 'revoke';
      });
    }

    setOverrideSettings(initialOverrides);
    setPermsDialogOpen(true);
  };

  const handleOverrideChange = (permId, value) => {
    setOverrideSettings((prev) => ({
      ...prev,
      [permId]: value
    }));
  };

  const handlePermsSubmit = async () => {
    // Collect overrides that are NOT set to 'inherit'
    const overridesList = [];
    Object.keys(overrideSettings).forEach((permId) => {
      const state = overrideSettings[permId];
      if (state !== 'inherit') {
        overridesList.push({
          permission_id: parseInt(permId),
          is_granted: state === 'grant'
        });
      }
    });

    try {
      await api.post(`/api/users/${selectedUser.id}/assign-permissions/`, { permissions: overridesList });
      setPermsDialogOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to save overrides:", err);
      setError("Failed to save permission overrides.");
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage users, assign roles, toggle statuses, and set permission overrides.
          </Typography>
        </Box>
        {hasPermission('create_users') && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleCreateOpen}
          >
            Add New User
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ── Role & Permission Legend ── */}
      <Card sx={{ mb: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
        <Box
          sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', bgcolor: 'action.hover' }}
          onClick={() => {
            const el = document.getElementById('role-legend-body');
            if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Role & Permission Guide</Typography>
            <Chip label="Click to expand" size="small" sx={{ fontSize: '0.68rem', height: 20, bgcolor: 'rgba(79,70,229,0.1)', color: 'primary.main' }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
            What each role can and cannot do
          </Typography>
        </Box>
        <Box id="role-legend-body" sx={{ display: 'none' }}>
          <Divider />
          <Box sx={{ p: 2.5, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  {['Permission', 'Super Admin', 'Admin', 'Lawyer / MOU Admin', 'Dept. Coordinator', 'View Only'].map((h, i) => (
                    <th key={h} style={{
                      padding: '8px 12px', textAlign: i === 0 ? 'left' : 'center',
                      fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: '#94A3B8', borderBottom: '1px solid rgba(148,163,184,0.2)',
                      background: i === 0 ? 'transparent' : 'transparent'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Create & Upload MOUs',          true,  true,  true,  false, false],
                  ['View all MOUs (system-wide)',    true,  true,  false, false, false],
                  ['View assigned MOUs',             true,  true,  true,  true,  true ],
                  ['Edit & Update MOUs',             true,  true,  true,  false, false],
                  ['Sign / Approve MOUs',            true,  true,  true,  false, false],
                  ['Manage Users & Roles',           true,  true,  false, false, false],
                  ['View Activity Logs',             true,  true,  false, false, false],
                  ['Override Permissions',           true,  false, false, false, false],
                  ['Delete Folders / Files',         true,  true,  false, false, false],
                  ['Share Files Externally',         true,  true,  true,  false, false],
                ].map(([perm, ...vals], ri) => (
                  <tr key={perm} style={{ background: ri % 2 === 0 ? 'rgba(148,163,184,0.04)' : 'transparent' }}>
                    <td style={{ padding: '7px 12px', fontWeight: 500, color: 'inherit' }}>{perm}</td>
                    {vals.map((v, vi) => (
                      <td key={vi} style={{ padding: '7px 12px', textAlign: 'center' }}>
                        {v
                          ? <span style={{ color: '#10B981', fontWeight: 700, fontSize: '1rem' }}>✓</span>
                          : <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>—</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <Box sx={{ mt: 2, p: 1.5, borderRadius: '10px', bgcolor: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.12)' }}>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '0.75rem' }}>
                <strong style={{ color: '#4F46E5' }}>Note:</strong> Individual users can have permission overrides that differ from their role defaults. Use the 🔑 Permissions button on each user row to set custom overrides. Role assignments always serve as the baseline.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((userItem) => (
                <TableRow key={userItem.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{userItem.name}</TableCell>
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={userItem.role?.name || 'No Role'} 
                      color="primary" 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{userItem.department || '—'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={userItem.status} 
                      color={userItem.status === 'Active' ? 'success' : 'error'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {userItem.last_login ? new Date(userItem.last_login).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      {hasPermission('edit_users') && (
                        <>
                          <IconButton size="small" title="Edit Profile" onClick={() => handleEditOpen(userItem)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Reset Password" onClick={() => handleResetOpen(userItem)}>
                            <LockOpenIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Permission Overrides" onClick={() => handlePermsOpen(userItem)}>
                            <SecurityIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create / Edit User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleUserSubmit}>
          <DialogTitle>{isEditMode ? 'Edit User Details' : 'Create User Account'}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEditMode}
                  required
                />
              </Grid>
              {!isEditMode && (
                <Grid item xs={12}>
                  <TextField
                    label="Temporary Password"
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  type="text"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  type="text"
                  fullWidth
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Designation"
                  type="text"
                  fullWidth
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Department"
                  type="text"
                  fullWidth
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="role-label">System Role</InputLabel>
                  <Select
                    labelId="role-label"
                    value={roleId}
                    label="System Role"
                    onChange={(e) => setRoleId(e.target.value)}
                  >
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="status-label">Account Status</InputLabel>
                  <Select
                    labelId="status-label"
                    value={status}
                    label="Account Status"
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <form onSubmit={handleResetSubmit}>
          <DialogTitle>Reset Password: {selectedUser?.email}</DialogTitle>
          <DialogContent sx={{ minWidth: 320 }}>
            <TextField
              autoFocus
              margin="dense"
              label="New Password"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
            <Button type="submit" color="primary" variant="contained">Update Password</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Permissions Overrides Dialog */}
      <Dialog open={permsDialogOpen} onClose={() => setPermsDialogOpen(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle>Permission Overrides: {selectedUser?.name}</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Permission</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>Override Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allPermissions.map((perm) => (
                  <TableRow key={perm.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{perm.name}</TableCell>
                    <TableCell>{perm.description}</TableCell>
                    <TableCell align="right" sx={{ minWidth: 300 }}>
                      <RadioGroup
                        row
                        value={overrideSettings[perm.id] || 'inherit'}
                        onChange={(e) => handleOverrideChange(perm.id, e.target.value)}
                        sx={{ justifyContent: 'flex-end', gap: 1 }}
                      >
                        <FormControlLabel value="inherit" control={<Radio size="small" />} label="Inherit" />
                        <FormControlLabel value="grant" control={<Radio size="small" />} label="Grant" />
                        <FormControlLabel value="revoke" control={<Radio size="small" />} label="Revoke" />
                      </RadioGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePermsSubmit} variant="contained">Save Overrides</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
