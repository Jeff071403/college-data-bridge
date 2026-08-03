import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Card, CardContent, Typography, TextField, Button, 
  Alert, InputAdornment, IconButton, CircularProgress,
  Grid, FormControlLabel, Checkbox, Link, Tooltip, Avatar, Divider
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { GoogleLogin } from '@react-oauth/google';

import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';

const Login = () => {
  const { login, googleLogin, user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const isRegistered = queryParams.get('registered') === 'true';
  const successMessage = isRegistered 
    ? 'Registration completed successfully! You can now sign in with your password.' 
    : location.state?.successMessage;

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loggedUser = await login(email, password);
      navigate('/', { state: { successMessage: `Logged in successfully! Welcome back, ${loggedUser.name || 'user'}.` } });
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.non_field_errors?.[0] || 
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError('');
    try {
      const loggedUser = await googleLogin(credentialResponse.credential);
      navigate('/', { state: { successMessage: `Logged in via Google! Welcome back, ${loggedUser.name || 'user'}.` } });
    } catch (err) {
      console.error("Google login failed:", err);
      setError(
        err.response?.data?.detail || 
        'Google Sign-In failed. Please try again or use email/password login.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In popup was closed or cancelled. Please try again.');
  };

  const isDark = mode === 'dark';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }} className="animate-fade-in">
      <Grid container sx={{ width: '100%' }}>
        
        {/* Left Side: Modern SVG Artwork Illustration Panel */}
        <Grid 
          item 
          xs={0} 
          md={6} 
          sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, var(--indigo) 0%, var(--violet) 100%)',
            color: '#ffffff',
            p: 6,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Animated/Glowing background blur orbs */}
          <Box sx={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(var(--violet-rgb), 0.5) 0%, rgba(var(--indigo-rgb), 0) 70%)', filter: 'blur(60px)', top: '-5%', left: '10%' }} />
          <Box sx={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(16,185,129,0) 70%)', filter: 'blur(60px)', bottom: '5%', right: '10%' }} />

          <Box sx={{ maxWidth: 460, textAlign: 'center', zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)', width: 64, height: 64 }}>
                <CloudQueueIcon sx={{ color: '#ffffff', fontSize: 36 }} />
              </Avatar>
            </Box>
            
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
              MCC LEGAL Documents
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 5, fontWeight: 500 }}>
              Professional Memorandum of Understanding Registry
            </Typography>

            {/* Custom SVG Illustration */}
            <Box sx={{ my: 4, transform: 'scale(1.1)' }}>
              <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Floating file templates */}
                <g style={{ filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.15))' }}>
                  <rect x="30" y="20" width="80" height="110" rx="8" fill="#ffffff" />
                  <path d="M42 35H98" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                  <path d="M42 47H98" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <path d="M42 59H80" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <path d="M42 71H60" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="88" cy="98" r="12" fill="#10b981" />
                  <path d="M84 98L87 101L93 95" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                <g style={{ filter: 'drop-shadow(0px 12px 24px rgba(0,0,0,0.2))' }}>
                  <rect x="90" y="40" width="100" height="120" rx="8" fill="#ffffff" />
                  <path d="M106 60H174" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
                  <path d="M106 76H174" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <path d="M106 90H174" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <path d="M106 104H150" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  
                  {/* Decorative stamp on document */}
                  <rect x="150" y="120" width="24" height="24" rx="4" fill="rgba(37, 99, 235, 0.1)" stroke="#2563eb" strokeWidth="1" />
                  <circle cx="162" cy="132" r="6" fill="#2563eb" />
                </g>

                {/* Additional floating design details */}
                <circle cx="215" cy="55" r="10" fill="rgba(255, 255, 255, 0.15)" />
                <path d="M205 130L225 150" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="230" cy="120" r="4" fill="#f59e0b" />
              </svg>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start', mt: 4, pl: 6 }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 600 }}>
                <ArrowRightAltIcon /> Fully-integrated document version control
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 600 }}>
                <ArrowRightAltIcon /> Granular user permission matrices
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 600 }}>
                <ArrowRightAltIcon /> Automated expiry warning system logs
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Right Side: Sign In Card Form Panel */}
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
            position: 'relative'
          }}
        >
          {/* Top Right Controls: Theme Toggle */}
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton onClick={toggleTheme} sx={{ border: '1px solid', borderColor: 'divider', p: 1.2 }}>
                {isDark ? <LightModeIcon sx={{ fontSize: '1.25rem' }} /> : <DarkModeIcon sx={{ fontSize: '1.25rem' }} />}
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ maxWidth: 420, width: '100%' }}>
            
            {/* Header info */}
            <Box sx={{ mb: 4, textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px', color: 'text.primary' }}>
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome back! Enter credentials to manage institution agreements.
              </Typography>
            </Box>

            {successMessage && <Alert severity="success" sx={{ mb: 3.5, borderRadius: '12px' }}>{successMessage}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 3.5, borderRadius: '12px' }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.2 }}>
                
                {/* Email Address */}
                <TextField
                  label="Email Address"
                  variant="outlined"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px'
                    }
                  }}
                />

                {/* Password Field */}
                <TextField
                  label="Password"
                  variant="outlined"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
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
                      ),
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px'
                    }
                  }}
                />

                {/* Remember me & Forgot Password Row */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: -1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)} 
                        size="small"
                        color="primary"
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Remember me</Typography>}
                  />
                  <Link 
                    component="button" 
                    type="button"
                    variant="body2" 
                    onClick={() => alert("Please contact system administrators to reset your credential passwords.")}
                    sx={{ fontWeight: 600, fontSize: '0.85rem', underline: 'hover', textTransform: 'none', color: 'primary.main' }}
                  >
                    Forgot Password?
                  </Link>
                </Box>

                {/* Sign In Trigger Button */}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ 
                    py: 1.6, 
                    fontWeight: 700,
                    fontSize: '0.98rem',
                    borderRadius: '12px',
                    textTransform: 'none',
                    bgcolor: 'primary.main',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 'Sign In'}
                </Button>
              </Box>
            </form>

            <Divider sx={{ my: 3, color: 'text.secondary', fontSize: '0.8rem', fontWeight: 600 }}>
              OR CONTINUE WITH
            </Divider>

            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: 44 }}>
              {googleLoading ? (
                <CircularProgress size={28} />
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  shape="pill"
                  size="large"
                  theme={isDark ? 'filled_black' : 'outline'}
                  text="continue_with"
                />
              )}
            </Box>



          </Box>
        </Grid>
        
      </Grid>
    </Box>
  );
};

export default Login;
