# Personal Finance Manager (PFM)

## Project Overview

Personal Finance Manager is a RESTful backend application that helps users track their income and expenses, manage monthly budgets, and monitor their financial status.

The API is built with **Node.js**, **Express**, and **SQLite**. Data is stored persistently in a local database and survives server restarts.

---

## سؤالات اصلی کاربر (راهنمای استفاده)

| سؤال کاربر | Endpoint | فیلد پاسخ |
|------------|----------|-----------|
| چقدر درآمد داشتم؟ | `GET /api/dashboard/balance` | `data.totalIncome` |
| چقدر خرج کردم؟ | `GET /api/dashboard/balance` | `data.totalExpense` |
| الان چقدر پول دارم؟ | `GET /api/dashboard/balance` | `data.balance` |
| بیشترین خرجم کجا بوده؟ | `GET /api/dashboard/report` | `data.topCategory` |
| از بودجه رد شدم یا نه؟ | `GET /api/budgets/status` | `data.budgets[].status` (`OK` / `Warning` / `Exceeded`) |
| این ماه چقدر پس‌انداز کردم؟ | `GET /api/dashboard/monthly-report` | `data.monthlyBalance` |

**یا یک‌جا همه را ببینید:** `GET /api/dashboard`

**نکته:** بودجه ماهانه فقط هزینه‌های **ماه جاری** را با سقف بودجه مقایسه می‌کند.

---

## Features

Each feature is designed to answer a specific question a user might have about their finances.

### Required Features

| Feature | User question answered | Endpoint(s) |
|---------|------------------------|-------------|
| Add expense transactions | *Where did my money go? What did I spend on?* | `POST /api/expenses` |
| Add income transactions | *Where did my money come from? How much did I earn?* | `POST /api/incomes` |
| List transactions | *What are all my recorded incomes and expenses?* | `GET /api/incomes`, `GET /api/expenses` |
| View current balance | *How much money do I currently have?* | `GET /api/dashboard/balance` |
| Expense reports | *How much have I spent in total? Which category do I spend the most on?* | `GET /api/dashboard/report` |
| Monthly budget management | *How much can I spend per category? Am I staying within my limits?* | `POST /api/budgets`, `GET /api/budgets`, `GET /api/budgets/status` |
| Delete transactions | *Did I record a wrong transaction? How do I remove it?* | `DELETE /api/incomes/:id`, `DELETE /api/expenses/:id` |
| Persistent data storage | *Will my data still be here after I restart the server?* | Automatic — SQLite database |

### Optional Features

| Feature | User question answered | Endpoint(s) |
|---------|------------------------|-------------|
| Dashboard summary | *What is my overall financial situation at a glance?* | `GET /api/dashboard` |
| Monthly reports | *How much did I earn and spend this month? What was my top spending category this month?* | `GET /api/dashboard/monthly-report` |
| Edit transactions | *Did I enter the wrong amount, title, or category? How do I fix it?* | `PUT /api/incomes/:id`, `PUT /api/expenses/:id` |
| Savings goal tracking | *How much do I want to save? How close am I to reaching that goal?* | `POST /api/savings-goal`, `GET /api/savings-goal` |
| Search and filtering | *Show me only Food expenses this month between 100,000 and 500,000.* | `GET /api/expenses?...`, `GET /api/incomes?...` |

---

## Categories

### Expense Categories (هزینه‌ها)

- غذا
- حمل‌ونقل
- قبض
- تفریح
- خرید
- سلامت
- آموزش
- سفر
- سایر

### Income Categories (درآمدها)

- حقوق
- فریلنس
- هدیه
- پاداش
- سرمایه‌گذاری
- سایر

---

## API Endpoints

Base URL: `http://localhost:3465`

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Verify the API is running |

---

### Transactions (Incomes & Expenses)

Income and expense transactions are managed through separate endpoints.

#### Incomes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/incomes` | Create a new income transaction |
| GET | `/api/incomes` | Get all income transactions (supports filters) |
| PUT | `/api/incomes/:id` | Update an existing income transaction |
| DELETE | `/api/incomes/:id` | Delete an income transaction |

