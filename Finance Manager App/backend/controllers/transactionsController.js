const { run, get, all } = require('../database');
const { createHttpError, createValidationError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/response');
const { validateTransaction, parsePositiveAmount } = require('../utils/validation');
const {
  applyTransactionEffect,
  reverseTransactionEffect,
} = require('../services/accountBalanceService');
const { MESSAGES } = require('../utils/messages');

const TX_FIELDS = `
  id, user_id, account_id, category_id, type, amount, date, note, tags,
  payment_method, target_account_id, created_at, updated_at
`;

function mapTransaction(row) {
  if (!row) {
    return null;
  }
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
  };
}

function buildTransactionFilters(query, userId) {
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (query.from) {
    conditions.push('date >= ?');
    params.push(query.from);
  }

  if (query.to) {
    conditions.push('date <= ?');
    params.push(query.to);
  }

  if (query.type) {
    conditions.push('type = ?');
    params.push(query.type);
  }

  if (query.category_id) {
    conditions.push('category_id = ?');
    params.push(Number(query.category_id));
  }

  if (query.account_id) {
    conditions.push('(account_id = ? OR target_account_id = ?)');
    params.push(Number(query.account_id), Number(query.account_id));
  }

  if (query.min_amount !== undefined) {
    const minAmount = Number(query.min_amount);
    if (!Number.isFinite(minAmount) || minAmount < 0) {
      throw createHttpError(400, MESSAGES.MIN_AMOUNT_INVALID);
    }
    conditions.push('amount >= ?');
    params.push(minAmount);
  }

  if (query.max_amount !== undefined) {
    const maxAmount = Number(query.max_amount);
    if (!Number.isFinite(maxAmount) || maxAmount < 0) {
      throw createHttpError(400, MESSAGES.MAX_AMOUNT_INVALID);
    }
    conditions.push('amount <= ?');
    params.push(maxAmount);
  }

  if (query.search) {
    conditions.push('(note LIKE ? OR tags LIKE ?)');
    const term = `%${query.search.trim()}%`;
    params.push(term, term);
  }

  return { whereClause: `WHERE ${conditions.join(' AND ')}`, params };
}

async function verifyAccountOwnership(accountId, userId) {
  return get(
    'SELECT id FROM accounts WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [accountId, userId]
  );
}

async function verifyCategoryOwnership(categoryId, userId, expectedType) {
  if (!categoryId) {
    return null;
  }
  return get(
    'SELECT id, type FROM categories WHERE id = ? AND user_id = ?',
    [categoryId, userId]
  );
}

