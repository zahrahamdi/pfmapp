const { get, all } = require('../database');
const { getBudgetStatus, getMonthlySpentForCategory } = require('./budgetsController');
const { getCurrentMonthRange } = require('../utils/validation');
const { sendSuccess } = require('../utils/response');

async function getTotals() {
  const incomeRow = await get('SELECT COALESCE(SUM(amount), 0) AS total FROM incomes');
  const expenseRow = await get('SELECT COALESCE(SUM(amount), 0) AS total FROM expenses');
  const incomeCountRow = await get('SELECT COUNT(*) AS count FROM incomes');
  const expenseCountRow = await get('SELECT COUNT(*) AS count FROM expenses');

  const totalIncome = incomeRow.total;
  const totalExpense = expenseRow.total;

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    incomeCount: incomeCountRow.count,
    expenseCount: expenseCountRow.count,
  };
}

async function getExpenseCategoryBreakdown(whereClause = '', params = []) {
  const categoryRows = await all(
    `
      SELECT category, SUM(amount) AS total
      FROM expenses
      ${whereClause}
      GROUP BY category
      ORDER BY total DESC
    `,
    params
  );

  const categories = {};
  categoryRows.forEach((row) => {
    categories[row.category] = row.total;
  });

  const topCategory = categoryRows.length > 0 ? categoryRows[0].category : null;

  return { categories, topCategory };
}

async function getExceededBudgetCategories() {
  const budgets = await all('SELECT * FROM budgets');

  const exceeded = [];
  for (const budget of budgets) {
    const { spent } = await getMonthlySpentForCategory(budget.category);

    if (getBudgetStatus(spent, budget.limit_amount) === 'Exceeded') {
      exceeded.push(budget.category);
    }
  }

  return exceeded;
}

async function getBalance(req, res) {
  const { totalIncome, totalExpense, balance } = await getTotals();
  return sendSuccess(res, { totalIncome, totalExpense, balance });
}

async function getReport(req, res) {
  const expenseRow = await get('SELECT COALESCE(SUM(amount), 0) AS total FROM expenses');
  const expenseCountRow = await get('SELECT COUNT(*) AS count FROM expenses');
  const { categories, topCategory } = await getExpenseCategoryBreakdown();

  return sendSuccess(res, {
    totalExpense: expenseRow.total,
    expenseCount: expenseCountRow.count,
    topCategory,
    categories,
  });
}

async function getDashboardSummary(req, res) {
  const totals = await getTotals();
  const { topCategory } = await getExpenseCategoryBreakdown();
  const budgetExceeded = await getExceededBudgetCategories();

  return sendSuccess(res, {
    balance: totals.balance,
    totalIncome: totals.totalIncome,
    totalExpense: totals.totalExpense,
    topCategory,
    budgetExceeded,
    incomeCount: totals.incomeCount,
    expenseCount: totals.expenseCount,
  });
}

async function getMonthlyReport(req, res) {
  const { startDate, endDate } = getCurrentMonthRange();

  const incomeRow = await get(
    'SELECT COALESCE(SUM(amount), 0) AS total FROM incomes WHERE date >= ? AND date <= ?',
    [startDate, endDate]
  );

  const expenseRow = await get(
    'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE date >= ? AND date <= ?',
    [startDate, endDate]
  );

  const monthlyIncome = incomeRow.total;
  const monthlyExpense = expenseRow.total;

  const { topCategory } = await getExpenseCategoryBreakdown(
    'WHERE date >= ? AND date <= ?',
    [startDate, endDate]
  );

  return sendSuccess(res, {
    monthlyIncome,
    monthlyExpense,
    monthlyBalance: monthlyIncome - monthlyExpense,
    topCategory,
    period: { startDate, endDate },
  });
}

module.exports = {
  getBalance,
  getReport,
  getDashboardSummary,
  getMonthlyReport,
};
