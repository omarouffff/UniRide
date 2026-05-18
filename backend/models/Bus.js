const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    busNumber: { type: String, required: true, unique: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    make: { type: String, trim: true },
    model: { type: String, trim: true },
    licensePlate: { type: String, trim: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },
    lastMaintenance: { type: Date },
    nextMaintenance: { type: Date },
    amenities: [String], // wifi, usb, ac, etc
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bus', busSchema);
