import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Display from './pages/Display/Display';
import Login from './pages/Login/Login';
import SecretLogin from './pages/Admin/SecretLogin';
import Admin from './pages/Admin/Admin';
import Dashboard from './pages/Admin/Dashboard';
import TimetableManager from './pages/Admin/TimetableManager';
import FullTimetableView from './pages/Admin/FullTimetableView';
import AnnouncementsManager from './pages/Admin/AnnouncementsManager';
import PhoneNumbersManager from './pages/Admin/PhoneNumbersManager';
import TeacherProfile from './pages/Admin/TeacherProfile';
import SchoolEventsManager from './pages/Admin/SchoolEventsManager';
import Profile from './pages/Admin/Profile';
import ParentsManager from './pages/Admin/ParentsManager';
import TeacherNotificationSetup from './pages/Teacher/TeacherNotificationSetup';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import TeacherAnnouncements from './pages/Teacher/TeacherAnnouncements';
import ScheduleManagement from './pages/Admin/ScheduleManagement';
import TimetableGenerator from './pages/Admin/TimetableGenerator';
import SmartTimetableSystem from './pages/Admin/SmartTimetableSystem';
import About from './pages/Home/About';
import Contact from './pages/Home/Contact';

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
        <SocketProvider>
          <AuthProvider>
            <Router future={{ v7_relativeSplatPath: true }}>
            <Routes>
              {/* Public Display Route */}
              <Route path="/display" element={<Display filterClassId={undefined} filterLevel={undefined} />} />

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
                <Route path="timetable-generator" element={<TimetableGenerator />} />
                <Route path="smart-timetable" element={<SmartTimetableSystem />} />
                <Route path="timetable/view" element={<FullTimetableView />} />
                <Route path="schedule" element={<ScheduleManagement />} />
                <Route path="teachers" element={<TeacherProfile />} />
                <Route path="announcements" element={<AnnouncementsManager />} />
                <Route path="phone-numbers" element={<PhoneNumbersManager />} />
                <Route path="school-events" element={<SchoolEventsManager />} />
                <Route path="profile" element={<Profile />} />
                <Route path="parents" element={<ParentsManager />} />
              </Route>

              {/* Teacher Notification Setup (public for teachers to register) */}
              <Route path="/teacher/notifications" element={<TeacherNotificationSetup />} />

              {/* Manager Dashboard (protected) */}
              <Route path="/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />

              {/* Teacher Dashboard (protected) */}
              <Route path="/teacher/dashboard" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/announcements" element={<ProtectedRoute><TeacherAnnouncements /></ProtectedRoute>} />

              {/* Public Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/admin/login" replace />} />
              <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
        </SocketProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
