const EXPENSE_CATEGORIES = [
  'غذا',
  'حمل‌ونقل',
  'قبض',
  'تفریح',
  'خرید',
  'سلامت',
  'آموزش',
  'سفر',
  'سایر',
];

const INCOME_CATEGORIES = [
  'حقوق',
  'فریلنس',
  'هدیه',
  'پاداش',
  'سرمایه‌گذاری',
  'سایر',
];

const BUDGET_WARNING_THRESHOLD = 0.8;

/** Maps legacy English category values to Persian (one-time migration). */
const LEGACY_EXPENSE_CATEGORY_MAP = {
  Food: 'غذا',
  Transport: 'حمل‌ونقل',
  Entertainment: 'تفریح',
  Bills: 'قبض',
  Shopping: 'خرید',
  Health: 'سلامت',
  Education: 'آموزش',
  Other: 'سایر',
};

const LEGACY_INCOME_CATEGORY_MAP = {
  Salary: 'حقوق',
  Freelance: 'فریلنس',
  Gift: 'هدیه',
  Bonus: 'پاداش',
  Other: 'سایر',
};

module.exports = {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  BUDGET_WARNING_THRESHOLD,
  LEGACY_EXPENSE_CATEGORY_MAP,
  LEGACY_INCOME_CATEGORY_MAP,
};
