# Personal Finance Manager (PFM)

## معرفی

بک‌اند RESTful برای اپ مدیریت مالی شخصی — احراز هویت، حساب‌ها، دسته‌بندی‌ها، تراکنش‌ها، بودجه، داشبورد، گزارش‌ها و پیش‌بینی مالی.

**Stack:** Node.js · Express · SQLite

**مستندات کامل API:** [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md)

**Swagger:** `http://localhost:3465/api-docs`

---

## راه‌اندازی سریع (برای فرانت‌اند)

### ۱. اجرای بک‌اند

```bash
cd backend
npm install
npm start
```

سرور روی `http://localhost:3465` اجرا می‌شود. اگر پورت اشغال باشد، اولین پورت آزاد بعدی انتخاب می‌شود (پورت واقعی در ترمینال نمایش داده می‌شود).

### ۲. تنظیمات `.env`

```env
PORT=3465
DATABASE_PATH=database/finance.db
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### ۳. فلو احراز هویت

```
POST /api/auth/register  →  ذخیره token
POST /api/auth/login     →  ذخیره token
GET  /api/auth/me        →  با Bearer Token
```

**Header برای همه APIهای محافظت‌شده:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

### ۴. فلو پیشنهادی فرانت‌اند

```
1. register/login
2. GET /api/categories          → دسته‌بندی‌ها
3. POST /api/accounts           → ایجاد حساب
4. POST /api/transactions       → ثبت تراکنش
5. GET  /api/dashboard/summary  → داشبورد
6. GET  /api/budgets/summary    → وضعیت بودجه
7. GET  /api/forecast/next-month→ پیش‌بینی
```

---

## سؤالات اصلی کاربر

| سؤال | Endpoint | فیلد پاسخ |
|------|----------|-----------|
| چقدر درآمد داشتم؟ | `GET /api/dashboard/summary` | `data.monthly_income` |
| چقدر خرج کردم؟ | `GET /api/dashboard/summary` | `data.monthly_expense` |
| الان چقدر پول دارم؟ | `GET /api/dashboard/summary` | `data.total_balance` |
| بیشترین خرجم کجا بوده؟ | `GET /api/dashboard/category-breakdown` | `data.category_breakdown.expense` |
| از بودجه رد شدم یا نه؟ | `GET /api/budgets/summary` | `data.budgets[].status` |
| این ماه چقدر پس‌انداز کردم؟ | `GET /api/dashboard/summary` | `data.monthly_saving` |
| ماه آینده چقدر خرج می‌کنم؟ | `GET /api/forecast/next-month` | `data.predicted_expense` |

---

## نقشه APIها

### APIهای اصلی (با Bearer Token)

| بخش | Base Path | توضیح |
|-----|-----------|-------|
| Auth | `/api/auth` | register · login · me |
| Accounts | `/api/accounts` | CRUD حساب‌ها |
| Categories | `/api/categories` | CRUD دسته‌بندی‌ها |
| Transactions | `/api/transactions` | CRUD تراکنش (income/expense/transfer) |
| Budgets | `/api/budgets` | بودجه per-user + `/summary` |
| Dashboard | `/api/dashboard` | `/summary` · `/monthly-report` · `/category-breakdown` |
| Reports | `/api/reports` | overview · cashflow · categories · accounts |
| Forecast | `/api/forecast` | next-month · cashflow · categories |

### APIهای Legacy (بدون auth — سازگاری)

| بخش | Base Path |
|-----|-----------|
| Incomes | `/api/incomes` |
| Expenses | `/api/expenses` |
| Budgets | `/api/budgets` (بدون token) |
| Dashboard | `/api/dashboard/balance` · `/report` |
| Savings Goal | `/api/savings-goal` |

> فرانت‌اند جدید باید از APIهای auth-based استفاده کند. جزئیات در [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md).

---

## ثابت‌ها

### نوع حساب (`type`)

`cash` · `bank` · `wallet` · `savings` · `credit` · `other`

### نوع تراکنش (`type`)

`income` · `expense` · `transfer`

### روش پرداخت (`payment_method`)

`cash` · `card` · `transfer` · `online` · `other`

### وضعیت بودجه (`status`)

`ایمن` · `هشدار` · `عبور از بودجه`

---

## راهنمای Postman

### Environment

| Variable | Value |
|----------|-------|
| `baseUrl` | `http://localhost:3465` |
| `token` | خالی — بعد از login پر شود |

