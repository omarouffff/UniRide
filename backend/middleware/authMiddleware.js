const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (!req.user.isActive) {
      return res.status(403).json({ message: 'Account is banned. Contact administration.', status: 'banned' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

const requireApproved = (req, res, next) => {
  if (req.user?.role === 'student' && req.user.status !== 'approved') {
    return res.status(403).json({
      message:
        req.user.status === 'rejected'
          ? 'Your account was rejected by administration'
          : 'Your account is still pending admin approval',
      status: req.user.status,
    });
  }
  next();
};

module.exports = { protect, authorizeRoles, requireApproved };
