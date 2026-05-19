const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sessionSchema = new mongoose.Schema(
  {
    tokenId: { type: String, required: true },
    refreshTokenHash: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    deviceName: { type: String, maxlength: 100 },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    revoked: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phoneNumber: {
      type: String,
      required() {
        return this.role === 'student';
      },
      trim: true,
      match: [/^\+?[0-9]{10,15}$/, 'Invalid phone number format'],
    },
    college: {
      type: String,
      required() {
        return this.role === 'student';
      },
      trim: true,
      maxlength: 120,
    },
    academicYear: {
      type: String,
      required() {
        return this.role === 'student';
      },
      trim: true,
      maxlength: 60,
    },
    profileImage: { type: String },
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
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    sessions: { type: [sessionSchema], default: [] },
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
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = function () {
  const updates = { $inc: { failedLoginAttempts: 1 } };
  if (this.failedLoginAttempts + 1 >= Number(process.env.MAX_LOGIN_ATTEMPTS || 5)) {
    updates.$set = { lockUntil: Date.now() + Number(process.env.ACCOUNT_LOCK_MINUTES || 15) * 60000 };
  }
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({ failedLoginAttempts: 0, lockUntil: null });
};

userSchema.methods.getSession = function (tokenId) {
  return this.sessions.find((session) => session.tokenId === tokenId && !session.revoked && session.expiresAt > new Date());
};

userSchema.methods.revokeSession = function (tokenId) {
  const session = this.sessions.find((entry) => entry.tokenId === tokenId);
  if (session) {
    session.revoked = true;
  }
  return this.save();
};

userSchema.methods.revokeAllSessions = function () {
  this.sessions.forEach((entry) => {
    entry.revoked = true;
  });
  return this.save();
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phoneNumber: this.phoneNumber,
    college: this.college,
    academicYear: this.academicYear,
    profileImage: this.profileImage,
    role: this.role,
    status: this.status,
    universityId: this.universityId,
    idCardImage: this.idCardImage,
    universityIdImage: this.universityIdImage || this.idCardImage,
    universityIdStatus: this.universityIdStatus,
    reviewedAt: this.reviewedAt,
    reviewNotes: this.reviewNotes,
    noShowCount: this.noShowCount,
    waitingListPosition: this.waitingListPosition,
    isActive: this.isActive,
    emailVerified: this.emailVerified,
    twoFactorEnabled: this.twoFactorEnabled,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
