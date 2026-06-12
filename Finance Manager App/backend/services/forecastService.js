const { get, all } = require('../database');

const FORECAST_BASIS_MONTHS = 3;
const ABNORMAL_GROWTH_THRESHOLD = 0.25;

const RECENCY_WEIGHTS = [0.25, 0.35, 0.4];

function roundAmount(value) {
  return Math.round(Number(value) || 0);
}

function getMonthLabel(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function getPastCompletedMonths(count, referenceDate = new Date()) {
  const months = [];
  let year = referenceDate.getFullYear();
  let month = referenceDate.getMonth() + 1;

  for (let i = 0; i < count; i += 1) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    months.unshift({ year, month, label: getMonthLabel(year, month) });
  }

  return months;
}

function getNextMonth(referenceDate = new Date()) {
  let year = referenceDate.getFullYear();
  let month = referenceDate.getMonth() + 2;

  if (month > 12) {
    month = 1;
    year += 1;
  }

  return { year, month, label: getMonthLabel(year, month) };
}

function getMonthDateRange(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

async function getTransactionMonthCount(userId) {
  const row = await get(
    `SELECT COUNT(DISTINCT strftime('%Y-%m', date)) AS count
     FROM transactions WHERE user_id = ?`,
    [userId]
  );
  return row ? row.count : 0;
}

async function hasAnyTransactions(userId) {
  const row = await get('SELECT COUNT(*) AS count FROM transactions WHERE user_id = ?', [userId]);
  return row.count > 0;
}

async function getMonthlyTotals(userId, year, month) {
  const { startDate, endDate } = getMonthDateRange(year, month);

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

  const income = roundAmount(incomeRow.total);
  const expense = roundAmount(expenseRow.total);

  return {
    income,
    expense,
    saving: income - expense,
  };
}

function getConfidenceLevel(monthsWithData) {
  if (monthsWithData < 3) {
    return 'low';
  }
  if (monthsWithData <= 6) {
    return 'medium';
  }
  return 'high';
}

function detectTrend(values) {
  if (!values || values.length < 2) {
    return 'stable';
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const slope = (values[values.length - 1] - values[0]) / (values.length - 1);
  const threshold = Math.max(average * 0.05, 1);

  if (slope > threshold) {
    return 'increasing';
  }
  if (slope < -threshold) {
    return 'decreasing';
  }
  return 'stable';
}

function predictFromSeries(values) {
  if (!values || values.length === 0) {
    return 0;
  }

  if (values.length === 1) {
    return roundAmount(values[0]);
  }

  const weights = RECENCY_WEIGHTS.slice(RECENCY_WEIGHTS.length - values.length);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const weightedAverage = values.reduce((sum, value, index) => sum + value * weights[index], 0) / weightSum;
  const slope = (values[values.length - 1] - values[0]) / (values.length - 1);

  return roundAmount(Math.max(0, weightedAverage + slope * 0.5));
}

function savingRate(income, expense) {
  if (income <= 0) {
    return 0;
  }
  return Number((((income - expense) / income) * 100).toFixed(2));
}

async function getCategoryMonthlyTotals(userId, year, month) {
  const { startDate, endDate } = getMonthDateRange(year, month);

  return all(
    `SELECT c.id AS category_id, c.name AS category_name, COALESCE(SUM(t.amount), 0) AS total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
     GROUP BY c.id, c.name`,
    [userId, startDate, endDate]
  );
}

async function buildCategoryPredictions(userId, basisMonths) {
  const allCategories = await all(
    `SELECT id AS category_id, name AS category_name FROM categories
     WHERE user_id = ? AND type = 'expense' ORDER BY name ASC`,
    [userId]
  );

  const categoryMap = new Map(
    allCategories.map((category) => [
      category.category_id,
      {
        category_id: category.category_id,
        category_name: category.category_name,
        values: [],
      },
    ])
  );

  for (const period of basisMonths) {
    const rows = await getCategoryMonthlyTotals(userId, period.year, period.month);
    const monthTotals = new Map(rows.map((row) => [row.category_id, roundAmount(row.total)]));

    allCategories.forEach((category) => {
      categoryMap.get(category.category_id).values.push(monthTotals.get(category.category_id) || 0);
    });
  }

  const predictions = [];
  const abnormalCategories = [];

  categoryMap.forEach((entry) => {
    const predictedAmount = predictFromSeries(entry.values);
    const trend = detectTrend(entry.values);

    predictions.push({
      category_id: entry.category_id,
      category_name: entry.category_name,
      predicted_amount: predictedAmount,
      trend,
    });

    if (entry.values.length >= 2 && entry.values[0] > 0) {
      const growthRate = (entry.values[entry.values.length - 1] - entry.values[0]) / entry.values[0];
      if (growthRate >= ABNORMAL_GROWTH_THRESHOLD) {
        abnormalCategories.push(entry.category_name);
      }
    }
  });

  predictions.sort((a, b) => b.predicted_amount - a.predicted_amount);

  return { predictions, abnormalCategories };
}

function buildWarnings({
  incomeTrend,
  expenseTrend,
  savingTrend,
  predictedSaving,
  averageSaving,
  abnormalCategories,
  categoryPredictions,
}) {
  const warnings = [];

  if (expenseTrend === 'increasing') {
    warnings.push('هزینه‌های کلی شما نسبت به ماه‌های قبل در حال افزایش است.');
  }

  if (savingTrend === 'decreasing') {
    warnings.push('پس‌انداز پیش‌بینی‌شده ماه آینده کمتر از میانگین ماه‌های اخیر است.');
  } else if (predictedSaving < averageSaving) {
    warnings.push('پس‌انداز پیش‌بینی‌شده ماه آینده کمتر از میانگین ۳ ماه گذشته است.');
  }

  abnormalCategories.forEach((categoryName) => {
    warnings.push(`هزینه‌های دسته «${categoryName}» نسبت به ماه‌های قبل افزایش غیرعادی داشته است.`);
  });

  const topIncreasing = categoryPredictions
    .filter((item) => item.trend === 'increasing' && item.predicted_amount > 0)
    .slice(0, 2);

  topIncreasing.forEach((item) => {
    const message = `هزینه‌های دسته «${item.category_name}» نسبت به ماه‌های قبل در حال افزایش است.`;
    if (!warnings.includes(message)) {
      warnings.push(message);
    }
  });

  if (incomeTrend === 'decreasing') {
    warnings.push('روند درآمد شما رو به کاهش است و ممکن است بر پس‌انداز ماه آینده تأثیر بگذارد.');
  }

  return warnings;
}

async function buildForecastData(userId) {
  const hasData = await hasAnyTransactions(userId);
  if (!hasData) {
    return { insufficient: true };
  }

  const monthsWithData = await getTransactionMonthCount(userId);
  const confidenceLevel = getConfidenceLevel(monthsWithData);
  const basisMonths = getPastCompletedMonths(FORECAST_BASIS_MONTHS);
  const nextMonth = getNextMonth();

  const monthlyHistory = [];
  for (const period of basisMonths) {
    const totals = await getMonthlyTotals(userId, period.year, period.month);
    monthlyHistory.push({
      month: period.label,
      year: period.year,
      monthNumber: period.month,
      ...totals,
    });
  }

  const incomeSeries = monthlyHistory.map((item) => item.income);
  const expenseSeries = monthlyHistory.map((item) => item.expense);
  const savingSeries = monthlyHistory.map((item) => item.saving);

  const predictedIncome = predictFromSeries(incomeSeries);
  const predictedExpense = predictFromSeries(expenseSeries);
  const predictedSaving = predictedIncome - predictedExpense;
  const averageSaving = savingSeries.length > 0
    ? roundAmount(savingSeries.reduce((sum, value) => sum + value, 0) / savingSeries.length)
    : 0;

  const incomeTrend = detectTrend(incomeSeries);
  const expenseTrend = detectTrend(expenseSeries);
  const savingTrend = detectTrend(savingSeries);

  const { predictions: categoryPredictions, abnormalCategories } = await buildCategoryPredictions(
    userId,
    basisMonths
  );

  const warnings = buildWarnings({
    incomeTrend,
    expenseTrend,
    savingTrend,
    predictedSaving,
    averageSaving,
    abnormalCategories,
    categoryPredictions,
  });

  return {
    insufficient: false,
    predicted_income: predictedIncome,
    predicted_expense: predictedExpense,
    predicted_saving: predictedSaving,
    predicted_saving_rate: savingRate(predictedIncome, predictedExpense),
    expected_balance_change: predictedSaving,
    confidence_level: confidenceLevel,
    months_analyzed: basisMonths.length,
    months_with_data: monthsWithData,
    target_month: nextMonth.label,
    trend_summary: {
      income_trend: incomeTrend,
      expense_trend: expenseTrend,
      saving_trend: savingTrend,
    },
    warnings,
    category_predictions: categoryPredictions,
    monthly_history: monthlyHistory,
  };
}

module.exports = {
  buildForecastData,
  FORECAST_BASIS_MONTHS,
};