async function createTransaction(req, res) {
  const body = req.body;
  const validationErrors = validateTransaction(body);

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const amount = parsePositiveAmount(body.amount);
  const account = await verifyAccountOwnership(body.account_id, req.user.id);

  if (!account) {
    throw createHttpError(400, MESSAGES.INVALID_ACCOUNT);
  }

  if (body.type === 'transfer') {
    const target = await verifyAccountOwnership(body.target_account_id, req.user.id);
    if (!target) {
      throw createHttpError(400, MESSAGES.INVALID_TARGET_ACCOUNT);
    }
    if (Number(body.account_id) === Number(body.target_account_id)) {
      throw createHttpError(400, MESSAGES.ACCOUNTS_MUST_DIFFER);
    }
  } else {
    const category = await verifyCategoryOwnership(body.category_id, req.user.id, body.type);
    if (!category) {
      throw createHttpError(400, MESSAGES.INVALID_CATEGORY);
    }
    if (body.type === 'income' && category.type !== 'income') {
      throw createHttpError(400, MESSAGES.CATEGORY_MUST_INCOME);
    }
    if (body.type === 'expense' && category.type !== 'expense') {
      throw createHttpError(400, MESSAGES.CATEGORY_MUST_EXPENSE);
    }
  }

  const tagsJson = body.tags ? JSON.stringify(body.tags) : null;

  const result = await run(
    `INSERT INTO transactions
     (user_id, account_id, category_id, type, amount, date, note, tags, payment_method, target_account_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      body.account_id,
      body.type === 'transfer' ? null : body.category_id,
      body.type,
      amount,
      body.date.trim(),
      body.note ? body.note.trim() : null,
      tagsJson,
      body.payment_method || null,
      body.type === 'transfer' ? body.target_account_id : null,
    ]
  );

  const applied = await applyTransactionEffect({
    userId: req.user.id,
    type: body.type,
    amount,
    accountId: body.account_id,
    targetAccountId: body.target_account_id,
  });

  if (!applied) {
    await run('DELETE FROM transactions WHERE id = ?', [result.id]);
    throw createHttpError(400, MESSAGES.BALANCE_UPDATE_FAILED);
  }

  const transaction = mapTransaction(
    await get(`SELECT ${TX_FIELDS} FROM transactions WHERE id = ?`, [result.id])
  );
  return sendSuccess(res, transaction, 201);
}

async function getTransactions(req, res) {
  const { whereClause, params } = buildTransactionFilters(req.query, req.user.id);
  const rows = await all(
    `SELECT ${TX_FIELDS} FROM transactions ${whereClause} ORDER BY date DESC, id DESC`,
    params
  );
  return sendSuccess(res, rows.map(mapTransaction));
}

async function getTransactionById(req, res) {
  const transaction = mapTransaction(
    await get(`SELECT ${TX_FIELDS} FROM transactions WHERE id = ? AND user_id = ?`, [
      req.params.id,
      req.user.id,
    ])
  );

  if (!transaction) {
    throw createHttpError(404, MESSAGES.TRANSACTION_NOT_FOUND);
  }

  return sendSuccess(res, transaction);
}

async function updateTransaction(req, res) {
  const existing = await get('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [
    req.params.id,
    req.user.id,
  ]);

  if (!existing) {
    throw createHttpError(404, MESSAGES.TRANSACTION_NOT_FOUND);
  }

  const body = req.body;
  const validationErrors = validateTransaction(body);

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const amount = parsePositiveAmount(body.amount);
  const account = await verifyAccountOwnership(body.account_id, req.user.id);

  if (!account) {
    throw createHttpError(400, MESSAGES.INVALID_ACCOUNT);
  }

  if (body.type === 'transfer') {
    const target = await verifyAccountOwnership(body.target_account_id, req.user.id);
    if (!target) {
      throw createHttpError(400, MESSAGES.INVALID_TARGET_ACCOUNT);
    }
    if (Number(body.account_id) === Number(body.target_account_id)) {
      throw createHttpError(400, MESSAGES.ACCOUNTS_MUST_DIFFER);
    }
  } else {
    const category = await verifyCategoryOwnership(body.category_id, req.user.id, body.type);
    if (!category) {
      throw createHttpError(400, MESSAGES.INVALID_CATEGORY);
    }
    if (body.type === 'income' && category.type !== 'income') {
      throw createHttpError(400, MESSAGES.CATEGORY_MUST_INCOME);
    }
    if (body.type === 'expense' && category.type !== 'expense') {
      throw createHttpError(400, MESSAGES.CATEGORY_MUST_EXPENSE);
    }
  }

  await reverseTransactionEffect(existing);

  const tagsJson = body.tags ? JSON.stringify(body.tags) : null;

  await run(
    `UPDATE transactions SET
       account_id = ?, category_id = ?, type = ?, amount = ?, date = ?,
       note = ?, tags = ?, payment_method = ?, target_account_id = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
    [
      body.account_id,
      body.type === 'transfer' ? null : body.category_id,
      body.type,
      amount,
      body.date.trim(),
      body.note ? body.note.trim() : null,
      tagsJson,
      body.payment_method || null,
      body.type === 'transfer' ? body.target_account_id : null,
      req.params.id,
    ]
  );

  const applied = await applyTransactionEffect({
    userId: req.user.id,
    type: body.type,
    amount,
    accountId: body.account_id,
    targetAccountId: body.target_account_id,
  });

  if (!applied) {
    await reverseTransactionEffect({
      ...existing,
      user_id: req.user.id,
    });
    throw createHttpError(400, MESSAGES.BALANCE_UPDATE_FAILED);
  }

  const transaction = mapTransaction(
    await get(`SELECT ${TX_FIELDS} FROM transactions WHERE id = ?`, [req.params.id])
  );
  return sendSuccess(res, transaction);
}

async function deleteTransaction(req, res) {
  const existing = await get('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [
    req.params.id,
    req.user.id,
  ]);

  if (!existing) {
    throw createHttpError(404, MESSAGES.TRANSACTION_NOT_FOUND);
  }

  await reverseTransactionEffect(existing);
  await run('DELETE FROM transactions WHERE id = ?', [req.params.id]);

  return sendSuccess(res, { message: MESSAGES.TRANSACTION_DELETED });
}

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
