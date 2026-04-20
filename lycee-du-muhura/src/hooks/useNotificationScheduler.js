import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';

/**
 * Hook to schedule smart notifications before sessions and breaks
 * Configurable timing: 5, 10, 15 minutes before
 */
export const useNotificationScheduler = (timetable, enabled = true) => {
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    sessionReminder: 5, // minutes before session
    breakReminder: 5,  // minutes before break
    enabled: true
  });

  // Request notification permission
  useEffect(() => {
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enabled]);

  const scheduleNotifications = useCallback(() => {
    if (!enabled || !notificationSettings.enabled) return;

    const now = new Date();
    const notifications = [];
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Get today's sessions
    const todaySessions = timetable.filter(t => t.day === currentDay);
    
    todaySessions.forEach(session => {
      const startTime = parseTime(session.startTime);
      const endTime = parseTime(session.endTime);
      
      // Session reminder
      const sessionReminderTime = new Date(startTime - notificationSettings.sessionReminder * 60000);
      if (sessionReminderTime > now) {
        notifications.push({
          id: `session-${session._id}`,
          type: 'session',
          title: `Upcoming: ${session.subject}`,
          body: `${session.subject} starts in ${notificationSettings.sessionReminder} minutes`,
          icon: Bell,
          time: sessionReminderTime,
          sessionId: session._id
        });
      }
      
      // Break reminder (find next session after this one)
      const nextSession = todaySessions.find(s => parseTime(s.startTime) > endTime);
      if (nextSession) {
        const nextStartTime = parseTime(nextSession.startTime);
        const breakEndTime = new Date(nextStartTime - notificationSettings.breakReminder * 60000);
        
        if (breakEndTime > now && breakEndTime < nextStartTime) {
          notifications.push({
            id: `break-${session._id}`,
            type: 'break',
            title: 'Break Time Ending',
            body: `${nextSession.subject} starts in ${notificationSettings.breakReminder} minutes`,
            icon: Bell,
            time: breakEndTime,
            sessionId: nextSession._id
          });
        }
      }
    });
    
    setScheduledNotifications(notifications);
  }, [timetable, notificationSettings, enabled]);

  // Schedule notifications
  useEffect(() => {
    scheduleNotifications();
    
    // Check every minute
    const interval = setInterval(() => {
      const now = new Date();
      scheduledNotifications.forEach(notif => {
        if (Math.abs(now - notif.time) < 60000 && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notif.title, {
            body: notif.body,
            icon: '/favicon.ico'
          });
        }
      });
    }, 60000);
    
    return () => clearInterval(interval);
  }, [timetable, notificationSettings, enabled]);

  const updateSettings = (settings) => {
    setNotificationSettings(prev => ({ ...prev, ...settings }));
  };

  return {
    notificationSettings,
    updateSettings,
    scheduledNotifications
  };
};

// Helper: Parse time string to timestamp
const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};
