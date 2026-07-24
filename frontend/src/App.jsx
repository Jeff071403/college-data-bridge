import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeModeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FolderExplorer from './pages/FolderExplorer';
import UserManagement from './pages/UserManagement';
import ActivityLog from './pages/ActivityLog';
import Profile from './pages/Profile';
import SystemMap from './pages/SystemMap';
import MOURepository from './pages/MOURepository';
import MOUDetail from './pages/MOUDetail';
import MOUCreate from './pages/MOUCreate';
import Reports from './pages/Reports';
import Templates from './pages/Templates';
import SharedWithMe from './pages/SharedWithMe';
import Departments from './pages/Departments';
import NotificationsPage from './pages/NotificationsPage';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <ThemeModeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Login Page */}
            <Route path="/login" element={<Login />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/mou-repository"
              element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <Layout><MOURepository /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/mou/create"
              element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <Layout><MOUCreate /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/mou/:id"
              element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <Layout><MOUDetail /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/shared"
              element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <Layout><SharedWithMe /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/departments"
              element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <Layout><Departments /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <Layout><Reports /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/templates"
              element={
                <ProtectedRoute requiredPermission="manage_users">
                  <Layout><Templates /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute requiredPermission="view_notifications">
                  <Layout><NotificationsPage /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <Layout><Settings /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/explorer"
              element={
                <ProtectedRoute requiredPermission="view_folder">
                  <Layout><FolderExplorer /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute requiredPermission="manage_users">
                  <Layout><UserManagement /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/logs"
              element={
                <ProtectedRoute requiredPermission="manage_users">
                  <Layout><ActivityLog /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout><Profile /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/system-map"
              element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <Layout><SystemMap /></Layout>
                </ProtectedRoute>
              }
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeModeProvider>
    </Router>
  );
}

export default App;
