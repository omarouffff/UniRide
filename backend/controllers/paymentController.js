const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const paymentService = require('../services/paymentService');

const createPayment = asyncHandler(async (req, res) => {
  const { bookingId, amount, method = 'cash', description } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Valid payment amount is required' });
  }

  let booking = null;
  if (bookingId) {
    booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
  }

  let proofImage;
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file, 'uniride/payment-proofs');
    proofImage = uploadResult.secure_url;
  }

  const payment = await Payment.create({
    user: req.user._id,
    booking: booking?._id,
    amount: Number(amount),
    method,
    status: proofImage ? 'pending' : method === 'cash' ? 'pending' : 'completed',
    reference: `UR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description,
    proofImage,
  });

  res.status(201).json({ payment });
});

const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).populate('booking').sort({ createdAt: -1 });
  res.json({ payments });
});

const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find().populate('user', 'name email').populate('booking').sort({ createdAt: -1 });
  res.json({ payments });
});

// Initialize Paymob payment
const initializePaymob = asyncHandler(async (req, res) => {
  const { bookingId, amount } = req.body;
  if (!bookingId) {
    return res.status(400).json({ message: 'Booking ID is required' });
  }
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Valid payment amount is required' });
  }

  const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  const paymobData = await paymentService.initializePaymobPayment(
    req.user._id,
    bookingId,
    Number(amount)
  );

  res.status(200).json(paymobData);
});

// Handle Paymob Webhook
const handlePaymobWebhook = asyncHandler(async (req, res) => {
  const receivedHmac = req.query.hmac;
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;

  if (!hmacSecret) {
    console.error('PAYMOB_HMAC_SECRET is not configured');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const obj = req.body.obj;
  if (!obj) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  // 1. Re-calculate the Paymob HMAC signature
  const orderId = obj.order ? (typeof obj.order === 'object' ? obj.order.id : obj.order) : '';
  const pan = obj.source_data ? obj.source_data.pan : '';
  const subType = obj.source_data ? obj.source_data.sub_type : '';
  const type = obj.source_data ? obj.source_data.type : '';

  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    orderId,
    obj.owner,
    obj.pending,
    pan,
    subType,
    type,
    obj.success
  ];

  const concatenatedString = fields.map(val => {
    if (val === undefined || val === null) return '';
    return String(val);
  }).join('');

  const calculatedHmac = crypto
    .createHmac('sha512', hmacSecret)
    .update(concatenatedString)
    .digest('hex');

  // 2. Constant-time secure verification to prevent timing attacks
  const buf1 = crypto.createHash('sha256').update(calculatedHmac).digest();
  const buf2 = crypto.createHash('sha256').update(receivedHmac || '').digest();

  if (!crypto.timingSafeEqual(buf1, buf2)) {
    console.warn('Paymob webhook HMAC verification failed');
    return res.status(401).json({ message: 'Invalid signature' });
  }

  // 3. Process verification
  const isSuccess = obj.success === true || String(obj.success) === 'true';
  const paymentStatus = isSuccess ? 'success' : 'failed';

  const verificationResult = await paymentService.verifyPaymobPayment(orderId, paymentStatus);

  // 4. Trigger socket update to inform user immediately
  const io = req.app.get('io');
  if (io && verificationResult.booking) {
    const booking = verificationResult.booking;
    
    // Generate QR code if booking confirmed but not yet set
    if (isSuccess && !booking.qrPayload) {
      const { encryptQrPayload } = require('../utils/qrPayload');
      booking.qrPayload = encryptQrPayload({
        bookingId: booking._id,
        userId: booking.user,
        tripId: booking.trip,
        seat: booking.seat,
      });
      await booking.save();
    }

    io.to(booking.user.toString()).emit('bookingUpdate', {
      id: booking._id,
      status: booking.status,
      seat: booking.seat || null,
      qrPayload: booking.qrPayload || null,
    });
  }

  res.status(200).json({ status: 'verified', success: isSuccess });
});

const verifyCashPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'completed' or 'failed'

  if (!['completed', 'failed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid payment status. Must be completed or failed' });
  }

  const payment = await Payment.findById(id).populate('booking');
  if (!payment) {
    return res.status(404).json({ message: 'Payment record not found' });
  }

  if (payment.method !== 'cash') {
    return res.status(400).json({ message: 'Only cash/proof payments can be verified manually' });
  }

  payment.status = status;
  await payment.save();

  if (payment.booking) {
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      if (status === 'completed') {
        booking.status = 'confirmed';
        
        // Generate QR code if booking confirmed but not yet set
        if (!booking.qrPayload) {
          const { encryptQrPayload } = require('../utils/qrPayload');
          booking.qrPayload = encryptQrPayload({
            bookingId: booking._id,
            userId: booking.user,
            tripId: booking.trip,
            seat: booking.seat,
          });
        }
        await booking.save();

        // Trigger socket update to inform user immediately
        const io = req.app.get('io');
        if (io) {
          io.to(booking.user.toString()).emit('bookingUpdate', {
            id: booking._id,
            status: booking.status,
            seat: booking.seat || null,
            qrPayload: booking.qrPayload || null,
          });
        }
      } else {
        booking.status = 'cancelled';
        await booking.save();
        
        // Trigger socket update to inform user immediately
        const io = req.app.get('io');
        if (io) {
          io.to(booking.user.toString()).emit('bookingUpdate', {
            id: booking._id,
            status: booking.status,
            seat: null,
            qrPayload: null,
          });
        }
      }
    }
  }

  res.json({ message: `Payment verified as ${status}`, payment });
});

module.exports = {
  createPayment,
  getMyPayments,
  getAllPayments,
  initializePaymob,
  handlePaymobWebhook,
  verifyCashPayment
};
