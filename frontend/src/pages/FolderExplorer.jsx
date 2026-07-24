import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Box, Grid, Card, CardContent, Typography, Button, IconButton, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, CircularProgress, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Menu, MenuItem, ListItemIcon, ListItemText,
  Alert, Divider, Chip, ToggleButtonGroup, ToggleButton, Switch, 
  FormControlLabel, Autocomplete
} from '@mui/material';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import GetAppIcon from '@mui/icons-material/GetApp';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import DeleteIcon from '@mui/icons-material/Delete';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import BreadcrumbNav from '../components/BreadcrumbNav';
import FilePreviewModal from '../components/FilePreviewModal';

const FolderExplorer = () => {
  const { user, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamQuery = searchParams.get('search') || '';

  const folderParam = searchParams.get('folder');
  const currentFolderId = folderParam ? parseInt(folderParam) : null;
  const setCurrentFolderId = (folderId) => {
    if (folderId === null) {
      setSearchParams({});
    } else {
      setSearchParams({ folder: folderId });
    }
  };
  const [folderData, setFolderData] = useState({ subfolders: [], files: [] });
  const [currentFolder, setCurrentFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // Options Menu state
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeItem, setActiveItem] = useState(null); // { type: 'folder'|'file', data: obj }


  // Action Dialogs
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameName, setRenameName] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [accessList, setAccessList] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserForAccess, setSelectedUserForAccess] = useState(null);
  const [accessGrantState, setAccessGrantState] = useState(true);

  // File preview Modal
  const [previewFile, setPreviewFile] = useState(null);

  // Fetch folders and files contents
  const fetchContents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (searchParamQuery) {
        // Search Results mode
        const res = await api.get(`/api/search/?q=${encodeURIComponent(searchParamQuery)}`);
        setFolderData({ subfolders: res.data.folders, files: res.data.files });
        setCurrentFolder(null);
      } else if (currentFolderId === null) {
        // Root Directory
        const res = await api.get('/api/folders/root/');
        setFolderData({ subfolders: res.data.subfolders, files: [] });
        setCurrentFolder(null);
      } else {
        // Inner Directory
        const res = await api.get(`/api/folders/${currentFolderId}/contents/`);
        setFolderData(res.data);
        const folderRes = await api.get(`/api/folders/${currentFolderId}/`);
        setCurrentFolder(folderRes.data);
      }
    } catch (err) {
      console.error("Failed to load contents:", err);
      setError("Failed to retrieve directory contents. Check permissions.");
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, searchParamQuery]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  // Navigate folder helper
  const handleFolderClick = (folderId) => {
    if (searchParamQuery) {
      // Clear search query on folder click
      setSearchParams({});
    }
    setCurrentFolderId(folderId);
  };

  // Menu Handlers
  const handleMenuOpen = (e, item, type) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setActiveItem({ type, data: item });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActiveItem(null);
  };

  // Add Folder
  const handleCreateFolderSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      await api.post('/api/folders/', {
        name: folderName.trim(),
        parent_id: currentFolderId
      });
      setFolderDialogOpen(false);
      setFolderName('');
      fetchContents();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create folder.");
    }
  };

  // Upload File
  const handleFileUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('folder_id', currentFolderId);

    try {
      await api.post('/api/files/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFileDialogOpen(false);
      setSelectedFile(null);
      fetchContents();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload file.");
    }
  };

  // Rename action
  const handleRenameClick = () => {
    setRenameName(activeItem.data.name);
    setRenameDialogOpen(true);
    handleMenuClose();
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameName.trim()) return;

    try {
      if (activeItem.type === 'folder') {
        await api.put(`/api/folders/${activeItem.data.id}/`, { name: renameName.trim() });
      } else {
        await api.put(`/api/files/${activeItem.data.id}/`, { name: renameName.trim() });
      }
      setRenameDialogOpen(false);
      fetchContents();
    } catch (err) {
      setError(err.response?.data?.detail || "Rename failed.");
    }
  };

  // Delete Action
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteSubmit = async () => {
    try {
      if (activeItem.type === 'folder') {
        await api.delete(`/api/folders/${activeItem.data.id}/`);
      } else {
        await api.delete(`/api/files/${activeItem.data.id}/`);
      }
      setDeleteDialogOpen(false);
      fetchContents();
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed.");
    }
  };

  // Download File Action
  const handleDownloadClick = async () => {
    handleMenuClose();
    try {
      const response = await api.get(`/api/files/${activeItem.data.id}/download/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', activeItem.data.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  // Access Settings Actions
  const handleAccessClick = async () => {
    handleMenuClose();
    setAccessDialogOpen(true);
    try {
      // Get current folder's overrides
      const res = await api.get(`/api/folders/${activeItem.data.id}/permissions/`);
      setAccessList(res.data);
      // Load all users to select from
      const usersRes = await api.get('/api/users/');
      setAllUsers(usersRes.data);
    } catch (err) {
      console.error("Load access configuration failed:", err);
    }
  };

  const handleGrantAccessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserForAccess) return;

    try {
      await api.post(`/api/folders/${activeItem.data.id}/assign-access/`, {
        user_id: selectedUserForAccess.id,
        is_granted: accessGrantState
      });
      
      // Reload access list
      const res = await api.get(`/api/folders/${activeItem.data.id}/permissions/`);
      setAccessList(res.data);
      setSelectedUserForAccess(null);
    } catch (err) {
      console.error("Failed to grant folder access:", err);
    }
  };

  const triggerRename = (item, type) => {
    setActiveItem({ type, data: item });
    setRenameName(item.name);
    setRenameDialogOpen(true);
  };

  const triggerDelete = (item, type) => {
    setActiveItem({ type, data: item });
    setDeleteDialogOpen(true);
  };

  const triggerAccess = async (folderItem) => {
    setActiveItem({ type: 'folder', data: folderItem });
    setAccessDialogOpen(true);
    try {
      const res = await api.get(`/api/folders/${folderItem.id}/permissions/`);
      setAccessList(res.data);
      const usersRes = await api.get('/api/users/');
      setAllUsers(usersRes.data);
    } catch (err) {
      console.error("Load access configuration failed:", err);
    }
  };

  const triggerDownload = async (fileItem) => {
    try {
      const response = await api.get(`/api/files/${fileItem.id}/download/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileItem.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const getFileIconColor = (type) => {
    if (type.startsWith('image/')) return '#3b82f6';
    if (type === 'application/pdf') return '#ef4444';
    if (type.includes('word') || type.includes('officedocument.wordprocessing')) return '#2563eb';
    if (type.includes('excel') || type.includes('officedocument.spreadsheet')) return '#10b981';
    if (type.includes('powerpoint') || type.includes('officedocument.presentation')) return '#f97316';
    if (type.includes('zip') || type.includes('compressed')) return '#8b5cf6';
    return '#6b7280';
  };

  return (
    <Box sx={{ flexGrow: 1 }} className="animate-fade-in">
      {/* Breadcrumbs Row wrapped in a modern card */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        {!searchParamQuery ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff', 
            py: 1, 
            px: 2, 
            borderRadius: '24px',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <FolderIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
            <BreadcrumbNav 
              path={currentFolder ? currentFolder.path : []} 
              onFolderClick={handleFolderClick} 
            />
          </Box>
        ) : (
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Search Results for "{searchParamQuery}"
          </Typography>
        )}
      </Box>

      {/* Controls Row */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: 2, 
        mb: 4 
      }}>
        {/* Left Side: local tools */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* List/Grid View Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, next) => next && setViewMode(next)}
            size="small"
            sx={{ 
              bgcolor: 'background.paper',
              borderRadius: '24px',
              p: 0.2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '24px',
                px: 1.5,
                py: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#ffffff',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }
              }
            }}
          >
            <ToggleButton value="list"><ViewListIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="grid"><GridViewIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>

          {/* Sort selection button */}
          <Button
            size="small"
            variant="outlined"
            sx={{ 
              borderColor: 'divider', 
              borderRadius: '24px', 
              color: 'text.secondary',
              px: 2.5,
              py: 0.7,
              fontWeight: 600,
              bgcolor: 'background.paper'
            }}
          >
            Sort: Name A-Z
          </Button>
        </Box>

        {/* Right Side: Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {!searchParamQuery && (hasPermission('create_folder') || (currentFolderId && hasPermission('create_nested_folder'))) && (
            <Button
              variant="outlined"
              startIcon={<CreateNewFolderIcon />}
              onClick={() => setFolderDialogOpen(true)}
              sx={{ borderRadius: '24px', textTransform: 'none', fontWeight: 700 }}
            >
              New Folder
            </Button>
          )}

          {!searchParamQuery && currentFolderId && hasPermission('upload_files') && (
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => setFileDialogOpen(true)}
              sx={{ borderRadius: '24px', textTransform: 'none', fontWeight: 700 }}
            >
              Upload File
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <>
          {folderData.subfolders.length === 0 && folderData.files.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 12, border: '2px dashed', borderColor: 'divider', borderRadius: '16px' }}>
              <SearchOffIcon sx={{ fontSize: 60, mb: 1, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Empty Folder
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No folders or files found here.
              </Typography>
            </Box>
          ) : (
            <>
              {/* Folder list section */}
              {folderData.subfolders.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 2, letterSpacing: '0.5px' }}>
                    FOLDERS ({folderData.subfolders.length})
                  </Typography>

                  {viewMode === 'grid' ? (
                    <Grid container spacing={2.5}>
                      {folderData.subfolders.map((folder) => {
                        const deptStyle = folder.name.toLowerCase().includes('medical') ? { color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.12)' }
                          : folder.name.toLowerCase().includes('commerce') ? { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' }
                          : folder.name.toLowerCase().includes('arts') ? { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' }
                          : folder.name.toLowerCase().includes('engineering') || folder.name.toLowerCase().includes('cse') ? { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' }
                          : { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };

                        return (
                          <Grid item xs={12} sm={6} md={4} lg={2.4} key={folder.id}>
                            <Card 
                              className="card-lift"
                              sx={{ 
                                cursor: 'pointer',
                                height: '100%',
                                borderRadius: '18px',
                                position: 'relative',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderLeft: `4px solid ${deptStyle.color}`,
                                bgcolor: 'background.paper',
                                transition: 'all 0.22s ease',
                                '&:hover': { 
                                  borderColor: deptStyle.color, 
                                  bgcolor: deptStyle.bg,
                                }
                              }}
                              onDoubleClick={() => handleFolderClick(folder.id)}
                            >
                              {/* Absolute top actions menu */}
                              <IconButton 
                                size="small" 
                                onClick={(e) => handleMenuOpen(e, folder, 'folder')} 
                                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>

                              <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%', '&:last-child': { pb: 2.5 } }}>
                                <FolderIcon sx={{ color: deptStyle.color, fontSize: 56, mb: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }} />
                                
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.9rem', mb: 0.5, px: 0.5 }} noWrap>
                                  {folder.name}
                                </Typography>
                                
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  {folder.file_count} files • {folder.subfolder_count} folders
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  ) : (
                    // List view folders
                    <TableContainer component={Paper} sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: 'none', border: (theme) => `1px solid ${theme.palette.divider}` }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Folder Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Creator / Owner</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Last Modified</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Contents / Details</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, pr: 2 }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {folderData.subfolders.map((folder) => (
                            <TableRow 
                              key={folder.id} 
                              hover 
                              onDoubleClick={() => handleFolderClick(folder.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                                <FolderIcon sx={{ color: '#facc15', fontSize: 24 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{folder.name}</Typography>
                              </TableCell>
                              <TableCell>{folder.created_by?.name || 'System'}</TableCell>
                              <TableCell>{new Date(folder.updated_at).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                  {folder.file_count} files • {folder.subfolder_count} folders
                                </Typography>
                              </TableCell>
                              <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                <IconButton size="small" onClick={(e) => handleMenuOpen(e, folder, 'folder')}>
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* File list section */}
              {folderData.files.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 2, letterSpacing: '0.5px' }}>
                    FILES ({folderData.files.length})
                  </Typography>

                  {viewMode === 'grid' ? (
                    <Grid container spacing={2.5}>
                      {folderData.files.map((file) => {
                        const isPdf = file.file_type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                        const isImage = file.file_type.startsWith('image/') || file.name.toLowerCase().match(/\.(png|jpe?g|gif|webp)$/);
                        const isAdmin = user?.role?.name === 'Super Admin' || user?.role?.name === 'Admin';
                        const hasExplicitPreviewGrant = user?.permissions_override?.some(p => p.permission?.codename === 'preview_files' && p.is_granted === true);
                        const hasExplicitDownloadGrant = user?.permissions_override?.some(p => p.permission?.codename === 'download_files' && p.is_granted === true);
                        const canPreviewPdf = isAdmin || hasExplicitPreviewGrant;
                        const canDownloadPdf = isAdmin || hasExplicitDownloadGrant;
                        return (
                          <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                            <Card 
                              sx={{ 
                                cursor: 'pointer',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                borderRadius: '16px',
                                border: (theme) => `1px solid ${theme.palette.divider}`,
                                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.02)',
                                '&:hover': { 
                                  borderColor: 'primary.main', 
                                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,136,229,0.06)' : 'rgba(30,136,229,0.03)',
                                  transform: 'translateY(-2px)'
                                }
                              }}
                              onClick={() => {
                                if (isPdf && !canPreviewPdf) {
                                  setError("PDF previews are restricted to administrators.");
                                  return;
                                }
                                setPreviewFile(file);
                              }}
                            >
                              {/* Preview area container */}
                              <Box sx={{ 
                                height: 120, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
                                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                {isImage ? (
                                  <Box 
                                    component="img" 
                                    src={file.file_url} 
                                    alt={file.name} 
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <InsertDriveFileIcon sx={{ color: getFileIconColor(file.file_type), fontSize: 44 }} />
                                    {isPdf && (
                                      <Chip 
                                        label="PDF" 
                                        size="small" 
                                        sx={{ 
                                          bgcolor: '#ef4444', 
                                          color: '#ffffff', 
                                          fontWeight: 800, 
                                          fontSize: '0.65rem', 
                                          height: 18,
                                          position: 'absolute',
                                          top: 10,
                                          left: 10
                                        }} 
                                      />
                                    )}
                                  </Box>
                                )}
                              </Box>

                              <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, '&:last-child': { pb: 2 } }}>
                                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 0.5 }}>
                                  {file.name}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto', pt: 1, alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {file.size_formatted} • v{file.version_number}
                                  </Typography>
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => handleMenuOpen(e, file, 'file')}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  ) : (
                    // List view files
                    <TableContainer component={Paper} sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: 'none', border: (theme) => `1px solid ${theme.palette.divider}` }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>File Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Uploaded By</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Last Modified</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>File Size</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Version</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, pr: 2 }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {folderData.files.map((file) => {
                            const isPdf = file.file_type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                            const isAdmin = user?.role?.name === 'Super Admin' || user?.role?.name === 'Admin';
                            const hasExplicitPreviewGrant = user?.permissions_override?.some(p => p.permission?.codename === 'preview_files' && p.is_granted === true);
                            const hasExplicitDownloadGrant = user?.permissions_override?.some(p => p.permission?.codename === 'download_files' && p.is_granted === true);
                            const canPreviewPdf = isAdmin || hasExplicitPreviewGrant;
                            const canDownloadPdf = isAdmin || hasExplicitDownloadGrant;
                            return (
                              <TableRow 
                                key={file.id} 
                                hover 
                                onClick={() => {
                                  if (isPdf && !canPreviewPdf) {
                                    setError("PDF previews are restricted to administrators.");
                                    return;
                                  }
                                  setPreviewFile(file);
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                                  <InsertDriveFileIcon sx={{ color: getFileIconColor(file.file_type), fontSize: 24 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{file.name}</Typography>
                                </TableCell>
                                <TableCell>{file.uploaded_by?.name || 'System'}</TableCell>
                                <TableCell>{new Date(file.updated_at).toLocaleDateString()}</TableCell>
                                <TableCell>{file.size_formatted}</TableCell>
                                <TableCell>
                                  <Chip label={`v${file.version_number}`} size="small" sx={{ height: 20, fontWeight: 600 }} />
                                </TableCell>
                                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                  <IconButton size="small" onClick={(e) => handleMenuOpen(e, file, 'file')}>
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Row Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {activeItem?.type === 'file' && hasPermission('download_files') && (
          <MenuItem onClick={handleDownloadClick}>
            <ListItemIcon><GetAppIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        )}
        
        {((activeItem?.type === 'folder' && hasPermission('rename_folder')) || 
          (activeItem?.type === 'file' && hasPermission('replace_files'))) && (
          <MenuItem onClick={handleRenameClick}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
        )}

        {activeItem?.type === 'folder' && hasPermission('manage_users') && (
          <MenuItem onClick={handleAccessClick}>
            <ListItemIcon><SecurityIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Share Settings</ListItemText>
          </MenuItem>
        )}

        <Divider />

        {((activeItem?.type === 'folder' && hasPermission('delete_folder')) || 
          (activeItem?.type === 'file' && hasPermission('delete_files'))) && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Dialogs */}
      {/* Create Folder Dialog */}
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)}>
        <form onSubmit={handleCreateFolderSubmit}>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogContent sx={{ minWidth: 320 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Folder Name"
              type="text"
              fullWidth
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Upload File Dialog */}
      <Dialog open={fileDialogOpen} onClose={() => setFileDialogOpen(false)}>
        <form onSubmit={handleFileUploadSubmit}>
          <DialogTitle>Upload File</DialogTitle>
          <DialogContent sx={{ minWidth: 320, py: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ py: 4, borderStyle: 'dashed' }}
            >
              {selectedFile ? selectedFile.name : "Select File to Upload"}
              <input
                type="file"
                hidden
                onChange={(e) => setSelectedFile(e.target.files[0])}
                required
              />
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFileDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!selectedFile}>Upload</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <form onSubmit={handleRenameSubmit}>
          <DialogTitle>Rename {activeItem?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
          <DialogContent sx={{ minWidth: 320 }}>
            <TextField
              autoFocus
              margin="dense"
              label="New Name"
              type="text"
              fullWidth
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Rename</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this {activeItem?.type}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteSubmit} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Folder Share Settings (Access settings) */}
      <Dialog open={accessDialogOpen} onClose={() => setAccessDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Settings: {activeItem?.data?.name}</DialogTitle>
        <DialogContent dividers>
          {/* Grant Form */}
          <form onSubmit={handleGrantAccessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <Typography variant="subtitle2" color="text.secondary">GRANT NEW ACCESS RULE</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Autocomplete
                options={allUsers}
                getOptionLabel={(u) => `${u.name} (${u.email})`}
                value={selectedUserForAccess}
                onChange={(e, val) => setSelectedUserForAccess(val)}
                renderInput={(params) => <TextField {...params} label="Select User" size="small" />}
                sx={{ flexGrow: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={accessGrantState} 
                    onChange={(e) => setAccessGrantState(e.target.checked)} 
                  />
                }
                label={accessGrantState ? "Grant" : "Revoke"}
              />
              <Button type="submit" variant="contained" disabled={!selectedUserForAccess}>Apply</Button>
            </Box>
          </form>

          <Divider sx={{ my: 3 }} />

          {/* Rule list */}
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>ACTIVE FOLDER PERMISSIONS</Typography>
          {accessList.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="right">Access</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accessList.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.user.name}</TableCell>
                    <TableCell>{rule.user.email}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={rule.is_granted ? "Allowed" : "Blocked"} 
                        color={rule.is_granted ? "success" : "error"} 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No explicit folder permissions defined. Access falls back to defaults.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccessDialogOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>

      {/* Actions Options Menu for understandable controls */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 180, borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } }}
      >
        {activeItem?.type === 'folder' ? (
          <>
            {hasPermission('rename_folder') && (
              <MenuItem onClick={() => { triggerRename(activeItem.data, 'folder'); handleMenuClose(); }}>
                <ListItemIcon><DriveFileRenameOutlineIcon fontSize="small" /></ListItemIcon>
                Rename Folder
              </MenuItem>
            )}
            {hasPermission('manage_users') && (
              <MenuItem onClick={() => { triggerAccess(activeItem.data); handleMenuClose(); }}>
                <ListItemIcon><GroupAddIcon fontSize="small" /></ListItemIcon>
                Share Settings
              </MenuItem>
            )}
            {hasPermission('delete_folder') && (
              <MenuItem onClick={() => { triggerDelete(activeItem.data, 'folder'); handleMenuClose(); }} sx={{ color: 'error.main' }}>
                <ListItemIcon><DeleteOutlinedIcon fontSize="small" color="error" /></ListItemIcon>
                Delete Folder
              </MenuItem>
            )}
          </>
        ) : (
          <>
            {hasPermission('download_files') && (
              <MenuItem onClick={() => { triggerDownload(activeItem.data); handleMenuClose(); }}>
                <ListItemIcon><CloudDownloadIcon fontSize="small" /></ListItemIcon>
                Download File
              </MenuItem>
            )}
            {hasPermission('replace_files') && (
              <MenuItem onClick={() => { triggerRename(activeItem.data, 'file'); handleMenuClose(); }}>
                <ListItemIcon><DriveFileRenameOutlineIcon fontSize="small" /></ListItemIcon>
                Rename File
              </MenuItem>
            )}
            {hasPermission('delete_files') && (
              <MenuItem onClick={() => { triggerDelete(activeItem.data, 'file'); handleMenuClose(); }} sx={{ color: 'error.main' }}>
                <ListItemIcon><DeleteOutlinedIcon fontSize="small" color="error" /></ListItemIcon>
                Delete File
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      {/* File Preview Overlay Modal */}
      <FilePreviewModal
        open={Boolean(previewFile)}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onRefresh={fetchContents}
      />
    </Box>

  );
};

export default FolderExplorer;
