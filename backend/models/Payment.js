const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'EGP' },
    method: {
      type: String,
      enum: ['card', 'wallet', 'paymob', 'fawry', 'stripe', 'cash'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    reference: { type: String, unique: true }, // Transaction ID
    description: { type: String },
    metadata: mongoose.Schema.Types.Mixed, // For storing provider-specific data
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for fast queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ reference: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
