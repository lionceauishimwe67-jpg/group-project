import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Display from './pages/Display/Display';
import Login from './pages/Login/Login';
import SecretLogin from './pages/Admin/SecretLogin';
import Admin from './pages/Admin/Admin';
import Dashboard from './pages/Admin/Dashboard';
import TimetableManager from './pages/Admin/TimetableManager';
import AnnouncementsManager from './pages/Admin/AnnouncementsManager';
import TeacherProfile from './pages/Admin/TeacherProfile';
import TeacherNotificationSetup from './pages/Teacher/TeacherNotificationSetup';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';

// Components
import { ToastProvider } from './components/ToastNotification';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Secret login wrapper
const SecretLoginWrapper: React.FC = () => {
  const { login } = useAuthContext();
  const navigate = useNavigate();

  const handleLogin = (token: string) => {
    // Store token and user info directly for secret login
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ id: 0, username: 'admin', role: 'admin' }));
    navigate('/admin/dashboard');
  };

  return <SecretLogin onLogin={handleLogin} />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router future={{ v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Display Route */}
            <Route path="/display" element={<Display />} />

          {/* Admin Login */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/secret" element={<SecretLoginWrapper />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="timetable" element={<TimetableManager />} />
            <Route path="teachers" element={<TeacherProfile />} />
            <Route path="announcements" element={<AnnouncementsManager />} />
          </Route>

          {/* Teacher Notification Setup (public for teachers to register) */}
          <Route path="/teacher/notifications" element={<TeacherNotificationSetup />} />

          {/* Manager Dashboard (protected) */}
          <Route path="/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />

          {/* Teacher Dashboard (protected) */}
          <Route path="/teacher/dashboard" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/display" replace />} />
          <Route path="*" element={<Navigate to="/display" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
    </ToastProvider>
  </ErrorBoundary>
  );
};

export default App;
