const PaymentModel = require('../models/Payment');
const BookingModel = require('../models/Booking');
const axios = require('axios');
const { getFawryBaseUrl } = require('../config/fawry');

class PaymentService {
  // Initialize Paymob payment
  async initializePaymobPayment(userId, bookingId, amount) {
    try {
      // Get auth token from Paymob
      const authResponse = await axios.post(
        process.env.PAYMOB_AUTH_ENDPOINT,
        {
          api_key: process.env.PAYMOB_API_KEY,
        }
      );

      const token = authResponse.data.token;

      // Create order
      const orderResponse = await axios.post(
        'https://accept.paymobsolutions.com/api/ecommerce/orders',
        {
          auth_token: token,
          delivery_needed: false,
          currency: 'EGP',
          amount_cents: amount * 100, // Convert to cents
          items: [
            {
              name: 'UniRide Trip Booking',
              amount_cents: amount * 100,
              quantity: 1,
              description: `Booking ID: ${bookingId}`,
            },
          ],
        }
      );

      const orderId = orderResponse.data.id;

      // Create payment request
      const paymentResponse = await axios.post(
        'https://accept.paymobsolutions.com/api/acceptance/payment_keys',
        {
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
        }
      );

      const paymentKey = paymentResponse.data.token;

      // Save payment record
      await PaymentModel.create({
        user: userId,
        booking: bookingId,
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
    } catch (error) {
      console.error('Paymob initialization error:', error);
      throw new Error('Failed to initialize payment');
    }
  }

  // Initialize Fawry payment
  async initializeFawryPayment(userId, bookingId, amount) {
    try {
      const chargeResponse = await axios.post(
        `${getFawryBaseUrl()}/ECommerceWeb/Fawry/payments/charge`,
        {
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
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Save payment record
      await PaymentModel.create({
        user: userId,
        booking: bookingId,
        amount,
        currency: 'EGP',
        method: 'fawry',
        status: 'pending',
        reference: chargeResponse.data.charge.chargeId,
        metadata: chargeResponse.data,
      });

      return {
        chargeId: chargeResponse.data.charge.chargeId,
        redirectUrl: chargeResponse.data.charge.redirect_url,
      };
    } catch (error) {
      console.error('Fawry initialization error:', error);
      throw new Error('Failed to initialize Fawry payment');
    }
  }

  // Generate Fawry signature
  generateFawrySignature(merchantRefNum, amount) {
    const crypto = require('crypto');
    const signatureString = `${process.env.FAWRY_MERCHANT_CODE}${merchantRefNum}${amount}${process.env.FAWRY_SECURITY_KEY}`;
    return crypto.createHash('sha256').update(signatureString).digest('hex');
  }

  // Verify Paymob payment
  async verifyPaymobPayment(orderId, paymentStatus) {
    try {
      const payment = await PaymentModel.findOne({
        reference: orderId,
        method: 'paymob',
      });

      if (!payment) {
        throw new Error('Payment record not found');
      }

      if (paymentStatus === 'success') {
        payment.status = 'completed';
        await payment.save();

        // Update booking status
        const booking = await BookingModel.findByIdAndUpdate(
          payment.booking,
          { status: 'confirmed' },
          { new: true }
        );

        return { success: true, booking };
      } else {
        payment.status = 'failed';
        await payment.save();
        return { success: false, message: 'Payment failed' };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  // Verify Fawry payment
  async verifyFawryPayment(chargeId, transactionId) {
    try {
      const queryResponse = await axios.post(
        `${getFawryBaseUrl()}/ECommerceWeb/Fawry/payments/status`,
        {
          merchantCode: process.env.FAWRY_MERCHANT_CODE,
          chargeId,
          signature: this.generateFawrySignature(chargeId, ''),
        }
      );

      if (queryResponse.data.charge.chargeStatus === 'PAID') {
        const payment = await PaymentModel.findOne({ reference: chargeId });
        payment.status = 'completed';
        payment.metadata.transactionId = transactionId;
        await payment.save();

        // Update booking
        await BookingModel.findByIdAndUpdate(payment.booking, {
          status: 'confirmed',
        });

        return { success: true, payment };
      } else {
        throw new Error('Payment not completed');
      }
    } catch (error) {
      console.error('Fawry verification error:', error);
      throw error;
    }
  }

  // Get user's payment history
  async getUserPaymentHistory(userId, limit = 10, offset = 0) {
    try {
      const payments = await PaymentModel.find({ user: userId })
        .populate('booking')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      const total = await PaymentModel.countDocuments({ user: userId });

      return { payments, total, limit, offset };
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  // Get payment statistics for admin
  async getPaymentStatistics(startDate, endDate) {
    try {
      const stats = await PaymentModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: '$method',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' },
          },
        },
      ]);

      return stats;
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
