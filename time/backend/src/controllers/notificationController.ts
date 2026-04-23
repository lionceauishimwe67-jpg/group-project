import { Request, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

// Register device token for a teacher
export const registerDeviceToken = asyncHandler(async (req: Request, res: Response) => {
  const { deviceToken, teacherId } = req.body;
  const userId = req.user?.userId;

  if (!deviceToken) {
    return res.status(400).json({
      success: false,
      error: 'Device token is required'
    });
  }

  // If teacherId is provided, update that teacher
  if (teacherId) {
    const teachers = await query<any[]>('SELECT * FROM teachers WHERE id = ?', [teacherId]);
    
    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    await query(
      'UPDATE teachers SET device_token = ? WHERE id = ?',
      [deviceToken, teacherId]
    );

    return res.json({
      success: true,
      message: 'Device token registered successfully'
    });
  }

  // If no teacherId, try to find teacher by user_id
  if (userId) {
    const teachers = await query<any[]>('SELECT * FROM teachers WHERE user_id = ?', [userId]);
    
    if (teachers.length > 0) {
      await query(
        'UPDATE teachers SET device_token = ? WHERE id = ?',
        [deviceToken, teachers[0].id]
      );

      return res.json({
        success: true,
        message: 'Device token registered successfully'
      });
    }
  }

  return res.status(400).json({
    success: false,
    error: 'Teacher ID or user authentication required'
  });
});

// Update notification preferences for a teacher
export const updateNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
  const { notificationEnabled, notificationAdvanceMinutes } = req.body;
  const { teacherId } = req.params;
  const userId = req.user?.userId;

  if (!teacherId && !userId) {
    return res.status(400).json({
      success: false,
      error: 'Teacher ID or authentication required'
    });
  }

  let queryStr = 'UPDATE teachers SET ';
  const params: any[] = [];
  const updates: string[] = [];

  if (notificationEnabled !== undefined) {
    updates.push('notification_enabled = ?');
    params.push(notificationEnabled ? 1 : 0);
  }

  if (notificationAdvanceMinutes !== undefined) {
    updates.push('notification_advance_minutes = ?');
    params.push(notificationAdvanceMinutes);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No preferences to update'
    });
  }

  queryStr += updates.join(', ') + ' WHERE ';
  
  if (teacherId) {
    queryStr += 'id = ?';
    params.push(teacherId);
  } else {
    queryStr += 'user_id = ?';
    params.push(userId);
  }

  await query(queryStr, params);

  return res.json({
    success: true,
    message: 'Notification preferences updated successfully'
  });
});

// Get notification history for a teacher
export const getNotificationHistory = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;
  const userId = req.user?.userId;
  const { limit = 50, offset = 0 } = req.query;

  // Determine which teacher's notifications to fetch
  let targetTeacherId = teacherId;
  
  if (!targetTeacherId && userId) {
    const teachers = await query<any[]>('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    if (teachers.length > 0) {
      targetTeacherId = teachers[0].id;
    }
  }

  if (!targetTeacherId) {
    return res.status(400).json({
      success: false,
      error: 'Teacher ID required'
    });
  }

  const notifications = await query<any[]>(
    `SELECT 
      n.id,
      n.teacher_id,
      n.timetable_id,
      n.notification_type,
      n.title,
      n.body,
      n.sent_at,
      n.status,
      n.error_message,
      c.name AS class_name,
      s.name AS subject_name,
      t.name AS teacher_name
    FROM notifications n
    LEFT JOIN timetable tt ON n.timetable_id = tt.id
    LEFT JOIN classes c ON tt.class_id = c.id
    LEFT JOIN subjects s ON tt.subject_id = s.id
    LEFT JOIN teachers t ON n.teacher_id = t.id
    WHERE n.teacher_id = ?
    ORDER BY n.sent_at DESC
    LIMIT ? OFFSET ?`,
    [targetTeacherId, Number(limit), Number(offset)]
  );

  const totalCount = await query<any[]>(
    'SELECT COUNT(*) as count FROM notifications WHERE teacher_id = ?',
    [targetTeacherId]
  );

  return res.json({
    success: true,
    data: notifications,
    meta: {
      count: notifications.length,
      total: totalCount[0].count,
      limit: Number(limit),
      offset: Number(offset)
    }
  });
});

