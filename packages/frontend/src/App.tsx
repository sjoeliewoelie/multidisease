import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { Helmet } from 'react-helmet-async';

import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Auth Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';

// Dashboard Pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import PatientsPage from './pages/Patients/PatientsPage';
import PatientDetailPage from './pages/Patients/PatientDetailPage';
import TreatmentsPage from './pages/Treatments/TreatmentsPage';
import TreatmentDetailPage from './pages/Treatments/TreatmentDetailPage';
import TasksPage from './pages/Tasks/TasksPage';
import MedicationsPage from './pages/Medications/MedicationsPage';
import VitalSignsPage from './pages/VitalSigns/VitalSignsPage';
import AppointmentsPage from './pages/Appointments/AppointmentsPage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ProfilePage from './pages/Profile/ProfilePage';

// Admin Pages
import UsersManagementPage from './pages/Admin/UsersManagementPage';
import OrganizationsPage from './pages/Admin/OrganizationsPage';
import RulesManagementPage from './pages/Admin/RulesManagementPage';
import SystemSettingsPage from './pages/Admin/SystemSettingsPage';

// Error Pages
import NotFoundPage from './pages/Error/NotFoundPage';
import UnauthorizedPage from './pages/Error/UnauthorizedPage';

// Route Guards
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RoleBasedRoute from './components/Auth/RoleBasedRoute';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <LoadingSpinner size={60} />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Multi-Disease Treatment Platform</title>
        <meta name="description" content="Comprehensive platform for remote treatment monitoring across multiple diseases" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />
        <Route 
          path="/register" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <RegisterPage />
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />
          } 
        />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route path="" element={<Navigate to="/dashboard" replace />} />
          
          <Route element={<Layout />}>
            {/* Dashboard */}
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* Patient Management */}
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/:id" element={<PatientDetailPage />} />
            
            {/* Treatment Management */}
            <Route path="treatments" element={<TreatmentsPage />} />
            <Route path="treatments/:id" element={<TreatmentDetailPage />} />
            
            {/* Task Management */}
            <Route path="tasks" element={<TasksPage />} />
            
            {/* Medication Management */}
            <Route path="medications" element={<MedicationsPage />} />
            
            {/* Vital Signs & Monitoring */}
            <Route path="vital-signs" element={<VitalSignsPage />} />
            
            {/* Appointments */}
            <Route path="appointments" element={<AppointmentsPage />} />
            
            {/* Reports & Analytics */}
            <Route path="reports" element={<ReportsPage />} />
            
            {/* User Profile */}
            <Route path="profile" element={<ProfilePage />} />
            
            {/* Settings */}
            <Route path="settings" element={<SettingsPage />} />
            
            {/* Admin Routes */}
            <Route path="admin" element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} />}>
              <Route path="users" element={<UsersManagementPage />} />
              <Route path="organizations" element={<OrganizationsPage />} />
              <Route path="rules" element={<RulesManagementPage />} />
              <Route path="system" element={<SystemSettingsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  );
}

export default App; 