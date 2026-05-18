const express = require('express');
const { createBooking, getAvailableTrips, getMyBookings, getBookingById, cancelBooking } = require('../controllers/bookingController');
const { getDashboard } = require('../controllers/dashboardController');
const { protect, requireApproved } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/dashboard', getDashboard);
router.get('/trips', requireApproved, getAvailableTrips);
router.post('/', requireApproved, createBooking);
router.get('/', getMyBookings);
router.patch('/:id/cancel', requireApproved, cancelBooking);
router.get('/:id', getBookingById);

module.exports = router;
