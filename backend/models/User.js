const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['student', 'admin', 'driver'], default: 'student' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    universityId: {
      type: String,
      required() {
        return this.role === 'student';
      },
      trim: true,
    },
    idCardImage: {
      type: String,
      required() {
        return this.role === 'student';
      },
    },
    universityIdImage: { type: String },
    universityIdStatus: {
      type: String,
      enum: ['pending', 'approved', 'verified', 'rejected'],
      default: 'pending',
    },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
    noShowCount: { type: Number, default: 0 },
    waitingListPosition: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.virtual('password').set(function (password) {
  this.passwordHash = password;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  if (this.passwordHash.startsWith('$2a$') || this.passwordHash.startsWith('$2b$')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
    universityId: this.universityId,
    idCardImage: this.idCardImage,
    universityIdImage: this.universityIdImage || this.idCardImage,
    universityIdStatus: this.status,
    reviewedAt: this.reviewedAt,
    reviewNotes: this.reviewNotes,
    noShowCount: this.noShowCount,
    waitingListPosition: this.waitingListPosition,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