**Request body (create / update):**

```json
{
  "title": "حقوق خرداد",
  "amount": 15000000,
  "category": "حقوق",
  "date": "2026-06-01"
}
```

**Query filters (combinable):**

- `category` — e.g. `?category=حقوق`
- `startDate` — e.g. `?startDate=2026-01-01`
- `endDate` — e.g. `?endDate=2026-01-31`
- `minAmount` — e.g. `?minAmount=100000`
- `maxAmount` — e.g. `?maxAmount=500000`

#### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses` | Create a new expense transaction |
| GET | `/api/expenses` | Get all expense transactions (supports filters) |
| PUT | `/api/expenses/:id` | Update an existing expense transaction |
| DELETE | `/api/expenses/:id` | Delete an expense transaction |

**Request body (create / update):**

```json
{
  "title": "خرید مواد غذایی",
  "amount": 500000,
  "category": "غذا",
  "date": "2026-06-05"
}
```

**Query filters (combinable):**

- `category` — e.g. `?category=غذا`
- `startDate` — e.g. `?startDate=2026-01-01`
- `endDate` — e.g. `?endDate=2026-01-31`
- `minAmount` — e.g. `?minAmount=100000`
- `maxAmount` — e.g. `?maxAmount=500000`

---

### Balance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/balance` | Returns total income, total expenses, and current balance |

**Example response:**

```json
{
  "totalIncome": 15000000,
  "totalExpense": 5000000,
  "balance": 10000000
}
```

---

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/report` | Returns expense statistics and top spending category |
| GET | `/api/dashboard/monthly-report` | Returns current month statistics |
| GET | `/api/dashboard` | Full dashboard summary (optional) |

**Expense report response (`/api/dashboard/report`):**

```json
{
  "totalExpense": 5000000,
  "expenseCount": 12,
  "topCategory": "غذا",
  "categories": {
    "غذا": 2000000,
    "حمل‌ونقل": 1000000
  }
}
```

**Monthly report response (`/api/dashboard/monthly-report`):**

```json
{
  "monthlyIncome": 15000000,
  "monthlyExpense": 5000000,
  "monthlyBalance": 10000000,
  "topCategory": "غذا",
  "period": {
    "startDate": "2026-06-01",
    "endDate": "2026-06-30"
  }
}
```

**Dashboard summary response (`/api/dashboard`):**

```json
{
  "balance": 10000000,
  "totalIncome": 15000000,
  "totalExpense": 5000000,
  "topCategory": "غذا",
  "budgetExceeded": ["غذا"],
  "incomeCount": 5,
  "expenseCount": 20
}
```

---

### Budgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/budgets` | Set budget limit for a category |
| GET | `/api/budgets` | List all budget limits |
| PUT | `/api/budgets/:id` | Update a budget |
| DELETE | `/api/budgets/:id` | Delete a budget |
| GET | `/api/budgets/status` | View budget status per category |

**Request body (create / update):**

```json
{
  "category": "غذا",
  "limit_amount": 3000000
}
```

**Budget status response (`/api/budgets/status`):**

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-06-01",
      "endDate": "2026-06-30"
    },
    "budgets": [
      {
        "category": "غذا",
        "limit": 3000000,
        "spent": 3500000,
        "remaining": -500000,
        "status": "Exceeded"
      }
    ]
  }
}
```

**Status values:**

| Status | Condition |
|--------|-----------|
| `OK` | Spent below 80% of the limit |
| `Warning` | Spent between 80% and 100% of the limit |
| `Exceeded` | Spent above the limit |

---

### Savings Goal

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/savings-goal` | Set savings target |
| GET | `/api/savings-goal` | Get savings target and track progress |

**Request body:**

```json
{
  "target_amount": 10000000
}
```

**Example response:**

```json
{
  "target": 10000000,
  "currentBalance": 6500000,
  "progress": 65
}
```

---

## Database Schema

### `incomes`

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| title | TEXT | NOT NULL |
| amount | INTEGER | NOT NULL, CHECK(amount > 0) |
| category | TEXT | NOT NULL |
| date | TEXT | NOT NULL |

