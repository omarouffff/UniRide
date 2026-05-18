const express = require('express');
const { getUsers, updateUserStatus, createTrip, getTrips, getAnalytics } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('admin'));
router.get('/users', getUsers);
router.patch('/users/:userId', updateUserStatus);
router.get('/trips', getTrips);
router.post('/trips', createTrip);
router.get('/analytics', getAnalytics);

module.exports = router;
