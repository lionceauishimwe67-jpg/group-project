import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: '📅',
      title: 'Manage Timetable',
      description: 'Add, edit, or delete class schedules',
      path: '/admin/timetable',
      color: '#3b82f6',
    },
    {
      icon: '📢',
      title: 'Announcements',
      description: 'Upload and manage display content',
      path: '/admin/announcements',
      color: '#10b981',
    },
    {
      icon: '📺',
      title: 'View Display',
      description: 'Preview the display screen',
      path: '/display',
      color: '#8b5cf6',
      external: true,
    },
  ];

  const stats = [
    { icon: '⏰', label: 'Lunch Break', value: '12:25 PM - 1:25 PM', color: '#f59e0b' },
    { icon: '☕', label: 'Afternoon Break', value: '3:30 PM - 3:45 PM', color: '#ec4899' },
    { icon: '🌙', label: 'Day Ends', value: '5:00 PM', color: '#6366f1' },
    { icon: '📚', label: 'Etude Time', value: '6:30 PM - 8:25 PM', color: '#14b8a6' },
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Manage your school timetable efficiently.</p>
        </div>
        <div className="dashboard-time">
          <span className="time-icon">🕐</span>
          <span className="time-value">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card" style={{ '--stat-color': stat.color } as React.CSSProperties}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section-title">
        <span className="section-icon">⚡</span>
        Quick Actions
      </div>
      <div className="actions-grid">
        {quickActions.map((action, index) => (
          <div
            key={index}
            className="action-card"
            style={{ '--action-color': action.color } as React.CSSProperties}
            onClick={() => {
              if (action.external) {
                window.open(action.path, '_blank');
              } else {
                navigate(action.path);
              }
            }}
          >
            <div className="action-icon-wrapper">
              <span className="action-icon">{action.icon}</span>
            </div>
            <div className="action-content">
              <h3 className="action-title">{action.title}</h3>
              <p className="action-description">{action.description}</p>
            </div>
            <div className="action-arrow">→</div>
          </div>
        ))}
      </div>

      {/* Info Cards */}
      <div className="info-section">
        <div className="info-card primary">
          <div className="info-icon">💡</div>
          <div className="info-content">
            <h3>Quick Tip</h3>
            <p>
              Changes made here will automatically appear on all display screens within 5-10 seconds 
              due to automatic polling. No manual refresh needed!
            </p>
          </div>
        </div>

        <div className="info-card secondary">
          <div className="info-icon">🔗</div>
          <div className="info-content">
            <h3>Display URL</h3>
            <code className="url-code">{window.location.origin}/display</code>
            <p>Use this URL for Raspberry Pi displays or any screen showing the timetable.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <p>School Timetable Management System © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default Dashboard;