### `expenses`

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| title | TEXT | NOT NULL |
| amount | INTEGER | NOT NULL, CHECK(amount > 0) |
| category | TEXT | NOT NULL |
| date | TEXT | NOT NULL |

### `budgets`

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| category | TEXT | NOT NULL UNIQUE |
| limit_amount | INTEGER | NOT NULL, CHECK(limit_amount > 0) |

### `savings_goals`

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| target_amount | INTEGER | NOT NULL, CHECK(target_amount > 0) |
| created_at | TEXT | DEFAULT datetime('now') |

Tables are created automatically on server startup. No manual setup is required.

---

## Running the Project

### Install dependencies

```bash
cd backend
npm install
```

### Start server

```bash
cd backend
npm start
```

سرور روی `http://localhost:3465` اجرا می‌شود. اگر پورت اشغال باشد، اولین پورت آزاد بعدی انتخاب می‌شود (پورت واقعی در ترمینال نمایش داده می‌شود).

Optional:

```bash
cd backend
PORT=4000 npm start
```

---

## What Questions Can Users Ask?

Below is a complete guide mapping common user questions to the feature and endpoint that answers them.

### Income & Expenses

| User question | Feature | Endpoint |
|---------------|---------|----------|
| How do I record money I received? | Add income | `POST /api/incomes` |
| How do I record something I bought or paid for? | Add expense | `POST /api/expenses` |
| What incomes have I recorded? | List incomes | `GET /api/incomes` |
| What expenses have I recorded? | List expenses | `GET /api/expenses` |
| I entered the wrong income — how do I fix it? | Edit transaction | `PUT /api/incomes/:id` |
| I entered the wrong expense — how do I fix it? | Edit transaction | `PUT /api/expenses/:id` |
| I recorded a transaction by mistake — how do I remove it? | Delete transaction | `DELETE /api/incomes/:id` or `DELETE /api/expenses/:id` |
| Show me only my حقوق income. | Search & filtering | `GET /api/incomes?category=حقوق` |
| Show me غذا expenses between two dates. | Search & filtering | `GET /api/expenses?category=غذا&startDate=2026-01-01&endDate=2026-01-31` |
| Show me expenses between 100,000 and 500,000. | Search & filtering | `GET /api/expenses?minAmount=100000&maxAmount=500000` |

### Balance & Reports

| User question | Feature | Endpoint |
|---------------|---------|----------|
| How much money do I currently have? | Current balance | `GET /api/dashboard/balance` |
| How much total income have I received? | Current balance | `GET /api/dashboard/balance` → `totalIncome` |
| How much total money have I spent? | Expense report | `GET /api/dashboard/report` → `totalExpense` |
| How many expenses have I recorded? | Expense report | `GET /api/dashboard/report` → `expenseCount` |
| Which category has the highest spending? | Expense report | `GET /api/dashboard/report` → `topCategory` |
| How much did I spend on Food vs Transport? | Expense report | `GET /api/dashboard/report` → `categories` |
| What is my full financial overview? | Dashboard summary | `GET /api/dashboard` |
| How many income and expense records do I have? | Dashboard summary | `GET /api/dashboard` → `incomeCount`, `expenseCount` |
| Which budgets have I exceeded? | Dashboard summary | `GET /api/dashboard` → `budgetExceeded` |
| How much did I earn this month? | Monthly report | `GET /api/dashboard/monthly-report` → `monthlyIncome` |
| How much did I spend this month? | Monthly report | `GET /api/dashboard/monthly-report` → `monthlyExpense` |
| What is my balance for this month only? | Monthly report | `GET /api/dashboard/monthly-report` → `monthlyBalance` |
| What was my top spending category this month? | Monthly report | `GET /api/dashboard/monthly-report` → `topCategory` |

### Budgets

