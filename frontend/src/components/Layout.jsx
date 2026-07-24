import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, Box, Drawer, IconButton, Toolbar, Typography, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Divider, Badge, Menu, MenuItem, Avatar, Tooltip, 
  Popover, Button, TextField, InputAdornment, Dialog, DialogContent,
  BottomNavigation, BottomNavigationAction, Paper, CircularProgress,
  Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import MapIcon from '@mui/icons-material/Map';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ShareIcon from '@mui/icons-material/Share';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ExtensionIcon from '@mui/icons-material/Extension';
import BusinessIcon from '@mui/icons-material/Business';

import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import api from '../services/api';

const drawerWidth = 260;
const drawerWidthCollapsed = 68;

const Layout = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notiAnchor, setNotiAnchor] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Command Palette states
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdResults, setCmdResults] = useState({ folders: [], files: [], users: [] });
  const [searching, setSearching] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications/');
      setNotifications(res.data);
      const unread = res.data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Poll notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Query search for Command Palette
  useEffect(() => {
    if (!cmdQuery || cmdQuery.length < 2) {
      setCmdResults({ folders: [], files: [], users: [] });
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/api/search/?q=${encodeURIComponent(cmdQuery)}`);
        setCmdResults(res.data);
      } catch (err) {
        console.error("Command palette search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [cmdQuery]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileOpen = (e) => {
    setProfileAnchor(e.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchor(null);
  };

  const handleNotiOpen = (e) => {
    setNotiAnchor(e.currentTarget);
  };

  const handleNotiClose = () => {
    setNotiAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/api/notifications/${id}/mark-read/`);
      fetchNotifications();
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read/');
      fetchNotifications();
    } catch (err) {
      console.error("Mark all read failed:", err);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/explorer?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const menuItems = [
    { text: 'Dashboard',       icon: <DashboardIcon />,          path: '/',           permission: 'view_dashboard', iconColor: '#4F46E5' },
    { text: 'MOU Repository',  icon: <AssignmentIcon />,         path: '/mou-repository', permission: 'view_dashboard', iconColor: '#7C3AED' },
    { text: 'Shared With Me',  icon: <ShareIcon />,              path: '/shared',     permission: 'view_dashboard', iconColor: '#3B82F6' },
    { text: 'Departments',     icon: <BusinessIcon />,           path: '/departments', permission: 'view_dashboard', iconColor: '#14B8A6' },
    { text: 'Notifications',   icon: <NotificationsIcon />,      path: '/notifications', permission: 'view_notifications', iconColor: '#F43F5E' },
    { text: 'Reports & Stats', icon: <AssessmentIcon />,         path: '/reports',    permission: 'view_dashboard', iconColor: '#10B981' },
    { text: 'MOU Templates',   icon: <ExtensionIcon />,          path: '/templates',  permission: 'manage_users',   iconColor: '#F59E0B' },
    { text: 'Folder Explorer', icon: <FolderCopyIcon />,          path: '/explorer',   permission: 'view_folder',    iconColor: '#0EA5E9' },
    { text: 'User Management', icon: <ManageAccountsIcon />,      path: '/users',      permission: 'manage_users',   iconColor: '#EC4899' },
    { text: 'Activity Logs',   icon: <AdminPanelSettingsIcon />,  path: '/logs',       permission: 'manage_users',   iconColor: '#F97316' },
    { text: 'System Settings', icon: <SettingsIcon />,           path: '/settings',   permission: 'view_dashboard', iconColor: '#64748B' },
    { text: 'System Map',      icon: <MapIcon />,                 path: '/system-map', permission: 'view_dashboard', iconColor: '#6366F1' },
  ];

  const handleCommandAction = (actionPath) => {
    setCmdOpen(false);
    setCmdQuery('');
    if (typeof actionPath === 'function') {
      actionPath();
    } else {
      navigate(actionPath);
    }
  };

  const currentDrawerWidth = sidebarCollapsed ? drawerWidthCollapsed : drawerWidth;

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header */}
      <Box sx={{ p: sidebarCollapsed ? 1.5 : 3, display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 64, justifyContent: sidebarCollapsed ? 'center' : 'flex-start', transition: 'padding 0.3s ease' }}>
        <Avatar sx={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', width: 36, height: 36, flexShrink: 0 }}>
          <CloudQueueIcon sx={{ color: '#ffffff', fontSize: '1.1rem' }} />
        </Avatar>
        {!sidebarCollapsed && (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '0.95rem', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              MCC LEGAL
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.5px', fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              Documents
            </Typography>
          </Box>
        )}
      </Box>
      <Divider />
      
      {/* User Quick Info */}
      {!sidebarCollapsed && (
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 40, height: 40, border: '2px solid', borderColor: 'primary.main', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', fontSize: '0.95rem', fontWeight: 700 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" noWrap sx={{ display: 'block', color: 'text.secondary', fontSize: '0.72rem' }}>
              {user?.role?.name || 'User'}
            </Typography>
          </Box>
        </Box>
      )}
      
      <Divider sx={{ mb: 1 }} />

      {/* Collapse toggle */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: sidebarCollapsed ? 'center' : 'flex-end', px: sidebarCollapsed ? 0 : 1.5, mb: 0.5 }}>
        <Tooltip title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <IconButton size="small" onClick={() => setSidebarCollapsed(p => !p)}
            sx={{ color: 'text.secondary', border: '1px solid', borderColor: 'divider', width: 28, height: 28, '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
            {sidebarCollapsed ? <ChevronRightIcon sx={{ fontSize: '1rem' }} /> : <ChevronLeftIcon sx={{ fontSize: '1rem' }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Navigation List */}
      <List sx={{ px: 0, flexGrow: 1 }}>
        {menuItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) return null;
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={sidebarCollapsed ? item.text : ''} placement="right">
                <ListItemButton
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  selected={isSelected}
                  sx={{
                    borderRadius: '12px',
                    py: 1,
                    px: sidebarCollapsed ? 1 : 2,
                    mx: sidebarCollapsed ? 0.8 : 1.5,
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    width: 'auto',
                    transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
                    ...(isSelected ? {
                      background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                      '& .MuiListItemIcon-root': { color: '#ffffff' },
                      '& .MuiListItemText-root *': { color: '#ffffff' },
                      boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                      '&:hover': { opacity: 0.92 },
                    } : {
                      '&:hover': { bgcolor: 'action.hover', '& .MuiListItemIcon-root': { color: item.iconColor } },
                    }),
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: sidebarCollapsed ? 'unset' : 32,
                    color: isSelected ? '#ffffff' : item.iconColor,
                    width: 32, height: 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mr: sidebarCollapsed ? 0 : 1.5,
                    borderRadius: '10px',
                    bgcolor: isSelected ? 'rgba(255,255,255,0.18)' : `${item.iconColor}12`,
                    transition: 'all 0.22s ease',
                    flexShrink: 0,
                    '& svg': { fontSize: '1.05rem' },
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {!sidebarCollapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#ffffff' : 'text.primary',
                        transition: 'opacity 0.2s ease',
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Vector Illustration in Sidebar */}
      <Box sx={{ p: 2, textAlign: 'center', mt: 'auto', mb: 1, display: { xs: 'none', sm: 'block' } }}>
        <Box sx={{
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
          borderRadius: '16px',
          p: 2,
          mx: 0.5,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}>
          <svg width="100" height="70" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
            <circle cx="20" cy="30" r="8" fill="rgba(37, 99, 235, 0.03)" />
            <circle cx="105" cy="45" r="12" fill="rgba(37, 99, 235, 0.03)" />
            <circle cx="60" cy="15" r="6" fill="rgba(37, 99, 235, 0.04)" />

            <rect x="35" y="40" width="50" height="38" rx="8" fill={(theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff'} stroke="rgba(37, 99, 235, 0.15)" strokeWidth="1" />
            <path d="M35 44V42C35 40.8954 35.8954 40 37 40H52L57 45H80C81.1046 45 82 45.8954 82 47V70" stroke="rgba(37, 99, 235, 0.15)" strokeWidth="2" />
            
            <rect x="42" y="22" width="36" height="24" rx="4" fill="rgba(37, 99, 235, 0.2)" />
            <rect x="46" y="28" width="28" height="20" rx="3" fill={(theme) => theme.palette.mode === 'dark' ? '#334155' : '#f8fafc'} />
            <rect x="51" y="33" width="18" height="2" rx="1" fill="#2563eb" />
            <rect x="51" y="39" width="12" height="2" rx="1" fill="#2563eb" />
            
            <path d="M35 48C35 44.6863 37.6863 42 41 42H79C82.3137 42 85 44.6863 85 48V72C85 75.3137 82.3137 78 79 78H41C37.6863 78 35 75.3137 35 72V48Z" fill="#facc15" />
            <path d="M35 48L60 62L85 48" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            <g style={{ transform: 'translate(82px, 8px)' }}>
              <path d="M0 12L18 0L9 16L0 12Z" fill="#2563eb" />
              <path d="M9 16L18 0L6 9" fill="rgba(37, 99, 235, 0.7)" />
            </g>
            <path d="M60 48C64 36 72 26 80 24" stroke="rgba(37, 99, 235, 0.3)" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
          </svg>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.82rem' }}>
              MOU Storage
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
              Efficient, safe & accessible
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />
      
      {/* Bottom Profile Settings Link & Logout */}
      <List sx={{ px: 0, py: 1.5 }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton 
            onClick={() => navigate('/profile')}
            selected={location.pathname === '/profile'}
            sx={{ 
              borderRadius: '12px',
              mx: 1.5,
              py: 0.8,
              px: 2,
              width: 'auto',
              '&.Mui-selected': {
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
                '&:hover': { bgcolor: 'action.hover' }
              },
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 32, 
              color: location.pathname === '/profile' ? 'primary.main' : 'text.secondary',
              '& svg': { fontSize: '1.2rem' }
            }}>
              <AccountCircleIcon />
            </ListItemIcon>
            <ListItemText primary="My Profile" primaryTypographyProps={{ fontSize: '0.88rem', color: location.pathname === '/profile' ? 'primary.main' : 'text.primary' }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleLogout} 
            sx={{ 
              borderRadius: '12px', 
              mx: 1.5,
              py: 0.8,
              px: 2,
              width: 'auto',
              color: 'error.main',
              '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2' }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 32, 
              color: 'error.main',
              '& svg': { fontSize: '1.2rem' }
            }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: '0.88rem', color: 'error.main' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* AppBar (Top Navigation) */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1), margin-left 0.3s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2, minHeight: 64 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' }, color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>

            {/* Topbar Search Input - triggers command palette */}
            <TextField
              size="small"
              placeholder="Search or type a command... (Ctrl + K)"
              value={searchQuery}
              onClick={() => setCmdOpen(true)}
              readOnly
              sx={{ 
                width: { xs: 150, sm: 320 },
                cursor: 'pointer',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  cursor: 'pointer',
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                },
                '& input': { cursor: 'pointer' }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                    <Typography variant="caption" sx={{ bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', px: 1, py: 0.25, borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
                      Ctrl + K
                    </Typography>
                  </InputAdornment>
                )
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Quick System Map / Help Button */}
            <Tooltip title="How This System Works (Lifecycle Guide)">
              <IconButton 
                onClick={() => navigate('/system-map')} 
                sx={{ 
                  color: 'primary.main', 
                  border: '1px solid', 
                  borderColor: 'rgba(79, 70, 229, 0.25)', 
                  bgcolor: 'rgba(79, 70, 229, 0.06)',
                  p: 1,
                  '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.12)', transform: 'translateY(-1px)' }
                }}
              >
                <HelpCenterIcon sx={{ fontSize: '1.2rem' }} />
              </IconButton>
            </Tooltip>

            {/* Theme Toggle Button */}
            <Tooltip title={mode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton onClick={toggleTheme} color="default" sx={{ color: 'text.secondary', border: '1px solid', borderColor: 'divider', p: 1, '&:hover': { transform: 'rotate(15deg)' } }}>
                {mode === 'dark' ? <LightModeIcon sx={{ fontSize: '1.2rem', color: '#F59E0B' }} /> : <DarkModeIcon sx={{ fontSize: '1.2rem' }} />}
              </IconButton>
            </Tooltip>

            {/* Notifications Trigger */}
            <Tooltip title="Notifications">
              <IconButton 
                onClick={handleNotiOpen} 
                color="default" 
                className={unreadCount > 0 ? "animate-bell" : ""}
                sx={{ color: 'text.secondary', border: '1px solid', borderColor: 'divider', p: 1 }}
              >
                <Badge badgeContent={unreadCount} color="error" className={unreadCount > 0 ? "animate-pulse-soft" : ""}>
                  <NotificationsIcon sx={{ fontSize: '1.2rem', color: unreadCount > 0 ? '#F43F5E' : 'inherit' }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Profile dropdown avatar */}
            <Tooltip title={user?.name || "Account Profile"}>
              <IconButton onClick={handleProfileOpen} sx={{ p: 0.2, ml: 0.5, border: '2px solid', borderColor: 'primary.main', transition: 'transform 0.2s ease', '&:hover': { transform: 'scale(1.08)' } }}>
                <Avatar sx={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', width: 32, height: 32, fontSize: '0.85rem', fontWeight: 700 }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Notifications Popover list */}
      <Popover
        open={Boolean(notiAnchor)}
        anchorEl={notiAnchor}
        onClose={handleNotiClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 340, maxHeight: 420, borderRadius: '16px', mt: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />
        <List sx={{ p: 0, overflowY: 'auto', maxHeight: 300 }}>
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <ListItem 
                key={n.id} 
                disablePadding
                secondaryAction={
                  !n.is_read && (
                    <IconButton edge="end" size="small" onClick={() => handleMarkAsRead(n.id)}>
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  )
                }
              >
                <ListItemButton 
                  onClick={async () => {
                    if (!n.is_read) {
                      await handleMarkAsRead(n.id);
                    }
                    handleNotiClose();
                    if (n.metadata?.folder_id) {
                      navigate(`/explorer?folder=${n.metadata.folder_id}`);
                    } else if (n.metadata?.action === 'user_created' || n.metadata?.action === 'user_disabled') {
                      navigate('/users');
                    }
                  }}
                  sx={{ 
                    py: 1.5, 
                    px: 2, 
                    alignItems: 'flex-start',
                    bgcolor: n.is_read ? 'transparent' : 'action.hover'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.5, color: n.is_read ? 'text.disabled' : 'primary.main' }}>
                    <NotificationsActiveIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={n.title}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'block', fontSize: '0.8rem', mt: 0.25 }}>
                          {n.description}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
                          {new Date(n.created_at).toLocaleString()}
                        </Typography>
                      </>
                    }
                    primaryTypographyProps={{ 
                      fontSize: '0.85rem', 
                      fontWeight: n.is_read ? 500 : 700, 
                      color: n.is_read ? 'text.secondary' : 'text.primary' 
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No notifications yet.
              </Typography>
            </Box>
          )}
        </List>
      </Popover>

      {/* Profile menu dropdown */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={handleProfileClose}
        onClick={handleProfileClose}
        PaperProps={{ sx: { width: 220, borderRadius: '16px', mt: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' } }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{user?.name}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8rem' }}>
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => navigate('/profile')}>
          <AccountCircleIcon sx={{ fontSize: 20, mr: 1.5, color: 'text.secondary' }} />
          Profile Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <LogoutIcon sx={{ fontSize: 20, mr: 1.5, color: 'error.main' }} />
          Sign Out
        </MenuItem>
      </Menu>

      {/* Drawer Sidebar (Navigation panel) */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth, 
              backgroundImage: 'none',
              background: (theme) => theme.palette.mode === 'dark' ? '#111827' : '#ffffff',
              color: 'text.primary',
              borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {sidebarContent}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              borderRight: (theme) => `1px solid ${theme.palette.divider}`,
              backgroundImage: 'none',
              background: (theme) => theme.palette.mode === 'dark' ? '#12141E' : '#ffffff',
              color: 'text.primary',
              overflowX: 'hidden',
              transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1)',
            },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          mt: 8,
          mb: { xs: 8, md: 0 },
          bgcolor: 'background.default',
          transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1)',
          animation: 'fadeSlideUp 0.35s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {children}
      </Box>

      {/* Mobile Floating Bottom Navigation Bar */}
      <Paper 
        elevation={3} 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 100, 
          display: { xs: 'block', md: 'none' },
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <BottomNavigation
          showLabels
          value={location.pathname === '/' ? 0 : location.pathname.startsWith('/explorer') ? 1 : location.pathname.startsWith('/profile') ? 3 : 2}
          onChange={(event, newValue) => {
            if (newValue === 0) navigate('/');
            else if (newValue === 1) navigate('/explorer');
            else if (newValue === 2) setCmdOpen(true);
            else if (newValue === 3) navigate('/profile');
          }}
          sx={{
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              padding: '6px 0',
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                '& .MuiSvgIcon-root': {
                  transform: 'scale(1.1)',
                  transition: 'transform 0.2s ease-in-out'
                }
              }
            }
          }}
        >
          <BottomNavigationAction label="Home" icon={<DashboardIcon sx={{ fontSize: '1.3rem' }} />} />
          <BottomNavigationAction label="Folders" icon={<FolderCopyIcon sx={{ fontSize: '1.3rem' }} />} />
          <BottomNavigationAction label="Search" icon={<SearchIcon sx={{ fontSize: '1.3rem' }} />} />
          <BottomNavigationAction label="Profile" icon={<AccountCircleIcon sx={{ fontSize: '1.3rem' }} />} />
        </BottomNavigation>
      </Paper>

      {/* Notion-style Command Palette Modal Dialog */}
      <Dialog 
        open={cmdOpen} 
        onClose={() => { setCmdOpen(false); setCmdQuery(''); }}
        maxWidth="sm" 
        fullWidth
        scroll="paper"
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(6px)',
            bgcolor: 'rgba(15, 23, 42, 0.4)'
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid',
            borderColor: 'divider',
            background: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
            backgroundImage: 'none',
            overflow: 'hidden',
            mt: '8vh',
            alignSelf: 'flex-start'
          }
        }}
      >
        {/* Search header inside modal */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', gap: 1.5 }}>
          <SearchIcon sx={{ color: 'text.secondary' }} />
          <TextField
            autoFocus
            fullWidth
            variant="standard"
            placeholder="Search files, folders, users or actions..."
            value={cmdQuery}
            onChange={(e) => setCmdQuery(e.target.value)}
            InputProps={{
              disableUnderline: true,
              endAdornment: (
                <IconButton size="small" onClick={() => { setCmdOpen(false); setCmdQuery(''); }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              )
            }}
            sx={{
              '& input': {
                fontSize: '1rem',
                fontWeight: 500,
                color: 'text.primary'
              }
            }}
          />
        </Box>

        <DialogContent sx={{ p: 0, maxHeight: 380, overflowY: 'auto' }}>
          
          {/* 1. Showing static Navigation options when query is empty */}
          {!cmdQuery && (
            <Box>
              <Typography variant="caption" sx={{ display: 'block', px: 2.5, py: 1.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary' }}>
                Quick Navigation & Commands
              </Typography>
              <List sx={{ p: 0 }}>
                <ListItemButton onClick={() => handleCommandAction('/')} sx={{ py: 1.2, px: 2.5, gap: 2 }}>
                  <DashboardIcon sx={{ color: '#2563eb', fontSize: '1.2rem' }} />
                  <ListItemText primary="Go to Dashboard" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                  <ArrowForwardIosIcon sx={{ fontSize: '0.65rem', color: 'text.secondary' }} />
                </ListItemButton>

                <ListItemButton onClick={() => handleCommandAction('/explorer')} sx={{ py: 1.2, px: 2.5, gap: 2 }}>
                  <FolderCopyIcon sx={{ color: '#10b981', fontSize: '1.2rem' }} />
                  <ListItemText primary="Go to Folder Explorer" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                  <ArrowForwardIosIcon sx={{ fontSize: '0.65rem', color: 'text.secondary' }} />
                </ListItemButton>

                {hasPermission('manage_users') && (
                  <ListItemButton onClick={() => handleCommandAction('/users')} sx={{ py: 1.2, px: 2.5, gap: 2 }}>
                    <ManageAccountsIcon sx={{ color: '#8b5cf6', fontSize: '1.2rem' }} />
                    <ListItemText primary="Go to User Management" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                    <ArrowForwardIosIcon sx={{ fontSize: '0.65rem', color: 'text.secondary' }} />
                  </ListItemButton>
                )}

                {hasPermission('manage_users') && (
                  <ListItemButton onClick={() => handleCommandAction('/logs')} sx={{ py: 1.2, px: 2.5, gap: 2 }}>
                    <AdminPanelSettingsIcon sx={{ color: '#64748b', fontSize: '1.2rem' }} />
                    <ListItemText primary="Go to Activity Logs Audit" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                    <ArrowForwardIosIcon sx={{ fontSize: '0.65rem', color: 'text.secondary' }} />
                  </ListItemButton>
                )}

                <ListItemButton onClick={() => handleCommandAction(toggleTheme)} sx={{ py: 1.2, px: 2.5, gap: 2 }}>
                  <KeyboardIcon sx={{ color: '#f59e0b', fontSize: '1.2rem' }} />
                  <ListItemText primary={`Switch to ${mode === 'dark' ? 'Light Mode' : 'Dark Mode'}`} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                  <Chip label="Theme Toggle" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                </ListItemButton>
              </List>
            </Box>
          )}

          {/* 2. Showing loader when searching API */}
          {searching && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6, gap: 1.5 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">Searching database records...</Typography>
            </Box>
          )}

          {/* 3. Render Search Results from API */}
          {cmdQuery && !searching && (
            <Box>
              
              {/* FOLDERS SECTION */}
              {cmdResults.folders.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', px: 2.5, py: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', bgcolor: 'action.hover' }}>
                    Folders ({cmdResults.folders.length})
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {cmdResults.folders.map((f) => (
                      <ListItemButton key={f.id} onClick={() => handleCommandAction(`/explorer?folder=${f.id}`)} sx={{ py: 1, px: 2.5, gap: 2 }}>
                        <FolderIcon sx={{ color: '#facc15', fontSize: '1.25rem' }} />
                        <ListItemText 
                          primary={f.name} 
                          primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} 
                          secondary={`${f.file_count || 0} files • ${f.subfolder_count || 0} subfolders`}
                          secondaryTypographyProps={{ fontSize: '0.72rem' }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              )}

              {/* FILES SECTION */}
              {cmdResults.files.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', px: 2.5, py: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', bgcolor: 'action.hover' }}>
                    Files ({cmdResults.files.length})
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {cmdResults.files.map((file) => (
                      <ListItemButton key={file.id} onClick={() => handleCommandAction(`/explorer?folder=${file.folder}`)} sx={{ py: 1, px: 2.5, gap: 2 }}>
                        <InsertDriveFileIcon sx={{ color: '#2563eb', fontSize: '1.25rem' }} />
                        <ListItemText 
                          primary={file.name} 
                          primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} 
                          secondary={`v${file.version_number} • ${file.size_formatted} • Modified ${new Date(file.updated_at).toLocaleDateString()}`}
                          secondaryTypographyProps={{ fontSize: '0.72rem' }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              )}

              {/* USERS SECTION (ADMIN ONLY) */}
              {cmdResults.users && cmdResults.users.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', px: 2.5, py: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', bgcolor: 'action.hover' }}>
                    Users ({cmdResults.users.length})
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {cmdResults.users.map((u) => (
                      <ListItemButton key={u.id} onClick={() => handleCommandAction('/users')} sx={{ py: 1, px: 2.5, gap: 2 }}>
                        <Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem', bgcolor: 'primary.main' }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <ListItemText 
                          primary={u.name} 
                          primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} 
                          secondary={`${u.email} • ${u.designation || 'Staff'} - ${u.department || 'MOU Office'}`}
                          secondaryTypographyProps={{ fontSize: '0.72rem' }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              )}

              {/* EMPTY STATE INSIDE DIALOG */}
              {cmdResults.folders.length === 0 && cmdResults.files.length === 0 && (!cmdResults.users || cmdResults.users.length === 0) && (
                <Box sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
                  <SearchIcon sx={{ fontSize: 32, mb: 1, opacity: 0.4 }} />
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    No results matching "{cmdQuery}"
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        {/* Footer shortcuts helper */}
        <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <kbd style={{ border: '1px solid', borderColor: 'divider', px: 0.75, py: 0.1, borderRadius: '4px', background: '#ffffff', color: '#0f172a', fontSize: '0.62rem', fontWeight: 700 }}>↑↓</kbd> Navigate
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <kbd style={{ border: '1px solid', borderColor: 'divider', px: 0.75, py: 0.1, borderRadius: '4px', background: '#ffffff', color: '#0f172a', fontSize: '0.62rem', fontWeight: 700 }}>Enter</kbd> Select
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Press <kbd style={{ border: '1px solid', borderColor: 'divider', px: 0.75, py: 0.1, borderRadius: '4px', background: '#ffffff', color: '#0f172a', fontSize: '0.62rem', fontWeight: 700 }}>Esc</kbd> to close
          </Typography>
        </Box>
      </Dialog>
      
    </Box>
  );
};

export default Layout;
