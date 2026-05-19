const express = require('express');
const { createPayment, getMyPayments, getAllPayments } = require('../controllers/paymentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);
router.post('/', upload.single('proofImage'), createPayment);
router.get('/mine', getMyPayments);
router.get('/', authorizeRoles('admin'), getAllPayments);

module.exports = router;