| User question | Feature | Endpoint |
|---------------|---------|----------|
| How much can I spend on Food this month? | Set budget | `POST /api/budgets` |
| What budget limits have I set? | List budgets | `GET /api/budgets` |
| I want to change my Food budget limit. | Update budget | `PUT /api/budgets/:id` |
| I no longer need a budget for a category. | Delete budget | `DELETE /api/budgets/:id` |
| Have I exceeded my Food budget? | Budget status | `GET /api/budgets/status` |
| How much of my Food budget is left? | Budget status | `GET /api/budgets/status` → `remaining` |
| Am I close to exceeding my budget? | Budget status | `GET /api/budgets/status` → `status: "Warning"` |

### Savings Goal

| User question | Feature | Endpoint |
|---------------|---------|----------|
| How much do I want to save? | Set savings goal | `POST /api/savings-goal` |
| How close am I to my savings goal? | Savings progress | `GET /api/savings-goal` → `progress` |
| What is my current balance compared to my target? | Savings progress | `GET /api/savings-goal` → `currentBalance`, `target` |

### Data & System

| User question | Feature | How it works |
|---------------|---------|--------------|
| Will my data disappear when I restart the server? | Persistent storage | Data is saved in `backend/database/finance.db` (SQLite) |
| Is the API running? | Health check | `GET /` |

---

## Technologies

- Node.js
- Express.js
- SQLite (persistent database)
- REST API

---

## Postman Testing Guide

### Setup

1. Start the server from the `backend` folder with `npm start` and note the port shown in the terminal.
2. In Postman, create an environment variable:
   - `baseUrl` = `http://localhost:3465`

### Suggested test flow

1. `GET {{baseUrl}}/` — verify API is running
2. `POST {{baseUrl}}/api/incomes` — add salary income
3. `POST {{baseUrl}}/api/expenses` — add a Food expense
4. `GET {{baseUrl}}/api/dashboard/balance` — verify balance
5. `GET {{baseUrl}}/api/dashboard/report` — verify expense report
6. `POST {{baseUrl}}/api/budgets` — set Food budget
7. `GET {{baseUrl}}/api/budgets/status` — check budget status
8. `GET {{baseUrl}}/api/dashboard` — view dashboard summary
9. `GET {{baseUrl}}/api/dashboard/monthly-report` — view monthly report
10. `POST {{baseUrl}}/api/savings-goal` — set savings target
11. `GET {{baseUrl}}/api/savings-goal` — check progress
12. `PUT {{baseUrl}}/api/incomes/:id` — edit a transaction
13. `DELETE {{baseUrl}}/api/expenses/:id` — delete a transaction
14. `GET {{baseUrl}}/api/expenses?category=غذا` — test filtering

### Negative tests

- Empty `title` → expect `400`
- Negative `amount` → expect `400`
- Invalid category → expect `400`
- Delete non-existent id → expect `404`

### Screenshots

Add Postman screenshots demonstrating:

- Adding income
- Adding expenses
- Setting budgets
- Viewing balance
- Viewing reports
- Budget exceeded scenario

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 404 | Resource not found |
| 409 | Conflict (duplicate budget category) |
| 500 | Internal server error |

---

## Project Structure

```
Finance Manager App/
├── backend/
│   ├── controllers/
│   │   ├── budgetsController.js
│   │   ├── dashboardController.js
│   │   ├── expensesController.js
│   │   ├── incomesController.js
│   │   └── savingsGoalController.js
│   ├── database/
│   │   └── finance.db
│   ├── middlewares/
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── budgets.js
│   │   ├── dashboard.js
│   │   ├── expenses.js
│   │   ├── incomes.js
│   │   └── savingsGoal.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── response.js
│   │   └── validation.js
│   ├── database.js
│   ├── server.js
│   ├── swagger.js
│   └── package.json
├── API_DOCUMENTATION.md
└── README.md
```

---

## Migration Notes

If you have an older database from a previous version:

- Columns `category` and `date` are added automatically to `incomes`
- Column `date` is added automatically to `expenses`
- Existing `created_at` values are copied into `date` when present
- The `savings_goals` table is created automatically on startup

Restart the server after updating the code. To start fresh, delete `backend/database/finance.db` and run `npm start` from the `backend` folder again.
