const express = require('express');
const { createBooking, getMyBookings, getBookingById } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/', createBooking);
router.get('/', getMyBookings);
router.get('/:id', getBookingById);

module.exports = router;
