const axios = require('axios');
const { prisma } = require('../prisma/client');
const paymentRepository = require('../repositories/paymentRepository');
const { getFawryBaseUrl } = require('../config/fawry');

function buildReference(prefix = 'UR') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class PaymentService {
  async initializePaymobPayment(userId, bookingId, amount) {
    const authResponse = await axios.post(process.env.PAYMOB_AUTH_ENDPOINT, {
      api_key: process.env.PAYMOB_API_KEY,
    });
    const token = authResponse.data.token;

    const orderResponse = await axios.post('https://accept.paymobsolutions.com/api/ecommerce/orders', {
      auth_token: token,
      delivery_needed: false,
      currency: 'EGP',
      amount_cents: amount * 100,
      items: [
        {
          name: 'UniRide Trip Booking',
          amount_cents: amount * 100,
          quantity: 1,
          description: `Booking ID: ${bookingId}`,
        },
      ],
    });

    const orderId = String(orderResponse.data.id);
    const paymentResponse = await axios.post('https://accept.paymobsolutions.com/api/acceptance/payment_keys', {
      auth_token: token,
      amount_cents: amount * 100,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        apartment: 'NA',
        email: 'customer@example.com',
        floor: 'NA',
        first_name: 'Customer',
        street: 'NA',
        phone_number: '01000000000',
        postal_code: 'NA',
        city: 'Cairo',
        country: 'EG',
        last_name: 'Name',
        state: 'Cairo',
      },
      currency: 'EGP',
      integration_id: process.env.PAYMOB_INTEGRATION_ID,
    });

    const paymentKey = paymentResponse.data.token;
    await paymentRepository.create({
      userId,
      bookingId,
      amount,
      currency: 'EGP',
      method: 'paymob',
      status: 'pending',
      reference: orderId,
      metadata: { paymentKey, orderId },
    });

    return {
      paymentKey,
      orderId,
      iframeUrl: `https://accept.paymobsolutions.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`,
    };
  }

  async initializeFawryPayment(userId, bookingId, amount) {
    const chargeResponse = await axios.post(`${getFawryBaseUrl()}/ECommerceWeb/Fawry/payments/charge`, {
      merchantCode: process.env.FAWRY_MERCHANT_CODE,
      merchantRefNum: bookingId,
      amount,
      currencyCode: 'EGP',
      chargeItems: [
        {
          itemId: '1',
          description: 'UniRide Trip Booking',
          price: amount,
          quantity: 1,
        },
      ],
      description: `Trip booking for user ${userId}`,
      customerProfileId: userId,
      paymentMethod: 'CARD',
      signature: this.generateFawrySignature(bookingId, amount),
    });

    const chargeId = chargeResponse.data.charge.chargeId;
    await paymentRepository.create({
      userId,
      bookingId,
      amount,
      currency: 'EGP',
      method: 'fawry',
      status: 'pending',
      reference: chargeId,
      metadata: chargeResponse.data,
    });

    return {
      chargeId,
      redirectUrl: chargeResponse.data.charge.redirect_url,
    };
  }

  async initializeStripePayment(userId, bookingId, amount) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured');
    }
    const reference = buildReference('STRIPE');
    const payment = await paymentRepository.create({
      userId,
      bookingId,
      amount,
      currency: 'EGP',
      method: 'stripe',
      status: 'pending',
      reference,
      metadata: { provider: 'stripe' },
    });
    return {
      paymentId: payment.id,
      reference,
      clientSecret: null,
      message: 'Configure Stripe Checkout session on the client using paymentId',
    };
  }

  generateFawrySignature(merchantRefNum, amount) {
    const crypto = require('crypto');
    const signatureString = `${process.env.FAWRY_MERCHANT_CODE}${merchantRefNum}${amount}${process.env.FAWRY_SECURITY_KEY}`;
    return crypto.createHash('sha256').update(signatureString).digest('hex');
  }

  async verifyPaymobPayment(orderId, paymentStatus) {
    const payment = await paymentRepository.findByReference(String(orderId));
    if (!payment || payment.method !== 'paymob') {
      throw new Error('Payment record not found');
    }

    if (paymentStatus === 'success') {
      const updated = await paymentRepository.update(payment.id, { status: 'completed' });
      const booking = payment.bookingId
        ? await prisma.booking.findUnique({ where: { id: payment.bookingId } })
        : null;
      return { success: true, booking, payment: updated };
    }

    await paymentRepository.update(payment.id, { status: 'failed' });
    return { success: false, message: 'Payment failed' };
  }

  async verifyFawryPayment(chargeId, transactionId) {
    const queryResponse = await axios.post(`${getFawryBaseUrl()}/ECommerceWeb/Fawry/payments/status`, {
      merchantCode: process.env.FAWRY_MERCHANT_CODE,
      chargeId,
      signature: this.generateFawrySignature(chargeId, ''),
    });

    if (queryResponse.data.charge.chargeStatus === 'PAID') {
      const payment = await paymentRepository.findByReference(chargeId);
      if (!payment) throw new Error('Payment record not found');
      const updated = await paymentRepository.update(payment.id, {
        status: 'completed',
        transactionId,
        metadata: { ...(payment.metadata || {}), transactionId },
      });
      return { success: true, payment: updated };
    }
    throw new Error('Payment not completed');
  }

  async getUserPaymentHistory(userId, limit = 10, offset = 0) {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        include: { booking: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where: { userId } }),
    ]);
    return { payments, total, limit, offset };
  }

  async getPaymentStatistics(startDate, endDate) {
    const payments = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'completed',
      },
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
    });
    return payments.map((row) => ({
      _id: row.method,
      totalAmount: Number(row._sum.amount || 0),
      count: row._count,
      avgAmount: Number(row._avg.amount || 0),
    }));
  }
}

module.exports = new PaymentService();
