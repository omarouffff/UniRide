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
  getRoutes,
  upsertRoute,
  getBuses,
  upsertBus,
  getPayments,
  verifyPayment,
  getComplaints,
  updateComplaint,
  getMonthlyReport,
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

router.get('/routes', getRoutes);
router.post('/routes', upsertRoute);
router.put('/routes/:id', upsertRoute);

router.get('/buses', getBuses);
router.post('/buses', upsertBus);
router.put('/buses/:id', upsertBus);

router.get('/analytics', getAnalytics);
router.get('/reports/monthly', getMonthlyReport);
router.get('/bookings', getBookings);

router.get('/payments', getPayments);
router.patch('/payments/:id/verify', verifyPayment);

router.get('/complaints', getComplaints);
router.patch('/complaints/:id', updateComplaint);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
