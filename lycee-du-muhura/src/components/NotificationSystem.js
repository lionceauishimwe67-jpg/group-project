import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, Mail } from 'lucide-react';
import './NotificationSystem.css';

const NotificationSystem = ({ user }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'info',
      title: 'Welcome!',
      message: 'Welcome to Lycée du Muhura School Management System.',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: 2,
      type: 'success',
      title: 'Grades Published',
      message: 'Your grades for Term 2 have been published.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: false
    },
    {
      id: 3,
      type: 'warning',
      title: 'Exam Reminder',
      message: 'Mathematics exam starts tomorrow at 8:00 AM.',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      read: true
    }
  ]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addNotification = (type, title, message) => {
    const newNotification = {
      id: Date.now(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle size={20} className="icon-success" />;
      case 'warning': return <AlertTriangle size={20} className="icon-warning" />;
      case 'error': return <AlertTriangle size={20} className="icon-error" />;
      default: return <Info size={20} className="icon-info" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Simulate receiving new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add notifications for demo
      if (Math.random() > 0.95) {
        const types = ['info', 'success', 'warning'];
        const titles = ['New Message', 'Grade Update', 'Event Reminder', 'System Alert'];
        const messages = [
          'You have a new message from your teacher.',
          'Your recent assignment has been graded.',
          'Don\'t forget about the school event tomorrow.',
          'System maintenance scheduled for tonight.'
        ];
        
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomTitle = titles[Math.floor(Math.random() * titles.length)];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        addNotification(randomType, randomTitle, randomMessage);
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="notification-system">
      {/* Bell Icon */}
      <button className="notification-bell" onClick={() => setIsOpen(!isOpen)}>
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              <button onClick={markAllAsRead} className="btn-text">
                Mark all read
              </button>
              <button onClick={() => setIsOpen(false)} className="btn-close">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="notification-settings">
            <label className="setting-toggle">
              <Mail size={16} />
              <span>Email notifications</span>
              <input 
                type="checkbox" 
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
            </label>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Info size={40} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  <button 
                    className="notification-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
