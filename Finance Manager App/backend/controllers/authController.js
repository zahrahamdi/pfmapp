const bcrypt = require('bcrypt');
const { run, get } = require('../database');
const { createHttpError, createValidationError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/response');
const { signToken } = require('../middlewares/auth');
const { validateRegister, validateLogin } = require('../utils/validation');
const { seedDefaultCategories } = require('../services/categoryService');
const { MESSAGES } = require('../utils/messages');

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

async function register(req, res) {
  const { name, email, password } = req.body;
  const validationErrors = validateRegister({ name, email, password });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);

  if (existing) {
    throw createHttpError(409, MESSAGES.EMAIL_EXISTS);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await run(
    `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
    [name.trim(), normalizedEmail, passwordHash]
  );

  const user = await get('SELECT * FROM users WHERE id = ?', [result.id]);
  await seedDefaultCategories(user.id);

  const token = signToken(user);

  return sendSuccess(
    res,
    {
      user: sanitizeUser(user),
      token,
    },
    201
  );
}

async function login(req, res) {
  const { email, password } = req.body;
  const validationErrors = validateLogin({ email, password });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

  if (!user) {
    throw createHttpError(401, MESSAGES.INVALID_CREDENTIALS);
  }

  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw createHttpError(401, MESSAGES.INVALID_CREDENTIALS);
  }

  const token = signToken(user);

  return sendSuccess(res, {
    user: sanitizeUser(user),
    token,
  });
}

async function getMe(req, res) {
  const user = await get(
    'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
    [req.user.id]
  );

  if (!user) {
    throw createHttpError(404, MESSAGES.USER_NOT_FOUND);
  }

  return sendSuccess(res, user);
}

module.exports = {
  register,
  login,
  getMe,
};
