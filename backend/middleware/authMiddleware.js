const asyncHandler = require('express-async-handler');
const { getSupabaseAdmin } = require('../config/supabase');
const userRepository = require('../repositories/userRepository');
const { toSafeUser } = require('../utils/userMapper');

async function resolveUserFromToken(token) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Supabase is not configured on the server');
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }

  const authUser = data.user;
  let dbUser = await userRepository.findBySupabaseId(authUser.id);

  if (!dbUser && authUser.email) {
    dbUser = await userRepository.findByEmail(authUser.email);
    if (dbUser && !dbUser.supabaseId) {
      dbUser = await userRepository.update(dbUser.id, { supabaseId: authUser.id });
    }
  }

  if (!dbUser) {
    const metadata = authUser.user_metadata || {};
    const appMeta = authUser.app_metadata || {};
    dbUser = await userRepository.create({
      supabaseId: authUser.id,
      email: authUser.email.toLowerCase(),
      name: metadata.name || authUser.email.split('@')[0],
      phoneNumber: metadata.phoneNumber || null,
      college: metadata.college || null,
      academicYear: metadata.academicYear || null,
      universityId: metadata.universityId || null,
      profileImage: metadata.profileImage || null,
      idCardImage: metadata.idCardImage || null,
      universityIdImage: metadata.universityIdImage || metadata.idCardImage || null,
      role: appMeta.role || metadata.role || 'student',
      status: appMeta.status || metadata.status || 'pending',
      universityIdStatus: metadata.universityIdStatus || 'pending',
      emailVerified: Boolean(authUser.email_confirmed_at),
    });
  }

  return dbUser;
}

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const user = await resolveUserFromToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is banned. Contact administration.', status: 'banned' });
    }
    req.user = toSafeUser(user);
    req.authToken = token;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
});

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
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

module.exports = { protect, authorizeRoles, requireApproved, resolveUserFromToken };
