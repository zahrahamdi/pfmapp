const { EXPENSE_CATEGORIES, INCOME_CATEGORIES } = require('./constants');

function validateTitle(title) {
  const errors = [];

  if (title === undefined || title === null || title === '') {
    errors.push('Title is required');
    return errors;
  }

  if (typeof title !== 'string' || title.trim() === '') {
    errors.push('Title is required');
    return errors;
  }

  if (title.trim().length < 2) {
    errors.push('Title must be at least 2 characters');
  }

  return errors;
}

function validateAmount(amount, fieldName = 'Amount') {
  const errors = [];

  if (amount === undefined || amount === null || amount === '') {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.push(`${fieldName} must be greater than 0`);
  }

  return errors;
}

function validateDate(date) {
  const errors = [];

  if (!date || typeof date !== 'string' || date.trim() === '') {
    errors.push('Date is required');
    return errors;
  }

  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) {
    errors.push('Date must be a valid date string (e.g. 2026-01-15)');
  }

  return errors;
}

function validateExpenseCategory(category) {
  const errors = [];

  if (!category || typeof category !== 'string' || category.trim() === '') {
    errors.push('Category is required');
    return errors;
  }

  if (!EXPENSE_CATEGORIES.includes(category.trim())) {
    errors.push(`Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
  }

  return errors;
}

function validateIncomeCategory(category) {
  const errors = [];

  if (!category || typeof category !== 'string' || category.trim() === '') {
    errors.push('Category is required');
    return errors;
  }

  if (!INCOME_CATEGORIES.includes(category.trim())) {
    errors.push(`Category must be one of: ${INCOME_CATEGORIES.join(', ')}`);
  }

  return errors;
}

function validateIncome({ title, amount, category, date }) {
  return [
    ...validateTitle(title),
    ...validateAmount(amount),
    ...validateIncomeCategory(category),
    ...validateDate(date),
  ];
}

function validateExpense({ title, amount, category, date }) {
  return [
    ...validateTitle(title),
    ...validateAmount(amount),
    ...validateExpenseCategory(category),
    ...validateDate(date),
  ];
}

function validateBudget({ category, limit_amount }) {
  const errors = [...validateExpenseCategory(category)];

  if (limit_amount === undefined || limit_amount === null || limit_amount === '') {
    errors.push('limit_amount is required');
  } else {
    const parsedLimit = Number(limit_amount);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      errors.push('limit_amount must be greater than 0');
    }
  }

  return errors;
}

function validateSavingsGoal({ target_amount }) {
  return validateAmount(target_amount, 'target_amount');
}

function parsePositiveAmount(amount) {
  return Math.round(Number(amount));
}

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const startDate = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

module.exports = {
  validateTitle,
  validateAmount,
  validateDate,
  validateExpenseCategory,
  validateIncomeCategory,
  validateIncome,
  validateExpense,
  validateBudget,
  validateSavingsGoal,
  parsePositiveAmount,
  getCurrentMonthRange,
};
