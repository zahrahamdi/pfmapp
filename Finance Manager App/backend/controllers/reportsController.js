const { get, all } = require('../database');
const { createHttpError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/response');
const { MESSAGES } = require('../utils/messages');

function parseDateRange(query) {
  const { from, to } = query;

  if (!from || !to) {
    throw createHttpError(400, MESSAGES.DATE_RANGE_REQUIRED);
  }

  if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) {
    throw createHttpError(400, MESSAGES.DATE_INVALID);
  }

  if (from > to) {
    throw createHttpError(400, MESSAGES.DATE_ORDER_INVALID);
  }

  return { from, to };
}

async function getOverview(req, res) {
  const { from, to } = parseDateRange(req.query);
  const userId = req.user.id;

  const incomeRow = await get(
    `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM transactions
     WHERE user_id = ? AND type = 'income' AND date >= ? AND date <= ?`,
    [userId, from, to]
  );

  const expenseRow = await get(
    `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM transactions
     WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
    [userId, from, to]
  );

  const transferRow = await get(
    `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM transactions
     WHERE user_id = ? AND type = 'transfer' AND date >= ? AND date <= ?`,
    [userId, from, to]
  );

  const totalIncome = incomeRow.total;
  const totalExpense = expenseRow.total;
  const netCashflow = totalIncome - totalExpense;

  return sendSuccess(res, {
    period: { from, to },
    income: { total: totalIncome, count: incomeRow.count },
    expense: { total: totalExpense, count: expenseRow.count },
    transfer: { total: transferRow.total, count: transferRow.count },
    net_cashflow: netCashflow,
    saving_rate: totalIncome > 0 ? Number(((netCashflow / totalIncome) * 100).toFixed(2)) : 0,
  });
}

async function getCashflow(req, res) {
  const { from, to } = parseDateRange(req.query);
  const userId = req.user.id;

  const dailyRows = await all(
    `SELECT date,
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
     FROM transactions
     WHERE user_id = ? AND date >= ? AND date <= ?
     GROUP BY date
     ORDER BY date ASC`,
    [userId, from, to]
  );

  const monthlyRows = await all(
    `SELECT strftime('%Y-%m', date) AS month,
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
     FROM transactions
     WHERE user_id = ? AND date >= ? AND date <= ?
     GROUP BY strftime('%Y-%m', date)
     ORDER BY month ASC`,
    [userId, from, to]
  );

  return sendSuccess(res, {
    period: { from, to },
    daily: dailyRows.map((row) => ({
      date: row.date,
      income: row.income,
      expense: row.expense,
      net: row.income - row.expense,
    })),
    monthly: monthlyRows.map((row) => ({
      month: row.month,
      income: row.income,
      expense: row.expense,
      net: row.income - row.expense,
    })),
  });
}

async function getCategoriesReport(req, res) {
  const { from, to } = parseDateRange(req.query);
  const userId = req.user.id;

  const expenseRows = await all(
    `SELECT c.id, c.name, c.color, c.icon, SUM(t.amount) AS total, COUNT(t.id) AS count
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
     GROUP BY c.id
     ORDER BY total DESC`,
    [userId, from, to]
  );

  const incomeRows = await all(
    `SELECT c.id, c.name, c.color, c.icon, SUM(t.amount) AS total, COUNT(t.id) AS count
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = ? AND t.type = 'income' AND t.date >= ? AND t.date <= ?
     GROUP BY c.id
     ORDER BY total DESC`,
    [userId, from, to]
  );

  const totalExpense = expenseRows.reduce((sum, r) => sum + r.total, 0);
  const totalIncome = incomeRows.reduce((sum, r) => sum + r.total, 0);

  return sendSuccess(res, {
    period: { from, to },
    expense_categories: expenseRows.map((row) => ({
      category_id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      total: row.total,
      count: row.count,
      percent: totalExpense > 0 ? Number(((row.total / totalExpense) * 100).toFixed(2)) : 0,
    })),
    income_categories: incomeRows.map((row) => ({
      category_id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      total: row.total,
      count: row.count,
      percent: totalIncome > 0 ? Number(((row.total / totalIncome) * 100).toFixed(2)) : 0,
    })),
  });
}

async function getAccountsReport(req, res) {
  const { from, to } = parseDateRange(req.query);
  const userId = req.user.id;

  const accounts = await all(
    `SELECT id, name, type, current_balance, currency FROM accounts
     WHERE user_id = ? AND deleted_at IS NULL
     ORDER BY name ASC`,
    [userId]
  );

  const accountReports = await Promise.all(
    accounts.map(async (account) => {
      const incomeRow = await get(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
         WHERE user_id = ? AND account_id = ? AND type = 'income' AND date >= ? AND date <= ?`,
        [userId, account.id, from, to]
      );

      const expenseRow = await get(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
         WHERE user_id = ? AND account_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
        [userId, account.id, from, to]
      );

      const transferOutRow = await get(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
         WHERE user_id = ? AND account_id = ? AND type = 'transfer' AND date >= ? AND date <= ?`,
        [userId, account.id, from, to]
      );

      const transferInRow = await get(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
         WHERE user_id = ? AND target_account_id = ? AND type = 'transfer' AND date >= ? AND date <= ?`,
        [userId, account.id, from, to]
      );

      return {
        account_id: account.id,
        name: account.name,
        type: account.type,
        currency: account.currency,
        current_balance: account.current_balance,
        period_income: incomeRow.total,
        period_expense: expenseRow.total,
        period_transfer_out: transferOutRow.total,
        period_transfer_in: transferInRow.total,
        period_net: incomeRow.total - expenseRow.total - transferOutRow.total + transferInRow.total,
      };
    })
  );

  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);

  return sendSuccess(res, {
    period: { from, to },
    total_balance: totalBalance,
    accounts: accountReports,
  });
}

module.exports = {
  getOverview,
  getCashflow,
  getCategoriesReport,
  getAccountsReport,
  parseDateRange,
};
