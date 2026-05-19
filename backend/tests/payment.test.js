process.env.MONGO_URI = 'mongodb://localhost:27017/uniride-test';
process.env.JWT_SECRET = 'test-jwt-secret-key-super-secure-32chars-min';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-super-secure-32';
process.env.QR_ENCRYPTION_SECRET = 'test-qr-secret-key-32-chars-long-enough!!';
process.env.JWT_SECRET = 'test-jwt-secret-key-super-secure';
process.env.QR_ENCRYPTION_SECRET = 'test-qr-secret-key-32-chars-long';
process.env.PAYMOB_API_KEY = 'test-paymob-api-key';
process.env.PAYMOB_HMAC_SECRET = 'test-paymob-hmac-secret';
process.env.PAYMOB_INTEGRATION_ID = '12345';
process.env.PAYMOB_IFRAME_ID = '67890';
process.env.PAYMOB_AUTH_ENDPOINT = 'https://accept.paymobsolutions.com/api/auth/tokens';
process.env.NODE_ENV = 'test';

// Mock Mongoose models and third-party services
jest.mock('../models/Payment');
jest.mock('../models/Booking');
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
jest.mock('../services/cloudinaryService', () => ({
  uploadToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'http://example.com/mock-proof.jpg' })
}));
jest.mock('axios');

const tokenService = require('../services/tokenService');
tokenService.verifyAccessToken = jest.fn().mockReturnValue({
  id: 'user123',
  role: 'student',
  sid: 'session123'
});

const crypto = require('crypto');
const request = require('supertest');
const { app } = require('../server');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const axios = require('axios');

