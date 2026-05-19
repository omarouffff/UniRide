const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { uploadToCloudinary } = require('../services/cloudinaryService');

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

module.exports = { createPayment, getMyPayments, getAllPayments };
