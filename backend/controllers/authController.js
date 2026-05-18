const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const UniversityVerification = require('../models/UniversityVerification');
const { generateToken } = require('../utils/jwt');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { validateEmail, validateUniversityId } = require('../services/authService');

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, universityId } = req.body;
  if (!name || !email || !password || !universityId) {
    return res.status(400).json({ message: 'All fields are required' });
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

  const user = await User.create({ name, email, password, universityId });

  res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      universityId: user.universityId,
      universityIdStatus: user.universityIdStatus,
    },
    token: generateToken(user._id),
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

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      universityId: user.universityId,
      universityIdStatus: user.universityIdStatus,
      universityIdImage: user.universityIdImage,
    },
    token: generateToken(user._id),
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ user });
});

const submitUniversityId = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'University ID image is required' });
  }

  const uploadResult = await uploadToCloudinary(req.file.path, 'university_ids');

  user.universityIdImage = uploadResult.secure_url;
  user.universityIdStatus = 'pending';
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

module.exports = { registerUser, loginUser, getProfile, submitUniversityId };
