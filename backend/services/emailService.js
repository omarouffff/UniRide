const { Resend } = require('resend');
const { logger } = require('../utils/logger');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

let resendClient = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function getFromAddress() {
  return process.env.EMAIL_FROM || 'UniRide <onboarding@resend.dev>';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createEmailTemplate({ heading, body, actionText, actionUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;background:#1e293b;border-radius:12px;padding:32px;border:1px solid #334155;">
    <h2 style="margin:0 0 16px;color:#22d3ee;">${heading}</h2>
    <p style="margin:0 0 24px;color:#cbd5e1;">${body}</p>
    ${actionUrl ? `<p><a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:#0891b2;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">${actionText || 'Continue'}</a></p>` : ''}
    <p style="margin-top:24px;font-size:13px;color:#64748b;">If you did not request this, you can safely ignore this email.</p>
  </div>
</body>
</html>`;
}

async function sendMail({ to, subject, html, text }) {
  const client = getResendClient();
  if (!client) {
    logger.warn('RESEND_API_KEY not configured — email not sent', { to, subject });
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured');
    }
    return { skipped: true };
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const result = await client.emails.send({
        from: getFromAddress(),
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || undefined,
      });
      return result;
    } catch (error) {
      lastError = error;
      logger.warn('Email send attempt failed', { attempt, to, subject, error: error.message });
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  logger.error('Email send failed after retries', { to, subject, error: lastError?.message });
  throw lastError;
}

async function sendVerificationEmail(user, verifyUrl) {
  return sendMail({
    to: user.email,
    subject: 'Verify your UniRide email',
    html: createEmailTemplate({
      heading: 'Confirm your email',
      body: `Hi ${user.name}, please verify your email to complete your UniRide registration.`,
      actionText: 'Verify Email',
      actionUrl: verifyUrl,
    }),
  });
}

async function sendPasswordResetEmail(user, resetUrl) {
  return sendMail({
    to: user.email,
    subject: 'Reset your UniRide password',
    html: createEmailTemplate({
      heading: 'Password reset',
      body: `Hi ${user.name}, we received a request to reset your password. This link expires in 1 hour.`,
      actionText: 'Reset Password',
      actionUrl: resetUrl,
    }),
  });
}

async function sendBookingConfirmationEmail(user, booking) {
  return sendMail({
    to: user.email,
    subject: 'Booking confirmed — UniRide',
    html: createEmailTemplate({
      heading: 'Trip confirmed',
      body: `Hi ${user.name}, your booking for ${booking.route || 'your trip'} on ${new Date(booking.travelDate).toLocaleDateString()} is confirmed.`,
      actionText: 'View Dashboard',
      actionUrl: `${process.env.FRONTEND_URL || ''}/dashboard`,
    }),
  });
}

async function sendWaitingListPromotionEmail(user, booking) {
  return sendMail({
    to: user.email,
    subject: 'You got a seat — UniRide',
    html: createEmailTemplate({
      heading: 'Promoted from waiting list',
      body: `Hi ${user.name}, a seat opened up for ${booking.route || 'your trip'}. Your booking is now confirmed.`,
      actionText: 'View QR Pass',
      actionUrl: `${process.env.FRONTEND_URL || ''}/qr`,
    }),
  });
}

async function sendPaymentConfirmationEmail(user, payment) {
  return sendMail({
    to: user.email,
    subject: 'Payment received — UniRide',
    html: createEmailTemplate({
      heading: 'Payment confirmed',
      body: `Hi ${user.name}, we received your payment of ${payment.amount} ${payment.currency || 'EGP'}.`,
      actionText: 'View Bookings',
      actionUrl: `${process.env.FRONTEND_URL || ''}/bookings`,
    }),
  });
}

async function sendTripCancelledEmail(user, booking) {
  return sendMail({
    to: user.email,
    subject: 'Trip cancelled — UniRide',
    html: createEmailTemplate({
      heading: 'Booking cancelled',
      body: `Hi ${user.name}, your booking for ${booking.route || 'your trip'} has been cancelled.`,
    }),
  });
}

async function sendPasswordChangedEmail(user) {
  return sendMail({
    to: user.email,
    subject: 'Password changed — UniRide',
    html: createEmailTemplate({
      heading: 'Password updated',
      body: `Hi ${user.name}, your password was changed successfully. If this wasn't you, contact support immediately.`,
    }),
  });
}

module.exports = {
  sendMail,
  createEmailTemplate,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendWaitingListPromotionEmail,
  sendPaymentConfirmationEmail,
  sendTripCancelledEmail,
  sendPasswordChangedEmail,
};
