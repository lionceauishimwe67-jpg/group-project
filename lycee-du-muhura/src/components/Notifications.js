import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Info, 
  AlertTriangle, 
  AlertCircle,
  Clock,
  Trash2,
  CheckCheck
} from 'lucide-react';
import apiService from '../services/api';
import authService from '../services/authService';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const user = authService.getUser();

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const params = {
        userId: user.id,
        role: user.role
      };
      const data = await apiService.request('/api/notifications', 'GET', null, params);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await apiService.request(`/api/notifications/${notifId}`, 'PUT');
      // Update local state
      setNotifications(prev => 
        prev.map(n => n._id === notifId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.request('/api/notifications/read-all', 'PUT', { userId: user.id });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      // Note: You'd need to add a DELETE endpoint for this
      // For now, just remove from local state
      setNotifications(prev => prev.filter(n => n._id !== notifId));
      const deleted = notifications.find(n => n._id === notifId);
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={18} className="icon-warning" />;
      case 'error':
        return <AlertCircle size={18} className="icon-error" />;
      case 'success':
        return <Check size={18} className="icon-success" />;
      case 'info':
      default:
        return <Info size={18} className="icon-info" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <div className="notifications-wrapper">
      {/* Bell Icon with Badge */}
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="notification-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>
                <Bell size={18} />
                Notifications
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount} new</span>
                )}
              </h3>
              <div className="notification-actions">
                {unreadCount > 0 && (
                  <button 
                    className="btn-mark-all"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                <button 
                  className="btn-close"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <Bell size={40} className="empty-icon" />
                  <p>No notifications yet</p>
                  <span>We'll notify you when something important happens</span>
                </div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification._id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => !notification.read && markAsRead(notification._id)}
                  >
                    <div className={`notification-icon ${notification.type}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">
                        <Clock size={12} />
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    <div className="notification-actions-row">
                      {!notification.read && (
                        <button 
                          className="btn-read"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button 
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notification-footer">
                <button onClick={() => setIsOpen(false)}>
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Notifications;
