const express = require('express');
const {
  getUsers,
  getPendingUsers,
  updateUserStatus,
  approveUser,
  rejectUser,
  banUser,
  deleteUser,
  createTrip,
  getTrips,
  updateTrip,
  deleteTrip,
  getAnalytics,
  getBookings,
} = require('../controllers/adminController');
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('admin'));
router.get('/users', getUsers);
router.get('/users/pending', getPendingUsers);
router.patch('/users/:id/approve', approveUser);
router.patch('/users/:id/reject', rejectUser);
router.patch('/users/:id/ban', banUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:userId', updateUserStatus);
router.get('/trips', getTrips);
router.post('/trips', createTrip);
router.put('/trips/:id', updateTrip);
router.delete('/trips/:id', deleteTrip);
router.get('/analytics', getAnalytics);
router.get('/bookings', getBookings);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
