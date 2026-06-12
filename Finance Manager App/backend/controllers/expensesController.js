const { run, get, all } = require('../database');
const { createHttpError, createValidationError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/response');
const {
  validateExpense,
  parsePositiveAmount,
} = require('../utils/validation');
const { MESSAGES } = require('../utils/messages');

function buildExpenseFilters(query) {
  const conditions = [];
  const params = [];

  if (query.category) {
    conditions.push('category = ?');
    params.push(query.category.trim());
  }

  if (query.startDate) {
    conditions.push('date >= ?');
    params.push(query.startDate);
  }

  if (query.endDate) {
    conditions.push('date <= ?');
    params.push(query.endDate);
  }

  if (query.minAmount !== undefined) {
    const minAmount = Number(query.minAmount);
    if (!Number.isFinite(minAmount) || minAmount < 0) {
      throw createHttpError(400, MESSAGES.MIN_AMOUNT_INVALID);
    }
    conditions.push('amount >= ?');
    params.push(Math.round(minAmount));
  }

  if (query.maxAmount !== undefined) {
    const maxAmount = Number(query.maxAmount);
    if (!Number.isFinite(maxAmount) || maxAmount < 0) {
      throw createHttpError(400, MESSAGES.MAX_AMOUNT_INVALID);
    }
    conditions.push('amount <= ?');
    params.push(Math.round(maxAmount));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

async function createExpense(req, res) {
  const { title, amount, category, date } = req.body;
  const validationErrors = validateExpense({ title, amount, category, date });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const parsedAmount = parsePositiveAmount(amount);

  const result = await run(
    'INSERT INTO expenses (title, amount, category, date) VALUES (?, ?, ?, ?)',
    [title.trim(), parsedAmount, category.trim(), date.trim()]
  );

  const expense = await get(
    'SELECT id, title, amount, category, date FROM expenses WHERE id = ?',
    [result.id]
  );
  return sendSuccess(res, expense, 201);
}

async function getExpenses(req, res) {
  const { whereClause, params } = buildExpenseFilters(req.query);
  const expenses = await all(
    `SELECT id, title, amount, category, date FROM expenses ${whereClause} ORDER BY date DESC, id DESC`,
    params
  );
  return sendSuccess(res, expenses);
}

async function updateExpense(req, res) {
  const { id } = req.params;
  const existing = await get('SELECT * FROM expenses WHERE id = ?', [id]);

  if (!existing) {
    throw createHttpError(404, MESSAGES.EXPENSE_NOT_FOUND);
  }

  const { title, amount, category, date } = req.body;
  const validationErrors = validateExpense({ title, amount, category, date });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const parsedAmount = parsePositiveAmount(amount);

  await run(
    'UPDATE expenses SET title = ?, amount = ?, category = ?, date = ? WHERE id = ?',
    [title.trim(), parsedAmount, category.trim(), date.trim(), id]
  );

  const expense = await get(
    'SELECT id, title, amount, category, date FROM expenses WHERE id = ?',
    [id]
  );
  return sendSuccess(res, expense);
}

async function deleteExpense(req, res) {
  const { id } = req.params;
  const result = await run('DELETE FROM expenses WHERE id = ?', [id]);

  if (result.changes === 0) {
    throw createHttpError(404, MESSAGES.EXPENSE_NOT_FOUND);
  }

  return sendSuccess(res, { message: MESSAGES.EXPENSE_DELETED });
}

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
};
