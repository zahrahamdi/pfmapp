# چرتکه — Personal Finance Manager (PFM)

## معرفی

اپلیکیشن **مدیریت مالی شخصی** با رابط کاربری فارسی (RTL) و بک‌اند RESTful.

| بخش | Stack |
|-----|-------|
| **Frontend** | Vanilla JS · HTML · CSS · Chart.js · jalaali-js |
| **Backend** | Node.js · Express · SQLite · JWT |

**مستندات API:** [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md)

**Swagger:** `http://localhost:3000/api-docs`

**اپلیکیشن (UI + API):** `http://localhost:3000`

---

## راه‌اندازی سریع

```bash
cd backend
npm install
npm start
```

سرور روی **`http://localhost:3000`** اجرا می‌شود و هم **API** و هم **فرانت‌اند** را سرو می‌دهد.

| آدرس | توضیح |
|------|-------|
| `http://localhost:3000` | رابط کاربری چرتکه |
| `http://localhost:3000/api/...` | REST API |
| `http://localhost:3000/api-docs` | Swagger |

> آدرس API در `frontend/js/api.js` تنظیم شده است (`BASE_URL = http://localhost:3000`).

### تنظیمات `.env` (بک‌اند)

```env
PORT=3000
DATABASE_PATH=database/finance.db
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

> فرانت‌اند از پوشه `frontend/` به‌صورت static توسط Express سرو می‌شود (`server.js`). نیازی به `npx serve` جداگانه نیست.

---

## فرانت‌اند — چرتکه

### صفحات

| مسیر | صفحه | توضیح |
|------|------|-------|
| `#login` / `#register` | ورود / ثبت‌نام | احراز هویت JWT |
| `#overview` | مرور کلی | کارت‌های آماری، نمودار جریان نقدی، دونات درآمد/هزینه، وضعیت بودجه |
| `#cashflow` | جریان نقدی | نمودار هفتگی/روزانه، جدول جریان، پیش‌بینی ماه آینده |
| `#forecast` | پیش‌بینی | کارت‌های واقعی و پیش‌بینی‌شده، نمودار هزینه و درآمد |
| `#accounts` | حساب‌های من | CRUD حساب بانکی، نقدی، کیف پول و … |
| `#transactions` | تراکنش‌ها | CRUD درآمد، هزینه، انتقال + فیلتر و مرتب‌سازی |
| `#budgets` | بودجه | بودجه ماهانه per دسته + نوار پیشرفت |
| `#savings` | هدف پس‌انداز | تعریف هدف، نمودار پیشرفت روزانه |
| `#categories` | دسته‌بندی‌ها | CRUD دسته درآمد و هزینه |

### ساختار فایل‌ها

```
frontend/
├── index.html          ← layout، sidebar، modals، صفحات
├── css/
│   └── style.css       ← استایل RTL، کارت‌ها، فیلترها، نمودارها
└── js/
    ├── api.js          ← wrapper تمام endpointها
    ├── utils.js        ← تاریخ شمسی، فرمت پول، toast، chart helpers
    ├── router.js       ← hash router
    ├── auth.js
    ├── overview.js
    ├── cashflow.js
    ├── forecast.js
    ├── accounts.js
    ├── transactions.js
    ├── budgets.js
    ├── savings.js
    └── categories.js
```

### کتابخانه‌های CDN

- **jalaali-js** — تبدیل تاریخ شمسی ↔ میلادی
- **Chart.js 4** — نمودارهای میله‌ای، خطی، دونات
- **Vazirmatn** — فونت فارسی

### قراردادهای UI

| موضوع | قاعده |
|-------|-------|
| **مبالغ در API** | ذخیره به **ریال** |
| **نمایش در UI** | ÷ ۱۰ → **تومان** + `Intl.NumberFormat('fa-IR')` |
| **تاریخ در UI** | شمسی (Jalali) |
| **تاریخ در API** | میلادی `YYYY-MM-DD` |
| **دسته‌بندی‌ها** | همیشه نام فارسی از API |
| **نمودارها** | tooltip فارسی، اعداد فارسی |

