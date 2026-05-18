const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    totalBookings: { type: Number, default: 0 },
    confirmedBookings: { type: Number, default: 0 },
    cancelledBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    completedTrips: { type: Number, default: 0 },
    noShowCount: { type: Number, default: 0 },
    averageOccupancy: { type: Number, default: 0 },
    peakBookingTime: { type: String }, // e.g., "08:00-09:00"
    topRoutes: [
      {
        route: String,
        bookings: Number,
      },
    ],
    metrics: {
      customerSatisfaction: { type: Number, min: 0, max: 5 },
      driverRating: { type: Number, min: 0, max: 5 },
      onTimePercentage: { type: Number, min: 0, max: 100 },
    },
  },
  { timestamps: true }
);

analyticsSchema.index({ date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