describe('Payment & Paymob Webhook Verification Testing Suite', () => {
  let mockUser;
  let mockAdmin;

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
      role: 'student',
      status: 'approved',
      isActive: true,
      getSession: () => ({ id: 'session123' }),
      save: jest.fn().mockResolvedValue(true)
    };

    mockAdmin = {
      _id: 'admin456',
      name: 'Admin User',
      role: 'admin',
      status: 'approved',
      isActive: true,
      getSession: () => ({ id: 'session456' }),
      save: jest.fn().mockResolvedValue(true)
    };

    // Default mock behavior for User.findById to authenticate the student user
    User.findById.mockImplementation((id) => {
      const u = id === 'admin456' ? mockAdmin : mockUser;
      return {
        select: jest.fn().mockResolvedValue(u)
      };
    });
  });

  describe('POST /api/payments (Create Cash/Proof Payment)', () => {
    it('should successfully submit a pending cash payment with uploaded proof image', async () => {
      const mockBooking = {
        _id: 'booking123',
        user: 'user123',
        amount: 50,
        status: 'pending'
      };

      const mockCreatedPayment = {
        _id: 'payment777',
        user: 'user123',
        booking: 'booking123',
        amount: 50,
        method: 'cash',
        status: 'pending',
        proofImage: 'http://example.com/mock-proof.jpg',
        reference: 'UR-12345'
      };

      Booking.findOne.mockResolvedValue(mockBooking);
      Payment.create.mockResolvedValue(mockCreatedPayment);

      const response = await request(app)
        .post('/api/payments')
        .set('Cookie', ['token=mock-valid-token'])
        .send({
          bookingId: 'booking123',
          amount: 50,
          method: 'cash',
          description: 'Payment for shuttle'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment.status).toBe('pending');
      expect(Payment.create).toHaveBeenCalled();
    });

    it('should fail if payment amount is invalid or missing', async () => {
      const response = await request(app)
        .post('/api/payments')
        .set('Cookie', ['token=mock-valid-token'])
        .send({
          bookingId: 'booking123',
          amount: -10,
          method: 'cash'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('amount is required');
    });
  });

  describe('POST /api/payments/paymob/initialize', () => {
    it('should authenticate student and return Paymob checkout iframe information', async () => {
      const mockBooking = {
        _id: 'booking123',
        user: 'user123',
        status: 'pending'
      };

      Booking.findOne.mockResolvedValue(mockBooking);

      // Mock the nested Paymob API post requests inside paymentService
      axios.post
        .mockResolvedValueOnce({ data: { token: 'mock-paymob-auth-token' } }) // 1. Auth Key
        .mockResolvedValueOnce({ data: { id: 987654 } }) // 2. E-commerce Order ID
        .mockResolvedValueOnce({ data: { token: 'mock-payment-key-12345' } }); // 3. Payment Key

      Payment.create.mockResolvedValue({ _id: 'pay777' });

      const response = await request(app)
        .post('/api/payments/paymob/initialize')
        .set('Cookie', ['token=mock-valid-token'])
        .send({
          bookingId: 'booking123',
          amount: 150
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('paymentKey', 'mock-payment-key-12345');
      expect(response.body).toHaveProperty('orderId', 987654);
      expect(response.body.iframeUrl).toContain('mock-payment-key-12345');
      expect(Payment.create).toHaveBeenCalled();
    });
  });

  describe('POST /api/payments/webhook (Paymob Webhook Verification)', () => {
    it('should verify signature successfully and update booking to confirmed on success status', async () => {
      const mockPayment = {
        _id: 'pay777',
        booking: 'booking123',
        amount: 150,
        reference: '987654',
        method: 'paymob',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockBooking = {
        _id: 'booking123',
        user: 'user123',
        trip: 'trip123',
        seat: 'S-4',
        status: 'confirmed',
        save: jest.fn().mockResolvedValue(true)
      };

      Payment.findOne.mockResolvedValue(mockPayment);
      Booking.findByIdAndUpdate.mockResolvedValue(mockBooking);

      const webhookObj = {
        amount_cents: 15000,
        created_at: '2026-05-19T23:00:00.000Z',
        currency: 'EGP',
        error_occured: false,
        has_parent_transaction: false,
        id: 111222,
        integration_id: 12345,
        is_3d_secure: true,
        is_auth: false,
        is_capture: true,
        is_refunded: false,
        is_standalone_payment: true,
        is_voided: false,
        order: { id: 987654 },
        owner: 222333,
        pending: false,
        source_data: {
          pan: '123456xxxxxx7890',
          sub_type: 'card',
          type: 'credit'
        },
        success: true
      };

      // Construct fields for HMAC generation
      const orderId = webhookObj.order.id;
      const pan = webhookObj.source_data.pan;
      const subType = webhookObj.source_data.sub_type;
      const type = webhookObj.source_data.type;

      const fields = [
        webhookObj.amount_cents,
        webhookObj.created_at,
        webhookObj.currency,
        webhookObj.error_occured,
        webhookObj.has_parent_transaction,
        webhookObj.id,
        webhookObj.integration_id,
        webhookObj.is_3d_secure,
        webhookObj.is_auth,
        webhookObj.is_capture,
        webhookObj.is_refunded,
        webhookObj.is_standalone_payment,
        webhookObj.is_voided,
        orderId,
        webhookObj.owner,
        webhookObj.pending,
        pan,
        subType,
        type,
        webhookObj.success
      ];

      const concatenatedString = fields.map(v => (v === undefined || v === null ? '' : String(v))).join('');
      const calculatedHmac = crypto
        .createHmac('sha512', 'test-paymob-hmac-secret')
        .update(concatenatedString)
        .digest('hex');

      const response = await request(app)
        .post(`/api/payments/webhook?hmac=${calculatedHmac}`)
        .send({
          obj: webhookObj
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'verified', success: true });
      expect(Payment.findOne).toHaveBeenCalled();
      expect(Booking.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should reject requests with invalid/forged webhook signature', async () => {
      const response = await request(app)
        .post('/api/payments/webhook?hmac=forged_hmac_signature')
        .send({
          obj: {
            amount_cents: 15000,
            success: true
          }
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid signature');
    });
  });

  describe('PATCH /api/payments/:id/verify (Admin Cash Verification)', () => {
    it('should authorize admin to verify cash payment successfully', async () => {
      // Authenticate as Admin
      tokenService.verifyAccessToken.mockReturnValue({
        id: 'admin456',
        role: 'admin',
        sid: 'session456'
      });

      const mockPayment = {
        _id: 'payment555',
        user: 'user123',
        booking: 'booking123',
        amount: 80,
        method: 'cash',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockBooking = {
        _id: 'booking123',
        user: 'user123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      Payment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment)
      });
      Booking.findById.mockResolvedValue(mockBooking);

      const response = await request(app)
        .patch('/api/payments/payment555/verify')
        .set('Cookie', ['token=mock-valid-token'])
        .send({
          status: 'completed'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('verified as completed');
      expect(mockPayment.status).toBe('completed');
      expect(mockBooking.status).toBe('confirmed');
    });

    it('should reject verification request if user is not an admin', async () => {
      // Authenticate as a normal student
      tokenService.verifyAccessToken.mockReturnValue({
        id: 'user123',
        role: 'student',
        sid: 'session123'
      });

      const response = await request(app)
        .patch('/api/payments/payment555/verify')
        .set('Cookie', ['token=mock-valid-token'])
        .send({
          status: 'completed'
        });

      expect(response.status).toBe(403);
    });
  });
});
