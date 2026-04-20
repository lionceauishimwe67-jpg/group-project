import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import './Admin.css';

const Admin: React.FC = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-logo">
            <span>📚</span>
            School Timetable
          </h2>
          <p className="sidebar-subtitle">Admin Dashboard</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin/dashboard" className="nav-item" end>
            <span className="nav-icon">📊</span>
            Dashboard
          </NavLink>
          <NavLink to="/admin/timetable" className="nav-item">
            <span className="nav-icon">🗓️</span>
            Manage Timetable
          </NavLink>
          <NavLink to="/admin/teachers" className="nav-item">
            <span className="nav-icon">👨‍🏫</span>
            Teacher Profiles
          </NavLink>
          <NavLink to="/admin/announcements" className="nav-item">
            <span className="nav-icon">📢</span>
            Announcements
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => navigate('/display')} className="back-button">
            <span>🔙</span>
            Back to Display
          </button>
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">{user?.username || 'Admin'}</div>
              <div className="user-role">{user?.role || 'admin'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Admin;
