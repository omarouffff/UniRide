const asyncHandler = require('express-async-handler');
const { getSupabaseAdmin, getSupabaseAnon } = require('../config/supabase');
const userRepository = require('../repositories/userRepository');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { toSafeUser } = require('../utils/userMapper');
const { resolveUserFromToken } = require('../middleware/authMiddleware');
const { prisma } = require('../prisma/client');
const { auditEvent } = require('../utils/logger');

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const supabase = getSupabaseAnon();
  if (!supabase) {
    return res.status(503).json({ message: 'Supabase auth is not configured on the server' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });

  if (error || !data.session) {
    return res.status(401).json({ message: error?.message || 'Invalid credentials' });
  }

  const user = await resolveUserFromToken(data.session.access_token);
  auditEvent('auth.login', { userId: user?.id });

  res.json({
    user: toSafeUser(user),
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phoneNumber, college, academicYear, universityId } = req.body;
  const supabase = getSupabaseAnon();
  if (!supabase) {
    return res.status(503).json({ message: 'Supabase auth is not configured on the server' });
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase(),
    password,
    options: {
      data: {
        role: 'student',
        status: 'pending',
        name,
        phoneNumber,
        college,
        academicYear,
        universityId,
        universityIdStatus: 'pending',
      },
    },
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  let user = null;
  if (data.session?.access_token) {
    user = await resolveUserFromToken(data.session.access_token);
  } else if (data.user) {
    user = await userRepository.findByEmail(email);
  }

  auditEvent('auth.register', { email });

  res.status(201).json({
    message: 'Registration successful. Await admin approval before booking.',
    user: user ? toSafeUser(user) : null,
    session: data.session
      ? {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        }
      : null,
  });
});

const syncUser = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bearer token required' });
  }

  const token = authHeader.split(' ')[1];
  const user = await resolveUserFromToken(token);
  if (!user) {
    return res.status(401).json({ message: 'Unable to sync user' });
  }

  const { name, phoneNumber, college, academicYear, universityId, role, status } = req.body || {};
  const updates = {};
  if (name) updates.name = name;
  if (phoneNumber) updates.phoneNumber = phoneNumber;
  if (college) updates.college = college;
  if (academicYear) updates.academicYear = academicYear;
  if (universityId) updates.universityId = universityId;
  if (role && ['student', 'admin', 'driver'].includes(role)) updates.role = role;
  if (status && ['pending', 'approved', 'rejected'].includes(status)) updates.status = status;

  const synced = Object.keys(updates).length
    ? await userRepository.update(user.id, updates)
    : user;

  auditEvent('auth.sync', { userId: synced.id });
  res.json({ user: toSafeUser(synced) });
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phoneNumber, college, academicYear } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
  if (college !== undefined) updates.college = college;
  if (academicYear !== undefined) updates.academicYear = academicYear;

  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file, 'uniride/profiles');
    updates.profileImage = uploadResult.secure_url;
  }

  const user = await userRepository.update(req.user.id, updates);

  const supabase = getSupabaseAdmin();
  if (supabase && req.authToken) {
    await supabase.auth.admin.updateUserById(req.user.supabaseId || req.user.id, {
      user_metadata: {
        name: user.name,
        phoneNumber: user.phoneNumber,
        college: user.college,
        academicYear: user.academicYear,
        profileImage: user.profileImage,
      },
    }).catch(() => undefined);
  }

  res.json({ user: toSafeUser(user) });
});

const submitUniversityId = asyncHandler(async (req, res) => {
  const idCardFile = req.file;
  if (!idCardFile) {
    return res.status(400).json({ message: 'University ID image is required' });
  }

  const uploadResult = await uploadToCloudinary(idCardFile, 'uniride/id-cards');
  const [user] = await Promise.all([
    userRepository.update(req.user.id, {
      universityIdImage: uploadResult.secure_url,
      idCardImage: uploadResult.secure_url,
      universityIdStatus: 'pending',
      status: 'pending',
    }),
    prisma.universityVerification.create({
      data: {
        userId: req.user.id,
        studentNumber: req.body.universityId || req.user.universityId || 'N/A',
        universityIdImage: uploadResult.secure_url,
        status: 'pending',
      },
    }),
  ]);

  res.json({ user: toSafeUser(user), message: 'University ID submitted for review' });
});

module.exports = {
  loginUser,
  registerUser,
  syncUser,
  getProfile,
  updateProfile,
  submitUniversityId,
};
