import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Box, Button, Card, Typography, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Select, FormControl, 
  InputLabel, Alert, Grid, Divider, FormControlLabel,
  Autocomplete
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SecurityIcon from '@mui/icons-material/Security';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── Shared field styles ──────────────────────────────────────────────────────
const FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#fff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
    '& fieldset': { borderColor: 'rgba(0,0,0,0.23)', borderWidth: '1.5px', transition: 'border-color 0.18s' },
    '&:hover fieldset': { borderColor: '#111827' },
    '&.Mui-focused fieldset': { borderColor: '#7C3AED', borderWidth: '2px' },
    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(124,58,237,0.12)' },
  },
  '& .MuiInputLabel-root': {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
    '&.Mui-focused': { color: '#7C3AED' },
  },
  '& .MuiFormHelperText-root': { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px' },
};

const SELECT_SX = {
  borderRadius: '12px',
  backgroundColor: '#fff',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '14px',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.23)', borderWidth: '1.5px' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#111827' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7C3AED', borderWidth: '2px' },
  '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(124,58,237,0.12)' },
};

const LABEL_SX = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '14px',
  '&.Mui-focused': { color: '#7C3AED' },
};

const MENU_ITEM_SX = { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' };

// ─── Custom Portal Department Select ─────────────────────────────────────────
const DepartmentSelect = ({ value, onChange, options, disabled, label = 'Department', required, saveAttempted }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [touched, setTouched] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  // Reset touch state when saveAttempted resets
  useEffect(() => { if (!saveAttempted) setTouched(false); }, [saveAttempted]);

  const showSearch = options.length > 6;
  const filtered = showSearch
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedLabel = options.find(o => o.value === value)?.label || '';
  const hasValue = Boolean(selectedLabel);
  const showError = (touched || saveAttempted) && required && !value;

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  const openDrop = () => {
    if (disabled) return;
    calcPos();
    setOpen(true);
    setHighlightIdx(-1);
    setSearch('');
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 40);
  };

  const closeDrop = useCallback(() => {
    setOpen(false);
    setSearch('');
    setHighlightIdx(-1);
  }, []);

  const selectOpt = (opt) => {
    onChange(opt.value);
    closeDrop();
    setTouched(true);
    triggerRef.current?.focus();
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        closeDrop();
        setTouched(true);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, closeDrop]);

  // Reposition on scroll / resize
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);
    return () => {
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [open, calcPos]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!listRef.current || highlightIdx < 0) return;
    const items = listRef.current.querySelectorAll('[role="option"]');
    items[highlightIdx]?.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx]);

  const handleTriggerKey = (e) => {
    if (disabled) return;
    if (['Enter', ' ', 'ArrowDown'].includes(e.key)) { e.preventDefault(); openDrop(); }
  };

  const handleDropKey = (e) => {
    if (e.key === 'Escape') { closeDrop(); triggerRef.current?.focus(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && highlightIdx >= 0) { e.preventDefault(); selectOpt(filtered[highlightIdx]); }
    if (e.key === 'Tab') { closeDrop(); }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Trigger */}
      <Box
        ref={triggerRef}
        onClick={openDrop}
        onKeyDown={handleTriggerKey}
        onBlur={(e) => { if (!dropdownRef.current?.contains(e.relatedTarget)) { if (!open) setTouched(true); } }}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={open}
        aria-controls="dept-listbox"
        aria-label={label}
        aria-required={required}
        aria-disabled={disabled}
        aria-activedescendant={highlightIdx >= 0 ? `dept-opt-${highlightIdx}` : undefined}
        sx={{
          position: 'relative',
          height: '56px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: '14px',
          border: '1.5px solid',
          borderColor: showError ? '#d32f2f' : open ? '#7C3AED' : disabled ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.23)',
          borderRadius: '12px',
          backgroundColor: disabled ? 'rgba(0,0,0,0.04)' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
          boxShadow: open ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
          userSelect: 'none',
          '&:hover': { borderColor: showError ? '#d32f2f' : open ? '#7C3AED' : disabled ? 'rgba(0,0,0,0.12)' : '#111827' },
          '&:focus-visible': { outline: 'none', borderColor: '#7C3AED', boxShadow: '0 0 0 3px rgba(124,58,237,0.12)' },
        }}
      >
        {/* Floating label */}
        <Box
          component="span"
          aria-hidden="true"
          sx={{
            position: 'absolute',
            left: '11px',
            top: (open || hasValue) ? '-9px' : '50%',
            transform: (open || hasValue) ? 'none' : 'translateY(-50%)',
            fontSize: (open || hasValue) ? '11.5px' : '14px',
            fontWeight: (open || hasValue) ? 500 : 400,
            color: showError ? '#d32f2f' : (open || hasValue) ? '#7C3AED' : disabled ? 'rgba(0,0,0,0.38)' : 'rgba(0,0,0,0.6)',
            bgcolor: disabled ? 'transparent' : '#fff',
            px: (open || hasValue) ? '4px' : 0,
            lineHeight: 1,
            transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
            pointerEvents: 'none',
            zIndex: 1,
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: (open || hasValue) ? '0.02em' : 'normal',
          }}
        >
          {label}{required ? ' *' : ''}
        </Box>

        {/* Selected value text */}
        <Typography
          sx={{
            fontSize: '14px',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: disabled ? 'rgba(0,0,0,0.38)' : hasValue ? 'rgba(0,0,0,0.87)' : 'transparent',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mt: hasValue ? '2px' : 0,
          }}
        >
          {selectedLabel || '\u00A0'}
        </Typography>

        {/* Chevron */}
        <Box
          component="span"
          sx={{
            ml: 0.5,
            display: 'flex',
            alignItems: 'center',
            color: open ? '#7C3AED' : disabled ? 'rgba(0,0,0,0.26)' : 'rgba(0,0,0,0.54)',
            transition: 'transform 0.2s ease, color 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'none',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Box>
      </Box>

      {/* Helper / Error text */}
      <Box sx={{ minHeight: '20px', mt: '3px', mx: '14px' }}>
        {showError ? (
          <Typography sx={{ fontSize: '12px', color: '#d32f2f', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Department is required.
          </Typography>
        ) : !hasValue && disabled ? (
          <Typography sx={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Select a stream first.
          </Typography>
        ) : null}
      </Box>

      {/* Portal Dropdown */}
      {open && createPortal(
        <Box
          ref={dropdownRef}
          id="dept-listbox"
          role="listbox"
          aria-label={label}
          onKeyDown={handleDropKey}
          sx={{
            position: 'fixed',
            top: `${dropPos.top}px`,
            left: `${dropPos.left}px`,
            width: `${dropPos.width}px`,
            zIndex: 9999,
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '260px',
            animation: 'deptFadeIn 0.14s cubic-bezier(0.4,0,0.2,1)',
            '@keyframes deptFadeIn': {
              from: { opacity: 0, transform: 'translateY(-6px) scaleY(0.96)' },
              to: { opacity: 1, transform: 'translateY(0) scaleY(1)' },
            },
          }}
        >
          {/* Search box */}
          {showSearch && (
            <Box sx={{ p: '8px', borderBottom: '1px solid #F3F4F6', flexShrink: 0, bgcolor: '#fff' }}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: '8px',
                px: '12px', py: '7px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                bgcolor: '#F9FAFB',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <Box
                  ref={searchRef}
                  component="input"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setHighlightIdx(-1); }}
                  onKeyDown={handleDropKey}
                  placeholder="Search department..."
                  sx={{
                    border: 'none', outline: 'none', background: 'transparent',
                    flex: 1, fontSize: '13px', color: '#111827', p: 0,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    '&::placeholder': { color: '#9CA3AF' },
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Options list */}
          <Box
            ref={listRef}
            sx={{
              overflowY: 'auto',
              flex: 1,
              py: '4px',
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': { background: '#C7C3FF', borderRadius: '99px', '&:hover': { background: '#A78BFA' } },
              scrollbarWidth: 'thin',
              scrollbarColor: '#C7C3FF transparent',
            }}
          >
            {filtered.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '13px', color: '#9CA3AF', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  No departments found
                </Typography>
              </Box>
            ) : (
              filtered.map((opt, idx) => {
                const isSel = opt.value === value;
                const isHigh = idx === highlightIdx;
                return (
                  <Box
                    key={opt.value}
                    id={`dept-opt-${idx}`}
                    role="option"
                    aria-selected={isSel}
                    onClick={() => selectOpt(opt)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    sx={{
                      px: 2,
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontWeight: isSel ? 600 : 400,
                      color: (isSel || isHigh) ? '#5B3DF5' : '#111827',
                      backgroundColor: isSel ? '#EDE9FE' : isHigh ? '#F5F3FF' : 'transparent',
                      transition: 'background-color 0.1s ease, color 0.1s ease',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label}
                    </span>
                    {isSel && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5B3DF5" strokeWidth="2.5" style={{ flexShrink: 0, marginLeft: 8 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>,
        document.body
      )}
    </Box>
  );
};

// ─── Main UserManagement Component ───────────────────────────────────────────
const UserManagement = () => {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saveAttempted, setSaveAttempted] = useState(false);

  // User Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState('Active');

  // Dynamic Master Data states
  const [deptCategories, setDeptCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredFormDepts, setFilteredFormDepts] = useState([]);
  const [deptCategory, setDeptCategory] = useState('');

  // Filter States
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterUserType, setFilterUserType] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Password reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');



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
      const deptCatsRes = await api.get('/api/mous/master/dept-categories/');
      setDeptCategories(deptCatsRes.data);
      const deptsRes = await api.get('/api/mous/master/departments/');
      setDepartments(deptsRes.data);
    } catch (err) {
      console.error('Failed to load user management data:', err);
      setError('Failed to load users list. Please check permission authorization.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Open creation dialog
  const handleCreateOpen = () => {
    setIsEditMode(false);
    setSelectedUser(null);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setDesignation('');
    setDeptCategory('');
    setDepartment('');
    setFilteredFormDepts([]);
    setRoleId('');
    setStatus('Active');
    setSaveAttempted(false);
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
    const userDept = userItem.department || '';
    const foundDept = departments.find(d => d.name === userDept);
    if (foundDept) {
      setDeptCategory(foundDept.category);
      setFilteredFormDepts(departments.filter(d => d.category === foundDept.category));
    } else {
      setDeptCategory('');
      setFilteredFormDepts([]);
    }
    setRoleId(userItem.role?.id || '');
    setStatus(userItem.status);
    setSaveAttempted(false);
    setUserDialogOpen(true);
  };

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    setDeptCategory(catId);
    setDepartment('');
    setFilteredFormDepts(departments.filter(d => d.category === catId));
  };

  // User creation/edit submission
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!department) {
      setSaveAttempted(true);
      return;
    }
    const payload = { email, name, phone, designation, department, role_id: roleId, status };
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
      console.error('Failed to save user:', err);
      setError(err.response?.data?.email?.[0] || err.response?.data?.detail || 'Failed to save user account details.');
    }
  };

  // Password reset
  const handleResetOpen = (userItem) => { setSelectedUser(userItem); setNewPassword(''); setResetDialogOpen(true); };
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    try {
      await api.post(`/api/users/${selectedUser.id}/reset-password/`, { password: newPassword });
      setResetDialogOpen(false);
      alert(`Password reset successful for ${selectedUser.email}`);
    } catch (err) {
      console.error('Failed to reset password:', err);
      setError('Failed to reset password.');
    }
  };



  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!u.name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
    }
    if (filterCategory) {
      const deptObj = departments.find(d => d.name === u.department);
      if (!deptObj || deptObj.category !== filterCategory) return false;
    }
    if (filterDept && u.department !== filterDept) return false;
    if (filterUserType) {
      const roleName = u.role?.name;
      const hasDept = !!u.department && u.department !== 'Principal Office' && u.department !== 'Administration Office';
      if (filterUserType === 'Super Admin' && roleName !== 'Super Admin') return false;
      if (filterUserType === 'Admin / Lawyer' && roleName !== 'Admin') return false;
      if (filterUserType === 'Dept. Coordinator' && (roleName !== 'User' || !hasDept)) return false;
      if (filterUserType === 'View Only' && (roleName !== 'User' || hasDept)) return false;
    }
    if (filterRole && u.role?.id !== filterRole) return false;
    if (filterStatus && u.status !== filterStatus) return false;
    return true;
  });

  // Compute dept options for DepartmentSelect
  const deptSelectOptions = filteredFormDepts.map(d => {
    const catObj = deptCategories.find(c => c.id === deptCategory);
    let lbl = d.name;
    if (catObj?.name === 'Aided' && lbl.endsWith(' (Aided)')) lbl = lbl.slice(0, -8);
    if (catObj?.name === 'Self-Financed (SFS)' && lbl.endsWith(' (SFS)')) lbl = lbl.slice(0, -6);
    return { value: d.name, label: lbl };
  }).sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>User Management</Typography>
          <Typography variant="body1" color="text.secondary">
            Manage users, assign roles, toggle statuses, and set permission overrides.
          </Typography>
        </Box>
        {(['Super Admin', 'Admin'].includes(user?.role?.name) || hasPermission('create_users')) && (
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleCreateOpen}>
            Add New User
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Role & Permission Legend */}
      <Box sx={{ mb: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden', boxShadow: 'none', bgcolor: 'background.paper' }}>
        <Box
          sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', bgcolor: 'action.hover' }}
          onClick={() => {
            const el = document.getElementById('role-legend-body');
            if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Role &amp; Permission Guide</Typography>
            <Chip label="Click to expand" size="small" sx={{ fontSize: '0.68rem', height: 20, bgcolor: 'rgba(79,70,229,0.1)', color: 'primary.main' }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>What each role can and cannot do</Typography>
        </Box>
        <Box id="role-legend-body" sx={{ display: 'none' }}>
          <Box sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Permission Name</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: '#7C3AED' }}>Super Admin</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: '#2563EB' }}>Admin</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: '#059669' }}>User</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: '#D97706' }}>View Only</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['View Dashboard & Stats', true, true, true, true],
                  ['View / Search Folders & Files', true, true, true, true],
                  ['Download & Preview Files', true, true, true, true],
                  ['Upload Files to Folders', true, true, true, false],
                  ['Create Root Folders & Subfolders', true, true, false, false],
                  ['Create & Edit MOUs', true, true, false, false],
                  ['Sign / Approve MOUs', true, true, true, false],
                  ['Manage Users & Roles', true, true, false, false],
                  ['View Activity Logs', true, true, false, false],
                  ['Delete Folders / Files', true, true, false, false],
                  ['Share Files Externally', true, true, true, false],
                ].map(([perm, ...vals], ri) => (
                  <tr key={perm} style={{ background: ri % 2 === 0 ? 'rgba(148,163,184,0.04)' : 'transparent' }}>
                    <td style={{ padding: '7px 12px', fontWeight: 500 }}>{perm}</td>
                    {vals.map((v, vi) => (
                      <td key={vi} style={{ padding: '7px 12px', textAlign: 'center' }}>
                        {v ? <span style={{ color: '#10B981', fontWeight: 700, fontSize: '1rem' }}>✓</span>
                           : <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      </Box>

      {/* Search & Filter Bar */}
      <Box sx={{ p: 3, mb: 3.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', bgcolor: 'background.paper', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Search &amp; Filter Directory</Typography>
          {(searchQuery || filterCategory || filterDept || filterUserType || filterRole || filterStatus) && (
            <Button
              size="small"
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('');
                setFilterDept('');
                setFilterUserType('');
                setFilterRole('');
                setFilterStatus('');
              }}
              sx={{ fontSize: '0.78rem', textTransform: 'none', color: 'primary.main', fontWeight: 600 }}
            >
              Clear All Filters
            </Button>
          )}
        </Box>

        {/* Row 1: Search */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            label="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                bgcolor: '#fff',
              }
            }}
          />
        </Box>

        {/* Row 2: 5 Filters in Responsive CSS Grid */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(5, 1fr)',
          },
          gap: 2,
          width: '100%',
        }}>
          {/* Stream */}
          <FormControl fullWidth size="small">
            <InputLabel>Stream</InputLabel>
            <Select
              value={filterCategory}
              label="Stream"
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setFilterDept('');
              }}
              sx={{ borderRadius: '10px', bgcolor: '#fff' }}
            >
              <MenuItem value="">All Streams</MenuItem>
              {deptCategories.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Department */}
          <Autocomplete
            size="small"
            disabled={!filterCategory}
            options={departments.filter(d => d.category === filterCategory)}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              const catObj = deptCategories.find(c => c.id === filterCategory);
              let n = option.name;
              if (catObj?.name === 'Aided' && n.endsWith(' (Aided)')) return n.slice(0, -8);
              if (catObj?.name === 'Self-Financed (SFS)' && n.endsWith(' (SFS)')) return n.slice(0, -6);
              return n;
            }}
            value={departments.find(d => d.name === filterDept) || null}
            onChange={(e, newVal) => setFilterDept(newVal ? newVal.name : '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Department"
                placeholder="Select dept..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }}
              />
            )}
            fullWidth
          />

          {/* User Type */}
          <FormControl fullWidth size="small">
            <InputLabel>User Type</InputLabel>
            <Select
              value={filterUserType}
              label="User Type"
              onChange={(e) => setFilterUserType(e.target.value)}
              sx={{ borderRadius: '10px', bgcolor: '#fff' }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="Super Admin">Super Admin</MenuItem>
              <MenuItem value="Admin / Lawyer">Admin / Lawyer</MenuItem>
              <MenuItem value="Dept. Coordinator">Dept. Coordinator</MenuItem>
              <MenuItem value="View Only">View Only</MenuItem>
            </Select>
          </FormControl>

          {/* Role */}
          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select
              value={filterRole}
              label="Role"
              onChange={(e) => setFilterRole(e.target.value)}
              sx={{ borderRadius: '10px', bgcolor: '#fff' }}
            >
              <MenuItem value="">All Roles</MenuItem>
              {roles.map(r => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status */}
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ borderRadius: '10px', bgcolor: '#fff' }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Disabled">Disabled</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

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
              {filteredUsers.map((userItem) => (
                <TableRow key={userItem.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{userItem.name}</TableCell>
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell>
                    <Chip label={userItem.role?.name || 'No Role'} color="primary" size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{userItem.department || '—'}</TableCell>
                  <TableCell>
                    <Chip label={userItem.status} color={userItem.status === 'Active' ? 'success' : 'error'} size="small" />
                  </TableCell>
                  <TableCell>{userItem.last_login ? new Date(userItem.last_login).toLocaleString() : 'Never'}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      {(['Super Admin', 'Admin'].includes(user?.role?.name) || hasPermission('edit_users')) && (
                        <>
                          <IconButton size="small" title="Edit Profile" onClick={() => handleEditOpen(userItem)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" title="Reset Password" onClick={() => handleResetOpen(userItem)}><LockOpenIcon fontSize="small" /></IconButton>
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

      {/* ═══════════════════════════════════════════════════════════
          CREATE / EDIT USER DIALOG — Enterprise Grade
      ════════════════════════════════════════════════════════════ */}
      <Dialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: '900px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: '20px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            m: 2,
          }
        }}
      >
        <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          {/* ── Fixed Header ── */}
          <Box sx={{
            px: 4, py: 2.5,
            borderBottom: '1px solid #F3F4F6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0, bgcolor: 'background.paper',
          }}>
            <Box>
              <Typography sx={{
                fontWeight: 700, fontSize: '1.1rem',
                fontFamily: 'Inter, system-ui, sans-serif',
                color: 'text.primary',
              }}>
                {isEditMode ? '✏️  Edit User Account' : '👤  Create User Account'}
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontFamily: 'Inter, system-ui, sans-serif', mt: 0.3 }}>
                {isEditMode ? 'Update the user profile, role, and department assignment.' : 'Fill in all required fields to create a new user.'}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setUserDialogOpen(false)}
              sx={{ color: 'text.secondary', ml: 2, '&:hover': { bgcolor: 'action.hover' }, borderRadius: '10px' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* ── Scrollable Form Body (2-Column CSS Grid) ── */}
          <Box sx={{ px: 4, py: 3.5, overflowY: 'auto', flex: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: '20px 24px',
              width: '100%',
            }}>
              {/* Row 1: Username/Email + Password */}
              <Box>
                <TextField
                  label="Email (Username)"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isEditMode}
                  required
                  sx={FIELD_SX}
                />
              </Box>
              <Box>
                {!isEditMode ? (
                  <TextField
                    label="Temporary Password"
                    type="password"
                    fullWidth
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    sx={FIELD_SX}
                  />
                ) : (
                  <TextField
                    label="Email (Login ID)"
                    fullWidth
                    value={email}
                    disabled
                    helperText="Email cannot be changed after account creation."
                    sx={FIELD_SX}
                  />
                )}
              </Box>

              {/* Row 2: Full Name + Designation */}
              <Box>
                <TextField
                  label="Full Name"
                  fullWidth
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  sx={FIELD_SX}
                />
              </Box>
              <Box>
                <TextField
                  label="Designation / Title"
                  fullWidth
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  sx={FIELD_SX}
                />
              </Box>

              {/* Row 3: Stream + Department (custom portal) */}
              <Box>
                <FormControl fullWidth required>
                  <InputLabel sx={LABEL_SX}>Stream</InputLabel>
                  <Select
                    value={deptCategory}
                    label="Stream"
                    onChange={handleCategoryChange}
                    sx={SELECT_SX}
                  >
                    {deptCategories.map(c => (
                      <MenuItem key={c.id} value={c.id} sx={MENU_ITEM_SX}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <DepartmentSelect
                  value={department}
                  onChange={setDepartment}
                  options={deptSelectOptions}
                  disabled={!deptCategory}
                  label="Department"
                  required
                  saveAttempted={saveAttempted}
                />
              </Box>

              {/* Row 4: System Role + Account Status */}
              <Box>
                <FormControl fullWidth required>
                  <InputLabel sx={LABEL_SX}>System Role</InputLabel>
                  <Select
                    value={roleId}
                    label="System Role"
                    onChange={e => setRoleId(e.target.value)}
                    sx={SELECT_SX}
                  >
                    {roles.map(r => (
                      <MenuItem key={r.id} value={r.id} sx={MENU_ITEM_SX}>{r.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FormControl fullWidth required>
                  <InputLabel sx={LABEL_SX}>Account Status</InputLabel>
                  <Select
                    value={status}
                    label="Account Status"
                    onChange={e => setStatus(e.target.value)}
                    sx={SELECT_SX}
                  >
                    <MenuItem value="Active" sx={MENU_ITEM_SX}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
                        Active
                      </Box>
                    </MenuItem>
                    <MenuItem value="Disabled" sx={MENU_ITEM_SX}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444', flexShrink: 0 }} />
                        Disabled
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>

          {/* ── Fixed Footer ── */}
          <Box sx={{
            px: 4, py: 2.5,
            borderTop: '1px solid #F3F4F6',
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5,
            flexShrink: 0, bgcolor: 'background.paper',
          }}>
            <Button
              onClick={() => setUserDialogOpen(false)}
              variant="outlined"
              sx={{
                borderRadius: '10px', fontWeight: 600, px: 3,
                fontFamily: 'Inter, system-ui, sans-serif',
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                borderRadius: '10px', fontWeight: 700, px: 4,
                fontFamily: 'Inter, system-ui, sans-serif',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA, #6D28D9)',
                  boxShadow: '0 6px 20px rgba(124,58,237,0.5)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.18s ease',
              }}
            >
              {isEditMode ? 'Save Changes' : '✓  Create Account'}
            </Button>
          </Box>
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


    </Box>
  );
};

export default UserManagement;
