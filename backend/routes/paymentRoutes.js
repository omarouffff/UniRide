const express = require('express');
const {
  createPayment,
  getMyPayments,
  getAllPayments,
  initializePaymob,
  handlePaymobWebhook,
  verifyCashPayment
} = require('../controllers/paymentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public webhook route (Paymob needs this unauthenticated)
router.post('/webhook', handlePaymobWebhook);

// Protected routes (require valid session token)
router.use(protect);
router.post('/', upload.single('proofImage'), createPayment);
router.post('/paymob/initialize', initializePaymob);
router.get('/mine', getMyPayments);
router.get('/', authorizeRoles('admin'), getAllPayments);
router.patch('/:id/verify', authorizeRoles('admin'), verifyCashPayment);

module.exports = router;
