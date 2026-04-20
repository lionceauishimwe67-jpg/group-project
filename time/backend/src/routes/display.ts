import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { DisplayConfig } from '../types';

const router = Router();

// Get display configuration
router.get('/config/:displayId', asyncHandler(async (req: Request, res: Response) => {
  const { displayId } = req.params;

  const configs = await query<DisplayConfig[]>(
    'SELECT * FROM display_configs WHERE display_id = ?',
    [displayId]
  );

  if (configs.length === 0) {
    // Return default config
    return res.json({
      success: true,
      data: {
        display_id: displayId,
        name: 'New Display',
        filter_classes: null,
        filter_levels: null,
        rotation_speed: 5000,
        theme: 'light',
        language: 'en'
      }
    });
  }

  return res.json({
    success: true,
    data: configs[0]
  });
}));

// Save or update display configuration
router.post('/config/:displayId', asyncHandler(async (req: Request, res: Response) => {
  const { displayId } = req.params;
  const { name, filter_classes, filter_levels, rotation_speed, theme, language } = req.body;

  await query(`
    INSERT INTO display_configs 
      (display_id, name, filter_classes, filter_levels, rotation_speed, theme, language)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      filter_classes = VALUES(filter_classes),
      filter_levels = VALUES(filter_levels),
      rotation_speed = VALUES(rotation_speed),
      theme = VALUES(theme),
      language = VALUES(language)
  `, [displayId, name, filter_classes, filter_levels, rotation_speed, theme, language]);

  return res.json({
    success: true,
    message: 'Display configuration saved'
  });
}));

// Get all display configurations
router.get('/configs', asyncHandler(async (req: Request, res: Response) => {
  const configs = await query<DisplayConfig[]>('SELECT * FROM display_configs ORDER BY name');

  return res.json({
    success: true,
    data: configs
  });
}));

export default router;
