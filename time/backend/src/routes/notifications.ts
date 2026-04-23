import { Router } from 'express';
import {
  registerDeviceToken,
  updateNotificationPreferences,
  getNotificationHistory,
  sendTestNotification,
  getNotificationPreferences,
  sendClassArrival
} from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Register device token (public for teachers to register their devices)
router.post('/device-token', registerDeviceToken);

// Update notification preferences (teacher can update their own)
router.put('/preferences/:teacherId?', authenticateToken, updateNotificationPreferences);

// Get notification preferences (teacher can view their own)
router.get('/preferences/:teacherId?', authenticateToken, getNotificationPreferences);

// Get notification history (teacher can view their own)
router.get('/history/:teacherId?', authenticateToken, getNotificationHistory);

// Send test notification (admin only)
router.post('/test', authenticateToken, sendTestNotification);

// Send class arrival notification (for when students arrive)
router.post('/class-arrival', authenticateToken, sendClassArrival);

export default router;
