import { query } from '../config/database';
import { io } from '../server';

let schedulerInterval: NodeJS.Timeout | null = null;

export const startLessonStatusScheduler = () => {
  if (schedulerInterval) {
    console.log('Lesson status scheduler already running');
    return;
  }

  console.log('Starting lesson status scheduler...');

  // Check lesson status every minute
  schedulerInterval = setInterval(async () => {
    try {
      await checkAndUpdateLessonStatus();
    } catch (error) {
      console.error('Error in lesson status scheduler:', error);
    }
  }, 60000); // Check every minute

  console.log('Lesson status scheduler started - checking every minute');
};

export const stopLessonStatusScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Lesson status scheduler stopped');
  }
};

const checkAndUpdateLessonStatus = async () => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Get all timetable entries for today
  const entries = await query<any[]>(
    `SELECT 
      tt.id,
      tt.teacher_id,
      tt.start_time,
      tt.end_time,
      tt.day_of_week,
      tt.status,
      tt.teacher_checked_in,
      t.name AS teacher_name,
      c.name AS class_name,
      s.name AS subject_name
    FROM timetable tt
    JOIN teachers t ON tt.teacher_id = t.id
    JOIN classes c ON tt.class_id = c.id
    JOIN subjects s ON tt.subject_id = s.id
    WHERE tt.day_of_week = ? 
    AND tt.is_active = 1
    ORDER BY tt.start_time`,
    [currentDay]
  );

  for (const entry of entries) {
    const [startHours, startMinutes] = entry.start_time.split(':').map(Number);
    const [endHours, endMinutes] = entry.end_time.split(':').map(Number);
    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;

    // Check if teacher has checked in for this lesson today
    const checkin = await query<any[]>(
      `SELECT * FROM teacher_checkins 
       WHERE teacher_id = ? 
       AND timetable_id = ? 
       AND DATE(check_in_time) = DATE('now')`,
      [entry.teacher_id, entry.id]
    );

    const teacherCheckedIn = checkin.length > 0;

    // Update teacher_checked_in status
    if (teacherCheckedIn !== !!entry.teacher_checked_in) {
      await query(
        'UPDATE timetable SET teacher_checked_in = ? WHERE id = ?',
        [teacherCheckedIn ? 1 : 0, entry.id]
      );
    }

    let newStatus = entry.status;

    // Determine lesson status based on time and teacher presence
    if (currentTime < startTime) {
      // Lesson hasn't started yet
      newStatus = 'scheduled';
    } else if (currentTime >= startTime && currentTime < endTime) {
      // Lesson is in progress
      if (teacherCheckedIn) {
        newStatus = 'active';
      } else {
        newStatus = 'no_teacher';
        // Notify managers if teacher is absent and lesson just started (within 5 minutes)
        if (currentTime >= startTime && currentTime < startTime + 5 && entry.status !== 'no_teacher') {
          await notifyAbsentTeacher(entry);
        }
      }
    } else if (currentTime >= endTime) {
      // Lesson has ended
      newStatus = 'completed';
    }

    // Update status if changed
    if (newStatus !== entry.status) {
      await query('UPDATE timetable SET status = ? WHERE id = ?', [newStatus, entry.id]);
      
      // Notify managers of status change via Socket.IO
      io.to('managers').emit('lesson-status-change', {
        timetableId: entry.id,
        status: newStatus,
        teacherName: entry.teacher_name,
        className: entry.class_name,
        subjectName: entry.subject_name,
        startTime: entry.start_time,
        endTime: entry.end_time
      });

      console.log(`Lesson status updated: ${entry.subject_name} - ${newStatus}`);
    }
  }
};

const notifyAbsentTeacher = async (entry: any) => {
  const message = `Teacher absent: ${entry.teacher_name} has not checked in for ${entry.subject_name} - ${entry.class_name} at ${entry.start_time}`;

  // Log notification to database
  await query(
    `INSERT INTO notifications (teacher_id, notification_type, title, body, status, sent_via)
     VALUES (?, 'absent_teacher', 'Absent Teacher', ?, 'sent', 'socket')`,
    [entry.teacher_id, message]
  );

  console.log(`Absent teacher notification sent for: ${entry.teacher_name}`);
};