### فاز ۱ — Auth

1. `POST {{baseUrl}}/api/auth/register`
   ```json
   { "name": "کاربر تست", "email": "test@example.com", "password": "secret123" }
   ```
2. `POST {{baseUrl}}/api/auth/login` — `data.token` را در `token` ذخیره کنید
3. `GET {{baseUrl}}/api/auth/me` — Authorization: Bearer `{{token}}`

### فاز ۲ — Setup (با Bearer Token)

4. `GET {{baseUrl}}/api/categories?type=expense`
5. `POST {{baseUrl}}/api/accounts`
   ```json
   { "name": "کیف پول", "type": "wallet", "initial_balance": 1000000 }
   ```
6. `POST {{baseUrl}}/api/transactions`
   ```json
   {
     "type": "expense",
     "amount": 500000,
     "date": "2026-06-05",
     "account_id": 1,
     "category_id": 1,
     "note": "تست"
   }
   ```

### فاز ۳ — داشبورد و گزارش

7. `GET {{baseUrl}}/api/dashboard/summary`
8. `GET {{baseUrl}}/api/dashboard/category-breakdown`
9. `POST {{baseUrl}}/api/budgets`
   ```json
   { "category_id": 1, "amount": 3000000, "month": 6, "year": 2026 }
   ```
10. `GET {{baseUrl}}/api/budgets/summary?month=6&year=2026`
11. `GET {{baseUrl}}/api/reports/overview?from=2026-06-01&to=2026-06-30`
12. `GET {{baseUrl}}/api/forecast/next-month`

### تست‌های منفی

- بدون token به `/api/accounts` → `401`
- رمز کوتاه در register → `400`
- ایمیل تکراری → `409`

---

## ساختار پروژه

```
Finance Manager App/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── accountsController.js
│   │   ├── categoriesController.js
│   │   ├── transactionsController.js
│   │   ├── userBudgetsController.js
│   │   ├── userDashboardController.js
│   │   ├── reportsController.js
│   │   ├── forecastController.js
│   │   ├── budgetsController.js
│   │   ├── dashboardController.js
│   │   ├── expensesController.js
│   │   ├── incomesController.js
│   │   └── savingsGoalController.js
│   ├── services/
│   │   ├── forecastService.js
│   │   ├── categoryService.js
│   │   └── accountBalanceService.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── routes/
│   ├── utils/
│   │   ├── messages.js      ← پیام‌های فارسی API
│   │   ├── validation.js
│   │   └── constants.js
│   ├── database/
│   ├── server.js
│   ├── swagger.js
│   └── package.json
├── API_DOCUMENTATION.md     ← مستندات کامل برای فرانت‌اند
└── README.md
```

---

## HTTP Status Codes

| کد | معنی |
|----|------|
| 200 | موفق |
| 201 | ایجاد شد |
| 400 | اعتبارسنجی |
| 401 | توکن نامعتبر |
| 404 | یافت نشد |
| 409 | تداخل |
| 429 | تلاش بیش از حد |
| 500 | خطای داخلی |

---

## Migration Notes

اگر دیتابیس قدیمی دارید:

- ستون‌های `category` و `date` به `incomes` خودکار اضافه می‌شوند
- ستون `date` به `expenses` خودکار اضافه می‌شود
- جدول `savings_goals` خودکار ایجاد می‌شود
- جداول `users`، `accounts`، `categories`، `transactions` خودکار ایجاد می‌شوند

برای شروع از صفر: `backend/database/finance.db` را حذف کنید و `npm start` بزنید.

---

## Technologies

- Node.js · Express.js · SQLite
- JWT · bcrypt · Swagger UI
- Helmet · CORS · Morgan
