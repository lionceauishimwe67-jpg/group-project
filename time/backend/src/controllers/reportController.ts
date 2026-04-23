import { Request, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

export const getDailySummary = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const lessons = await query<any[]>(
      `SELECT 
        tt.id,
        tt.teacher_id,
        tt.class_id,
        tt.subject_id,
        tt.classroom_id,
        tt.start_time,
        tt.end_time,
        tt.day_of_week,
        tt.status,
        tt.teacher_checked_in,
        t.name AS teacher_name,
        c.name AS class_name,
        s.name AS subject_name,
        cl.name AS classroom_name
      FROM timetable tt
      JOIN teachers t ON tt.teacher_id = t.id
      JOIN classes c ON tt.class_id = c.id
      JOIN subjects s ON tt.subject_id = s.id
      JOIN classrooms cl ON tt.classroom_id = cl.id
      WHERE tt.is_active = 1
      ORDER BY tt.start_time`
    );

    const summary = {
      date: targetDate,
      totalLessons: lessons.length,
      activeLessons: lessons.filter(l => l.status === 'active').length,
      completedLessons: lessons.filter(l => l.status === 'completed').length,
      noTeacherLessons: lessons.filter(l => l.status === 'no_teacher').length,
      scheduledLessons: lessons.filter(l => l.status === 'scheduled').length,
      lessons: lessons.map(lesson => {
        const checkinQuery = query<any[]>(
          `SELECT * FROM teacher_checkins 
           WHERE teacher_id = ? 
           AND timetable_id = ? 
           AND DATE(check_in_time) = ?`,
          [lesson.teacher_id, lesson.id, targetDate]
        );

        return {
          ...lesson,
          teacherCheckedIn: !!lesson.teacher_checked_in,
          checkinTime: null
        };
      })
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    console.error('Error generating daily summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily summary'
    });
  }
});

export const getMissedLessons = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const missedLessons = await query<any[]>(
      `SELECT 
        tt.id,
        tt.teacher_id,
        tt.start_time,
        tt.end_time,
        tt.day_of_week,
        tt.status,
        t.name AS teacher_name,
        c.name AS class_name,
        s.name AS subject_name,
        cl.name AS classroom_name
      FROM timetable tt
      JOIN teachers t ON tt.teacher_id = t.id
      JOIN classes c ON tt.class_id = c.id
      JOIN subjects s ON tt.subject_id = s.id
      JOIN classrooms cl ON tt.classroom_id = cl.id
      WHERE tt.is_active = 1 
      AND (tt.status = 'no_teacher' OR tt.teacher_checked_in = 0)
      ORDER BY tt.start_time`
    );

    res.json({
      success: true,
      data: missedLessons,
      count: missedLessons.length
    });
  } catch (error: any) {
    console.error('Error fetching missed lessons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch missed lessons'
    });
  }
});

export const getTeacherAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const attendance = await query<any[]>(
      `SELECT 
        tc.id,
        tc.teacher_id,
        tc.timetable_id,
        tc.check_in_time,
        tc.check_out_time,
        tc.status,
        t.name AS teacher_name,
        tt.start_time,
        tt.end_time,
        c.name AS class_name,
        s.name AS subject_name
      FROM teacher_checkins tc
      JOIN teachers t ON tc.teacher_id = t.id
      LEFT JOIN timetable tt ON tc.timetable_id = tt.id
      LEFT JOIN classes c ON tt.class_id = c.id
      LEFT JOIN subjects s ON tt.subject_id = s.id
      WHERE DATE(tc.check_in_time) = ?
      ORDER BY tc.check_in_time DESC`,
      [targetDate]
    );

    res.json({
      success: true,
      data: attendance,
      count: attendance.length
    });
  } catch (error: any) {
    console.error('Error fetching teacher attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teacher attendance'
    });
  }
});
