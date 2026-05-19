const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const UniversityVerification = require('../models/UniversityVerification');
const { generateToken } = require('../utils/jwt');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { validateEmail, validateUniversityId } = require('../services/authService');

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phoneNumber, password, universityId, college, academicYear } = req.body;
  if (!name || !email || !phoneNumber || !password || !universityId || !college || !academicYear) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ message: 'Invalid phone number format' });
  }

  const idCardFile = req.files?.idCardImage?.[0] || req.files?.universityIdImage?.[0];
  if (!idCardFile) {
    return res.status(400).json({ message: 'University ID image is required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  if (!validateUniversityId(universityId)) {
    return res.status(400).json({ message: 'University ID must be 8-15 alphanumeric characters' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const idCardUpload = await uploadToCloudinary(idCardFile, 'uniride/id-cards');

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
    universityIdStatus: 'pending',
    status: 'pending',
  });

  res.status(201).json({
    message: 'Registration submitted. Account waiting for admin approval.',
    user: user.toSafeObject(),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.status === 'pending') {
    return res.status(403).json({ message: 'Account waiting for admin approval', status: 'pending' });
  }

  if (user.status === 'rejected') {
    return res.status(403).json({ message: 'Account rejected by administration', status: 'rejected' });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: 'Account is banned. Contact administration.', status: 'banned' });
  }

  const token = generateToken(user._id);
  setAuthCookie(res, token);

  res.json({
    user: user.toSafeObject(),
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ user: user.toSafeObject() });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ message: 'Logged out successfully' });
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
  res.json({ user: user.toSafeObject() });
});

module.exports = { registerUser, loginUser, logoutUser, getProfile, updateProfile, submitUniversityId };
