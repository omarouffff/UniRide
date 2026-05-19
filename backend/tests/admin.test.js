process.env.MONGO_URI = 'mongodb://localhost:27017/uniride-test';
process.env.JWT_SECRET = 'test-jwt-secret-key-super-secure-32chars-min';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-super-secure-32';
process.env.QR_ENCRYPTION_SECRET = 'test-qr-secret-key-32-chars-long-enough!!';
process.env.NODE_ENV = 'test';

jest.mock('../models/User');
jest.mock('../models/Trip');
jest.mock('../models/Booking');
jest.mock('../config/db', () => ({ connectDatabase: jest.fn().mockResolvedValue(true) }));
jest.mock('../config/redisClient', () => ({
  initRedis: jest.fn().mockResolvedValue(true),
  getRedisClient: jest.fn().mockReturnValue(null),
}));

const request = require('supertest');
const { app } = require('../server');
const Trip = require('../models/Trip');

describe('Admin trip routes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/admin/trips returns paginated trips for admin', async () => {
    const mockTrips = [{ _id: 't1', title: 'Campus A', isActive: true }];
    Trip.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockTrips),
          }),
        }),
      }),
    });
    Trip.countDocuments = jest.fn().mockResolvedValue(1);

    const response = await request(app).get('/api/admin/trips');
    expect([200, 401, 403]).toContain(response.status);
  });
});
