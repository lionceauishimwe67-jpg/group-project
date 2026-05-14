import { Request, Response } from 'express';
import { query, run } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

// Get all phone numbers
export const getPhoneNumbers = asyncHandler(async (req: Request, res: Response) => {
  const phoneNumbers = await query<any[]>(`
    SELECT id, phone_number, name, is_active, created_at, updated_at
    FROM phone_numbers
    ORDER BY created_at DESC
  `);
  
  res.json({ success: true, data: phoneNumbers });
});

// Add phone number
export const addPhoneNumber = asyncHandler(async (req: Request, res: Response) => {
  const { phone_number, name } = req.body;
  
  if (!phone_number) {
    return res.status(400).json({ success: false, error: 'Phone number is required' });
  }
  
  // Check if phone number already exists
  const existing = await query<any[]>(
    'SELECT id FROM phone_numbers WHERE phone_number = ?',
    [phone_number]
  );
  
  if (existing.length > 0) {
    return res.status(400).json({ success: false, error: 'Phone number already exists' });
  }
  
  await query(
    'INSERT INTO phone_numbers (phone_number, name, is_active) VALUES (?, ?, 1)',
    [phone_number, name || null]
  );
  
  res.json({ success: true, message: 'Phone number added successfully' });
});

// Delete phone number
export const deletePhoneNumber = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await query('DELETE FROM phone_numbers WHERE id = ?', [id]);
  
  res.json({ success: true, message: 'Phone number deleted successfully' });
});

// Toggle phone number active status
export const togglePhoneNumber = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const current = await query<any[]>(
    'SELECT is_active FROM phone_numbers WHERE id = ?',
    [id]
  );
  
  if (current.length === 0) {
    return res.status(404).json({ success: false, error: 'Phone number not found' });
  }
  
  const newStatus = current[0].is_active ? 0 : 1;
  
  await query(
    'UPDATE phone_numbers SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newStatus, id]
  );
  
  res.json({ success: true, message: 'Phone number status updated' });
});
