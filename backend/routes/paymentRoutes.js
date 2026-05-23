const express = require('express');
const {
  createPayment,
  getMyPayments,
  getAllPayments,
  initializePaymob,
  initializeFawry,
  initializeStripe,
  handlePaymobWebhook,
  handleFawryWebhook,
  verifyCashPayment,
} = require('../controllers/paymentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/webhook', handlePaymobWebhook);
router.post('/fawry/webhook', handleFawryWebhook);

router.use(protect);
router.post('/', upload.single('proofImage'), createPayment);
router.post('/paymob/initialize', initializePaymob);
router.post('/fawry/initialize', initializeFawry);
router.post('/stripe/initialize', initializeStripe);
router.get('/mine', getMyPayments);
router.get('/', authorizeRoles('admin'), getAllPayments);
router.patch('/:id/verify', authorizeRoles('admin'), verifyCashPayment);

module.exports = router;
