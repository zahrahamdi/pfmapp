# API Documentation — Personal Finance Manager

> Backend source code is in the `backend/` folder. Run the server with `cd backend && npm start`.

Base URL: `http://localhost:3458`

Swagger UI: `http://localhost:3458/api-docs`

---

## سؤالات اصلی کاربر

| سؤال | Endpoint | فیلد پاسخ |
|------|----------|-----------|
| چقدر درآمد داشتم؟ | `GET /api/dashboard/balance` | `data.totalIncome` |
| چقدر خرج کردم؟ | `GET /api/dashboard/balance` | `data.totalExpense` |
| الان چقدر پول دارم؟ | `GET /api/dashboard/balance` | `data.balance` |
| بیشترین خرجم کجا بوده؟ | `GET /api/dashboard/report` | `data.topCategory` |
| از بودجه رد شدم یا نه؟ | `GET /api/budgets/status` | `data.budgets[].status` |
| این ماه چقدر پس‌انداز کردم؟ | `GET /api/dashboard/monthly-report` | `data.monthlyBalance` |

**خلاصه یک‌جا:** `GET /api/dashboard`

---

## Response Format

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Error description"
}
```

### Validation Error (HTTP 400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Title is required",
    "Amount must be greater than 0"
  ]
}
```

---

## Categories

### Expense Categories (هزینه‌ها)

`غذا` · `حمل‌ونقل` · `قبض` · `تفریح` · `خرید` · `سلامت` · `آموزش` · `سفر` · `سایر`

### Income Categories (درآمدها)

`حقوق` · `فریلنس` · `هدیه` · `پاداش` · `سرمایه‌گذاری` · `سایر`

---

## Health Check

### `GET /`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "message": "Finance Manager API is running"
  }
}
```

---

## Incomes

### `POST /api/incomes`

Create a new income record.

**Request body:**

```json
{
  "title": "حقوق خرداد",
  "amount": 15000000,
  "category": "حقوق",
  "date": "2026-06-01"
}
```

**Validation rules:**
- `title` — required, minimum 2 characters
- `amount` — required, must be greater than 0
- `category` — required (`حقوق`, `فریلنس`, `هدیه`, `پاداش`, `سرمایه‌گذاری`, `سایر`)
- `date` — required, valid date string

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "حقوق خرداد",
    "amount": 15000000,
    "category": "حقوق",
    "date": "2026-06-01"
  }
}
```

**Response 400:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Title is required", "Amount must be greater than 0"]
}
```

---

### `GET /api/incomes`

List all income records with optional filters.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `startDate` | string | Filter from date (inclusive) |
| `endDate` | string | Filter to date (inclusive) |
| `minAmount` | number | Minimum amount |
| `maxAmount` | number | Maximum amount |

**Example:** `GET /api/incomes?category=حقوق&startDate=2026-01-01&endDate=2026-06-30`

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "حقوق خرداد",
      "amount": 15000000,
      "category": "حقوق",
      "date": "2026-06-01"
    }
  ]
}
```

---

### `PUT /api/incomes/:id`

Update an existing income record.

**Request body:** Same as `POST /api/incomes`

**Response 200:** Updated income object in `data`

**Response 404:**

```json
{
  "success": false,
  "message": "Income not found"
}
```

---

### `DELETE /api/incomes/:id`

Delete an income record.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "message": "Income deleted successfully"
  }
}
```

**Response 404:**

```json
{
  "success": false,
  "message": "Income not found"
}
```

---

## Expenses

### `POST /api/expenses`

Create a new expense record.

**Request body:**

```json
{
  "title": "خرید مواد غذایی",
  "amount": 500000,
  "category": "غذا",
  "date": "2026-06-05"
}
```

**Validation rules:**
- `title` — required, minimum 2 characters
- `amount` — required, must be greater than 0
- `category` — required (`غذا`, `حمل‌ونقل`, `قبض`, `تفریح`, `خرید`, `سلامت`, `آموزش`, `سفر`, `سایر`)
- `date` — required, valid date string

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "خرید مواد غذایی",
    "amount": 500000,
    "category": "غذا",
    "date": "2026-06-05"
  }
}
```

---

### `GET /api/expenses`

List all expense records with optional filters.

