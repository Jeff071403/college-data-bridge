import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Grid, Card, CardContent, Typography, Button, 
  Avatar, Chip, CircularProgress, Divider, TextField, 
  InputAdornment, LinearProgress
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PaletteIcon from '@mui/icons-material/Palette';
import ScienceIcon from '@mui/icons-material/Science';
import GavelIcon from '@mui/icons-material/Gavel';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

import { getMOUs } from '../services/mouApi';

const DEPARTMENTS = [
  { name: 'Engineering & CSE', code: 'ENG', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', icon: <SchoolIcon />, head: 'Dr. Robert Smith', email: 'eng.mou@college.edu' },
  { name: 'Medical & Health Sciences', code: 'MED', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.12)', icon: <LocalHospitalIcon />, head: 'Dr. Elena Vance', email: 'med.mou@college.edu' },
  { name: 'Commerce & Business Studies', code: 'COM', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', icon: <BusinessCenterIcon />, head: 'Prof. Marcus Vance', email: 'com.mou@college.edu' },
  { name: 'Arts & Humanities', code: 'ART', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', icon: <PaletteIcon />, head: 'Dr. Clara Oswald', email: 'arts.mou@college.edu' },
  { name: 'Science & Technology', code: 'SCI', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', icon: <ScienceIcon />, head: 'Dr. Alan Grant', email: 'sci.mou@college.edu' },
  { name: 'School of Law & Policy', code: 'LAW', color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', icon: <GavelIcon />, head: 'Prof. Harvey Specter', email: 'law.mou@college.edu' },
];

const Departments = () => {
  const navigate = useNavigate();
  const [mous, setMous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getMOUs().then(data => {
      setMous(data);
      setLoading(false);
    });
  }, []);

  const getDeptStats = (deptName) => {
    const deptMous = mous.filter(m => 
      (m.department_name || '').toLowerCase().includes(deptName.toLowerCase().split(' ')[0])
    );
    const active = deptMous.filter(m => m.status === 'Active').length;
    const expiring = deptMous.filter(m => m.days_left !== null && m.days_left <= 30 && m.days_left >= 0).length;
    return { total: deptMous.length, active, expiring };
  };

  const filteredDepts = DEPARTMENTS.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.head.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ flexGrow: 1 }} className="animate-fade-slide-up">
      {/* Header */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Department Directory & MOU Repositories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse institutional agreements, assigned department coordinators, and active compliance metrics.
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Filter departments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredDepts.map((dept) => {
            const stats = getDeptStats(dept.name);
            return (
              <Grid item xs={12} sm={6} md={4} key={dept.code}>
                <Card
                  className="card-lift"
                  sx={{
                    p: 3,
                    borderRadius: '22px',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: `4px solid ${dept.color}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    bgcolor: 'background.paper',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: dept.bg, color: dept.color, width: 48, height: 48, borderRadius: '14px' }}>
                        {dept.icon}
                      </Avatar>
                      <Chip label={dept.code} size="small" sx={{ fontWeight: 900, bgcolor: dept.bg, color: dept.color }} />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, fontSize: '1.05rem' }}>
                      {dept.name}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      Coordinator: <strong>{dept.head}</strong> ({dept.email})
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Metrics */}
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1, borderRadius: '10px', bgcolor: 'action.hover' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 700 }}>TOTAL</Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main' }}>{stats.total}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1, borderRadius: '10px', bgcolor: 'rgba(16,185,129,0.08)' }}>
                          <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#10B981' }}>ACTIVE</Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#10B981' }}>{stats.active}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1, borderRadius: '10px', bgcolor: 'rgba(249,115,22,0.08)' }}>
                          <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#F97316' }}>EXPIRING</Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#F97316' }}>{stats.expiring}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(`/explorer?search=${encodeURIComponent(dept.name.split(' ')[0])}`)}
                    sx={{ borderRadius: '12px', fontWeight: 700 }}
                  >
                    View Department MOUs
                  </Button>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default Departments;
