import React, { useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Button, Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { logDocumentPreview, logDocumentDownload } from '../services/templateApi';

const PDFPreviewModal = ({ open, onClose, fileUrl, docId, title }) => {
  useEffect(() => {
    if (open && docId) {
      logDocumentPreview(docId).catch(err => console.error("Failed to log preview:", err));
    }
  }, [open, docId]);

  const handleDownload = () => {
    if (docId) {
      logDocumentDownload(docId).catch(err => console.error("Failed to log download:", err));
    }
    window.open(fileUrl, '_blank');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{title || 'Document Preview'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            onClick={handleDownload}
            sx={{ borderRadius: '18px', textTransform: 'none', fontWeight: 700 }}
          >
            Download PDF
          </Button>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, flexGrow: 1, overflow: 'hidden' }}>
        {fileUrl ? (
          <iframe
            src={`${fileUrl}#toolbar=1`}
            title={title}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>No document file available.</Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewModal;
