process.env.MONGO_URI = 'mongodb://localhost:27017/uniride-test';
process.env.JWT_SECRET = 'test-jwt-secret-key-super-secure';
process.env.QR_ENCRYPTION_SECRET = 'test-qr-secret-key-32-chars-long';
process.env.PAYMOB_API_KEY = 'test-paymob-api-key';
process.env.PAYMOB_HMAC_SECRET = 'test-paymob-hmac-secret';
process.env.PAYMOB_INTEGRATION_ID = '12345';
process.env.PAYMOB_IFRAME_ID = '67890';
process.env.NODE_ENV = 'test';

// Mock models and services first to avoid CommonJS require issues
jest.mock('../models/Booking', () => {
  const mockBookingConstructor = function(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    this.toJSON = function() {
      const copy = { ...this };
      delete copy.save;
      delete copy.toJSON;
      return copy;
    };
  };
  mockBookingConstructor.findOne = jest.fn();
  mockBookingConstructor.find = jest.fn();
  mockBookingConstructor.countDocuments = jest.fn();
  mockBookingConstructor.updateMany = jest.fn();
  mockBookingConstructor.create = jest.fn();
  return mockBookingConstructor;
});
jest.mock('../models/Trip');
jest.mock('../models/User');
jest.mock('../config/db', () => ({
  connectDatabase: jest.fn().mockResolvedValue(true)
}));
jest.mock('../config/redisClient', () => ({
  initRedis: jest.fn().mockResolvedValue(true),
  getRedisClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  })
}));
const tokenService = require('../services/tokenService');
tokenService.verifyAccessToken = jest.fn().mockReturnValue({
  id: 'user123',
  role: 'student',
  sid: 'session123'
});

const request = require('supertest');
const { app } = require('../server');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const User = require('../models/User');

describe('Booking Operations & Concurrency Testing Suite', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    tokenService.verifyAccessToken.mockReturnValue({
      id: 'user123',
      role: 'student',
      sid: 'session123'
    });
    
    mockUser = {
      _id: 'user123',
      name: 'Jane Doe',
      status: 'approved',
      role: 'student',
      isActive: true,
      getSession: () => ({ id: 'session123' }),
      save: jest.fn().mockResolvedValue(true)
    };
    
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });
  });

  describe('POST /api/bookings', () => {
    it('should atomically reserve a seat on the trip when capacity exists', async () => {
      const mockTrip = {
        _id: 'trip123',
        title: 'Morning Gate Shuttle',
        pickupPoint: 'Main Gate',
        destination: 'Campus Center',
        capacity: 40,
        confirmedCount: 5,
        departureTime: new Date().toISOString(),
        save: jest.fn().mockResolvedValue(true)
      };

      const mockCreatedBooking = {
        _id: 'booking999',
        user: 'user123',
        trip: 'trip123',
        pickupPoint: 'Main Gate',
        destination: 'Campus Center',
        travelDate: new Date(),
        status: 'confirmed',
        seat: 'S-6'
      };

      // Mock optimistic locking success: findOneAndUpdate locks seat and increments confirmedCount
      Trip.findOneAndUpdate.mockResolvedValue({
        ...mockTrip,
        confirmedCount: 6
      });
      Trip.findById.mockResolvedValue(mockTrip);
      Booking.create.mockResolvedValue(mockCreatedBooking);

      const response = await request(app)
        .post('/api/bookings')
        .set('Cookie', ['token=mock-valid-token'])
        .send({
          tripId: 'trip123',
          pickupPoint: 'Main Gate',
          destination: 'Campus Center',
          travelDate: new Date().toISOString(),
          route: 'Main Gate -> Campus'
        });

      expect(response.status).toBe(201);
      expect(response.body.booking).toHaveProperty('status', 'confirmed');
      expect(response.body.booking.seat).toBe('S-6');
      expect(Trip.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should dynamically demote student to waiting list when trip capacity is full', async () => {
      const mockTrip = {
        _id: 'trip123',
        title: 'Morning Gate Shuttle',
        capacity: 40,
        confirmedCount: 40, // Full!
        departureTime: new Date().toISOString()
      };

      const mockCreatedWaitingBooking = {
        _id: 'booking888',
        user: 'user123',
        trip: 'trip123',
        status: 'waiting',
        waitingPosition: 3
      };

      // Mock optimistic locking returns null because capacity matches confirmedCount (40 < 40 is false)
      Trip.findOneAndUpdate.mockResolvedValue(null);
      Trip.findById.mockResolvedValue(mockTrip);
      
      // Mock waitlist position counts
      Booking.countDocuments.mockResolvedValue(2); // Position 3 (2 + 1)
      Booking.create.mockResolvedValue(mockCreatedWaitingBooking);

      const response = await request(app)
        .post('/api/bookings')
        .set('Cookie', ['token=mock-valid-token'])
        .send({
          tripId: 'trip123',
          pickupPoint: 'Main Gate',
          destination: 'Campus Center',
          travelDate: new Date().toISOString()
        });

      expect(response.status).toBe(201);
      expect(response.body.booking.status).toBe('waiting');
      expect(response.body.booking.waitingPosition).toBe(3);
    });
  });
});
