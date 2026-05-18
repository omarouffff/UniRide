const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');

const getUsers = asyncHandler(async (req, res) => {
  const { status, role } = req.query;
  const filter = {};

  if (status) {
    filter.status = status === 'verified' ? 'approved' : status;
  }

  if (role) {
    filter.role = role;
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({ users: users.map((user) => user.toSafeObject()) });
});

const getPendingUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'student', status: 'pending' })
    .select('-passwordHash')
    .sort({ createdAt: -1 });

  res.json({ users: users.map((user) => user.toSafeObject()) });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, reviewNotes, role } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (status) {
    const normalizedStatus = status === 'verified' ? 'approved' : status;
    if (!['pending', 'approved', 'rejected'].includes(normalizedStatus)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    user.status = normalizedStatus;
    user.universityIdStatus = normalizedStatus;
    user.reviewedAt = new Date();
  }

  if (reviewNotes !== undefined) {
    user.reviewNotes = reviewNotes;
  }

  if (role && ['student', 'admin', 'driver'].includes(role)) {
    user.role = role;
  }

  await user.save();

  res.json({ user: user.toSafeObject() });
});

const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.status = 'approved';
  user.universityIdStatus = 'approved';
  user.reviewedAt = new Date();
  user.reviewNotes = undefined;
  await user.save();

  res.json({ message: 'User approved successfully', user: user.toSafeObject() });
});

const rejectUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.status = 'rejected';
  user.universityIdStatus = 'rejected';
  user.reviewedAt = new Date();
  user.reviewNotes = req.body?.reviewNotes || 'Rejected by administration';
  await user.save();

  res.json({ message: 'User rejected successfully', user: user.toSafeObject() });
});

const createTrip = asyncHandler(async (req, res) => {
  const { title, pickupPoint, destination, busNumber, capacity, departureTime, driver } = req.body;
  if (!title || !pickupPoint || !destination || !busNumber || !capacity || !departureTime) {
    return res.status(400).json({ message: 'Trip title, route, bus, capacity, and departure time are required' });
  }

  const trip = await Trip.create({
    title,
    pickupPoint,
    destination,
    busNumber,
    capacity,
    departureTime,
    driver: driver || undefined,
  });

  res.status(201).json({ trip });
});

const getTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ isActive: true }).populate('driver', 'name email').sort({ departureTime: 1 });
  res.json({ trips });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const [bookingsCount, pendingUsers, noShowStats, tripsCount, confirmedBookings, waitingBookings] = await Promise.all([
    Booking.countDocuments(),
    User.countDocuments({ status: 'pending' }),
    User.aggregate([{ $group: { _id: null, total: { $sum: '$noShowCount' } } }]),
    Trip.countDocuments({ isActive: true }),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'waiting' }),
  ]);

  res.json({
    bookingsCount,
    pendingUsers,
    noShowStats: noShowStats[0]?.total || 0,
    tripsCount,
    confirmedBookings,
    waitingBookings,
  });
});

module.exports = { getUsers, getPendingUsers, updateUserStatus, approveUser, rejectUser, createTrip, getTrips, getAnalytics };
