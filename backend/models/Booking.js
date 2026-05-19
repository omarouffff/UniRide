const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    pickupPoint: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    travelDate: { type: Date, required: true },
    cancelledAt: { type: Date },
    seat: { type: String },
    status: {
      type: String,
      enum: ['confirmed', 'waiting', 'cancelled'],
      default: 'waiting',
    },
    waitingPosition: { type: Number, default: null },
    noShow: { type: Boolean, default: false },
    boardedAt: { type: Date },
    qrPayload: { type: String },
    route: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
