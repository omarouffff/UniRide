const express = require('express');
const { syncUser, getProfile, updateProfile, submitUniversityId } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/sync', protect, syncUser);
router.get('/me', protect, getProfile);
router.patch('/profile', protect, upload.single('profileImage'), updateProfile);
router.post('/verify-university-id', protect, upload.single('universityIdImage'), submitUniversityId);

module.exports = router;
