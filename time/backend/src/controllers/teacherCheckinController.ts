import { Request, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { io } from '../server';

// Teacher check-in
export const teacherCheckIn = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, timetableId } = req.body;

  if (!teacherId) {
    return res.status(400).json({
      success: false,
      error: 'Teacher ID is required'
    });
  }

  try {
    // Check if teacher already checked in today for this lesson
    const existing = await query<any[]>(
      `SELECT * FROM teacher_checkins 
       WHERE teacher_id = ? 
       AND timetable_id = ? 
       AND DATE(check_in_time) = DATE('now')`,
      [teacherId, timetableId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Teacher already checked in for this lesson'
      });
    }

    // Create check-in record
    const result = await query<{ insertId: number }>(
      `INSERT INTO teacher_checkins (teacher_id, timetable_id, status)
       VALUES (?, ?, 'present')`,
      [teacherId, timetableId]
    );

    // Notify managers via Socket.IO
    io.to('managers').emit('teacher-checkin', {
      teacherId,
      timetableId,
      checkInTime: new Date().toISOString(),
      status: 'present'
    });

    res.status(201).json({
      success: true,
      message: 'Teacher checked in successfully',
      checkinId: result.insertId
    });
  } catch (error: any) {
    console.error('Error during teacher check-in:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check in teacher'
    });
  }
});

// Teacher check-out
export const teacherCheckOut = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, timetableId } = req.body;

  if (!teacherId) {
    return res.status(400).json({
      success: false,
      error: 'Teacher ID is required'
    });
  }

  try {
    // Update check-in record with check-out time
    const result = await query<{ changes: number }>(
      `UPDATE teacher_checkins 
       SET check_out_time = CURRENT_TIMESTAMP 
       WHERE teacher_id = ? 
       AND timetable_id = ? 
       AND check_out_time IS NULL`,
      [teacherId, timetableId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active check-in found for this teacher and lesson'
      });
    }

    // Notify managers via Socket.IO
    io.to('managers').emit('teacher-checkout', {
      teacherId,
      timetableId,
      checkOutTime: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Teacher checked out successfully'
    });
  } catch (error: any) {
    console.error('Error during teacher check-out:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check out teacher'
    });
  }
});

// Get teacher check-in status
export const getTeacherCheckInStatus = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;

  try {
    const checkins = await query<any[]>(
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
      WHERE tc.teacher_id = ?
      ORDER BY tc.check_in_time DESC
      LIMIT 10`,
      [teacherId]
    );

    res.json({
      success: true,
      data: checkins
    });
  } catch (error: any) {
    console.error('Error fetching teacher check-in status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch check-in status'
    });
  }
});

// Get all check-ins for a specific date (for manager)
export const getCheckInsByDate = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query;

  try {
    const checkins = await query<any[]>(
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
      [date || 'now']
    );

    res.json({
      success: true,
      data: checkins
    });
  } catch (error: any) {
    console.error('Error fetching check-ins by date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch check-ins'
    });
  }
});
