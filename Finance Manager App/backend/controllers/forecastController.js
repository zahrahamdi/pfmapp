const { sendSuccess } = require('../utils/response');
const { buildForecastData } = require('../services/forecastService');
const { MESSAGES, TREND_FA, CONFIDENCE_FA } = require('../utils/messages');

function sendInsufficientForecast(res) {
  return res.status(200).json({
    success: false,
    message: MESSAGES.FORECAST_NO_DATA,
    errors: [],
  });
}

function mapTrend(trend) {
  return TREND_FA[trend] || trend;
}

function mapConfidence(level) {
  return CONFIDENCE_FA[level] || level;
}

function mapCategoryPrediction(item) {
  return {
    category_id: item.category_id,
    category_name: item.category_name,
    predicted_amount: item.predicted_amount,
    trend: mapTrend(item.trend),
  };
}

function mapForecastCore(forecast) {
  return {
    predicted_income: forecast.predicted_income,
    predicted_expense: forecast.predicted_expense,
    predicted_saving: forecast.predicted_saving,
    predicted_saving_rate: forecast.predicted_saving_rate,
    expected_balance_change: forecast.expected_balance_change,
    confidence_level: mapConfidence(forecast.confidence_level),
    target_month: forecast.target_month,
    months_analyzed: forecast.months_analyzed,
    months_with_data: forecast.months_with_data,
    trend_summary: {
      income_trend: mapTrend(forecast.trend_summary.income_trend),
      expense_trend: mapTrend(forecast.trend_summary.expense_trend),
      saving_trend: mapTrend(forecast.trend_summary.saving_trend),
    },
    warnings: forecast.warnings,
    category_predictions: forecast.category_predictions.map(mapCategoryPrediction),
  };
}

async function getNextMonthForecast(req, res) {
  const forecast = await buildForecastData(req.user.id);

  if (forecast.insufficient) {
    return sendInsufficientForecast(res);
  }

  return sendSuccess(res, mapForecastCore(forecast));
}

async function getCashflowForecast(req, res) {
  const forecast = await buildForecastData(req.user.id);

  if (forecast.insufficient) {
    return sendInsufficientForecast(res);
  }

  const actual = forecast.monthly_history.map((item) => ({
    month: item.month,
    income: item.income,
    expense: item.expense,
    saving: item.saving,
    type: 'actual',
    type_label: 'واقعی',
  }));

  const predicted = {
    month: forecast.target_month,
    income: forecast.predicted_income,
    expense: forecast.predicted_expense,
    saving: forecast.predicted_saving,
    type: 'predicted',
    type_label: 'پیش‌بینی‌شده',
  };

  return sendSuccess(res, {
    confidence_level: mapConfidence(forecast.confidence_level),
    target_month: forecast.target_month,
    cashflow: [...actual, predicted],
  });
}

async function getCategoriesForecast(req, res) {
  const forecast = await buildForecastData(req.user.id);

  if (forecast.insufficient) {
    return sendInsufficientForecast(res);
  }

  return sendSuccess(res, {
    confidence_level: mapConfidence(forecast.confidence_level),
    target_month: forecast.target_month,
    categories: forecast.category_predictions.map(mapCategoryPrediction),
  });
}

module.exports = {
  getNextMonthForecast,
  getCashflowForecast,
  getCategoriesForecast,
};
