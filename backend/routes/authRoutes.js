const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  getProfile,
  updateProfile,
  submitUniversityId,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  setupTwoFactor,
  verifyTwoFactor,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  verifyEmailSchema,
  twoFactorVerifySchema,
} = require('../validators/authValidators');

const router = express.Router();

router.post(
  '/register',
  upload.fields([
    { name: 'idCardImage', maxCount: 1 },
    { name: 'universityIdImage', maxCount: 1 },
  ]),
  validateRequest(registerSchema),
  registerUser
);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);
router.post('/verify-email', validateRequest(verifyEmailSchema), verifyEmail);
router.post('/password-reset/request', validateRequest(passwordResetRequestSchema), requestPasswordReset);
router.post('/password-reset/confirm', validateRequest(passwordResetSchema), resetPassword);
router.post('/2fa/setup', protect, setupTwoFactor);
router.post('/2fa/verify', protect, validateRequest(twoFactorVerifySchema), verifyTwoFactor);
router.get('/me', protect, getProfile);
router.patch('/profile', protect, upload.single('profileImage'), updateProfile);
router.post('/verify-university-id', protect, upload.single('universityIdImage'), submitUniversityId);

module.exports = router;
