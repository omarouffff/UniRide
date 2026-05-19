// Set dummy env variables before loading modules to pass validation checks
process.env.MONGO_URI = 'mongodb://localhost:27017/uniride-test';
process.env.JWT_SECRET = 'test-jwt-secret-key-super-secure-32chars-min';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-super-secure-32';
process.env.QR_ENCRYPTION_SECRET = 'test-qr-secret-key-32-chars-long-enough!!';
process.env.PAYMOB_API_KEY = 'test-paymob-api-key';
process.env.PAYMOB_HMAC_SECRET = 'test-paymob-hmac-secret';
process.env.PAYMOB_INTEGRATION_ID = '12345';
process.env.PAYMOB_IFRAME_ID = '67890';
process.env.NODE_ENV = 'test';

// Mock Mongoose model methods and services to prevent database and external operations
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
const cloudinaryService = require('../services/cloudinaryService');
cloudinaryService.uploadToCloudinary = jest.fn().mockResolvedValue({ secure_url: 'http://example.com/mock-id.jpg' });

const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');

describe('Auth Endpoint Testing Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cloudinaryService.uploadToCloudinary.mockResolvedValue({ secure_url: 'http://example.com/mock-id.jpg' });
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new university student account', async () => {
      const mockStudent = {
        _id: 'user123',
        name: 'Jane Doe',
        email: 'jane.doe@university.edu.eg',
        role: 'student',
        status: 'pending',
        universityId: '20260012',
        toSafeObject: () => ({
          id: 'user123',
          name: 'Jane Doe',
          email: 'jane.doe@university.edu.eg',
          role: 'student',
          status: 'pending'
        })
      };

      // Mock user not existing and successful save
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockStudent);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane.doe@university.edu.eg',
          password: 'Password123!',
          universityId: '20260012',
          college: 'Computer Science',
          academicYear: 'Third Year',
          phoneNumber: '01012345678'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.name).toBe('Jane Doe');
      expect(User.findOne).toHaveBeenCalled();
      expect(User.create).toHaveBeenCalled();
    });

    it('should fail registration if email is already taken', async () => {
      User.findOne.mockResolvedValue({ _id: 'existingUser' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane.doe@university.edu.eg',
          password: 'Password123!',
          universityId: '20260012',
          college: 'Computer Science',
          academicYear: 'Third Year',
          phoneNumber: '01012345678'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully authenticate user with correct credentials', async () => {
      const mockUserInstance = {
        _id: 'user123',
        name: 'Jane Doe',
        email: 'jane.doe@university.edu.eg',
        role: 'student',
        isActive: true,
        loginAttempts: 0,
        emailVerified: true,
        status: 'approved',
        sessions: [],
        comparePassword: jest.fn().mockResolvedValue(true),
        isLocked: jest.fn().mockReturnValue(false),
        resetLoginAttempts: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toSafeObject: () => ({
          id: 'user123',
          name: 'Jane Doe',
          email: 'jane.doe@university.edu.eg',
          role: 'student'
        })
      };

      User.findOne.mockResolvedValue(mockUserInstance);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane.doe@university.edu.eg',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(mockUserInstance.comparePassword).toHaveBeenCalled();
    });

    it('should enforce account lockouts after multiple failed attempts', async () => {
      const mockUserInstance = {
        _id: 'user123',
        email: 'jane.doe@university.edu.eg',
        isActive: true,
        loginAttempts: 5,
        emailVerified: true,
        status: 'approved',
        lockUntil: new Date(Date.now() + 30 * 60 * 1000), // Locked
        comparePassword: jest.fn(),
        isLocked: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUserInstance);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane.doe@university.edu.eg',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(423); // Locked
      expect(response.body.message).toContain('locked');
    });
  });
});
