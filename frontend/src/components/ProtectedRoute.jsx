import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button } from '@mui/material';
import LockPersonIcon from '@mui/icons-material/LockPerson';

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return null; // AuthContext handles loading internally, or we can render a spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '70vh', 
          textAlign: 'center', 
          p: 3 
        }}
      >
        <LockPersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 450, mb: 3 }}>
          You do not have the required permissions ({requiredPermission}) to view this module. 
          Please contact your administrator if you believe this is an error.
        </Typography>
        <Button variant="contained" href="/" sx={{ px: 4 }}>
          Go to Dashboard
        </Button>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;
