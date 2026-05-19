const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 465),
  secure: process.env.EMAIL_SECURE !== 'false',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendMail({ to, subject, html, text }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials are not fully configured. Skipping email send.');
    return;
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || `UniRide <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

function createEmailTemplate({ heading, body, actionText, actionUrl }) {
  return `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
    <h2>${heading}</h2>
    <p>${body}</p>
    ${actionUrl ? `<p><a href="${actionUrl}" style="display: inline-block; padding: 12px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">${actionText || 'Continue'}</a></p>` : ''}
    <p>If you did not request this, please ignore this email.</p>
  </body>
</html>`;
}

module.exports = { sendMail, createEmailTemplate };