import { Router } from 'express';
import { getCurrentTime, syncTime, getTimeStatus } from '../controllers/timeController';

const router = Router();

// Public routes (for display screen and frontend)
router.get('/current', getCurrentTime);
router.get('/sync', syncTime);
router.get('/status', getTimeStatus);

export default router;
