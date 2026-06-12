const { get, all } = require('../database');
const { createHttpError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/response');
const { BUDGET_WARNING_THRESHOLD, BUDGET_STATUS } = require('../utils/constants');
const { MESSAGES } = require('../utils/messages');

function getMonthRange(month, year) {
  const m = String(month).padStart(2, '0');
  const startDate = `${year}-${m}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${m}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

function resolvePeriod(query) {
  const now = new Date();
  const month = query.month ? Number(query.month) : now.getMonth() + 1;
  const year = query.year ? Number(query.year) : now.getFullYear();

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw createHttpError(400, MESSAGES.MONTH_INVALID);
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw createHttpError(400, MESSAGES.YEAR_INVALID);
  }

  return { month, year, ...getMonthRange(month, year) };
}

function getBudgetStatusLabel(spent, budgetAmount) {
  if (spent > budgetAmount) {
    return BUDGET_STATUS.EXCEEDED;
  }
  if (spent >= budgetAmount * BUDGET_WARNING_THRESHOLD) {
    return BUDGET_STATUS.WARNING;
  }
  return BUDGET_STATUS.SAFE;
}

async function getUserSummary(req, res) {
  const { month, year, startDate, endDate } = resolvePeriod(req.query);
  const userId = req.user.id;

  const totalBalanceRow = await get(
    `SELECT COALESCE(SUM(current_balance), 0) AS total FROM accounts
     WHERE user_id = ? AND deleted_at IS NULL`,
    [userId]
  );

  const incomeRow = await get(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
     WHERE user_id = ? AND type = 'income' AND date >= ? AND date <= ?`,
    [userId, startDate, endDate]
  );

  const expenseRow = await get(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
     WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
    [userId, startDate, endDate]
  );

  const monthlyIncome = incomeRow.total;
  const monthlyExpense = expenseRow.total;
  const monthlySaving = monthlyIncome - monthlyExpense;
  const savingRate = monthlyIncome > 0 ? Number(((monthlySaving / monthlyIncome) * 100).toFixed(2)) : 0;

  const topCategoryRow = await get(
    `SELECT c.name AS category_name, SUM(t.amount) AS total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
     GROUP BY c.id
     ORDER BY total DESC
     LIMIT 1`,
    [userId, startDate, endDate]
  );

  const recentRows = await all(
    `SELECT t.id, t.type, t.amount, t.date, t.note, t.account_id, t.category_id,
            c.name AS category_name, a.name AS account_name
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN accounts a ON a.id = t.account_id
     WHERE t.user_id = ?
     ORDER BY t.date DESC, t.id DESC
     LIMIT 10`,
    [userId]
  );

  const dailyExpenseRows = await all(
    `SELECT date, SUM(amount) AS total
     FROM transactions
     WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?
     GROUP BY date
     ORDER BY date ASC`,
    [userId, startDate, endDate]
  );

  const dailyExpenseChart = dailyExpenseRows.map((row) => ({
    date: row.date,
    amount: row.total,
  }));

  return sendSuccess(res, {
    total_balance: totalBalanceRow.total,
    monthly_income: monthlyIncome,
    monthly_expense: monthlyExpense,
    monthly_saving: monthlySaving,
    saving_rate: savingRate,
    biggest_expense_category: topCategoryRow ? topCategoryRow.category_name : null,
    recent_transactions: recentRows,
    daily_expense_chart: dailyExpenseChart,
    income_vs_expense: {
      income: monthlyIncome,
      expense: monthlyExpense,
    },
    period: { month, year, startDate, endDate },
  });
}

async function getUserMonthlyReport(req, res) {
  const { month, year, startDate, endDate } = resolvePeriod(req.query);
  const userId = req.user.id;

  const incomeRow = await get(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
     WHERE user_id = ? AND type = 'income' AND date >= ? AND date <= ?`,
    [userId, startDate, endDate]
  );

  const expenseRow = await get(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
     WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
    [userId, startDate, endDate]
  );

  const monthlyIncome = incomeRow.total;
  const monthlyExpense = expenseRow.total;

  const topCategoryRow = await get(
    `SELECT c.name AS category_name, SUM(t.amount) AS total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
     GROUP BY c.id
     ORDER BY total DESC
     LIMIT 1`,
    [userId, startDate, endDate]
  );

  return sendSuccess(res, {
    monthly_income: monthlyIncome,
    monthly_expense: monthlyExpense,
    monthly_saving: monthlyIncome - monthlyExpense,
    saving_rate: monthlyIncome > 0
      ? Number((((monthlyIncome - monthlyExpense) / monthlyIncome) * 100).toFixed(2))
      : 0,
    top_category: topCategoryRow ? topCategoryRow.category_name : null,
    period: { month, year, startDate, endDate },
  });
}

async function getCategoryBreakdown(req, res) {
  const { month, year, startDate, endDate } = resolvePeriod(req.query);
  const userId = req.user.id;

  const expenseRows = await all(
    `SELECT c.id, c.name, c.color, c.icon, SUM(t.amount) AS total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
     GROUP BY c.id
     ORDER BY total DESC`,
    [userId, startDate, endDate]
  );

  const incomeRows = await all(
    `SELECT c.id, c.name, c.color, c.icon, SUM(t.amount) AS total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = ? AND t.type = 'income' AND t.date >= ? AND t.date <= ?
     GROUP BY c.id
     ORDER BY total DESC`,
    [userId, startDate, endDate]
  );

  const totalExpense = expenseRows.reduce((sum, row) => sum + row.total, 0);
  const totalIncome = incomeRows.reduce((sum, row) => sum + row.total, 0);

  return sendSuccess(res, {
    period: { month, year, startDate, endDate },
    category_breakdown: {
      expense: expenseRows.map((row) => ({
        category_id: row.id,
        name: row.name,
        color: row.color,
        icon: row.icon,
        amount: row.total,
        percent: totalExpense > 0 ? Number(((row.total / totalExpense) * 100).toFixed(2)) : 0,
      })),
      income: incomeRows.map((row) => ({
        category_id: row.id,
        name: row.name,
        color: row.color,
        icon: row.icon,
        amount: row.total,
        percent: totalIncome > 0 ? Number(((row.total / totalIncome) * 100).toFixed(2)) : 0,
      })),
    },
  });
}

module.exports = {
  getUserSummary,
  getUserMonthlyReport,
  getCategoryBreakdown,
  getBudgetStatusLabel,
  resolvePeriod,
  getMonthRange,
};
