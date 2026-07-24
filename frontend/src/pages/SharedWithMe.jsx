import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Card, Button, Chip, Avatar, 
  CircularProgress, Alert, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow 
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import { getMOUs } from '../services/mouApi';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';

const SharedWithMe = () => {
  const navigate = useNavigate();
  const [mous, setMous] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMOUs().then(data => {
      // Shared or assigned to department
      setMous(data.filter(m => m.status === 'Shared' || m.status === 'Pending Verification' || m.status === 'Draft'));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }} className="animate-fade-slide-up">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'rgba(59,130,246,0.12)', color: '#3B82F6', width: 44, height: 44, borderRadius: '14px' }}>
          <ShareIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Shared With My Department
          </Typography>
          <Typography variant="body2" color="text.secondary">
            MOUs distributed to your department awaiting executed signed copy uploads or verification.
          </Typography>
        </Box>
      </Box>

      {mous.length === 0 ? (
        <EmptyState
          illustration="file"
          title="No Shared MOUs"
          description="MOUs shared with your department by administrators will appear here once distributed."
        />
      ) : (
        <Grid container spacing={2.5}>
          {mous.map((mou) => (
            <Grid item xs={12} sm={6} md={4} key={mou.id}>
              <Card sx={{ p: 2.5, borderRadius: '20px', border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Chip label={mou.mou_number} size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(79,70,229,0.1)', color: 'primary.main' }} />
                    <StatusPill status={mou.status} />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, fontSize: '0.98rem' }}>
                    {mou.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.84rem' }}>
                    Partner: <strong>{mou.partner_organization}</strong>
                  </Typography>
                </Box>

                <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button size="small" startIcon={<VisibilityIcon />} onClick={() => navigate(`/mou/${mou.id}`)} sx={{ fontWeight: 700 }}>
                    Review MOU
                  </Button>
                  <Button size="small" variant="contained" startIcon={<CloudUploadIcon />} onClick={() => navigate(`/mou/${mou.id}`)} sx={{ borderRadius: '10px', fontWeight: 700 }}>
                    Upload Signed
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SharedWithMe;
