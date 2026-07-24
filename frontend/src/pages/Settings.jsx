import React, { useState } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, Switch, 
  FormControlLabel, Button, TextField, MenuItem, Select, 
  FormControl, InputLabel, Divider, Alert, Avatar, Chip
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import StorageIcon from '@mui/icons-material/Storage';
import PaletteIcon from '@mui/icons-material/Palette';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useThemeMode } from '../context/ThemeContext';

const Settings = () => {
  const { mode, toggleTheme } = useThemeMode();

  // Settings State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [reminder30Days, setReminder30Days] = useState(true);
  const [reminder15Days, setReminder15Days] = useState(true);
  const [reminder7Days, setReminder7Days] = useState(true);
  const [reminder1Day, setReminder1Day] = useState(true);

  const [storageThreshold, setStorageThreshold] = useState(85);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 900, mx: 'auto' }} className="animate-fade-slide-up">
      {/* Header */}
      <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', width: 44, height: 44, borderRadius: '14px' }}>
          <SettingsIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            System Settings & Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure automated MOU expiry reminder schedules, email notifications, and storage thresholds.
          </Typography>
        </Box>
      </Box>

      {savedSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '14px', fontWeight: 700 }}>
          Settings updated successfully! Automated schedules are active.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSave}>
        <Grid container spacing={3}>
          
          {/* Automated Expiry Reminders Config */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <NotificationsActiveIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Automated Expiry Reminders
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>
                  The system checks active MOUs daily at midnight and triggers alerts for assigned users.
                </Typography>

                <FormControlLabel
                  control={<Switch checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} color="primary" />}
                  label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Send Email Reminders to Owners</Typography>}
                  sx={{ mb: 1, display: 'block' }}
                />

                <FormControlLabel
                  control={<Switch checked={inAppAlerts} onChange={(e) => setInAppAlerts(e.target.checked)} color="primary" />}
                  label={<Typography variant="body2" sx={{ fontWeight: 700 }}>In-App Notifications Bar Alerts</Typography>}
                  sx={{ mb: 2.5, display: 'block' }}
                />

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
                  Reminder Intervals
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={<Switch checked={reminder30Days} onChange={(e) => setReminder30Days(e.target.checked)} size="small" />}
                    label={<Typography variant="body2">30 Days Before Expiry (Warning)</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={reminder15Days} onChange={(e) => setReminder15Days(e.target.checked)} size="small" />}
                    label={<Typography variant="body2">15 Days Before Expiry (Urgent)</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={reminder7Days} onChange={(e) => setReminder7Days(e.target.checked)} size="small" />}
                    label={<Typography variant="body2">7 Days Before Expiry (Critical)</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={reminder1Day} onChange={(e) => setReminder1Day(e.target.checked)} size="small" />}
                    label={<Typography variant="body2">1 Day Before Expiry (Final Alert)</Typography>}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Theme & Server Storage Config */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PaletteIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Theme & Visual Appearance
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: '14px', bgcolor: 'action.hover', mb: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Theme Mode</Typography>
                    <Typography variant="caption" color="text.secondary">Currently {mode.toUpperCase()} mode</Typography>
                  </Box>
                  <Button variant="outlined" onClick={toggleTheme} sx={{ borderRadius: '10px', fontWeight: 700 }}>
                    Toggle Mode
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <StorageIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Server Storage Alert Threshold
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  type="number"
                  label="Disk Storage Warning Threshold (%)"
                  value={storageThreshold}
                  onChange={(e) => setStorageThreshold(e.target.value)}
                  helperText="Alert super admin when disk usage exceeds this percentage."
                  sx={{ mb: 2 }}
                />
              </CardContent>

              <Box sx={{ p: 3, pt: 0 }}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    py: 1.2,
                    borderRadius: '12px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
                  }}
                >
                  Save System Preferences
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Settings;
