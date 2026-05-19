const express = require('express');
const { getDriverBookings, scanQr, boardPassengerManual } = require('../controllers/driverController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('driver'));
router.get('/bookings', getDriverBookings);
router.post('/scan', scanQr);
router.post('/manual-board', boardPassengerManual);

module.exports = router;
