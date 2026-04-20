import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Logo from './components/Logo';
import Home from './pages/Home';
import About from './pages/About';
import Courses from './pages/Courses';
import StudentInfo from './pages/StudentInfo';
import Contacts from './pages/Contacts';
import Alumni from './pages/Alumni';
import Events from './pages/Events';
import Teachers from './pages/Teachers';
import Login from './pages/Login';
import UnifiedLogin from './pages/UnifiedLogin';
import StudentLogin from './pages/StudentLogin';
import StudentPortal from './pages/StudentPortal';
import TeacherLogin from './pages/TeacherLogin';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ParentDashboard from './pages/ParentDashboard';
import Reports from './pages/Reports';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Unauthorized from './pages/Unauthorized';
import TwoFactorSetup from './components/TwoFactorSetup';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app">
          <header className="header">
            <div className="logo-container">
              <Logo />
            </div>
            <nav className="navbar">
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/courses">Courses</Link></li>
                <li><Link to="/events">Events</Link></li>
                <li><Link to="/alumni">Alumni</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/student-login" className="student-link">🎓 Student Portal</Link></li>
                <li><Link to="/teacher-login" className="teacher-link">👨‍🏫 Teacher</Link></li>
                <li><Link to="/login" className="admin-link">Admin</Link></li>
              </ul>
            </nav>
          </header>
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/student-info" element={<StudentInfo />} />
              <Route path="/contact" element={<Contacts />} />
              <Route path="/alumni" element={<Alumni />} />
              <Route path="/events" element={<Events />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/login" element={<UnifiedLogin />} />
              <Route path="/student-login" element={<UnifiedLogin />} />
              <Route path="/teacher-login" element={<UnifiedLogin />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected Routes with Role-based Access */}
              <Route path="/student-portal" element={
                <ProtectedRoute requiredRole="student">
                  <StudentPortal />
                </ProtectedRoute>
              } />
              <Route path="/teacher-portal" element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/parent" element={
                <ProtectedRoute requiredRole="parent">
                  <ParentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute requiredRole="teacher">
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute requiredRole="admin">
                  <AnalyticsDashboard />
                </ProtectedRoute>
              } />
              <Route path="/setup-2fa" element={
                <ProtectedRoute>
                  <TwoFactorSetup />
                </ProtectedRoute>
              } />
              
              {/* Legacy routes - redirect to new login */}
              <Route path="/student-login" element={<Navigate to="/login" replace />} />
              <Route path="/teacher-login" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
          
          <footer className="footer">
            <div className="footer-content">
              <div className="footer-section">
                <h3>Lycée Saint Alexandre Sauli</h3>
                <p>TVET - MUHURA</p>
                <p>Excellence in Technical Education</p>
              </div>
              <div className="footer-section">
                <h3>Quick Links</h3>
                <ul>
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/about">About</Link></li>
                  <li><Link to="/courses">Courses</Link></li>
                  <li><Link to="/events">Events</Link></li>
                  <li><Link to="/alumni">Alumni</Link></li>
                  <li><Link to="/contact">Contact</Link></li>
                  <li><Link to="/student-login">Student Portal</Link></li>
                  <li><Link to="/teacher-login">Teacher Portal</Link></li>
                </ul>
              </div>
              <div className="footer-section">
                <h3>Contact Info</h3>
                <p>123 Education Street</p>
                <p>Muhura City, Rwanda</p>
                <p>Phone: +250 78 123 4567</p>
                <p>Email: info@lyceedumuhura.edu</p>
              </div>
              <div className="footer-section">
                <h3>Follow Us</h3>
                <div className="social-links">
                  <a href="https://facebook.com/lyceedumuhura" target="_blank" rel="noopener noreferrer" className="social-link facebook">
                    <span className="social-icon">📘</span>
                    <span>Facebook</span>
                  </a>
                  <a href="https://twitter.com/lyceedumuhura" target="_blank" rel="noopener noreferrer" className="social-link twitter">
                    <span className="social-icon">🐦</span>
                    <span>Twitter</span>
                  </a>
                  <a href="https://instagram.com/lyceedumuhura" target="_blank" rel="noopener noreferrer" className="social-link instagram">
                    <span className="social-icon">📷</span>
                    <span>Instagram</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="footer-bottom">
              <p>&copy; 2024 Lycée Saint Alexandre Sauli TVET - MUHURA. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
