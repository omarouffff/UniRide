const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const { prisma } = require('../prisma/client');
const paymentRepository = require('../repositories/paymentRepository');
const bookingRepository = require('../repositories/bookingRepository');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const paymentService = require('../services/paymentService');
const { encryptQrPayload } = require('../utils/qrPayload');
const { notifyPaymentSuccess, notifyBookingConfirmed } = require('../services/notificationService');

function buildReference() {
  return `UR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const createPayment = asyncHandler(async (req, res) => {
  const { bookingId, amount, method = 'cash', description } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Valid payment amount is required' });
  }

  if (bookingId) {
    const booking = await bookingRepository.findByUserAndId(req.user.id, bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
  }

  let proofImage;
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file, 'uniride/payment-proofs');
    proofImage = uploadResult.secure_url;
  }

  const payment = await paymentRepository.create({
    userId: req.user.id,
    bookingId: bookingId || null,
    amount: Number(amount),
    method,
    status: proofImage ? 'under_review' : 'pending',
    reference: buildReference(),
    description,
    proofImage,
  });

  res.status(201).json({ payment });
});

const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await paymentRepository.findByUser(req.user.id);
  res.json({ payments });
});

const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await paymentRepository.findAll();
  res.json({ payments });
});

const initializePaymob = asyncHandler(async (req, res) => {
  const { bookingId, amount } = req.body;
  if (!bookingId) return res.status(400).json({ message: 'Booking ID is required' });
  if (!amount || Number(amount) <= 0) return res.status(400).json({ message: 'Valid payment amount is required' });

  const booking = await bookingRepository.findByUserAndId(req.user.id, bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  const paymobData = await paymentService.initializePaymobPayment(req.user.id, bookingId, Number(amount));
  res.status(200).json(paymobData);
});

const initializeFawry = asyncHandler(async (req, res) => {
  const { bookingId, amount } = req.body;
  if (!bookingId || !amount) {
    return res.status(400).json({ message: 'Booking ID and amount are required' });
  }
  const booking = await bookingRepository.findByUserAndId(req.user.id, bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const data = await paymentService.initializeFawryPayment(req.user.id, bookingId, Number(amount));
  res.json(data);
});

const initializeStripe = asyncHandler(async (req, res) => {
  const { bookingId, amount } = req.body;
  if (!bookingId || !amount) {
    return res.status(400).json({ message: 'Booking ID and amount are required' });
  }
  const booking = await bookingRepository.findByUserAndId(req.user.id, bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const data = await paymentService.initializeStripePayment(req.user.id, bookingId, Number(amount));
  res.json(data);
});

const handlePaymobWebhook = asyncHandler(async (req, res) => {
  const receivedHmac = req.query.hmac;
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  if (!hmacSecret) return res.status(500).json({ message: 'Server configuration error' });

  const obj = req.body.obj;
  if (!obj) return res.status(400).json({ message: 'Invalid payload' });

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
    obj.success,
  ];

  const concatenatedString = fields.map((val) => (val === undefined || val === null ? '' : String(val))).join('');
  const calculatedHmac = crypto.createHmac('sha512', hmacSecret).update(concatenatedString).digest('hex');
  const buf1 = crypto.createHash('sha256').update(calculatedHmac).digest();
  const buf2 = crypto.createHash('sha256').update(receivedHmac || '').digest();
  if (!crypto.timingSafeEqual(buf1, buf2)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const isSuccess = obj.success === true || String(obj.success) === 'true';
  const verificationResult = await paymentService.verifyPaymobPayment(orderId, isSuccess ? 'success' : 'failed');
  const io = req.app.get('io');

  if (io && verificationResult.booking) {
    const booking = verificationResult.booking;
    if (isSuccess && !booking.qrPayload) {
      const qrPayload = encryptQrPayload({
        bookingId: booking.id,
        userId: booking.userId,
        tripId: booking.tripId,
        seat: booking.seat,
      });
      await prisma.booking.update({ where: { id: booking.id }, data: { qrPayload } });
      booking.qrPayload = qrPayload;
    }
    io.to(booking.userId).emit('bookingUpdate', {
      id: booking.id,
      status: booking.status,
      seat: booking.seat || null,
      qrPayload: booking.qrPayload || null,
    });
    if (isSuccess) {
      await notifyPaymentSuccess(booking.userId, verificationResult.payment, io).catch(() => undefined);
      await notifyBookingConfirmed(booking.userId, booking, io).catch(() => undefined);
    }
  }

  res.status(200).json({ status: 'verified', success: isSuccess });
});

const verifyCashPayment = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['completed', 'failed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid payment status. Must be completed or failed' });
  }

  const payment = await paymentRepository.findById(req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment record not found' });

  const updated = await paymentRepository.update(payment.id, {
    status,
    verifiedAt: new Date(),
    verifiedBy: req.user.id,
  });

  if (payment.bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } });
    if (booking) {
      let qrPayload = booking.qrPayload;
      if (status === 'completed' && !qrPayload) {
        qrPayload = encryptQrPayload({
          bookingId: booking.id,
          userId: booking.userId,
          tripId: booking.tripId,
          seat: booking.seat,
        });
      }
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: status === 'completed' ? 'confirmed' : 'cancelled',
          qrPayload: status === 'completed' ? qrPayload : null,
        },
      });
      const io = req.app.get('io');
      if (io) {
        io.to(booking.userId).emit('bookingUpdate', {
          id: booking.id,
          status: status === 'completed' ? 'confirmed' : 'cancelled',
          seat: booking.seat || null,
          qrPayload: status === 'completed' ? qrPayload : null,
        });
      }
    }
  }

  res.json({ message: `Payment verified as ${status}`, payment: updated });
});

const handleFawryWebhook = asyncHandler(async (req, res) => {
  const { merchantRefNumber, fawryRefNumber, paymentStatus, messageSignature } = req.body;
  if (!merchantRefNumber || !paymentStatus) {
    return res.status(400).json({ message: 'Invalid Fawry webhook payload' });
  }

  const securityKey = process.env.FAWRY_SECURITY_KEY;
  if (!securityKey) return res.status(500).json({ message: 'Fawry security key not configured' });

  if (messageSignature) {
    const expected = crypto
      .createHash('sha256')
      .update(`${merchantRefNumber}${fawryRefNumber || ''}${paymentStatus}${securityKey}`)
      .digest('hex');
    if (expected !== messageSignature) {
      return res.status(401).json({ message: 'Invalid signature' });
    }
  }

  const payment = await paymentRepository.findByReference(merchantRefNumber);
  if (!payment || payment.method !== 'fawry') {
    return res.status(404).json({ message: 'Payment not found' });
  }

  const isPaid = String(paymentStatus).toUpperCase() === 'PAID';
  const updated = await paymentRepository.update(payment.id, {
    status: isPaid ? 'completed' : 'failed',
    metadata: { ...(payment.metadata || {}), fawryRefNumber, webhookAt: new Date() },
  });

  if (isPaid && payment.bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } });
    if (booking) {
      let qrPayload = booking.qrPayload;
      if (!qrPayload) {
        qrPayload = encryptQrPayload({
          bookingId: booking.id,
          userId: booking.userId,
          tripId: booking.tripId,
          seat: booking.seat,
        });
      }
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'confirmed', qrPayload },
      });
      const io = req.app.get('io');
      await notifyPaymentSuccess(booking.userId, updated, io).catch(() => undefined);
      await notifyBookingConfirmed(booking.userId, booking, io).catch(() => undefined);
      if (io) {
        io.to(booking.userId).emit('bookingUpdate', {
          id: booking.id,
          status: 'confirmed',
          seat: booking.seat || null,
          qrPayload,
        });
      }
    }
  }

  res.status(200).json({ success: true, status: updated.status });
});

module.exports = {
  createPayment,
  getMyPayments,
  getAllPayments,
  initializePaymob,
  initializeFawry,
  initializeStripe,
  handlePaymobWebhook,
  handleFawryWebhook,
  verifyCashPayment,
};
