import { Router } from 'express';
import { triggerManualBell, getDeviceStatus, updateDeviceHeartbeat, getCurrentSessionState } from '../schedulers/bellScheduler';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { sendSMSToTeachers } from '../services/smsService';

const router = Router();

// Manual bell trigger (admin only)
router.post('/ring-now', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await triggerManualBell();
    
    // Send SMS notification for manual bell trigger
    sendSMSToTeachers('🔔 School bell has been rung manually', 'bell').catch((err: Error) => {
      console.error('Failed to send SMS for bell trigger:', err);
    });
    
    res.json({ success: true, message: 'Bell triggered successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ESP32 polls this endpoint to check if bell should ring
router.get('/ring-now', async (req, res) => {
  try {
    const result = await getCurrentSessionState();
    // Check system state for manual ring flag
    const { query: dbQuery } = await import('../config/database');
    const { run } = await import('../config/database');
    const flag = await dbQuery<{ value: string }[]>('SELECT value FROM system_state WHERE key = ?', ['manual_ring']);
    const shouldRing = flag.length > 0 && flag[0].value === 'true';
    if (shouldRing) {
      await run(`UPDATE system_state SET value = 'false', updated_at = CURRENT_TIMESTAMP WHERE key = 'manual_ring'`);
    }
    res.json({ ring: shouldRing, currentSession: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ESP32 heartbeat endpoint
router.post('/heartbeat', async (req, res) => {
  try {
    const { device_id } = req.body;
    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }
    await updateDeviceHeartbeat(device_id);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get device status (admin only)
router.get('/devices', authenticateToken, async (req, res) => {
  try {
    const devices = await getDeviceStatus();
    res.json({ devices });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current session state
router.get('/current-session', async (req, res) => {
  try {
    const session = await getCurrentSessionState();
    res.json({ session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get bell logs (admin only)
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const { query: dbQuery } = await import('../config/database');
    const logs = await dbQuery(
      `SELECT * FROM bell_logs ORDER BY triggered_at DESC LIMIT 50`
    );
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
