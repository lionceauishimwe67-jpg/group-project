const express = require('express');
const auth = require('../middleware/auth');
const groupController = require('../controllers/groupController');

const router = express.Router();

router.get('/', auth(), groupController.listMyGroups);
router.post('/', auth(), groupController.createGroup);
router.get('/:groupId', auth(), groupController.getGroup);
router.post('/:groupId/join', auth(), groupController.joinGroup);
router.patch('/:groupId/memberships/:membershipId/rotation', auth(), groupController.updateRotation);
router.post('/:groupId/contributions', auth(), groupController.recordContribution);
router.get('/:groupId/dashboard', auth(), groupController.getDashboard);

module.exports = router;

