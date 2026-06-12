const MESSAGES = {
  VALIDATION_FAILED: 'اعتبارسنجی ناموفق بود',
  INTERNAL_ERROR: 'خطای داخلی سرور',
  ROUTE_NOT_FOUND: 'مسیر یافت نشد',
  DUPLICATE_RECORD: 'رکوردی با این مقدار از قبل وجود دارد',
  API_RUNNING: 'API مدیریت مالی در حال اجراست',

  UNAUTHORIZED_TOKEN: 'دسترسی غیرمجاز — توکن Bearer الزامی است',
  UNAUTHORIZED_INVALID: 'دسترسی غیرمجاز — توکن نامعتبر یا منقضی شده است',
  JWT_NOT_CONFIGURED: 'کلید JWT پیکربندی نشده است',
  RATE_LIMIT_AUTH: 'تلاش‌های ورود بیش از حد مجاز است، لطفاً بعداً دوباره تلاش کنید',

  EMAIL_EXISTS: 'این ایمیل قبلاً ثبت شده است',
  INVALID_CREDENTIALS: 'ایمیل یا رمز عبور نامعتبر است',
  USER_NOT_FOUND: 'کاربر یافت نشد',

  ACCOUNT_NOT_FOUND: 'حساب یافت نشد',
  ACCOUNT_SOFT_DELETED: 'حساب با موفقیت به‌صورت نرم حذف شد',
  ACCOUNT_DELETED: 'حساب با موفقیت حذف شد',

  CATEGORY_NOT_FOUND: 'دسته‌بندی یافت نشد',
  CATEGORY_EXISTS: 'دسته‌بندی با این نام و نوع از قبل وجود دارد',
  CATEGORY_HAS_TRANSACTIONS: 'امکان حذف دسته‌بندی دارای تراکنش وجود ندارد',
  CATEGORY_DELETED: 'دسته‌بندی با موفقیت حذف شد',

  TRANSACTION_NOT_FOUND: 'تراکنش یافت نشد',
  TRANSACTION_DELETED: 'تراکنش با موفقیت حذف شد',
  INVALID_ACCOUNT: 'شناسه حساب نامعتبر است',
  INVALID_TARGET_ACCOUNT: 'شناسه حساب مقصد نامعتبر است',
  ACCOUNTS_MUST_DIFFER: 'حساب مبدا و مقصد باید متفاوت باشند',
  INVALID_CATEGORY: 'شناسه دسته‌بندی نامعتبر است',
  CATEGORY_MUST_INCOME: 'دسته‌بندی باید از نوع درآمد باشد',
  CATEGORY_MUST_EXPENSE: 'دسته‌بندی باید از نوع هزینه باشد',
  BALANCE_UPDATE_FAILED: 'به‌روزرسانی موجودی حساب ناموفق بود',

  BUDGET_NOT_FOUND: 'بودجه یافت نشد',
  BUDGET_EXISTS: 'بودجه برای این دسته‌بندی از قبل وجود دارد',
  BUDGET_MONTH_EXISTS: 'بودجه برای این دسته‌بندی در ماه انتخاب‌شده از قبل وجود دارد',
  BUDGET_INVALID_CATEGORY: 'شناسه دسته‌بندی باید یک دسته‌بندی هزینه معتبر باشد',
  BUDGET_DELETED: 'بودجه با موفقیت حذف شد',

  INCOME_NOT_FOUND: 'درآمد یافت نشد',
  INCOME_DELETED: 'درآمد با موفقیت حذف شد',
  EXPENSE_NOT_FOUND: 'هزینه یافت نشد',
  EXPENSE_DELETED: 'هزینه با موفقیت حذف شد',

  SAVINGS_GOAL_NOT_SET: 'هدف پس‌انداز تنظیم نشده است',

  MONTH_INVALID: 'ماه باید بین ۱ تا ۱۲ باشد',
  YEAR_INVALID: 'سال باید معتبر باشد',
  DATE_RANGE_REQUIRED: 'پارامترهای from و to الزامی هستند (YYYY-MM-DD)',
  DATE_INVALID: 'from و to باید تاریخ معتبر باشند',
  DATE_ORDER_INVALID: 'from باید قبل از to یا برابر آن باشد',
  MIN_AMOUNT_INVALID: 'حداقل مبلغ باید عدد غیرمنفی باشد',
  MAX_AMOUNT_INVALID: 'حداکثر مبلغ باید عدد غیرمنفی باشد',

  FORECAST_NO_DATA: 'داده تراکنش کافی برای تولید پیش‌بینی وجود ندارد',

  DB_SETUP_OK: 'پایگاه داده با موفقیت راه‌اندازی شد',
  DB_SETUP_FAIL: 'راه‌اندازی پایگاه داده ناموفق بود',
};

const TREND_FA = {
  stable: 'پایدار',
  increasing: 'افزایشی',
  decreasing: 'کاهشی',
};

const CONFIDENCE_FA = {
  low: 'کم',
  medium: 'متوسط',
  high: 'بالا',
};

const BUDGET_STATUS_FA = {
  safe: 'ایمن',
  warning: 'هشدار',
  exceeded: 'عبور از بودجه',
};

module.exports = {
  MESSAGES,
  TREND_FA,
  CONFIDENCE_FA,
  BUDGET_STATUS_FA,
};
