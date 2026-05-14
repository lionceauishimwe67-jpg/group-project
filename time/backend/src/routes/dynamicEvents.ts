import { Router } from 'express';
import { query, run } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { io } from '../server';

const router = Router();

// Get all dynamic events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, start_date, end_date } = req.query;
    
    let sql = `SELECT de.*, u.username as created_by_name 
               FROM dynamic_events de 
               LEFT JOIN users u ON de.created_by = u.id 
               WHERE 1=1`;
    const params: any[] = [];
    
    if (status) {
      sql += ` AND de.status = ?`;
      params.push(status);
    }
    
    if (start_date) {
      sql += ` AND de.start_date >= ?`;
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ` AND de.end_date <= ?`;
      params.push(end_date);
    }
    
    sql += ` ORDER BY de.start_date, de.start_time`;
    
    const events = await query<any[]>(sql, params);
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get dynamic event by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await query<any[]>(
      `SELECT de.*, u.username as created_by_name 
       FROM dynamic_events de 
       LEFT JOIN users u ON de.created_by = u.id 
       WHERE de.id = ?`,
      [req.params.id]
    );
    
    if (event.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ event: event[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming events for today
router.get('/upcoming/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const events = await query<any[]>(
      `SELECT * FROM dynamic_events 
       WHERE start_date <= ? AND end_date >= ? 
       AND status IN ('scheduled', 'active')
       ORDER BY start_time`,
      [today, today]
    );
    
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new dynamic event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      event_type,
      start_date,
      end_date,
      start_time,
      end_time,
      affected_classes,
      location,
      notify_teachers,
      notify_students
    } = req.body;
    
    if (!title || !event_type || !start_date || !end_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const userId = (req as any).user?.id;
    
    const result = await run(
      `INSERT INTO dynamic_events 
       (title, description, event_type, start_date, end_date, start_time, end_time, 
        affected_classes, location, notify_teachers, notify_students, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        event_type,
        start_date,
        end_date,
        start_time,
        end_time,
        affected_classes ? JSON.stringify(affected_classes) : null,
        location || null,
        notify_teachers !== undefined ? notify_teachers : 1,
        notify_students !== undefined ? notify_students : 0,
        userId || null
      ]
    );
    
    // Broadcast new event to all connected clients
    io.emit('dynamic-event-created', {
      id: result.lastID,
      title,
      event_type,
      start_date,
      start_time
    });
    
    res.status(201).json({ 
      success: true, 
      id: result.lastID,
      message: 'Dynamic event created successfully' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update dynamic event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      event_type,
      start_date,
      end_date,
      start_time,
      end_time,
      affected_classes,
      location,
      notify_teachers,
      notify_students,
      status
    } = req.body;
    
    const existing = await query<any[]>(
      `SELECT * FROM dynamic_events WHERE id = ?`,
      [req.params.id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await run(
      `UPDATE dynamic_events 
       SET title = ?, description = ?, event_type = ?, start_date = ?, end_date = ?, 
           start_time = ?, end_time = ?, affected_classes = ?, location = ?, 
           notify_teachers = ?, notify_students = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title || existing[0].title,
        description !== undefined ? description : existing[0].description,
        event_type || existing[0].event_type,
        start_date || existing[0].start_date,
        end_date || existing[0].end_date,
        start_time || existing[0].start_time,
        end_time || existing[0].end_time,
        affected_classes ? JSON.stringify(affected_classes) : existing[0].affected_classes,
        location !== undefined ? location : existing[0].location,
        notify_teachers !== undefined ? notify_teachers : existing[0].notify_teachers,
        notify_students !== undefined ? notify_students : existing[0].notify_students,
        status || existing[0].status,
        req.params.id
      ]
    );
    
    // Broadcast event update to all connected clients
    io.emit('dynamic-event-updated', {
      id: parseInt(req.params.id),
      title: title || existing[0].title,
      status: status || existing[0].status
    });
    
    res.json({ success: true, message: 'Dynamic event updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete dynamic event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await query<any[]>(
      `SELECT * FROM dynamic_events WHERE id = ?`,
      [req.params.id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await run(`DELETE FROM dynamic_events WHERE id = ?`, [req.params.id]);
    
    // Broadcast event deletion to all connected clients
    io.emit('dynamic-event-deleted', {
      id: parseInt(req.params.id),
      title: existing[0].title
    });
    
    res.json({ success: true, message: 'Dynamic event deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel dynamic event
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    await run(
      `UPDATE dynamic_events SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.params.id]
    );
    
    res.json({ success: true, message: 'Event cancelled successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
