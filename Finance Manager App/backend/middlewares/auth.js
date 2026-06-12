const jwt = require('jsonwebtoken');
const { createHttpError } = require('./errorHandler');
const { MESSAGES } = require('../utils/messages');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createHttpError(401, MESSAGES.UNAUTHORIZED_TOKEN));
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(createHttpError(500, MESSAGES.JWT_NOT_CONFIGURED));
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = { id: payload.userId, email: payload.email, name: payload.name };
    return next();
  } catch (error) {
    return next(createHttpError(401, MESSAGES.UNAUTHORIZED_INVALID));
  }
}

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(MESSAGES.JWT_NOT_CONFIGURED);
  }

  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = {
  authenticate,
  signToken,
};
