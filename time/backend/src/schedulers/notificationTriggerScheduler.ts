import { query } from '../config/database';
import { io } from '../server';
import { sendNotificationToTeacher, sendNotificationToAdmins } from '../services/notificationService';

let schedulerInterval: NodeJS.Timeout | null = null;
const sentNotifications = new Map<string, number>();

export const startNotificationTriggerScheduler = () => {
  if (schedulerInterval) {
    console.log('Notification trigger scheduler already running');
    return;
  }

  console.log('Starting notification trigger scheduler...');

  schedulerInterval = setInterval(async () => {
    try {
      await checkNotificationTriggers();
    } catch (error) {
      console.error('Error in notification trigger scheduler:', error);
    }
  }, 60000);

  console.log('Notification trigger scheduler started - checking every minute');
};

export const stopNotificationTriggerScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Notification trigger scheduler stopped');
  }
};

const checkNotificationTriggers = async () => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const currentDate = now.toISOString().split('T')[0];

  const entries = await query<any[]>(
    `SELECT tt.id, tt.teacher_id, tt.start_time, tt.end_time, tt.day_of_week, tt.status,
       t.name AS teacher_name, c.name AS class_name, s.name AS subject_name, cl.name AS classroom_name
    FROM timetable tt
    JOIN teachers t ON tt.teacher_id = t.id
    JOIN classes c ON tt.class_id = c.id
    JOIN subjects s ON tt.subject_id = s.id
    JOIN classrooms cl ON tt.classroom_id = cl.id
    WHERE tt.day_of_week = ? AND tt.is_active = 1 ORDER BY tt.start_time`,
    [currentDay]
  );

  for (const entry of entries) {
    const [startHours, startMinutes] = entry.start_time.split(':').map(Number);
    const [endHours, endMinutes] = entry.end_time.split(':').map(Number);
    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;

    if (currentTime === startTime) {
      const key = `lesson_start_${entry.id}_${currentDate}`;
      if (!sentNotifications.has(key)) {
        await sendLessonStartNotification(entry);
        sentNotifications.set(key, Date.now());
      }
    }

    if (currentTime === endTime - 5) {
      const key = `lesson_ending_${entry.id}_${currentDate}`;
      if (!sentNotifications.has(key)) {
        await sendLessonEndingSoonNotification(entry);
        sentNotifications.set(key, Date.now());
      }
    }

    if (currentTime === endTime) {
      const key = `lesson_end_${entry.id}_${currentDate}`;
      if (!sentNotifications.has(key)) {
        await sendLessonEndNotification(entry);
        sentNotifications.set(key, Date.now());
      }
    }

    if (currentTime === startTime + 5) {
      const checkin = await query<any[]>(
        `SELECT * FROM teacher_checkins WHERE teacher_id = ? AND timetable_id = ? AND DATE(check_in_time) = DATE('now')`,
        [entry.teacher_id, entry.id]
      );
      if (checkin.length === 0) {
        const key = `absent_${entry.id}_${currentDate}`;
        if (!sentNotifications.has(key)) {
          await sendAbsentTeacherNotification(entry);
          sentNotifications.set(key, Date.now());
        }
      }
    }
  }

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, timestamp] of sentNotifications.entries()) {
    if (timestamp < oneDayAgo) {
      sentNotifications.delete(key);
    }
  }
};

const sendLessonStartNotification = async (entry: any) => {
  const title = 'Lesson Started';
  const body = `${entry.subject_name} for ${entry.class_name} has started in ${entry.classroom_name}. Teacher: ${entry.teacher_name}`;

  await sendNotificationToTeacher(entry.teacher_id, title, body, entry.id, 'class_start');
  await sendNotificationToAdmins(title, body, entry.id, 'class_start');
  
  io.to('managers').emit('notification', { type: 'lesson_start', title, body, data: entry });
  console.log(`Lesson start notification: ${entry.subject_name}`);
};

const sendLessonEndingSoonNotification = async (entry: any) => {
  const title = 'Lesson Ending Soon';
  const body = `${entry.subject_name} for ${entry.class_name} will end in 5 minutes. Teacher: ${entry.teacher_name}`;

  await sendNotificationToTeacher(entry.teacher_id, title, body, entry.id, 'class_reminder');
  await sendNotificationToAdmins(title, body, entry.id, 'class_reminder');
  
  io.to('managers').emit('notification', { type: 'lesson_ending', title, body, data: entry });
  console.log(`Lesson ending notification: ${entry.subject_name}`);
};

const sendLessonEndNotification = async (entry: any) => {
  const title = 'Lesson Ended';
  const body = `${entry.subject_name} for ${entry.class_name} has ended. Teacher: ${entry.teacher_name}`;

  await sendNotificationToTeacher(entry.teacher_id, title, body, entry.id, 'class_start');
  await sendNotificationToAdmins(title, body, entry.id, 'class_start');
  
  io.to('managers').emit('notification', { type: 'lesson_end', title, body, data: entry });
  console.log(`Lesson end notification: ${entry.subject_name}`);
};

const sendAbsentTeacherNotification = async (entry: any) => {
  const title = 'Teacher Absent';
  const body = `${entry.teacher_name} has not checked in for ${entry.subject_name} - ${entry.class_name}`;

  await sendNotificationToAdmins(title, body, entry.id, 'emergency');
  
  io.to('managers').emit('notification', { type: 'absent_teacher', title, body, data: entry });
  console.log(`Absent teacher notification: ${entry.teacher_name}`);
};
