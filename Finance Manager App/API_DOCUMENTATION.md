# API Documentation — Personal Finance Manager

> کد بک‌اند در پوشه `backend/` است. اجرا: `cd backend && npm start`

**Base URL:** `http://localhost:3465`

**Swagger UI:** `http://localhost:3465/api-docs`

> پورت پیش‌فرض: `3465` (در `backend/.env`). اگر اشغال باشد، سرور اولین پورت آزاد بعدی را انتخاب می‌کند — پورت واقعی را در خروجی ترمینال ببینید.

---

## فهرست

1. [احراز هویت (Auth)](#احراز-هویت-auth)
2. [حساب‌ها (Accounts)](#حساب‌ها-accounts)
3. [دسته‌بندی‌ها (Categories)](#دسته‌بندی‌ها-categories)
4. [تراکنش‌ها (Transactions)](#تراکنش‌ها-transactions)
5. [بودجه (Budgets)](#بودجه-budgets)
6. [داشبورد (Dashboard)](#داشبورد-dashboard)
7. [گزارش‌ها (Reports)](#گزارش‌ها-reports)
8. [پیش‌بینی (Forecast)](#پیش‌بینی-forecast)
9. [APIهای Legacy (بدون auth)](#apiهای-legacy-بدون-auth)
10. [فرمت پاسخ و خطاها](#فرمت-پاسخ-و-خطاها)

---

## نمادها

| نماد | معنی |
|------|------|
| 🔓 | بدون توکن |
| 🔒 | نیاز به `Authorization: Bearer <token>` |

**Header برای endpointهای 🔒:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## سؤالات اصلی کاربر

| سؤال | Endpoint (با auth) | فیلد پاسخ |
|------|-------------------|-----------|
| چقدر درآمد داشتم؟ | `GET /api/dashboard/summary` | `data.monthly_income` |
| چقدر خرج کردم؟ | `GET /api/dashboard/summary` | `data.monthly_expense` |
| الان چقدر پول دارم؟ | `GET /api/dashboard/summary` | `data.total_balance` |
| بیشترین خرجم کجا بوده؟ | `GET /api/dashboard/category-breakdown` | `data.category_breakdown.expense[0]` |
| از بودجه رد شدم یا نه؟ | `GET /api/budgets/summary` | `data.budgets[].status` |
| این ماه چقدر پس‌انداز کردم؟ | `GET /api/dashboard/summary` | `data.monthly_saving` |
| ماه آینده چقدر خرج می‌کنم؟ | `GET /api/forecast/next-month` | `data.predicted_expense` |

---

## احراز هویت (Auth)

### `POST /api/auth/register` 🔓

ثبت‌نام کاربر جدید. دسته‌بندی‌های پیش‌فرض به‌صورت خودکار seed می‌شوند.

**Body:**

```json
{
  "name": "زینا",
  "email": "zeina@example.com",
  "password": "secret123"
}
```

**Validation:** نام ≥ ۲ کاراکتر · ایمیل معتبر · رمز ≥ ۶ کاراکتر

**Response 201:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "زینا",
      "email": "zeina@example.com",
      "created_at": "2026-06-01 10:00:00",
      "updated_at": "2026-06-01 10:00:00"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**خطاها:** `409` ایمیل تکراری · `400` اعتبارسنجی · `429` تلاش بیش از حد

---

### `POST /api/auth/login` 🔓

**Body:**

```json
{
  "email": "zeina@example.com",
  "password": "secret123"
}
```

**Response 200:** همان ساختار register (`user` + `token`)

**خطاها:** `401` ایمیل یا رمز نامعتبر

---

### `GET /api/auth/me` 🔒

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "زینا",
    "email": "zeina@example.com",
    "created_at": "2026-06-01 10:00:00",
    "updated_at": "2026-06-01 10:00:00"
  }
}
```

---

## حساب‌ها (Accounts)

همه endpointها 🔒

| Method | Endpoint | توضیح |
|--------|----------|-------|
| GET | `/api/accounts` | لیست حساب‌ها |
| POST | `/api/accounts` | ایجاد حساب |
| GET | `/api/accounts/:id` | جزئیات حساب |
| PUT | `/api/accounts/:id` | ویرایش حساب |
| DELETE | `/api/accounts/:id` | حذف (soft delete اگر تراکنش داشته باشد) |

**نوع حساب (`type`):** `cash` · `bank` · `wallet` · `savings` · `credit` · `other`

### `POST /api/accounts`

```json
{
  "name": "کیف پول اصلی",
  "type": "wallet",
  "initial_balance": 1000000,
  "currency": "IRR"
}
```

`currency` اختیاری — پیش‌فرض `IRR`

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "کیف پول اصلی",
    "type": "wallet",
    "initial_balance": 1000000,
    "current_balance": 1000000,
    "currency": "IRR",
    "created_at": "2026-06-01 10:00:00",
    "updated_at": "2026-06-01 10:00:00"
  }
}
```

### `PUT /api/accounts/:id`

```json
{
  "name": "کیف پول به‌روز",
  "type": "bank",
  "currency": "IRR"
}
```

---

## دسته‌بندی‌ها (Categories)

همه endpointها 🔒

| Method | Endpoint | توضیح |
|--------|----------|-------|
| GET | `/api/categories` | لیست — فیلتر: `?type=income` یا `?type=expense` |
| POST | `/api/categories` | ایجاد |
| GET | `/api/categories/:id` | جزئیات |
| PUT | `/api/categories/:id` | ویرایش |
| DELETE | `/api/categories/:id` | حذف (فقط اگر تراکنش نداشته باشد) |

**نوع (`type`):** `income` · `expense`

### دسته‌بندی‌های پیش‌فرض (هنگام register)

**هزینه:** خوراک · حمل‌ونقل · اجاره · درمان · تفریح · خرید

**درآمد:** حقوق · فریلنس · سرمایه‌گذاری

### `POST /api/categories`

```json
{
  "name": "سرگرمی",
  "type": "expense",
  "icon": "fun",
  "color": "#FF5733"
}
```

`icon` و `color` اختیاری

---

## تراکنش‌ها (Transactions)

همه endpointها 🔒

| Method | Endpoint | توضیح |
|--------|----------|-------|
| GET | `/api/transactions` | لیست با فیلتر |
| POST | `/api/transactions` | ایجاد |
| GET | `/api/transactions/:id` | جزئیات |
| PUT | `/api/transactions/:id` | ویرایش |
| DELETE | `/api/transactions/:id` | حذف |

**نوع (`type`):** `income` · `expense` · `transfer`

**روش پرداخت (`payment_method`):** `cash` · `card` · `transfer` · `online` · `other`

### فیلترهای `GET /api/transactions`

| پارامتر | توضیح |
|---------|-------|
| `from` | تاریخ شروع `YYYY-MM-DD` |
| `to` | تاریخ پایان |
| `type` | `income` / `expense` / `transfer` |
| `category_id` | شناسه دسته‌بندی |
| `account_id` | شناسه حساب |
| `min_amount` | حداقل مبلغ |
| `max_amount` | حداکثر مبلغ |
| `search` | جستجو در note و tags |

### `POST /api/transactions` — درآمد یا هزینه

```json
{
  "type": "expense",
  "amount": 500000,
  "date": "2026-06-05",
  "account_id": 1,
  "category_id": 3,
  "note": "خرید مواد غذایی",
  "payment_method": "card",
  "tags": ["خوراک", "سوپرمارکت"]
}
```

### `POST /api/transactions` — انتقال

```json
{
  "type": "transfer",
  "amount": 200000,
  "date": "2026-06-05",
  "account_id": 1,
  "target_account_id": 2,
  "note": "انتقال به بانک"
}
```

> برای `transfer` نیازی به `category_id` نیست. `account_id` = مبدا، `target_account_id` = مقصد.

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "account_id": 1,
    "category_id": 3,
    "type": "expense",
    "amount": 500000,
    "date": "2026-06-05",
    "note": "خرید مواد غذایی",
    "tags": ["خوراک", "سوپرمارکت"],
    "payment_method": "card",
    "target_account_id": null,
    "created_at": "2026-06-05 12:00:00",
    "updated_at": "2026-06-05 12:00:00"
  }
}
```

---

## بودجه (Budgets)

### بودجه کاربر (با Bearer Token) 🔒

| Method | Endpoint | توضیح |
|--------|----------|-------|
| GET | `/api/budgets` | لیست — فیلتر: `?month=6&year=2026` |
| POST | `/api/budgets` | ایجاد |
| GET | `/api/budgets/:id` | جزئیات |
| PUT | `/api/budgets/:id` | ویرایش |
| DELETE | `/api/budgets/:id` | حذف |
| GET | `/api/budgets/summary` | وضعیت بودجه ماه — `?month=6&year=2026` |

### `POST /api/budgets` (با token)

```json
{
  "category_id": 3,
  "amount": 3000000,
  "month": 6,
  "year": 2026
}
```

`category_id` باید دسته‌بندی **هزینه** معتبر باشد.

### `GET /api/budgets/summary` 🔒

**Query:** `month` و `year` (اختیاری — پیش‌فرض ماه جاری)

**Response 200:**

```json
{
  "success": true,
  "data": {
    "period": { "month": 6, "year": 2026, "startDate": "2026-06-01", "endDate": "2026-06-30" },
    "budgets": [
      {
        "budget_id": 1,
        "category_id": 3,
        "category_name": "خوراک",
        "budget_amount": 3000000,
        "spent_amount": 2500000,
        "remaining_amount": 500000,
        "used_percent": 83.33,
        "status": "هشدار"
      }
    ]
  }
}
```

**وضعیت بودجه (`status`):** `ایمن` · `هشدار` · `عبور از بودجه`

| وضعیت | شرط |
|-------|------|
| `ایمن` | مصرف کمتر از ۸۰٪ |
| `هشدار` | مصرف بین ۸۰٪ تا ۱۰۰٪ |
| `عبور از بودجه` | مصرف بیشتر از سقف |

### بودجه Legacy (بدون token) 🔓

اگر **بدون** Bearer Token به `POST/GET/PUT/DELETE /api/budgets` بزنید، API قدیمی با `category` + `limit_amount` کار می‌کند.

```json
{
  "category": "غذا",
  "limit_amount": 3000000
}
```

`GET /api/budgets/status` 🔓 — وضعیت بودجه legacy (ماه جاری، بدون auth)

---

## داشبورد (Dashboard)

### با Bearer Token 🔒

| Method | Endpoint | توضیح |
|--------|----------|-------|
| GET | `/api/dashboard/summary` | خلاصه کامل داشبورد |
| GET | `/api/dashboard/monthly-report` | گزارش ماهانه |
| GET | `/api/dashboard/category-breakdown` | تفکیک دسته‌بندی |

**Query مشترک:** `month` و `year` (اختیاری — پیش‌فرض ماه جاری)

### `GET /api/dashboard/summary` 🔒

**Response 200:**

```json
{
  "success": true,
  "data": {
    "total_balance": 8500000,
    "monthly_income": 15000000,
    "monthly_expense": 5000000,
    "monthly_saving": 10000000,
    "saving_rate": 66.67,
    "biggest_expense_category": "خوراک",
    "recent_transactions": [],
    "daily_expense_chart": [{ "date": "2026-06-01", "amount": 500000 }],
    "income_vs_expense": { "income": 15000000, "expense": 5000000 },
    "period": { "month": 6, "year": 2026, "startDate": "2026-06-01", "endDate": "2026-06-30" }
  }
}
```

### `GET /api/dashboard/category-breakdown` 🔒

```json
{
  "success": true,
  "data": {
    "period": { "month": 6, "year": 2026, "startDate": "2026-06-01", "endDate": "2026-06-30" },
    "category_breakdown": {
      "expense": [
        { "category_id": 1, "name": "خوراک", "color": "#FF6B6B", "icon": "food", "amount": 2000000, "percent": 40 }
      ],
      "income": [
        { "category_id": 7, "name": "حقوق", "color": "#2ECC71", "icon": "salary", "amount": 15000000, "percent": 100 }
      ]
    }
  }
}
```

### Legacy (بدون token) 🔓

| Endpoint | توضیح |
|----------|-------|
| `GET /api/dashboard` | خلاصه legacy |
| `GET /api/dashboard/balance` | موجودی |
| `GET /api/dashboard/report` | گزارش هزینه |
| `GET /api/dashboard/monthly-report` | با token → گزارش کاربر؛ بدون token → legacy |

---

## گزارش‌ها (Reports)

همه endpointها 🔒 — پارامتر `from` و `to` الزامی (`YYYY-MM-DD`)

| Method | Endpoint | توضیح |
|--------|----------|-------|
| GET | `/api/reports/overview` | خلاصه دوره |
| GET | `/api/reports/cashflow` | جریان نقدی روزانه و ماهانه |
| GET | `/api/reports/categories` | تفکیک دسته‌بندی |
| GET | `/api/reports/accounts` | گزارش حساب‌ها |

**مثال:** `GET /api/reports/overview?from=2026-06-01&to=2026-06-30`

### `GET /api/reports/overview`

```json
{
  "success": true,
  "data": {
    "period": { "from": "2026-06-01", "to": "2026-06-30" },
    "income": { "total": 15000000, "count": 2 },
    "expense": { "total": 5000000, "count": 15 },
    "transfer": { "total": 200000, "count": 1 },
    "net_cashflow": 10000000,
    "saving_rate": 66.67
  }
}
```

### `GET /api/reports/cashflow`

```json
{
  "success": true,
  "data": {
    "period": { "from": "2026-06-01", "to": "2026-06-30" },
    "daily": [{ "date": "2026-06-01", "income": 0, "expense": 500000, "net": -500000 }],
    "monthly": [{ "month": "2026-06", "income": 15000000, "expense": 5000000, "net": 10000000 }]
  }
}
```

---

## پیش‌بینی (Forecast)

همه endpointها 🔒 — بر اساس حداکثر ۳ ماه گذشته تراکنش‌های کاربر

| Method | Endpoint | توضیح |
|--------|----------|-------|
| GET | `/api/forecast/next-month` | پیش‌بینی کامل ماه آینده |
| GET | `/api/forecast/cashflow` | ۳ ماه واقعی + ۱ ماه پیش‌بینی |
| GET | `/api/forecast/categories` | پیش‌بینی هزینه هر دسته |

اگر داده کافی نباشد:

```json
{
  "success": false,
  "message": "داده تراکنش کافی برای تولید پیش‌بینی وجود ندارد",
  "errors": []
}
```

### `GET /api/forecast/next-month`

```json
{
  "success": true,
  "data": {
    "predicted_income": 15000000,
    "predicted_expense": 6200000,
    "predicted_saving": 8800000,
    "predicted_saving_rate": 58.67,
    "expected_balance_change": 8800000,
    "confidence_level": "متوسط",
    "target_month": "2026-07",
    "months_analyzed": 3,
    "months_with_data": 3,
    "trend_summary": {
      "income_trend": "پایدار",
      "expense_trend": "افزایشی",
      "saving_trend": "کاهشی"
    },
    "warnings": ["هزینه‌های کلی شما نسبت به ماه‌های قبل افزایش یافته است."],
    "category_predictions": [
      { "category_id": 1, "category_name": "خوراک", "predicted_amount": 2000000, "trend": "افزایشی" }
    ]
  }
}
```

**روند (`trend`):** `پایدار` · `افزایشی` · `کاهشی`

**سطح اطمینان (`confidence_level`):** `کم` · `متوسط` · `بالا`

### `GET /api/forecast/cashflow`

```json
{
  "success": true,
  "data": {
    "confidence_level": "متوسط",
    "target_month": "2026-07",
    "cashflow": [
      { "month": "2026-04", "income": 14000000, "expense": 5000000, "saving": 9000000, "type": "actual", "type_label": "واقعی" },
      { "month": "2026-07", "income": 15000000, "expense": 6200000, "saving": 8800000, "type": "predicted", "type_label": "پیش‌بینی‌شده" }
    ]
  }
}
```

---

## APIهای Legacy (بدون auth)

این endpointها برای سازگاری با نسخه قبلی هستند. **فرانت‌اند جدید باید از APIهای auth-based استفاده کند.**

### Incomes — `/api/incomes` 🔓

| Method | Endpoint |
|--------|----------|
| POST | `/api/incomes` |
| GET | `/api/incomes` |
| PUT | `/api/incomes/:id` |
| DELETE | `/api/incomes/:id` |

```json
{
  "title": "حقوق خرداد",
  "amount": 15000000,
  "category": "حقوق",
  "date": "2026-06-01"
}
```

**دسته‌های درآمد:** `حقوق` · `فریلنس` · `هدیه` · `پاداش` · `سرمایه‌گذاری` · `سایر`

### Expenses — `/api/expenses` 🔓

| Method | Endpoint |
|--------|----------|
| POST | `/api/expenses` |
| GET | `/api/expenses` |
| PUT | `/api/expenses/:id` |
| DELETE | `/api/expenses/:id` |

```json
{
  "title": "خرید مواد غذایی",
  "amount": 500000,
  "category": "غذا",
  "date": "2026-06-05"
}
```

**دسته‌های هزینه:** `غذا` · `حمل‌ونقل` · `قبض` · `تفریح` · `خرید` · `سلامت` · `آموزش` · `سفر` · `سایر`

**فیلترها:** `category` · `startDate` · `endDate` · `minAmount` · `maxAmount`

### Savings Goal — `/api/savings-goal` 🔓

| Method | Endpoint |
|--------|----------|
| POST | `/api/savings-goal` |
| GET | `/api/savings-goal` |

```json
{ "target_amount": 10000000 }
```

---

## فرمت پاسخ و خطاها

### موفق

```json
{
  "success": true,
  "data": {}
}
```

### خطا

```json
{
  "success": false,
  "message": "توضیح خطا"
}
```

### اعتبارسنجی (400)

```json
{
  "success": false,
  "message": "اعتبارسنجی ناموفق بود",
  "errors": ["عنوان الزامی است", "مبلغ باید بزرگ‌تر از ۰ باشد"]
}
```

### کدهای HTTP

| کد | معنی |
|----|------|
| 200 | موفق |
| 201 | ایجاد شد |
| 400 | اعتبارسنجی / درخواست نامعتبر |
| 401 | توکن نامعتبر یا منقضی |
| 404 | منبع یافت نشد |
| 409 | تداخل (ایمیل تکراری، بودجه تکراری) |
| 429 | تلاش بیش از حد (auth) |
| 500 | خطای داخلی |

### امنیت

- **CORS** — از `CORS_ORIGIN` در `.env` (پیش‌فرض: `http://localhost:5173`)
- **Helmet** — هدرهای امنیتی
- **Morgan** — لاگ درخواست‌ها
- **SQL** — پارامتری (`?`)
