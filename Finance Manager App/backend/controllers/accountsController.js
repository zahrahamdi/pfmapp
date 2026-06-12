const { run, get, all } = require('../database');
const { createHttpError, createValidationError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/response');
const { validateAccount, parsePositiveAmount } = require('../utils/validation');
const { MESSAGES } = require('../utils/messages');

const ACCOUNT_FIELDS = 'id, user_id, name, type, initial_balance, current_balance, currency, created_at, updated_at';

async function createAccount(req, res) {
  const { name, type, initial_balance, currency } = req.body;
  const validationErrors = validateAccount({ name, type, initial_balance, currency });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const parsedBalance = initial_balance !== undefined && initial_balance !== null && initial_balance !== ''
    ? parsePositiveAmount(initial_balance, true)
    : 0;

  const result = await run(
    `INSERT INTO accounts (user_id, name, type, initial_balance, current_balance, currency)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      name.trim(),
      type,
      parsedBalance,
      parsedBalance,
      (currency || 'IRR').trim().toUpperCase(),
    ]
  );

  const account = await get(`SELECT ${ACCOUNT_FIELDS} FROM accounts WHERE id = ?`, [result.id]);
  return sendSuccess(res, account, 201);
}

async function getAccounts(req, res) {
  const accounts = await all(
    `SELECT ${ACCOUNT_FIELDS} FROM accounts WHERE user_id = ? AND deleted_at IS NULL ORDER BY name ASC`,
    [req.user.id]
  );
  return sendSuccess(res, accounts);
}

async function getAccountById(req, res) {
  const account = await get(
    `SELECT ${ACCOUNT_FIELDS} FROM accounts WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    [req.params.id, req.user.id]
  );

  if (!account) {
    throw createHttpError(404, MESSAGES.ACCOUNT_NOT_FOUND);
  }

  return sendSuccess(res, account);
}

async function updateAccount(req, res) {
  const existing = await get(
    'SELECT * FROM accounts WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [req.params.id, req.user.id]
  );

  if (!existing) {
    throw createHttpError(404, MESSAGES.ACCOUNT_NOT_FOUND);
  }

  const { name, type, currency } = req.body;
  const validationErrors = validateAccount({ name, type, currency }, { requireBalance: false });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  await run(
    `UPDATE accounts SET name = ?, type = ?, currency = ?, updated_at = datetime('now') WHERE id = ?`,
    [name.trim(), type, (currency || existing.currency).trim().toUpperCase(), req.params.id]
  );

  const account = await get(`SELECT ${ACCOUNT_FIELDS} FROM accounts WHERE id = ?`, [req.params.id]);
  return sendSuccess(res, account);
}

async function deleteAccount(req, res) {
  const existing = await get(
    'SELECT * FROM accounts WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [req.params.id, req.user.id]
  );

  if (!existing) {
    throw createHttpError(404, MESSAGES.ACCOUNT_NOT_FOUND);
  }

  const txCount = await get(
    `SELECT COUNT(*) AS count FROM transactions
     WHERE user_id = ? AND (account_id = ? OR target_account_id = ?)`,
    [req.user.id, req.params.id, req.params.id]
  );

  if (txCount.count > 0) {
    await run(
      `UPDATE accounts SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      [req.params.id]
    );
    return sendSuccess(res, { message: MESSAGES.ACCOUNT_SOFT_DELETED });
  }

  await run('DELETE FROM accounts WHERE id = ?', [req.params.id]);
  return sendSuccess(res, { message: MESSAGES.ACCOUNT_DELETED });
}

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
};
