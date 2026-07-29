import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, List, ListItem, ListItemText, 
  Divider, Chip, IconButton, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GetAppIcon from '@mui/icons-material/GetApp';
import HistoryIcon from '@mui/icons-material/History';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const FilePreviewModal = ({ open, onClose, file, onRefresh }) => {
  const { user, hasPermission } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');

  useEffect(() => {
    if (!open || !file) return;
    setError(null);
    if (file.file_url) {
      setPreviewBlobUrl(file.file_url);
    } else {
      api.get(`/api/files/${file.id}/preview/`, { responseType: 'blob' })
        .then(res => {
          const url = window.URL.createObjectURL(new Blob([res.data], { type: file.mime_type || file.file_type }));
          setPreviewBlobUrl(url);
        })
        .catch(err => {
          console.error("Preview fetch failed:", err);
          setError("Failed to load document preview.");
        });
    }

    return () => {
      if (previewBlobUrl && !previewBlobUrl.startsWith('http')) {
        window.URL.revokeObjectURL(previewBlobUrl);
      }
      setPreviewBlobUrl('');
    };
  }, [open, file]);

  if (!file) return null;

  const isImage = file.file_type.startsWith('image/');
  const isPdf = file.file_type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isAdmin = user?.role?.name === 'Super Admin' || user?.role?.name === 'Admin';
  const hasExplicitPreviewGrant = user?.permissions_override?.some(p => p.permission?.codename === 'preview_files' && p.is_granted === true);
  const hasExplicitDownloadGrant = user?.permissions_override?.some(p => p.permission?.codename === 'download_files' && p.is_granted === true);
  const canPreviewPdf = isAdmin || hasExplicitPreviewGrant;
  const canDownloadPdf = isAdmin || hasExplicitDownloadGrant;

  // Trigger file download
  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/files/${file.id}/download/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to download file. Please check permissions.");
    }
  };

  // Handle version download
  const handleDownloadVersion = async (version) => {
    try {
      // In a real system, you'd fetch version-specific downloads. 
      // We can map a direct request or download link. Since versions have URLs,
      // we can trigger a download by calling api.get and reading the blob
      const link = document.createElement('a');
      link.href = version.file_url;
      link.setAttribute('download', version.name);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Failed to download version:", err);
    }
  };

  // Handle replacing file (new version)
  const handleReplaceFile = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post(`/api/files/${file.id}/replace/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onRefresh();
      onClose();
    } catch (err) {
      console.error("Replace file failed:", err);
      setError(err.response?.data?.detail || "Failed to upload new version.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </Typography>
          <Chip label={`v${file.version_number}`} color="primary" size="small" />
        </Box>
        <IconButton aria-label="close" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '70vh' }}>
        {/* Left pane - File Preview */}
        <Box sx={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'black', position: 'relative', overflow: 'hidden', minHeight: '300px' }}>
          {isImage ? (
            <Box 
              component="img" 
              src={previewBlobUrl} 
              alt={file.name} 
              sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : isPdf && canPreviewPdf ? (
            previewBlobUrl ? (
              <iframe 
                src={`${previewBlobUrl}#toolbar=0`} 
                title="pdf-preview" 
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <Typography color="grey.300">Loading preview...</Typography>
            )
          ) : isPdf && !canPreviewPdf ? (
            <Box sx={{ color: 'grey.500', textAlign: 'center', p: 3 }}>
              <InsertDriveFileIcon sx={{ fontSize: 100, mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'grey.300', mb: 1 }}>
                Preview Restricted
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.500' }}>
                PDF previews are restricted to administrators.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ color: 'grey.500', textAlign: 'center', p: 3 }}>
              <InsertDriveFileIcon sx={{ fontSize: 100, mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'grey.300', mb: 1 }}>
                No Preview Available
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.500' }}>
                Preview is only supported for PDFs and Images in browser.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right pane - Metadata & Versions */}
        <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', overflowY: 'auto', borderLeft: (theme) => `1px solid ${theme.palette.divider}` }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            FILE DETAILS
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 1, mb: 3 }}>
            <Typography variant="body2" color="text.secondary">Type:</Typography>
            <Typography variant="body2">{file.file_type}</Typography>
            
            <Typography variant="body2" color="text.secondary">Size:</Typography>
            <Typography variant="body2">{file.size_formatted}</Typography>

            <Typography variant="body2" color="text.secondary">Uploaded By:</Typography>
            <Typography variant="body2">{file.uploaded_by?.name || "System"}</Typography>

            <Typography variant="body2" color="text.secondary">Uploaded At:</Typography>
            <Typography variant="body2">{new Date(file.created_at).toLocaleString()}</Typography>

            <Typography variant="body2" color="text.secondary">Last Modified:</Typography>
            <Typography variant="body2">{new Date(file.updated_at).toLocaleString()}</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Version History List */}
          <Box sx={{ flex: 1, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <HistoryIcon fontSize="small" /> VERSION HISTORY
            </Typography>
            
            {file.versions && file.versions.length > 0 ? (
              <List dense sx={{ width: '100%' }}>
                {file.versions.map((ver) => (
                  <ListItem 
                    key={ver.id}
                    secondaryAction={
                      <IconButton edge="end" aria-label="download-version" onClick={() => handleDownloadVersion(ver)}>
                        <GetAppIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={`Version ${ver.version_number} (${ver.size < 1024 ? ver.size + ' B' : (ver.size / 1024).toFixed(1) + ' KB'})`}
                      secondary={`Uploaded by: ${ver.uploaded_by?.name || "Unknown"} on ${new Date(ver.created_at).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>
                No older versions available.
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Action buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {hasPermission('download_files') && !(isPdf && !canDownloadPdf) && (
              <Button 
                variant="contained" 
                startIcon={<GetAppIcon />} 
                onClick={handleDownload}
                fullWidth
              >
                Download Active Version
              </Button>
            )}

            {hasPermission('replace_files') && (
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={uploading}
                fullWidth
              >
                {uploading ? "Uploading..." : "Upload New Version"}
                <input
                  type="file"
                  hidden
                  onChange={handleReplaceFile}
                />
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilePreviewModal;
