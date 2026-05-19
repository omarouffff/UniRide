const { z } = require('zod');

const emailSchema = z.string().email({ message: 'Email must be valid' }).max(120);
const passwordSchema = z.string().min(8, { message: 'Password must be at least 8 characters' });
const phoneSchema = z.string().regex(/^\+?[0-9]{10,15}$/, { message: 'Phone number must be valid' });
const nameSchema = z.string().min(2).max(100);
const universityIdSchema = z.string().regex(/^[A-Za-z0-9]{8,15}$/, { message: 'University ID must be 8-15 alphanumeric characters' });

const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phoneNumber: phoneSchema,
  password: passwordSchema,
  universityId: universityIdSchema,
  college: z.string().min(2).max(120),
  academicYear: z.string().min(2).max(60),
  deviceName: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  twoFactorCode: z.string().length(6).optional(),
  deviceName: z.string().max(100).optional(),
});

const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

const passwordResetSchema = z.object({
  token: z.string().min(20),
  password: passwordSchema,
});

const verifyEmailSchema = z.object({
  token: z.string().min(20),
});

const twoFactorVerifySchema = z.object({
  twoFactorCode: z.string().length(6),
});

module.exports = {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  verifyEmailSchema,
  twoFactorVerifySchema,
};