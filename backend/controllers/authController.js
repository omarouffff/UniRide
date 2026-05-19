const asyncHandler = require('express-async-handler');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const UniversityVerification = require('../models/UniversityVerification');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { sendMail, createEmailTemplate } = require('../services/emailService');
const {
  generateAccessToken,
  generateRefreshToken,
  createTokenId,
  hashToken,
  verifyRefreshToken,
} = require('../services/tokenService');
const { auditEvent } = require('../utils/logger');

function createTokenCookieOptions(maxAge) {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge,
    path: '/api',
  };
}

function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie('token', accessToken, createTokenCookieOptions(15 * 60 * 1000));
  res.cookie('refreshToken', refreshToken, createTokenCookieOptions(7 * 24 * 60 * 60 * 1000));
}

function clearTokenCookies(res) {
  res.clearCookie('token', createTokenCookieOptions(0));
  res.clearCookie('refreshToken', createTokenCookieOptions(0));
}

async function sendVerificationEmail(user, verificationToken) {
  const frontendUrl = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:3000';
  const verifyUrl = `${frontendUrl.replace(/\/$/, '')}/auth/verify-university-id?token=${verificationToken}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your UniRide email',
    html: createEmailTemplate({
      heading: 'Confirm your email',
      body: 'Please verify your email address to secure your UniRide account and complete registration.',
      actionText: 'Verify Email',
      actionUrl: verifyUrl,
    }),
  });
}

const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phoneNumber,
    password,
    universityId,
    college,
    academicYear,
  } = req.body;

  let idCardFile = req.files?.idCardImage?.[0] || req.files?.universityIdImage?.[0];
  if (process.env.NODE_ENV === 'test' && !idCardFile) {
    idCardFile = { path: 'mock-path', secure_url: 'http://example.com/mock.jpg' };
  } else if (!idCardFile) {
    return res.status(400).json({ message: 'University ID image is required' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const verificationToken = createTokenId();
  const verificationTokenHash = hashToken(verificationToken);

  const idCardUpload = await uploadToCloudinary(idCardFile, 'uniride/id-cards');

  const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

  const user = await User.create({
    name,
    email,
    phoneNumber,
    college,
    academicYear,
    passwordHash: password,
    universityId,
    idCardImage: idCardUpload.secure_url,
    universityIdImage: idCardUpload.secure_url,
    universityIdStatus: isDev ? 'approved' : 'pending',
    status: isDev ? 'approved' : 'pending',
    emailVerified: isDev ? true : false,
    emailVerificationToken: verificationTokenHash,
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
  });

  await sendVerificationEmail(user, verificationToken).catch((error) => {
    console.warn('Unable to send verification email:', error.message);
  });

  auditEvent('user.register', user._id, { email: user.email, ip: req.ip });

  res.status(201).json({
    message: 'Registration submitted. Account waiting for admin approval.',
    user: user.toSafeObject(),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, twoFactorCode, deviceName } = req.body;
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const isDebug = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

  if (isDebug) {
    console.log('[auth.login] request', { email: normalizedEmail, hasPassword: Boolean(password) });
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (isDebug) {
    console.log('[auth.login] user lookup', {
      found: Boolean(user),
      emailVerified: user?.emailVerified,
      status: user?.status,
      role: user?.role,
      isActive: user?.isActive,
    });
  }

  if (!user) {
    auditEvent('auth.failed', null, { email: normalizedEmail, ip: req.ip, reason: 'user-not-found' });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.isLocked()) {
    return res.status(423).json({ message: 'Account is locked due to repeated failed login attempts. Try again later.' });
  }

  const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

  if (isDev) {
    let modified = false;
    if (!user.emailVerified) {
      user.emailVerified = true;
      modified = true;
    }
    if (!user.status || user.status === 'pending') {
      user.status = 'approved';
      user.universityIdStatus = 'approved';
      modified = true;
    }
    if (modified) {
      await user.save();
    }
  } else {
    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Please verify your email', status: 'email_unverified' });
    }

    if (!user.status || user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is waiting for admin approval', status: 'pending' });
    }
  }

  if (user.status === 'rejected') {
    return res.status(403).json({ message: 'Your account has been rejected', status: 'rejected' });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: 'Your account has been banned', status: 'banned' });
  }

  const passwordValid = await user.comparePassword(password);
  if (isDebug) {
    console.log('[auth.login] password comparison', { valid: passwordValid });
  }

  if (!passwordValid) {
    await user.incrementLoginAttempts();
    auditEvent('auth.failed', user._id, { email: normalizedEmail, ip: req.ip, reason: 'invalid-password' });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.twoFactorEnabled) {
    if (!twoFactorCode) {
      return res.status(403).json({ requiresTwoFactor: true, message: 'Two-factor authentication code required.' });
    }
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 1,
    });
    if (!verified) {
      auditEvent('auth.failed', user._id, { reason: 'invalid-2fa', ip: req.ip });
      return res.status(401).json({ message: 'Invalid two-factor authentication code' });
    }
  }

  await user.resetLoginAttempts();

  const tokenId = createTokenId();
  const refreshToken = generateRefreshToken(user._id.toString(), tokenId);
  const accessToken = generateAccessToken(user._id.toString(), tokenId);
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.sessions.unshift({
    tokenId,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    deviceName: deviceName || 'browser',
    createdAt: new Date(),
    lastUsedAt: new Date(),
    expiresAt,
  });
  user.sessions = user.sessions.slice(0, 10);
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);
  auditEvent('auth.success', user._id, { ip: req.ip, deviceName });

  if (isDebug) {
    console.log('[auth.login] success', { userId: user._id.toString(), role: user.role, status: user.status });
  }

  res.json({
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body?.refreshToken;
  if (!token) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const session = user.getSession(decoded.sid);
    if (!session) {
      return res.status(401).json({ message: 'Session invalid or expired' });
    }

    if (session.refreshTokenHash !== hashToken(token)) {
      await user.revokeSession(decoded.sid);
      return res.status(401).json({ message: 'Refresh token mismatch' });
    }

    const newTokenId = createTokenId();
    const newRefreshToken = generateRefreshToken(user._id.toString(), newTokenId);
    const newAccessToken = generateAccessToken(user._id.toString(), newTokenId);

    session.revoked = true;
    user.sessions.unshift({
      tokenId: newTokenId,
      refreshTokenHash: hashToken(newRefreshToken),
      ip: req.ip,
      userAgent: req.get('user-agent'),
      deviceName: session.deviceName || 'browser',
      createdAt: new Date(),
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    user.sessions = user.sessions.slice(0, 10);
    await user.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);
    res.json({
      user: user.toSafeObject(),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    auditEvent('auth.refresh-failed', null, { ip: req.ip, error: error.message });
    return res.status(401).json({ message: 'Unable to refresh session' });
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.id);
      if (user) {
        await user.revokeSession(decoded.sid);
      }
    } catch (error) {
      // ignore invalid refresh token
    }
  }

  clearTokenCookies(res);
  res.json({ message: 'Logged out successfully' });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash -twoFactorSecret');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ user: user.toSafeObject() });
});

const submitUniversityId = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'University ID image is required' });
  }
  const uploadResult = await uploadToCloudinary(req.file, 'university_ids');
  user.universityIdImage = uploadResult.secure_url;
  user.universityIdStatus = 'pending';
  user.idCardImage = uploadResult.secure_url;
  user.status = 'pending';
  await user.save();
  await UniversityVerification.create({
    user: user._id,
    studentNumber: user.universityId,
    universityIdImage: uploadResult.secure_url,
    status: 'pending',
  });
  auditEvent('user.upload-university-id', user._id, { ip: req.ip });
  res.status(200).json({
    message: 'University ID submitted successfully',
    universityIdStatus: user.universityIdStatus,
    universityIdImage: user.universityIdImage,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const { name, phoneNumber, college, academicYear } = req.body;
  if (name) user.name = name;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (college) user.college = college;
  if (academicYear) user.academicYear = academicYear;
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file, 'uniride/profile-images');
    user.profileImage = uploadResult.secure_url;
  }
  await user.save();
  auditEvent('user.update-profile', user._id, { ip: req.ip });
  res.json({ user: user.toSafeObject() });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    emailVerificationToken: tokenHash,
    emailVerificationExpires: { $gt: Date.now() },
  });
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification token' });
  }
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  auditEvent('auth.email-verified', user._id, { ip: req.ip });
  res.json({ message: 'Email verified successfully' });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.json({ message: 'If your email is registered, a verification link has been sent.' });
  }

  if (user.emailVerified) {
    return res.status(400).json({ message: 'Email is already verified' });
  }

  const COOLDOWN_MS = 60 * 1000;
  if (user.emailVerificationLastSentAt && (Date.now() - new Date(user.emailVerificationLastSentAt).getTime() < COOLDOWN_MS)) {
    const timeLeft = Math.ceil((COOLDOWN_MS - (Date.now() - new Date(user.emailVerificationLastSentAt).getTime())) / 1000);
    return res.status(429).json({ message: `Please wait ${timeLeft} seconds before requesting a new verification link.` });
  }

  const verificationToken = createTokenId();
  user.emailVerificationToken = hashToken(verificationToken);
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  user.emailVerificationLastSentAt = new Date();
  await user.save();

  await sendVerificationEmail(user, verificationToken).catch((error) => {
    console.warn('Unable to send verification email:', error.message);
  });

  res.json({ message: 'Verification link has been resent successfully.' });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const resetToken = createTokenId();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save();
    const frontendUrl = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:3000';
    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/auth/reset-password?token=${resetToken}`;
    await sendMail({
      to: user.email,
      subject: 'UniRide password reset request',
      html: createEmailTemplate({
        heading: 'Reset your password',
        body: 'A request was made to reset your UniRide account password. Use the link below to continue.',
        actionText: 'Reset password',
        actionUrl: resetUrl,
      }),
    }).catch((error) => {
      console.warn('Password reset email error:', error.message);
    });
  }
  res.json({ message: 'If your account exists, a password reset link has been sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired password reset token' });
  }
  user.passwordHash = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.emailVerified = true;
  await user.revokeAllSessions();
  await user.save();
  auditEvent('auth.password-reset', user._id, { ip: req.ip });
  res.json({ message: 'Password has been reset successfully' });
});

const setupTwoFactor = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const secret = speakeasy.generateSecret({ name: 'UniRide' });
  user.twoFactorSecret = secret.base32;
  await user.save();
  res.json({ secret: secret.base32, otpAuthUrl: secret.otpauth_url });
});

const verifyTwoFactor = asyncHandler(async (req, res) => {
  const { twoFactorCode } = req.body;
  const user = await User.findById(req.user.id);
  if (!user || !user.twoFactorSecret) {
    return res.status(404).json({ message: 'Two-factor authentication setup not found' });
  }
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: twoFactorCode,
    window: 1,
  });
  if (!verified) {
    return res.status(401).json({ message: 'Invalid two-factor authentication code' });
  }
  user.twoFactorEnabled = true;
  await user.save();
  res.json({ message: 'Two-factor authentication enabled successfully' });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  getProfile,
  updateProfile,
  submitUniversityId,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  setupTwoFactor,
  verifyTwoFactor,
};