import { Router } from 'express';
import { query, run } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all break times
router.get('/', authenticateToken, async (req, res) => {
  try {
    const breakTimes = await query<any[]>(
      `SELECT * FROM break_times WHERE is_active = 1 ORDER BY break_type, start_time`
    );
    res.json({ breakTimes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get break time by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const breakTime = await query<any[]>(
      `SELECT * FROM break_times WHERE id = ?`,
      [req.params.id]
    );
    if (breakTime.length === 0) {
      return res.status(404).json({ error: 'Break time not found' });
    }
    res.json({ breakTime: breakTime[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new break time
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, break_type, start_time, end_time, days_of_week } = req.body;
    
    if (!name || !break_type || !start_time || !end_time || !days_of_week) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await run(
      `INSERT INTO break_times (name, break_type, start_time, end_time, days_of_week) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, break_type, start_time, end_time, JSON.stringify(days_of_week)]
    );

    res.status(201).json({ 
      success: true, 
      id: result.lastID,
      message: 'Break time created successfully' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update break time
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, break_type, start_time, end_time, days_of_week, is_active } = req.body;
    
    const existing = await query<any[]>(
      `SELECT * FROM break_times WHERE id = ?`,
      [req.params.id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Break time not found' });
    }

    await run(
      `UPDATE break_times 
       SET name = ?, break_type = ?, start_time = ?, end_time = ?, 
           days_of_week = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name || existing[0].name,
        break_type || existing[0].break_type,
        start_time || existing[0].start_time,
        end_time || existing[0].end_time,
        days_of_week ? JSON.stringify(days_of_week) : existing[0].days_of_week,
        is_active !== undefined ? is_active : existing[0].is_active,
        req.params.id
      ]
    );

    res.json({ success: true, message: 'Break time updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete break time (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await run(
      `UPDATE break_times SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.params.id]
    );
    res.json({ success: true, message: 'Break time deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
