const { run, get, all } = require('../database');
const { createHttpError, createValidationError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/response');
const { BUDGET_WARNING_THRESHOLD } = require('../utils/constants');
const { validateBudget, parsePositiveAmount, getCurrentMonthRange } = require('../utils/validation');

function getBudgetStatus(spent, limit) {
  if (spent > limit) {
    return 'Exceeded';
  }

  if (spent >= limit * BUDGET_WARNING_THRESHOLD) {
    return 'Warning';
  }

  return 'OK';
}

async function createBudget(req, res) {
  const { category, limit_amount } = req.body;
  const validationErrors = validateBudget({ category, limit_amount });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const parsedLimit = parsePositiveAmount(limit_amount);

  try {
    const result = await run(
      'INSERT INTO budgets (category, limit_amount) VALUES (?, ?)',
      [category.trim(), parsedLimit]
    );

    const budget = await get('SELECT id, category, limit_amount FROM budgets WHERE id = ?', [result.id]);
    return sendSuccess(res, budget, 201);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      throw createHttpError(409, 'Budget for this category already exists');
    }
    throw error;
  }
}

async function getBudgets(req, res) {
  const budgets = await all('SELECT id, category, limit_amount FROM budgets ORDER BY category ASC');
  return sendSuccess(res, budgets);
}

async function updateBudget(req, res) {
  const { id } = req.params;
  const existing = await get('SELECT * FROM budgets WHERE id = ?', [id]);

  if (!existing) {
    throw createHttpError(404, 'Budget not found');
  }

  const { category, limit_amount } = req.body;
  const validationErrors = validateBudget({ category, limit_amount });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const parsedLimit = parsePositiveAmount(limit_amount);

  try {
    await run(
      'UPDATE budgets SET category = ?, limit_amount = ? WHERE id = ?',
      [category.trim(), parsedLimit, id]
    );

    const budget = await get('SELECT id, category, limit_amount FROM budgets WHERE id = ?', [id]);
    return sendSuccess(res, budget);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      throw createHttpError(409, 'Budget for this category already exists');
    }
    throw error;
  }
}

async function deleteBudget(req, res) {
  const { id } = req.params;
  const result = await run('DELETE FROM budgets WHERE id = ?', [id]);

  if (result.changes === 0) {
    throw createHttpError(404, 'Budget not found');
  }

  return sendSuccess(res, { message: 'Budget deleted successfully' });
}

async function getMonthlySpentForCategory(category) {
  const { startDate, endDate } = getCurrentMonthRange();
  const spentRow = await get(
    'SELECT COALESCE(SUM(amount), 0) AS spent FROM expenses WHERE category = ? AND date >= ? AND date <= ?',
    [category, startDate, endDate]
  );
  return { spent: spentRow.spent, startDate, endDate };
}

async function getBudgetStatusReport(req, res) {
  const budgets = await all('SELECT * FROM budgets ORDER BY category ASC');
  const { startDate, endDate } = getCurrentMonthRange();

  const statusList = await Promise.all(
    budgets.map(async (budget) => {
      const { spent } = await getMonthlySpentForCategory(budget.category);
      const remaining = budget.limit_amount - spent;

      return {
        category: budget.category,
        limit: budget.limit_amount,
        spent,
        remaining,
        status: getBudgetStatus(spent, budget.limit_amount),
      };
    })
  );

  return sendSuccess(res, {
    period: { startDate, endDate },
    budgets: statusList,
  });
}

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetStatusReport,
  getBudgetStatus,
  getMonthlySpentForCategory,
};