**Query parameters:** Same as incomes (`category`, `startDate`, `endDate`, `minAmount`, `maxAmount`)

**Example:** `GET /api/expenses?category=غذا&minAmount=100000&maxAmount=500000`

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "خرید مواد غذایی",
      "amount": 500000,
      "category": "غذا",
      "date": "2026-06-05"
    }
  ]
}
```

---

### `PUT /api/expenses/:id`

Update an existing expense record.

**Response 200:** Updated expense in `data`

**Response 404:**

```json
{
  "success": false,
  "message": "Expense not found"
}
```

---

### `DELETE /api/expenses/:id`

Delete an expense record.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "message": "Expense deleted successfully"
  }
}
```

---

## Budgets

### `POST /api/budgets`

Set a monthly budget limit for a category.

**Request body:**

```json
{
  "category": "غذا",
  "limit_amount": 3000000
}
```

**Validation rules:**
- `category` — required, valid expense category
- `limit_amount` — required, must be greater than 0

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "category": "غذا",
    "limit_amount": 3000000
  }
}
```

**Response 409:**

```json
{
  "success": false,
  "message": "Budget for this category already exists"
}
```

---

### `GET /api/budgets`

List all budget limits.

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category": "غذا",
      "limit_amount": 3000000
    }
  ]
}
```

---

### `PUT /api/budgets/:id`

Update a budget.

**Response 404:**

```json
{
  "success": false,
  "message": "Budget not found"
}
```

---

### `DELETE /api/budgets/:id`

Delete a budget.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "message": "Budget deleted successfully"
  }
}
```

---

### `GET /api/budgets/status`

View spending status for each budget category (current month only).

**Response 200:**

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

**Status values:** `OK`, `Warning`, `Exceeded`

---

## Dashboard

### `GET /api/dashboard`

Full financial overview.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "balance": 10000000,
    "totalIncome": 15000000,
    "totalExpense": 5000000,
    "topCategory": "غذا",
    "budgetExceeded": ["غذا"],
    "incomeCount": 5,
    "expenseCount": 20
  }
}
```

---

### `GET /api/dashboard/balance`

Current balance summary.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "totalIncome": 15000000,
    "totalExpense": 5000000,
    "balance": 10000000
  }
}
```

---

### `GET /api/dashboard/report`

Expense statistics and category breakdown.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "totalExpense": 5000000,
    "expenseCount": 12,
    "topCategory": "غذا",
    "categories": {
      "غذا": 2000000,
      "حمل‌ونقل": 1000000
    }
  }
}
```

---

### `GET /api/dashboard/monthly-report`

Current month income, expenses, and balance.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "monthlyIncome": 15000000,
    "monthlyExpense": 5000000,
    "monthlyBalance": 10000000,
    "topCategory": "غذا",
    "period": {
      "startDate": "2026-06-01",
      "endDate": "2026-06-30"
    }
  }
}
```

---

## Savings Goal

### `POST /api/savings-goal`

Set a savings target.

**Request body:**

```json
{
  "target_amount": 10000000
}
```

**Validation rules:**
- `target_amount` — required, must be greater than 0

**Response 201:**

```json
{
  "success": true,
  "data": {
    "target": 10000000,
    "currentBalance": 6500000,
    "progress": 65,
    "id": 1
  }
}
```

---

### `GET /api/savings-goal`

Get savings goal progress.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "target": 10000000,
    "currentBalance": 6500000,
    "progress": 65
  }
}
```

**Response 404:**

```json
{
  "success": false,
  "message": "No savings goal has been set"
}
```

---

## Error Responses

| Status | Description | Example message |
|--------|-------------|-----------------|
| 400 | Validation or bad request | `Validation failed` |
| 404 | Resource or route not found | `Route not found` |
| 409 | Duplicate budget category | `Budget for this category already exists` |
| 500 | Internal server error | `Internal Server Error` |

### Route not found example

**Request:** `GET /api/random`

**Response 404:**

```json
{
  "success": false,
  "message": "Route not found"
}
```

### Internal server error example

**Response 500:**

```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Security & Logging

- **CORS** — enabled for all origins
- **Helmet** — security HTTP headers enabled
- **Morgan** — all incoming requests logged to the console
- **SQL safety** — all queries use parameterized statements (`?` placeholders)
