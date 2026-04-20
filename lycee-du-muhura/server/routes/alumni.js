const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { alumniController } = require('../controllers');

// Public routes
router.get('/', alumniController.getAllAlumni);
router.get('/stats/overview', alumniController.getAlumniStats);
router.get('/search', alumniController.searchAlumni);
router.get('/:id', alumniController.getAlumnus);

// Protected routes (admin only)
router.post('/', authenticateToken, requireAdmin, alumniController.createAlumnus);
router.put('/:id', authenticateToken, requireAdmin, alumniController.updateAlumnus);
router.delete('/:id', authenticateToken, requireAdmin, alumniController.deleteAlumnus);

module.exports = router;