### قابلیت‌های کلیدی فرانت

- **مرور کلی:** فیلتر ماه شمسی + انتخاب چندحسابی؛ موجودی = جمع `current_balance` همه حساب‌ها؛ پس‌انداز ماه = درآمد − هزینه
- **جریان نقدی:** خط موجودی از `initial_balance` + تراکنش‌های قبل از دوره؛ toggle هفتگی/روزانه
- **پیش‌بینی:** هزینه از API؛ درآمد per دسته = میانگین ۳ ماه گذشته (محاسبه client-side)
- **تراکنش‌ها:** فیلتر حساب از کارت‌های بالای صفحه؛ فیلتر نوع/دسته/تاریخ/مبلغ در grid فشرده
- **بودجه:** محاسبه `spent` از تراکنش‌های واقعی per `category_id`

---

## بک‌اند — API

### فلو احراز هویت

```
POST /api/auth/register  →  ذخیره token
POST /api/auth/login     →  ذخیره token
GET  /api/auth/me        →  با Bearer Token
```

**Header برای APIهای محافظت‌شده:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

### سؤالات اصلی کاربر

| سؤال | Endpoint | فیلد پاسخ |
|------|----------|-----------|
| چقدر درآمد داشتم؟ | `GET /api/dashboard/summary` | `data.monthly_income` |
| چقدر خرج کردم؟ | `GET /api/dashboard/summary` | `data.monthly_expense` |
| الان چقدر پول دارم؟ | `GET /api/dashboard/summary` | `data.total_balance` |
| بیشترین خرجم کجا بوده؟ | `GET /api/dashboard/category-breakdown` | `data.category_breakdown.expense` |
| از بودجه رد شدم یا نه؟ | `GET /api/budgets/summary` | `data.budgets[].status` |
| این ماه چقدر پس‌انداز کردم؟ | `GET /api/dashboard/summary` | `data.monthly_saving` |
| ماه آینده چقدر خرج می‌کنم؟ | `GET /api/forecast/next-month` | `data.predicted_expense` |

### نقشه APIها

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
| Savings Goal | `/api/savings-goal` | تعریف هدف پس‌انداز |

> APIهای Legacy بدون auth (`/api/incomes`, `/api/expenses`) همچنان وجود دارند؛ فرانت‌اند از APIهای auth-based استفاده می‌کند.

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

## ساختار پروژه

```
Finance Manager App/
├── frontend/                 ← UI چرتکه (Vanilla JS)
│   ├── index.html
│   ├── css/style.css
│   └── js/
├── backend/
│   ├── controllers/
│   ├── services/
│   ├── middlewares/
│   ├── routes/
│   ├── utils/
│   ├── database/
│   ├── server.js
│   ├── swagger.js
│   └── package.json
├── API_DOCUMENTATION.md
└── README.md
```

---

## راهنمای Postman

### Environment

| Variable | Value |
|----------|-------|
| `baseUrl` | `http://localhost:3000` |
| `token` | خالی — بعد از login پر شود |

### فاز ۱ — Auth

1. `POST {{baseUrl}}/api/auth/register`
   ```json
   { "name": "کاربر تست", "email": "test@example.com", "password": "secret123" }
   ```
2. `POST {{baseUrl}}/api/auth/login` — `data.token` را در `token` ذخیره کنید
3. `GET {{baseUrl}}/api/auth/me` — Authorization: Bearer `{{token}}`

### فاز ۲ — Setup

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

**Frontend:** HTML5 · CSS3 · JavaScript (ES6+) · Chart.js · jalaali-js · Vazirmatn

**Backend:** Node.js · Express.js · SQLite · JWT · bcrypt · Swagger UI · Helmet (CSP) · CORS · Morgan
