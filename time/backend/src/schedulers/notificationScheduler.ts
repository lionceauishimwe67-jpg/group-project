import cron from 'node-cron';
import { query } from '../config/database';
import {
  sendClassReminder,
  sendClassStartNotification,
  initializeFirebase,
} from '../services/notificationService';

// Initialize Firebase on startup
initializeFirebase();

// Check for upcoming classes every minute
export const startNotificationScheduler = () => {
  console.log('Starting notification scheduler...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      await checkAndSendNotifications();
    } catch (error) {
      console.error('Error in notification scheduler:', error);
    }
  });

  console.log('Notification scheduler started - checking every minute');
};

const checkAndSendNotifications = async () => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Get all upcoming classes for today
  const upcomingClasses = await query<any[]>(
    `SELECT 
      t.id,
      t.class_id,
      c.name AS class_name,
      t.subject_id,
      s.name AS subject_name,
      t.teacher_id,
      te.name AS teacher_name,
      te.notification_enabled,
      te.notification_advance_minutes,
      te.device_token,
      t.classroom_id,
      cl.name AS classroom_name,
      substr(t.start_time, 1, 5) AS start_time,
      substr(t.end_time, 1, 5) AS end_time,
      t.day_of_week
    FROM timetable t
    JOIN classes c ON t.class_id = c.id
    JOIN subjects s ON t.subject_id = s.id
    JOIN teachers te ON t.teacher_id = te.id
    JOIN classrooms cl ON t.classroom_id = cl.id
    WHERE t.day_of_week = ?
      AND t.is_active = 1
      AND (
        -- Regular session (not temporary)
        (t.is_temporary = 0)
        OR
        -- Temporary session for today
        (t.is_temporary = 1 AND t.temporary_date = date('now'))
      )
    ORDER BY t.start_time`,
    [currentDayOfWeek]
  );

  for (const classInfo of upcomingClasses) {
    const classStartTime = classInfo.start_time;
    const advanceMinutes = classInfo.notification_advance_minutes || 15;

    // Calculate the time when reminder should be sent
    const [hours, minutes] = classStartTime.split(':').map(Number);
    const reminderTime = new Date(now);
    reminderTime.setHours(hours, minutes - advanceMinutes, 0, 0);

    // Calculate the reminder time string
    const reminderTimeString = reminderTime.toTimeString().slice(0, 5);

    // Check if it's time to send the reminder (within the last minute)
    if (currentTime === reminderTimeString) {
      // Check if we already sent a notification for this class today
      const existingNotifications = await query<any[]>(
        `SELECT id FROM notifications 
         WHERE timetable_id = ? 
         AND teacher_id = ?
         AND notification_type = 'class_reminder'
         AND sent_at >= date('now')
         AND status = 'sent'`,
        [classInfo.id, classInfo.teacher_id]
      );

      if (existingNotifications.length === 0) {
        console.log(`Sending reminder for class: ${classInfo.subject_name} - ${classInfo.class_name}`);
        
        await sendClassReminder(
          classInfo.teacher_id,
          classInfo.teacher_name,
          classInfo.subject_name,
          classInfo.class_name,
          classInfo.start_time,
          classInfo.classroom_name,
          classInfo.id,
          advanceMinutes
        );
      }
    }

    // Check if it's time to send the "class starting now" notification
    if (currentTime === classStartTime) {
      // Check if we already sent a start notification for this class today
      const existingNotifications = await query<any[]>(
        `SELECT id FROM notifications 
         WHERE timetable_id = ? 
         AND teacher_id = ?
         AND notification_type = 'class_start'
         AND sent_at >= date('now')
         AND status = 'sent'`,
        [classInfo.id, classInfo.teacher_id]
      );

      if (existingNotifications.length === 0) {
        console.log(`Sending start notification for class: ${classInfo.subject_name} - ${classInfo.class_name}`);
        
        await sendClassStartNotification(
          classInfo.teacher_id,
          classInfo.teacher_name,
          classInfo.subject_name,
          classInfo.class_name,
          classInfo.start_time,
          classInfo.classroom_name,
          classInfo.id
        );
      }
    }
  }
};
