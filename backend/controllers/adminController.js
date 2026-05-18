const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const getUsers = asyncHandler(async (req, res) => {
  const { status, role } = req.query;
  const filter = {};

  if (status) {
    filter.universityIdStatus = status;
  }

  if (role) {
    filter.role = role;
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({ users });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, reviewNotes, role } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (status) {
    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    user.universityIdStatus = status;
    if (status === 'verified') {
      user.universityIdVerifiedAt = new Date();
    }
  }

  if (reviewNotes !== undefined) {
    user.universityIdReviewNotes = reviewNotes;
  }

  if (role && ['student', 'admin', 'driver'].includes(role)) {
    user.role = role;
  }

  await user.save();

  const sanitizedUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    universityId: user.universityId,
    universityIdStatus: user.universityIdStatus,
    universityIdImage: user.universityIdImage,
    universityIdVerifiedAt: user.universityIdVerifiedAt,
    universityIdReviewNotes: user.universityIdReviewNotes,
    noShowCount: user.noShowCount,
    waitingListPosition: user.waitingListPosition,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };

  res.json({ user: sanitizedUser });
});

module.exports = { getUsers, updateUserStatus };
