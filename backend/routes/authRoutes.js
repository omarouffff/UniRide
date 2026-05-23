const express = require('express');
const {
  loginUser,
  registerUser,
  syncUser,
  getProfile,
  updateProfile,
  submitUniversityId,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { loginSchema, registerSchema } = require('../validators/authValidators');

const router = express.Router();

router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/sync', protect, syncUser);
router.get('/me', protect, getProfile);
router.patch('/profile', protect, upload.single('profileImage'), updateProfile);
router.post('/verify-university-id', protect, upload.single('universityIdImage'), submitUniversityId);

module.exports = router;
