const express = require('express');
const { registerUser, loginUser, logoutUser, getProfile, updateProfile, submitUniversityId } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post(
  '/register',
  upload.fields([
    { name: 'idCardImage', maxCount: 1 },
    { name: 'universityIdImage', maxCount: 1 },
  ]),
  registerUser
);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getProfile);
router.patch('/profile', protect, upload.single('profileImage'), updateProfile);
router.post('/verify-university-id', protect, upload.single('universityIdImage'), submitUniversityId);

module.exports = router;