// Send test notification
export const sendTestNotification = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.body;

  if (!teacherId) {
    return res.status(400).json({
      success: false,
      error: 'Teacher ID is required'
    });
  }

  const teachers = await query<any[]>('SELECT id, name FROM teachers WHERE id = ?', [teacherId]);

  if (teachers.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Teacher not found'
    });
  }

  const teacher = teachers[0];

  // Import notification service
  const { sendNotificationToTeacher } = await import('../services/notificationService');

  const result = await sendNotificationToTeacher(
    teacherId,
    'Test Notification',
    `This is a test notification for ${teacher.name}. If you received this, push notifications are working!`,
    0, // Dummy timetable ID for test
    'class_reminder'
  );

  if (result.success) {
    return res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: result
    });
  } else {
    return res.status(500).json({
      success: false,
      error: result.error || 'Failed to send test notification'
    });
  }
});

// Get teacher notification preferences
export const getNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;
  const userId = req.user?.userId;

  let targetTeacherId = teacherId;
  
  if (!targetTeacherId && userId) {
    const teachers = await query<any[]>('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    if (teachers.length > 0) {
      targetTeacherId = teachers[0].id;
    }
  }

  if (!targetTeacherId) {
    return res.status(400).json({
      success: false,
      error: 'Teacher ID required'
    });
  }

  const teachers = await query<any[]>(
    'SELECT id, name, email, phone, notification_enabled, notification_advance_minutes, device_token FROM teachers WHERE id = ?',
    [targetTeacherId]
  );

  if (teachers.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Teacher not found'
    });
  }

  const teacher = teachers[0];

  // Don't expose full device token in response
  const { device_token, ...teacherData } = teacher;
  teacherData.has_device_token = !!device_token;

  return res.json({
    success: true,
    data: teacherData
  });
});

// Send class arrival notification
export const sendClassArrival = asyncHandler(async (req: Request, res: Response) => {
  const { timetableId, studentCount } = req.body;

  if (!timetableId) {
    return res.status(400).json({
      success: false,
      error: 'Timetable ID is required'
    });
  }

  // Get timetable details with teacher, class, subject, and classroom info
  const timetable = await query<any[]>(
    `SELECT 
      tt.id,
      tt.teacher_id,
      tt.class_id,
      tt.subject_id,
      tt.classroom_id,
      tt.start_time,
      tt.day_of_week,
      t.name AS teacher_name,
      c.name AS class_name,
      s.name AS subject_name,
      cl.name AS classroom_name
    FROM timetable tt
    JOIN teachers t ON tt.teacher_id = t.id
    JOIN classes c ON tt.class_id = c.id
    JOIN subjects s ON tt.subject_id = s.id
    JOIN classrooms cl ON tt.classroom_id = cl.id
    WHERE tt.id = ?`,
    [timetableId]
  );

  if (timetable.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Timetable entry not found'
    });
  }

  const entry = timetable[0];

  // Import notification service
  const { sendClassArrivalNotification } = await import('../services/notificationService');

  const result = await sendClassArrivalNotification(
    entry.teacher_id,
    entry.teacher_name,
    entry.subject_name,
    entry.class_name,
    entry.start_time,
    entry.classroom_name,
    studentCount
  );

  if (result.success) {
    return res.json({
      success: true,
      message: 'Class arrival notification sent successfully'
    });
  } else {
    return res.status(500).json({
      success: false,
      error: result.error || 'Failed to send class arrival notification'
    });
  }
});
