import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { NotFoundPage } from './pages/auth/NotFoundPage';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { MyGroupPage } from './pages/student/MyGroupPage';
import { StudentAssignmentsPage } from './pages/student/StudentAssignmentsPage';
import { AssignmentDetailsPage } from './pages/student/AssignmentDetailsPage';
import { StudentSubmissionsPage } from './pages/student/StudentSubmissionsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ManageAssignmentsPage } from './pages/admin/ManageAssignmentsPage';
import { CreateAssignmentPage } from './pages/admin/CreateAssignmentPage';
import { EditAssignmentPage } from './pages/admin/EditAssignmentPage';
import { ManageGroupsPage } from './pages/admin/ManageGroupsPage';
import { GroupDetailsPage } from './pages/admin/GroupDetailsPage';
import { SubmissionMonitoringPage } from './pages/admin/SubmissionMonitoringPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';

// Smart Home Redirector
const RootRedirector = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return user?.role === 'ADMIN' ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    <Navigate to="/student/dashboard" replace />
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Root smart redirect */}
            <Route path="/" element={<RootRedirector />} />

            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Student Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
              <Route element={<StudentLayout />}>
                <Route path="/student/dashboard" element={<StudentDashboardPage />} />
                <Route path="/student/group" element={<MyGroupPage />} />
                <Route path="/student/assignments" element={<StudentAssignmentsPage />} />
                <Route path="/student/assignments/:id" element={<AssignmentDetailsPage />} />
                <Route path="/student/submissions" element={<StudentSubmissionsPage />} />
                <Route path="/student/profile" element={<StudentProfilePage />} />
              </Route>
            </Route>

            {/* Admin Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/assignments" element={<ManageAssignmentsPage />} />
                <Route path="/admin/assignments/new" element={<CreateAssignmentPage />} />
                <Route path="/admin/assignments/edit/:id" element={<EditAssignmentPage />} />
                <Route path="/admin/groups" element={<ManageGroupsPage />} />
                <Route path="/admin/groups/:id" element={<GroupDetailsPage />} />
                <Route path="/admin/submissions" element={<SubmissionMonitoringPage />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                <Route path="/admin/profile" element={<AdminProfilePage />} />
              </Route>
            </Route>

            {/* Errors and Not Found */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
