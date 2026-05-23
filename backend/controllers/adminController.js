const asyncHandler = require('express-async-handler');
const { prisma } = require('../prisma/client');
const userRepository = require('../repositories/userRepository');
const tripRepository = require('../repositories/tripRepository');
const bookingRepository = require('../repositories/bookingRepository');
const paymentRepository = require('../repositories/paymentRepository');
const { toSafeUser } = require('../utils/userMapper');
const { getSupabaseAdmin } = require('../config/supabase');

async function syncSupabaseMetadata(user) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !user.supabaseId) return;
  await supabase.auth.admin.updateUserById(user.supabaseId, {
    app_metadata: { role: user.role, status: user.status },
    user_metadata: {
      role: user.role,
      status: user.status,
      universityIdStatus: user.universityIdStatus,
    },
  }).catch(() => undefined);
}

const getUsers = asyncHandler(async (req, res) => {
  const { status, role } = req.query;
  const where = {};
  if (status) where.status = status === 'verified' ? 'approved' : status;
  if (role) where.role = role;
  const users = await userRepository.findMany(where);
  res.json({ users: users.map(toSafeUser) });
});

const getPendingUsers = asyncHandler(async (req, res) => {
  const users = await userRepository.findMany({ role: 'student', status: 'pending' });
  res.json({ users: users.map(toSafeUser) });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, reviewNotes, role } = req.body;
  const existing = await userRepository.findById(userId);
  if (!existing) return res.status(404).json({ message: 'User not found' });

  const updates = {};
  if (status) {
    const normalized = status === 'verified' ? 'approved' : status;
    if (!['pending', 'approved', 'rejected'].includes(normalized)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    updates.status = normalized;
    updates.universityIdStatus = normalized;
    updates.reviewedAt = new Date();
  }
  if (reviewNotes !== undefined) updates.reviewNotes = reviewNotes;
  if (role && ['student', 'admin', 'driver'].includes(role)) updates.role = role;

  const user = await userRepository.update(userId, updates);
  await syncSupabaseMetadata(user);
  res.json({ user: toSafeUser(user) });
});

const approveUser = asyncHandler(async (req, res) => {
  const user = await userRepository.update(req.params.id, {
    status: 'approved',
    universityIdStatus: 'approved',
    reviewedAt: new Date(),
    reviewNotes: null,
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  await syncSupabaseMetadata(user);
  res.json({ message: 'User approved successfully', user: toSafeUser(user) });
});

const rejectUser = asyncHandler(async (req, res) => {
  const user = await userRepository.update(req.params.id, {
    status: 'rejected',
    universityIdStatus: 'rejected',
    reviewedAt: new Date(),
    reviewNotes: req.body?.reviewNotes || 'Rejected by administration',
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  await syncSupabaseMetadata(user);
  res.json({ message: 'User rejected successfully', user: toSafeUser(user) });
});

const banUser = asyncHandler(async (req, res) => {
  const user = await userRepository.update(req.params.id, {
    isActive: false,
    reviewNotes: req.body?.reviewNotes || 'Banned by administration',
    reviewedAt: new Date(),
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User banned successfully', user: toSafeUser(user) });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await prisma.$transaction([
    prisma.booking.deleteMany({ where: { userId: user.id } }),
    prisma.payment.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  res.json({ message: 'User and related records deleted successfully' });
});

const createTrip = asyncHandler(async (req, res) => {
  const { title, pickupPoint, destination, busNumber, capacity, departureTime, driverId, routeId, busId } = req.body;
  if (!title || !pickupPoint || !destination || !busNumber || !capacity || !departureTime) {
    return res.status(400).json({ message: 'Trip title, route, bus, capacity, and departure time are required' });
  }
  const trip = await tripRepository.create({
    title,
    pickupPoint,
    destination,
    busNumber,
    capacity: Number(capacity),
    departureTime: new Date(departureTime),
    driverId: driverId || null,
    routeId: routeId || null,
    busId: busId || null,
  });
  res.status(201).json({ trip });
});

const getTrips = asyncHandler(async (req, res) => {
  const { active, page = 1, limit = 50, driverId } = req.query;
  const where = {};
  if (active !== 'false') where.isActive = true;
  if (driverId) where.driverId = driverId;
  const take = Math.min(Number(limit), 100);
  const skip = (Math.max(Number(page), 1) - 1) * take;
  const [trips, total] = await Promise.all([
    tripRepository.findMany(where, { skip, take }),
    tripRepository.count(where),
  ]);
  res.json({ trips, total, page: Number(page), limit: take });
});

const updateTrip = asyncHandler(async (req, res) => {
  const trip = await tripRepository.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  const fields = ['title', 'pickupPoint', 'destination', 'busNumber', 'capacity', 'departureTime', 'driverId', 'isActive', 'routeId', 'busId'];
  const data = {};
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      data[field] = field === 'departureTime' ? new Date(req.body[field]) : req.body[field];
    }
  });
  const updated = await tripRepository.update(req.params.id, data);
  res.json({ trip: updated });
});

const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await tripRepository.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  const activeBookings = await bookingRepository.count({
    tripId: trip.id,
    status: { in: ['confirmed', 'waiting'] },
  });
  if (activeBookings > 0) {
    const deactivated = await tripRepository.update(trip.id, { isActive: false });
    return res.json({ message: 'Trip deactivated (has active bookings)', trip: deactivated });
  }
  await tripRepository.remove(trip.id);
  res.json({ message: 'Trip deleted successfully' });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    bookingsCount,
    pendingUsers,
    noShowAggregate,
    tripsCount,
    confirmedBookings,
    waitingBookings,
    revenueData,
  ] = await Promise.all([
    bookingRepository.count(),
    userRepository.count({ status: 'pending' }),
    prisma.user.aggregate({ _sum: { noShowCount: true } }),
    tripRepository.count({ isActive: true }),
    bookingRepository.count({ status: 'confirmed' }),
    bookingRepository.count({ status: 'waiting' }),
    paymentRepository.aggregateRevenue(startOfMonth),
  ]);

  res.json({
    bookingsCount,
    pendingUsers,
    noShowStats: noShowAggregate._sum.noShowCount || 0,
    tripsCount,
    confirmedBookings,
    waitingBookings,
    monthlyRevenue: revenueData.revenue,
    monthlyExpenses: revenueData.refunds,
    profit: revenueData.revenue - revenueData.refunds,
    completedPayments: revenueData.count,
  });
});

const getBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingRepository.findMany();
  res.json({ bookings });
});

const getRoutes = asyncHandler(async (req, res) => {
  const routes = await prisma.route.findMany({
    include: { schedules: true, _count: { select: { trips: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ routes });
});

const upsertRoute = asyncHandler(async (req, res) => {
  const { id, name, pickupPoint, destination, distanceKm, baseFare, isActive } = req.body;
  if (!name || !pickupPoint || !destination) {
    return res.status(400).json({ message: 'Route name and endpoints are required' });
  }
  const data = {
    name,
    pickupPoint,
    destination,
    distanceKm: distanceKm ? Number(distanceKm) : null,
    baseFare: baseFare ? Number(baseFare) : 0,
    isActive: isActive !== false,
  };
  const route = id
    ? await prisma.route.update({ where: { id }, data })
    : await prisma.route.create({ data });
  res.json({ route });
});

const getBuses = asyncHandler(async (req, res) => {
  const buses = await prisma.bus.findMany({
    include: { driver: { select: { id: true, name: true, email: true } } },
    orderBy: { busNumber: 'asc' },
  });
  res.json({ buses });
});

const upsertBus = asyncHandler(async (req, res) => {
  const { id, busNumber, capacity, make, model, licensePlate, driverId, status, amenities } = req.body;
  if (!busNumber || !capacity) {
    return res.status(400).json({ message: 'Bus number and capacity are required' });
  }
  const data = {
    busNumber,
    capacity: Number(capacity),
    make,
    model,
    licensePlate,
    driverId: driverId || null,
    status: status || 'active',
    amenities: Array.isArray(amenities) ? amenities : [],
  };
  const bus = id
    ? await prisma.bus.update({ where: { id }, data })
    : await prisma.bus.create({ data });
  res.json({ bus });
});

const getPayments = asyncHandler(async (req, res) => {
  const payments = await paymentRepository.findAll();
  res.json({ payments });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  const payment = await paymentRepository.findById(req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found' });

  const nextStatus = status === 'approved' ? 'completed' : status === 'rejected' ? 'failed' : status;
  if (!['completed', 'failed', 'under_review'].includes(nextStatus)) {
    return res.status(400).json({ message: 'Invalid payment status' });
  }

  const updated = await paymentRepository.update(payment.id, {
    status: nextStatus,
    verifiedAt: new Date(),
    verifiedBy: req.user.id,
    metadata: { ...(payment.metadata || {}), adminNote },
  });
  res.json({ payment: updated });
});

const getComplaints = asyncHandler(async (req, res) => {
  const complaints = await prisma.complaint.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ complaints });
});

const updateComplaint = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  const complaint = await prisma.complaint.update({
    where: { id: req.params.id },
    data: { status, adminNote },
  });
  res.json({ complaint });
});

const getMonthlyReport = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const months = [];
  for (let month = 0; month < 12; month += 1) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    const data = await paymentRepository.aggregateRevenue(start);
    const bookings = await bookingRepository.count({
      createdAt: { gte: start, lte: end },
    });
    months.push({
      month: month + 1,
      revenue: data.revenue,
      refunds: data.refunds,
      profit: data.revenue - data.refunds,
      bookings,
      payments: data.count,
    });
  }
  res.json({ year, months });
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
  getRoutes,
  upsertRoute,
  getBuses,
  upsertBus,
  getPayments,
  verifyPayment,
  getComplaints,
  updateComplaint,
  getMonthlyReport,
};
