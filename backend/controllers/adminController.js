const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

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
    .select('-passwordHash')
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

const banUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isActive = false;
  user.reviewNotes = req.body?.reviewNotes || 'Banned by administration';
  user.reviewedAt = new Date();
  await user.save();

  res.json({ message: 'User banned successfully', user: user.toSafeObject() });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  await Promise.all([
    Booking.deleteMany({ user: user._id }),
    Payment.deleteMany({ user: user._id }),
    User.deleteOne({ _id: user._id }),
  ]);

  res.json({ message: 'User and related records deleted successfully' });
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
  const { active, page = 1, limit = 50, driver } = req.query;
  const filter = {};
  if (active !== 'false') filter.isActive = true;
  if (driver) filter.driver = driver;

  const skip = (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100);
  const [trips, total] = await Promise.all([
    Trip.find(filter).populate('driver', 'name email').sort({ departureTime: 1 }).skip(skip).limit(Math.min(Number(limit), 100)),
    Trip.countDocuments(filter),
  ]);

  res.json({ trips, total, page: Number(page), limit: Number(limit) });
});

const updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    return res.status(404).json({ message: 'Trip not found' });
  }

  const fields = ['title', 'pickupPoint', 'destination', 'busNumber', 'capacity', 'departureTime', 'driver', 'isActive'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) trip[field] = req.body[field];
  });

  await trip.save();
  res.json({ trip });
});

const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    return res.status(404).json({ message: 'Trip not found' });
  }

  const activeBookings = await Booking.countDocuments({
    trip: trip._id,
    status: { $in: ['confirmed', 'waiting'] },
  });

  if (activeBookings > 0) {
    trip.isActive = false;
    await trip.save();
    return res.json({ message: 'Trip deactivated (has active bookings)', trip });
  }

  await Trip.deleteOne({ _id: trip._id });
  res.json({ message: 'Trip deleted successfully' });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [bookingsCount, pendingUsers, noShowStats, tripsCount, confirmedBookings, waitingBookings, revenue, expenses] = await Promise.all([
    Booking.countDocuments(),
    User.countDocuments({ status: 'pending' }),
    User.aggregate([{ $group: { _id: null, total: { $sum: '$noShowCount' } } }]),
    Trip.countDocuments({ isActive: true }),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'waiting' }),
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'refunded', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const monthlyRevenue = revenue[0]?.total || 0;
  const monthlyExpenses = expenses[0]?.total || 0;

  res.json({
    bookingsCount,
    pendingUsers,
    noShowStats: noShowStats[0]?.total || 0,
    tripsCount,
    confirmedBookings,
    waitingBookings,
    monthlyRevenue,
    monthlyExpenses,
    profit: monthlyRevenue - monthlyExpenses,
    completedPayments: revenue[0]?.count || 0,
  });
});

const getBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate('user', 'name email universityId')
    .populate('trip', 'title busNumber pickupPoint destination')
    .sort({ createdAt: -1 });
  res.json({ bookings });
});

module.exports = {
  getUsers,
  getPendingUsers,
  updateUserStatus,
  approveUser,
  rejectUser,
  banUser,
  deleteUser,
  createTrip,
  getTrips,
  updateTrip,
  deleteTrip,
  getAnalytics,
  getBookings,
};
