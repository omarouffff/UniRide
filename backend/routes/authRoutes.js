const express = require('express');
const { registerUser, loginUser, getProfile, submitUniversityId } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getProfile);
router.post('/verify-university-id', protect, upload.single('universityIdImage'), submitUniversityId);

module.exports = router;
