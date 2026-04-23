import admin from 'firebase-admin';
import { query } from '../config/database';
import { sendSMSNotificationToTeacher } from './smsService';

// Initialize Firebase Admin SDK (placeholder - needs actual credentials)
let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = () => {
  try {
    if (!firebaseApp) {
      // In production, you would use actual Firebase credentials
      // For now, we'll use a mock implementation
      // firebaseApp = admin.initializeApp({
      //   credential: admin.credential.cert({
      //     projectId: process.env.FIREBASE_PROJECT_ID,
      //     privateKey: process.env.FIREBASE_PRIVATE_KEY,
      //     clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      //   }),
      // });
      console.log('Firebase notification service initialized (mock mode)');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
};

// Send push notification to a specific device token
export const sendPushNotification = async (
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // Mock implementation for now
    // In production, this would use Firebase Cloud Messaging
    console.log(`[MOCK] Sending notification to device ${deviceToken}:`);
    console.log(`  Title: ${title}`);
    console.log(`  Body: ${body}`);
    console.log(`  Data: ${JSON.stringify(data || {})}`);

    // Simulate successful notification
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };

    // Production implementation would be:
    // const message = {
    //   notification: { title, body },
    //   data: data || {},
    //   token: deviceToken,
    // };
    // const response = await firebaseApp!.messaging().send(message);
    // return { success: true, messageId: response };
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification',
    };
  }
};

// Send notification to a teacher
export const sendNotificationToTeacher = async (
  teacherId: number,
  title: string,
  body: string,
  timetableId: number,
  notificationType: 'class_reminder' | 'class_start' | 'emergency' = 'class_reminder'
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // Get teacher's device token
    const teachers = await query<any[]>(
      'SELECT id, name, device_token, notification_enabled FROM teachers WHERE id = ?',
      [teacherId]
    );

    if (teachers.length === 0) {
      return { success: false, error: 'Teacher not found' };
    }

    const teacher = teachers[0];

    // Check if notifications are enabled for this teacher
    if (!teacher.notification_enabled || !teacher.device_token) {
      console.log(`Notifications disabled or no device token for teacher ${teacher.name}`);
      return { success: false, error: 'Notifications disabled or no device token' };
    }

    // Send push notification
    const result = await sendPushNotification(teacher.device_token, title, body, {
      teacherId: teacher.id.toString(),
      timetableId: timetableId.toString(),
      type: notificationType,
    });

    // Log notification to database
    if (result.success) {
      await query(
        `INSERT INTO notifications (teacher_id, timetable_id, notification_type, title, body, status)
         VALUES (?, ?, ?, ?, ?, 'sent')`,
        [teacherId, timetableId, notificationType, title, body]
      );
    } else {
      await query(
        `INSERT INTO notifications (teacher_id, timetable_id, notification_type, title, body, status, error_message)
         VALUES (?, ?, ?, ?, ?, 'failed', ?)`,
        [teacherId, timetableId, notificationType, title, body, result.error]
      );
    }

    return result;
  } catch (error: any) {
    console.error('Error sending notification to teacher:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification to teacher',
    };
  }
};

// Send notification to all admins
export const sendNotificationToAdmins = async (
  title: string,
  body: string,
  timetableId: number,
  notificationType: 'class_reminder' | 'class_start' | 'emergency' = 'class_reminder'
): Promise<{ success: boolean; sentCount: number; errors: string[] }> => {
  try {
    // Get all admin users with device tokens
    const users = await query<any[]>(
      `SELECT u.id, u.username, t.device_token 
       FROM users u 
       LEFT JOIN teachers t ON t.user_id = u.id
       WHERE u.role = 'admin' AND t.device_token IS NOT NULL AND t.notification_enabled = 1`
    );

    const errors: string[] = [];
    let sentCount = 0;

    for (const user of users) {
      if (user.device_token) {
        const result = await sendPushNotification(user.device_token, title, body, {
          userId: user.id.toString(),
          timetableId: timetableId.toString(),
          type: notificationType,
        });

        if (result.success) {
          sentCount++;
          // Log notification (using teacher_id = 0 for admin notifications)
          await query(
            `INSERT INTO notifications (teacher_id, timetable_id, notification_type, title, body, status)
             VALUES (?, ?, ?, ?, ?, 'sent')`,
            [user.id, timetableId, notificationType, title, body]
          );
        } else {
          errors.push(`User ${user.username}: ${result.error}`);
        }
      }
    }

    return {
      success: errors.length === 0,
      sentCount,
      errors,
    };
  } catch (error: any) {
    console.error('Error sending notification to admins:', error);
    return {
      success: false,
      sentCount: 0,
      errors: [error.message || 'Failed to send notifications to admins'],
    };
  }
};

// Send class reminder notification
export const sendClassReminder = async (
  teacherId: number,
  teacherName: string,
  subjectName: string,
  className: string,
  startTime: string,
  classroomName: string,
  timetableId: number,
  advanceMinutes: number = 15
): Promise<void> => {
  const title = `Class Starting Soon`;
  const body = `${subjectName} for ${className} in ${classroomName} at ${startTime}. You have ${advanceMinutes} minutes.`;

  await sendNotificationToTeacher(teacherId, title, body, timetableId, 'class_reminder');
  await sendNotificationToAdmins(title, body, timetableId, 'class_reminder');
};

// Send class start notification
export const sendClassStartNotification = async (
  teacherId: number,
  teacherName: string,
  subjectName: string,
  className: string,
  startTime: string,
  classroomName: string,
  timetableId: number
): Promise<void> => {
  const title = `Class Starting Now`;
  const body = `${subjectName} for ${className} is starting now in ${classroomName}. Teacher: ${teacherName}`;

  await sendNotificationToTeacher(teacherId, title, body, timetableId, 'class_start');
  await sendNotificationToAdmins(title, body, timetableId, 'class_start');
};

// Send class arrival notification via SMS
export const sendClassArrivalNotification = async (
  teacherId: number,
  teacherName: string,
  subjectName: string,
  className: string,
  startTime: string,
  classroomName: string,
  studentCount?: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const message = studentCount 
      ? `Class Arrival: ${studentCount} students have arrived for ${subjectName} - ${className} in ${classroomName}. Teacher: ${teacherName}. Time: ${startTime}`
      : `Class Arrival: Students have arrived for ${subjectName} - ${className} in ${classroomName}. Teacher: ${teacherName}. Time: ${startTime}`;

    const result = await sendSMSNotificationToTeacher(teacherId, message, 'class_arrival');
    
    if (result.success) {
      console.log(`SMS notification sent to teacher ${teacherName} for class arrival`);
    } else {
      console.error(`Failed to send SMS notification to teacher ${teacherName}: ${result.error}`);
    }

    return result;
  } catch (error: any) {
    console.error('Error sending class arrival notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send class arrival notification',
    };
  }
};
