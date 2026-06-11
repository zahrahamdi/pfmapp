const { run, get, all } = require('../database');
const { createHttpError, createValidationError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/response');
const {
  validateIncome,
  parsePositiveAmount,
} = require('../utils/validation');

function buildIncomeFilters(query) {
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
      throw createHttpError(400, 'minAmount must be a non-negative number');
    }
    conditions.push('amount >= ?');
    params.push(Math.round(minAmount));
  }

  if (query.maxAmount !== undefined) {
    const maxAmount = Number(query.maxAmount);
    if (!Number.isFinite(maxAmount) || maxAmount < 0) {
      throw createHttpError(400, 'maxAmount must be a non-negative number');
    }
    conditions.push('amount <= ?');
    params.push(Math.round(maxAmount));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

async function createIncome(req, res) {
  const { title, amount, category, date } = req.body;
  const validationErrors = validateIncome({ title, amount, category, date });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const parsedAmount = parsePositiveAmount(amount);

  const result = await run(
    'INSERT INTO incomes (title, amount, category, date) VALUES (?, ?, ?, ?)',
    [title.trim(), parsedAmount, category.trim(), date.trim()]
  );

  const income = await get('SELECT id, title, amount, category, date FROM incomes WHERE id = ?', [result.id]);
  return sendSuccess(res, income, 201);
}

async function getIncomes(req, res) {
  const { whereClause, params } = buildIncomeFilters(req.query);
  const incomes = await all(
    `SELECT id, title, amount, category, date FROM incomes ${whereClause} ORDER BY date DESC, id DESC`,
    params
  );
  return sendSuccess(res, incomes);
}

async function updateIncome(req, res) {
  const { id } = req.params;
  const existing = await get('SELECT * FROM incomes WHERE id = ?', [id]);

  if (!existing) {
    throw createHttpError(404, 'Income not found');
  }

  const { title, amount, category, date } = req.body;
  const validationErrors = validateIncome({ title, amount, category, date });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const parsedAmount = parsePositiveAmount(amount);

  await run(
    'UPDATE incomes SET title = ?, amount = ?, category = ?, date = ? WHERE id = ?',
    [title.trim(), parsedAmount, category.trim(), date.trim(), id]
  );

  const income = await get('SELECT id, title, amount, category, date FROM incomes WHERE id = ?', [id]);
  return sendSuccess(res, income);
}

async function deleteIncome(req, res) {
  const { id } = req.params;
  const result = await run('DELETE FROM incomes WHERE id = ?', [id]);

  if (result.changes === 0) {
    throw createHttpError(404, 'Income not found');
  }

  return sendSuccess(res, { message: 'Income deleted successfully' });
}

module.exports = {
  createIncome,
  getIncomes,
  updateIncome,
  deleteIncome,
};
