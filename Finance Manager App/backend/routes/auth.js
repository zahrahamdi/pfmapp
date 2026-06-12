const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { authRateLimiter } = require('../middlewares/rateLimiter');
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', authRateLimiter, asyncHandler(register));
router.post('/login', authRateLimiter, asyncHandler(login));
router.get('/me', authenticate, asyncHandler(getMe));

module.exports = router;
