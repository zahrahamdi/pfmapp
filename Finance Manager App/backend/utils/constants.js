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

const ACCOUNT_TYPES = ['cash', 'bank', 'wallet', 'savings', 'credit', 'other'];

const CATEGORY_TYPES = ['income', 'expense'];

const TRANSACTION_TYPES = ['income', 'expense', 'transfer'];

const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'online', 'other'];

const BUDGET_WARNING_THRESHOLD = 0.8;

const BUDGET_STATUS = {
  SAFE: 'safe',
  WARNING: 'warning',
  EXCEEDED: 'exceeded',
};

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'خوراک', icon: 'food', color: '#FF6B6B' },
  { name: 'حمل‌ونقل', icon: 'transport', color: '#4ECDC4' },
  { name: 'اجاره', icon: 'home', color: '#45B7D1' },
  { name: 'درمان', icon: 'health', color: '#96CEB4' },
  { name: 'تفریح', icon: 'entertainment', color: '#FFEAA7' },
  { name: 'خرید', icon: 'shopping', color: '#DDA0DD' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'حقوق', icon: 'salary', color: '#2ECC71' },
  { name: 'فریلنس', icon: 'freelance', color: '#3498DB' },
  { name: 'سرمایه‌گذاری', icon: 'investment', color: '#9B59B6' },
];

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
  ACCOUNT_TYPES,
  CATEGORY_TYPES,
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
  BUDGET_WARNING_THRESHOLD,
  BUDGET_STATUS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  LEGACY_EXPENSE_CATEGORY_MAP,
  LEGACY_INCOME_CATEGORY_MAP,
};
