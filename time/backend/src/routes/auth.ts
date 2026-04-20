import { Router } from 'express';
import { login, verifyToken, changePassword, createUser, adminSecretAuth } from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes with rate limiting
router.post('/login', loginRateLimiter, login);
router.post('/admin-secret', loginRateLimiter, adminSecretAuth);
router.post('/register', loginRateLimiter, createUser);

// Protected routes
router.get('/verify', authenticateToken, verifyToken);
router.post('/change-password', authenticateToken, changePassword);
router.post('/users', authenticateToken, requireAdmin, createUser);

export default router;
