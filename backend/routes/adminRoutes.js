const express = require('express');
const { getUsers, updateUserStatus } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('admin'));
router.get('/users', getUsers);
router.patch('/users/:userId', updateUserStatus);

module.exports = router;
