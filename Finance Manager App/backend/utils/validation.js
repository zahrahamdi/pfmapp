const { EXPENSE_CATEGORIES, INCOME_CATEGORIES, ACCOUNT_TYPES, CATEGORY_TYPES, TRANSACTION_TYPES, PAYMENT_METHODS } = require('./constants');

function validateTitle(title) {
  const errors = [];

  if (title === undefined || title === null || title === '') {
    errors.push('عنوان الزامی است');
    return errors;
  }

  if (typeof title !== 'string' || title.trim() === '') {
    errors.push('عنوان الزامی است');
    return errors;
  }

  if (title.trim().length < 2) {
    errors.push('عنوان باید حداقل ۲ کاراکتر باشد');
  }

  return errors;
}

function validateAmount(amount, fieldName = 'مبلغ') {
  const errors = [];

  if (amount === undefined || amount === null || amount === '') {
    errors.push(`${fieldName} الزامی است`);
    return errors;
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.push(`${fieldName} باید بزرگ‌تر از ۰ باشد`);
  }

  return errors;
}

function validateDate(date) {
  const errors = [];

  if (!date || typeof date !== 'string' || date.trim() === '') {
    errors.push('تاریخ الزامی است');
    return errors;
  }

  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) {
    errors.push('تاریخ باید معتبر باشد (مثال: 2026-01-15)');
  }

  return errors;
}

function validateExpenseCategory(category) {
  const errors = [];

  if (!category || typeof category !== 'string' || category.trim() === '') {
    errors.push('دسته‌بندی الزامی است');
    return errors;
  }

  if (!EXPENSE_CATEGORIES.includes(category.trim())) {
    errors.push(`دسته‌بندی باید یکی از موارد زیر باشد: ${EXPENSE_CATEGORIES.join('، ')}`);
  }

  return errors;
}

function validateIncomeCategory(category) {
  const errors = [];

  if (!category || typeof category !== 'string' || category.trim() === '') {
    errors.push('دسته‌بندی الزامی است');
    return errors;
  }

  if (!INCOME_CATEGORIES.includes(category.trim())) {
    errors.push(`دسته‌بندی باید یکی از موارد زیر باشد: ${INCOME_CATEGORIES.join('، ')}`);
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
    errors.push('سقف بودجه (limit_amount) الزامی است');
  } else {
    const parsedLimit = Number(limit_amount);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      errors.push('سقف بودجه باید بزرگ‌تر از ۰ باشد');
    }
  }

  return errors;
}

function validateSavingsGoal({ target_amount }) {
  return validateAmount(target_amount, 'مبلغ هدف');
}

function validateEmail(email) {
  const errors = [];
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('ایمیل الزامی است');
    return errors;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    errors.push('ایمیل باید معتبر باشد');
  }
  return errors;
}

function validatePassword(password) {
  const errors = [];
  if (!password || typeof password !== 'string') {
    errors.push('رمز عبور الزامی است');
    return errors;
  }
  if (password.length < 6) {
    errors.push('رمز عبور باید حداقل ۶ کاراکتر باشد');
  }
  return errors;
}

function validateName(name) {
  const errors = [];
  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('نام الزامی است');
    return errors;
  }
  if (name.trim().length < 2) {
    errors.push('نام باید حداقل ۲ کاراکتر باشد');
  }
  return errors;
}

function validateRegister({ name, email, password }) {
  return [...validateName(name), ...validateEmail(email), ...validatePassword(password)];
}

function validateLogin({ email, password }) {
  const errors = [...validateEmail(email)];
  if (!password || typeof password !== 'string' || password === '') {
    errors.push('رمز عبور الزامی است');
  }
  return errors;
}

function validateAccount({ name, type, initial_balance, currency }, options = { requireBalance: true }) {
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('نام حساب الزامی است');
  }

  if (!type || !ACCOUNT_TYPES.includes(type)) {
    errors.push(`نوع حساب باید یکی از موارد زیر باشد: ${ACCOUNT_TYPES.join('، ')}`);
  }

  if (options.requireBalance && initial_balance !== undefined && initial_balance !== null && initial_balance !== '') {
    const parsed = Number(initial_balance);
    if (!Number.isFinite(parsed)) {
      errors.push('موجودی اولیه باید عدد معتبر باشد');
    }
  }

  if (currency !== undefined && currency !== null && currency !== '') {
    if (typeof currency !== 'string' || currency.trim().length < 3) {
      errors.push('واحد پول باید کد معتبر باشد');
    }
  }

  return errors;
}

function validateCategory({ name, type, icon, color }) {
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('نام دسته‌بندی الزامی است');
  }

  if (!type || !CATEGORY_TYPES.includes(type)) {
    errors.push(`نوع دسته‌بندی باید income یا expense باشد`);
  }

  if (icon !== undefined && icon !== null && typeof icon !== 'string') {
    errors.push('آیکون باید رشته متنی باشد');
  }

  if (color !== undefined && color !== null && typeof color !== 'string') {
    errors.push('رنگ باید رشته متنی باشد');
  }

  return errors;
}

function validateTransaction(body) {
  const errors = [];

  if (!body.type || !TRANSACTION_TYPES.includes(body.type)) {
    errors.push(`نوع تراکنش باید یکی از موارد زیر باشد: ${TRANSACTION_TYPES.join('، ')}`);
  }

  errors.push(...validateAmount(body.amount, 'مبلغ'));
  errors.push(...validateDate(body.date));

  if (!body.account_id) {
    errors.push('شناسه حساب (account_id) الزامی است');
  }

  if (body.type === 'transfer') {
    if (!body.target_account_id) {
      errors.push('برای انتقال، شناسه حساب مقصد (target_account_id) الزامی است');
    }
  } else if (!body.category_id) {
    errors.push('شناسه دسته‌بندی (category_id) الزامی است');
  }

  if (body.payment_method && !PAYMENT_METHODS.includes(body.payment_method)) {
    errors.push(`روش پرداخت باید یکی از موارد زیر باشد: ${PAYMENT_METHODS.join('، ')}`);
  }

  if (body.tags !== undefined && body.tags !== null && !Array.isArray(body.tags)) {
    errors.push('برچسب‌ها باید آرایه باشند');
  }

  return errors;
}

function validateUserBudget({ category_id, amount, month, year }) {
  const errors = [];

  if (!category_id) {
    errors.push('شناسه دسته‌بندی الزامی است');
  }

  errors.push(...validateAmount(amount, 'مبلغ بودجه'));

  const parsedMonth = Number(month);
  if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    errors.push('ماه باید بین ۱ تا ۱۲ باشد');
  }

  const parsedYear = Number(year);
  if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
    errors.push('سال باید معتبر باشد');
  }

  return errors;
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

function parsePositiveAmount(amount, allowZero = false) {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) {
    return NaN;
  }
  if (allowZero) {
    return parsed;
  }
  return Math.round(parsed);
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
  validateRegister,
  validateLogin,
  validateAccount,
  validateCategory,
  validateTransaction,
  validateUserBudget,
  parsePositiveAmount,
  getCurrentMonthRange,
};
