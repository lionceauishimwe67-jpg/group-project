import { Request, Response } from 'express';
import { query, queryOne, run } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

export interface SchoolEvent {
  id: number;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  location?: string;
  organizer?: string;
  target_audience?: string;
  is_public: number;
  image_url?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

// Get all events with filters
export const getAllEvents = asyncHandler(async (req: Request, res: Response) => {
  const { type, from, to, isPublic, search } = req.query;
  
  let sql = 'SELECT e.*, u.username as creator_name FROM school_events e LEFT JOIN users u ON e.created_by = u.id WHERE 1=1';
  const params: any[] = [];
  
  if (type) {
    sql += ' AND e.event_type = ?';
    params.push(type);
  }
  if (from) {
    sql += ' AND e.start_date >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND e.start_date <= ?';
    params.push(to);
  }
  if (isPublic !== undefined) {
    sql += ' AND e.is_public = ?';
    params.push(isPublic === 'true' ? 1 : 0);
  }
  if (search) {
    sql += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  
  sql += ' ORDER BY e.start_date DESC';
  
  const events = await query<SchoolEvent[]>(sql, params);
  res.json({ success: true, events });
});

// Get upcoming events
export const getUpcomingEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await query<SchoolEvent[]>(`
    SELECT e.*, u.username as creator_name 
    FROM school_events e 
    LEFT JOIN users u ON e.created_by = u.id 
    WHERE e.start_date >= datetime('now')
    AND e.is_public = 1
    ORDER BY e.start_date ASC
    LIMIT 10
  `);
  
  res.json({ success: true, events });
});

// Get event by ID
export const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const event = await queryOne<SchoolEvent>(`
    SELECT e.*, u.username as creator_name 
    FROM school_events e 
    LEFT JOIN users u ON e.created_by = u.id 
    WHERE e.id = ?
  `, [id]);
  
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  
  res.json({ success: true, event });
});

// Create event
export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const {
    title, description, event_type, start_date, end_date,
    location, organizer, target_audience, is_public, image_url, created_by
  } = req.body;
  
  if (!title || !start_date) {
    return res.status(400).json({ success: false, error: 'Title and start date are required' });
  }
  
  const result = await run(`
    INSERT INTO school_events (
      title, description, event_type, start_date, end_date,
      location, organizer, target_audience, is_public, image_url, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [title, description || null, event_type || 'general', start_date,
      end_date || null, location || null, organizer || null,
      target_audience || 'all', is_public !== undefined ? (is_public ? 1 : 0) : 1,
      image_url || null, created_by || null]);
  
  res.status(201).json({ 
    success: true, 
    message: 'Event created successfully', 
    eventId: result.lastID 
  });
});

// Update event
export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title, description, event_type, start_date, end_date,
    location, organizer, target_audience, is_public, image_url
  } = req.body;
  
  const existing = await queryOne<SchoolEvent>('SELECT id FROM school_events WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  
  await run(`
    UPDATE school_events SET
      title = ?, description = ?, event_type = ?, start_date = ?,
      end_date = ?, location = ?, organizer = ?, target_audience = ?,
      is_public = ?, image_url = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [title, description || null, event_type || 'general', start_date,
      end_date || null, location || null, organizer || null,
      target_audience || 'all', is_public !== undefined ? (is_public ? 1 : 0) : 1,
      image_url || null, id]);
  
  res.json({ success: true, message: 'Event updated successfully' });
});

// Delete event
export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await run('DELETE FROM school_events WHERE id = ?', [id]);
  
  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  
  res.json({ success: true, message: 'Event deleted successfully' });
});

// Get event statistics
export const getEventStats = asyncHandler(async (req: Request, res: Response) => {
  const total = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM school_events');
  const upcoming = await queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM school_events WHERE start_date >= datetime('now')"
  );
  const byType = await query<any[]>(`
    SELECT event_type, COUNT(*) as count 
    FROM school_events 
    GROUP BY event_type 
    ORDER BY count DESC
  `);
  
  res.json({
    success: true,
    stats: { total: total?.count || 0, upcoming: upcoming?.count || 0, byType }
  });
});
