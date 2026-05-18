const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pickupPoint: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    travelDate: { type: Date, required: true },
    seat: { type: String },
    status: {
      type: String,
      enum: ['confirmed', 'waiting', 'cancelled'],
      default: 'waiting',
    },
    waitingPosition: { type: Number, default: null },
    noShow: { type: Boolean, default: false },
    route: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
