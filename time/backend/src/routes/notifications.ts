import { Router } from 'express';
import {
  registerDeviceToken,
  updateNotificationPreferences,
  getNotificationHistory,
  sendTestNotification,
  getNotificationPreferences,
  sendClassArrival,
  markNotificationAsRead,
  getAllTeachersNotificationStatus
} from '../controllers/notificationController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

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

// Mark a notification as read (teacher or admin)
router.post('/:id/read', markNotificationAsRead);

// Get all teachers notification status with read tracking (admin only)
router.get('/teacher-status', authenticateToken, requireAdmin, getAllTeachersNotificationStatus);

export default router;
