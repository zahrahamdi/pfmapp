const { run, get } = require('../database');
const { createHttpError, createValidationError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/response');
const { validateSavingsGoal, parsePositiveAmount } = require('../utils/validation');

async function getCurrentBalance() {
  const incomeRow = await get('SELECT COALESCE(SUM(amount), 0) AS total FROM incomes');
  const expenseRow = await get('SELECT COALESCE(SUM(amount), 0) AS total FROM expenses');
  return incomeRow.total - expenseRow.total;
}

async function createSavingsGoal(req, res) {
  const { target_amount } = req.body;
  const validationErrors = validateSavingsGoal({ target_amount });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  const parsedTarget = parsePositiveAmount(target_amount);

  const result = await run(
    'INSERT INTO savings_goals (target_amount) VALUES (?)',
    [parsedTarget]
  );

  const currentBalance = await getCurrentBalance();
  const progress = Math.min(100, Math.round((currentBalance / parsedTarget) * 100));

  return sendSuccess(res, {
    target: parsedTarget,
    currentBalance,
    progress,
    id: result.id,
  }, 201);
}

async function getSavingsGoal(req, res) {
  const goal = await get('SELECT * FROM savings_goals ORDER BY id DESC LIMIT 1');

  if (!goal) {
    throw createHttpError(404, 'No savings goal has been set');
  }

  const currentBalance = await getCurrentBalance();
  const progress = Math.min(100, Math.round((currentBalance / goal.target_amount) * 100));

  return sendSuccess(res, {
    target: goal.target_amount,
    currentBalance,
    progress,
  });
}

module.exports = {
  createSavingsGoal,
  getSavingsGoal,
};
