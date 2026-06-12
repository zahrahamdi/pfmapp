const { run, get, all } = require('../database');
const { createHttpError, createValidationError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/response');
const { validateUserBudget, parsePositiveAmount } = require('../utils/validation');
const { getBudgetStatusLabel, resolvePeriod } = require('./userDashboardController');
const { MESSAGES, BUDGET_STATUS_FA } = require('../utils/messages');

const BUDGET_FIELDS = 'id, user_id, category_id, amount, month, year, created_at, updated_at';

async function createUserBudget(req, res) {
  const { category_id, amount, month, year } = req.body;
  const validationErrors = validateUserBudget({ category_id, amount, month, year });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const category = await get(
    'SELECT id, type FROM categories WHERE id = ? AND user_id = ?',
    [category_id, req.user.id]
  );

  if (!category || category.type !== 'expense') {
    throw createHttpError(400, MESSAGES.BUDGET_INVALID_CATEGORY);
  }

  const parsedAmount = parsePositiveAmount(amount);
  const parsedMonth = Number(month);
  const parsedYear = Number(year);
  const legacyCategoryKey = `__user_${req.user.id}__cat_${category_id}`;

  try {
    const result = await run(
      `INSERT INTO budgets (user_id, category_id, amount, month, year, category, limit_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, category_id, parsedAmount, parsedMonth, parsedYear, legacyCategoryKey, parsedAmount]
    );

    const budget = await get(`SELECT ${BUDGET_FIELDS} FROM budgets WHERE id = ?`, [result.id]);
    return sendSuccess(res, budget, 201);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      throw createHttpError(409, MESSAGES.BUDGET_MONTH_EXISTS);
    }
    throw error;
  }
}

async function getUserBudgets(req, res) {
  const conditions = ['user_id = ?', 'category_id IS NOT NULL'];
  const params = [req.user.id];

  if (req.query.month) {
    conditions.push('month = ?');
    params.push(Number(req.query.month));
  }
  if (req.query.year) {
    conditions.push('year = ?');
    params.push(Number(req.query.year));
  }

  const budgets = await all(
    `SELECT b.id, b.user_id, b.category_id, b.amount, b.month, b.year,
            b.created_at, b.updated_at, c.name AS category_name
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY b.year DESC, b.month DESC, c.name ASC`,
    params
  );

  return sendSuccess(res, budgets);
}

async function getUserBudgetById(req, res) {
  const budget = await get(
    `SELECT b.id, b.user_id, b.category_id, b.amount, b.month, b.year,
            b.created_at, b.updated_at, c.name AS category_name
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     WHERE b.id = ? AND b.user_id = ?`,
    [req.params.id, req.user.id]
  );

  if (!budget) {
    throw createHttpError(404, MESSAGES.BUDGET_NOT_FOUND);
  }

  return sendSuccess(res, budget);
}

async function updateUserBudgetHandler(req, res) {
  const existing = await get('SELECT * FROM budgets WHERE id = ? AND user_id = ?', [
    req.params.id,
    req.user.id,
  ]);

  if (!existing) {
    throw createHttpError(404, MESSAGES.BUDGET_NOT_FOUND);
  }

  const { category_id, amount, month, year } = req.body;
  const validationErrors = validateUserBudget({ category_id, amount, month, year });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const category = await get(
    'SELECT id, type FROM categories WHERE id = ? AND user_id = ?',
    [category_id, req.user.id]
  );

  if (!category || category.type !== 'expense') {
    throw createHttpError(400, MESSAGES.BUDGET_INVALID_CATEGORY);
  }

  const parsedAmount = parsePositiveAmount(amount);
  const legacyCategoryKey = `__user_${req.user.id}__cat_${category_id}`;

  try {
    await run(
      `UPDATE budgets SET category_id = ?, amount = ?, month = ?, year = ?,
       category = ?, limit_amount = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [category_id, parsedAmount, Number(month), Number(year), legacyCategoryKey, parsedAmount, req.params.id]
    );

    const budget = await get(
      `SELECT b.id, b.user_id, b.category_id, b.amount, b.month, b.year,
              b.created_at, b.updated_at, c.name AS category_name
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       WHERE b.id = ?`,
      [req.params.id]
    );
    return sendSuccess(res, budget);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      throw createHttpError(409, MESSAGES.BUDGET_MONTH_EXISTS);
    }
    throw error;
  }
}

async function deleteUserBudget(req, res) {
  const result = await run('DELETE FROM budgets WHERE id = ? AND user_id = ?', [
    req.params.id,
    req.user.id,
  ]);

  if (result.changes === 0) {
    throw createHttpError(404, MESSAGES.BUDGET_NOT_FOUND);
  }

  return sendSuccess(res, { message: MESSAGES.BUDGET_DELETED });
}

async function getUserBudgetSummary(req, res) {
  const { month, year, startDate, endDate } = resolvePeriod(req.query);
  const userId = req.user.id;

  const budgets = await all(
    `SELECT b.id, b.category_id, b.amount, c.name AS category_name
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     WHERE b.user_id = ? AND b.category_id IS NOT NULL AND b.month = ? AND b.year = ?`,
    [userId, month, year]
  );

  const summary = await Promise.all(
    budgets.map(async (budget) => {
      const spentRow = await get(
        `SELECT COALESCE(SUM(amount), 0) AS spent FROM transactions
         WHERE user_id = ? AND category_id = ? AND type = 'expense'
         AND date >= ? AND date <= ?`,
        [userId, budget.category_id, startDate, endDate]
      );

      const spentAmount = spentRow.spent;
      const remainingAmount = budget.amount - spentAmount;
      const usedPercent = budget.amount > 0
        ? Number(((spentAmount / budget.amount) * 100).toFixed(2))
        : 0;

      return {
        budget_id: budget.id,
        category_id: budget.category_id,
        category_name: budget.category_name,
        budget_amount: budget.amount,
        spent_amount: spentAmount,
        remaining_amount: remainingAmount,
        used_percent: usedPercent,
        status: BUDGET_STATUS_FA[getBudgetStatusLabel(spentAmount, budget.amount)] || getBudgetStatusLabel(spentAmount, budget.amount),
      };
    })
  );

  return sendSuccess(res, {
    period: { month, year, startDate, endDate },
    budgets: summary,
  });
}

module.exports = {
  createUserBudget,
  getUserBudgets,
  getUserBudgetById,
  updateUserBudgetHandler,
  deleteUserBudget,
  getUserBudgetSummary,
};
