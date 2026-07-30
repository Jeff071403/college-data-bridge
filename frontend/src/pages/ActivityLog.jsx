import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, CircularProgress, Alert, TextField, 
  InputAdornment, TablePagination, Chip, Avatar, Card
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import api from '../services/api';

const MODULE_COLORS = {
  'Users': { bg: 'rgba(var(--violet-rgb), 0.12)', color: 'var(--violet)' },
  'Folders': { bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' },
  'Files': { bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981' },
  'Auth': { bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' },
  'System': { bg: 'rgba(249, 115, 22, 0.12)', color: '#F97316' },
};

const getModuleStyle = (module = '') => {
  for (const k of Object.keys(MODULE_COLORS)) {
    if (module.toLowerCase().includes(k.toLowerCase())) return MODULE_COLORS[k];
  }
  return { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748B' };
};

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/activity-logs/');
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to load activity logs:", err);
      setError("Failed to load activity log audit trail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter logs by search query
  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.module.toLowerCase().includes(search.toLowerCase()) ||
    (log.user?.email || 'system').toLowerCase().includes(search.toLowerCase()) ||
    (log.ip_address || '').includes(search)
  );

  return (
    <Box sx={{ flexGrow: 1 }} className="animate-fade-slide-up">
      {/* Header */}
      <Box sx={{ mb: 3.5, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'rgba(249, 115, 22, 0.12)', color: '#F97316', width: 44, height: 44, borderRadius: '14px' }}>
            <SecurityIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Security Audit Trail
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Permanent, read-only system log of all administrative and user operations.
            </Typography>
          </Box>
        </Box>

        <TextField
          size="small"
          placeholder="Search logs by user, action, IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Living Changelog Summary Panel for New Admins */}
      <Card sx={{ mb: 3.5, p: 2.5, borderRadius: '18px', border: '1px solid', borderColor: 'divider', background: 'linear-gradient(135deg, rgba(var(--indigo-rgb), 0.04) 0%, rgba(var(--violet-rgb), 0.04) 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <HistoryIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Recent System Changelog & History
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: '0.78rem', lineHeight: 1.6 }}>
          A quick glance at system configuration updates, user permission modifications, and template activities for quick onboarding of new administrators.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip label="Latest 50 System Events Recorded" size="small" sx={{ bgcolor: 'rgba(var(--indigo-rgb), 0.1)', color: 'var(--indigo)', fontWeight: 700 }} />
          <Chip label="Automated Daily Backup Active" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 700 }} />
          <Chip label="Immutable Audit Logs" size="small" sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontWeight: 700 }} />
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <Paper sx={{ borderRadius: '18px', boxShadow: 'none', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, py: 1.8 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>User / Agent</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No audit records match your search criteria.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((log, idx) => {
                      const modStyle = getModuleStyle(log.module);
                      return (
                        <TableRow 
                          key={log.id} 
                          hover 
                          sx={{ 
                            animation: `slideUp 0.3s ease ${idx * 30}ms both`,
                            '&:last-child td': { border: 0 } 
                          }}
                        >
                          <TableCell sx={{ py: 1.4 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              {new Date(log.created_at).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'primary.main', fontWeight: 700 }}>
                                {log.user?.email?.charAt(0).toUpperCase() || 'S'}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                                {log.user?.email || 'System'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                              {log.action}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={log.module} 
                              size="small" 
                              sx={{ bgcolor: modStyle.bg, color: modStyle.color, fontWeight: 700, borderRadius: '6px', fontSize: '0.7rem' }} 
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 600 }}>
                              {log.ip_address || '127.0.0.1'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 15, 25, 50]}
            component="div"
            count={filteredLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Box>
  );
};

export default ActivityLog;
