const express = require('express');
const {
  getDriverBookings,
  scanQr,
  boardPassengerManual,
  markNoShow,
  updateDriverLocation,
} = require('../controllers/driverController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('driver', 'admin'));
router.get('/bookings', getDriverBookings);
router.post('/scan', scanQr);
router.post('/manual-board', boardPassengerManual);
router.post('/no-show', markNoShow);
router.post('/location', updateDriverLocation);

module.exports = router;
