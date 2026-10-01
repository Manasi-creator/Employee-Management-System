import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { PublicRoute, ProtectedRoute, RoleGuard } from './guards';
import {
  LoginPage,
  ChangePasswordPage,
  HRDashboard,
  EmployeesPage,
  ManagersPage,
  DepartmentsPage,
  DesignationsPage,
  HRLeavePage,
  HRProjectsPage,
  FormerEmployeesPage,
  HRProfilePage,
  ManagerDashboard,
  TeamEmployeesPage,
  ManagerLeavePage,
  ManagerProjectsPage,
  ManagerProfilePage,
  EmployeeDashboard,
  EmployeeProfilePage,
  MyLeavePage,
  MyProjectsPage,
} from '../pages';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Force Change Password Route */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      {/* Authenticated Application Layout */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* HR Routes */}
        <Route
          path="hr/dashboard"
          element={
            <RoleGuard allowedRoles={['HR']}>
              <HRDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="hr/employees"
          element={
            <RoleGuard allowedRoles={['HR']}>
              <EmployeesPage />
            </RoleGuard>
          }
        />
        <Route
          path="hr/managers"
          element={
            <RoleGuard allowedRoles={['HR']}>
              <ManagersPage />
            </RoleGuard>
          }
        />
        <Route
          path="hr/departments"
          element={
            <RoleGuard allowedRoles={['HR']}>
              <DepartmentsPage />
            </RoleGuard>
          }
        />
        <Route
          path="hr/designations"
          element={
            <RoleGuard allowedRoles={['HR']}>
              <DesignationsPage />
            </RoleGuard>
          }
        />
        <Route
          path="hr/leave"
          element={
            <RoleGuard allowedRoles={['HR']}>
              <HRLeavePage />
            </RoleGuard>
          }
        />
        <Route
          path="hr/projects"
          element={
            <RoleGuard allowedRoles={['HR']}>
              <HRProjectsPage />
            </RoleGuard>
          }
        />
        <Route
          path="hr/former-employees"
          element={
            <RoleGuard allowedRoles={['HR']}>
              <FormerEmployeesPage />
            </RoleGuard>
          }
        />
        <Route
          path="hr/profile"
          element={
            <RoleGuard allowedRoles={['HR']}>
              <HRProfilePage />
            </RoleGuard>
          }
        />

        {/* Manager Routes */}
        <Route
          path="manager/dashboard"
          element={
            <RoleGuard allowedRoles={['MANAGER']}>
              <ManagerDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="manager/team"
          element={
            <RoleGuard allowedRoles={['MANAGER']}>
              <TeamEmployeesPage />
            </RoleGuard>
          }
        />
        <Route
          path="manager/leave"
          element={
            <RoleGuard allowedRoles={['MANAGER']}>
              <ManagerLeavePage />
            </RoleGuard>
          }
        />
        <Route
          path="manager/projects"
          element={
            <RoleGuard allowedRoles={['MANAGER']}>
              <ManagerProjectsPage />
            </RoleGuard>
          }
        />
        <Route
          path="manager/profile"
          element={
            <RoleGuard allowedRoles={['MANAGER']}>
              <ManagerProfilePage />
            </RoleGuard>
          }
        />

        {/* Employee Routes */}
        <Route
          path="employee/dashboard"
          element={
            <RoleGuard allowedRoles={['EMPLOYEE']}>
              <EmployeeDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="employee/profile"
          element={
            <RoleGuard allowedRoles={['EMPLOYEE']}>
              <EmployeeProfilePage />
            </RoleGuard>
          }
        />
        <Route
          path="employee/leave"
          element={
            <RoleGuard allowedRoles={['EMPLOYEE']}>
              <MyLeavePage />
            </RoleGuard>
          }
        />
        <Route
          path="employee/projects"
          element={
            <RoleGuard allowedRoles={['EMPLOYEE']}>
              <MyProjectsPage />
            </RoleGuard>
          }
        />

        {/* Default /app fallback */}
        <Route index element={<Navigate to="/login" replace />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
