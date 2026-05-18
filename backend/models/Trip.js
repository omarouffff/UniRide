const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    pickupPoint: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    busNumber: { type: String, required: true, trim: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    capacity: { type: Number, required: true, min: 1, max: 120 },
    departureTime: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

tripSchema.virtual('route').get(function () {
  return `${this.pickupPoint} -> ${this.destination}`;
});

tripSchema.set('toJSON', { virtuals: true });
tripSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Trip', tripSchema);
