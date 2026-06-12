const rateLimit = require('express-rate-limit');
const { MESSAGES } = require('../utils/messages');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: MESSAGES.RATE_LIMIT_AUTH,
    errors: [],
  },
});

module.exports = {
  authRateLimiter,
};
