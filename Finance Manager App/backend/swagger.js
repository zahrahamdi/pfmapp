const swaggerJsdoc = require('swagger-jsdoc');
const { EXPENSE_CATEGORIES, INCOME_CATEGORIES } = require('./utils/constants');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API مدیریت مالی شخصی',
      version: '1.0.0',
      description: 'API مدیریت مالی شخصی — احراز هویت، حساب‌ها، دسته‌بندی‌ها، تراکنش‌ها، بودجه، داشبورد، گزارش‌ها و پیش‌بینی مالی.',
    },
    servers: [
      {
        url: 'http://localhost:3465',
        description: 'سرور توسعه محلی',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'توضیح خطا' },
          },
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'اعتبارسنجی ناموفق بود' },
            errors: {
              type: 'array',
              items: { type: 'string' },
              example: ['عنوان الزامی است', 'مبلغ باید بزرگ‌تر از ۰ باشد'],
            },
          },
        },
        Income: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'حقوق خرداد' },
            amount: { type: 'integer', example: 15000000 },
            category: { type: 'string', enum: INCOME_CATEGORIES },
            date: { type: 'string', format: 'date', example: '2026-06-01' },
          },
        },
        IncomeInput: {
          type: 'object',
          required: ['title', 'amount', 'category', 'date'],
          properties: {
            title: { type: 'string', minLength: 2, example: 'حقوق خرداد' },
            amount: { type: 'number', minimum: 1, example: 15000000 },
            category: { type: 'string', enum: INCOME_CATEGORIES },
            date: { type: 'string', format: 'date', example: '2026-06-01' },
          },
        },
        Expense: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'خرید مواد غذایی' },
            amount: { type: 'integer', example: 500000 },
            category: { type: 'string', enum: EXPENSE_CATEGORIES },
            date: { type: 'string', format: 'date', example: '2026-06-05' },
          },
        },
        ExpenseInput: {
          type: 'object',
          required: ['title', 'amount', 'category', 'date'],
          properties: {
            title: { type: 'string', minLength: 2, example: 'خرید مواد غذایی' },
            amount: { type: 'number', minimum: 1, example: 500000 },
            category: { type: 'string', enum: EXPENSE_CATEGORIES },
            date: { type: 'string', format: 'date', example: '2026-06-05' },
          },
        },
        Budget: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            category: { type: 'string', example: 'غذا' },
            limit_amount: { type: 'integer', example: 3000000 },
          },
        },
        BudgetInput: {
          type: 'object',
          required: ['category', 'limit_amount'],
          properties: {
            category: { type: 'string', example: 'غذا' },
            limit_amount: { type: 'number', minimum: 1, example: 3000000 },
          },
        },
        BudgetStatus: {
          type: 'object',
          properties: {
            category: { type: 'string', example: 'غذا' },
            limit: { type: 'integer', example: 3000000 },
            spent: { type: 'integer', example: 3500000 },
            remaining: { type: 'integer', example: -500000 },
            status: { type: 'string', enum: ['ایمن', 'هشدار', 'عبور از بودجه'] },
          },
        },
        Balance: {
          type: 'object',
          properties: {
            totalIncome: { type: 'integer', example: 15000000 },
            totalExpense: { type: 'integer', example: 5000000 },
            balance: { type: 'integer', example: 10000000 },
          },
        },
        ExpenseReport: {
          type: 'object',
          properties: {
            totalExpense: { type: 'integer', example: 5000000 },
            expenseCount: { type: 'integer', example: 12 },
            topCategory: { type: 'string', example: 'غذا' },
            categories: {
              type: 'object',
              additionalProperties: { type: 'integer' },
              example: { 'غذا': 2000000, 'حمل‌ونقل': 1000000 },
            },
          },
        },
        DashboardSummary: {
          type: 'object',
          properties: {
            balance: { type: 'integer', example: 10000000 },
            totalIncome: { type: 'integer', example: 15000000 },
            totalExpense: { type: 'integer', example: 5000000 },
            topCategory: { type: 'string', example: 'غذا' },
            budgetExceeded: { type: 'array', items: { type: 'string' }, example: ['غذا'] },
            incomeCount: { type: 'integer', example: 5 },
            expenseCount: { type: 'integer', example: 20 },
          },
        },
        MonthlyReport: {
          type: 'object',
          properties: {
            monthlyIncome: { type: 'integer', example: 15000000 },
            monthlyExpense: { type: 'integer', example: 5000000 },
            monthlyBalance: { type: 'integer', example: 10000000 },
            topCategory: { type: 'string', example: 'غذا' },
            period: {
              type: 'object',
              properties: {
                startDate: { type: 'string', example: '2026-06-01' },
                endDate: { type: 'string', example: '2026-06-30' },
              },
            },
          },
        },
        SavingsGoal: {
          type: 'object',
          properties: {
            target: { type: 'integer', example: 10000000 },
            currentBalance: { type: 'integer', example: 6500000 },
            progress: { type: 'integer', example: 65 },
            id: { type: 'integer', example: 1 },
          },
        },
        SavingsGoalInput: {
          type: 'object',
          required: ['target_amount'],
          properties: {
            target_amount: { type: 'number', minimum: 1, example: 10000000 },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Ali Reza' },
            email: { type: 'string', example: 'ali@example.com' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string' },
          },
        },
        Account: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            name: { type: 'string', example: 'Main Bank' },
            type: { type: 'string', enum: ['cash', 'bank', 'wallet', 'savings', 'credit', 'other'] },
            initial_balance: { type: 'number' },
            current_balance: { type: 'number' },
            currency: { type: 'string', example: 'IRR' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['income', 'expense'] },
            icon: { type: 'string' },
            color: { type: 'string' },
            is_default: { type: 'boolean' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            account_id: { type: 'integer' },
            category_id: { type: 'integer' },
            type: { type: 'string', enum: ['income', 'expense', 'transfer'] },
            amount: { type: 'number' },
            date: { type: 'string', format: 'date' },
            note: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            payment_method: { type: 'string' },
            target_account_id: { type: 'integer' },
          },
        },
        UserBudget: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            category_id: { type: 'integer' },
            amount: { type: 'number' },
            month: { type: 'integer' },
            year: { type: 'integer' },
          },
        },
        ForecastNextMonth: {
          type: 'object',
          properties: {
            predicted_income: { type: 'number', example: 85000000 },
            predicted_expense: { type: 'number', example: 62000000 },
            predicted_saving: { type: 'number', example: 23000000 },
            predicted_saving_rate: { type: 'number', example: 27.05 },
            expected_balance_change: { type: 'number', example: 23000000 },
            confidence_level: { type: 'string', enum: ['low', 'medium', 'high'] },
            target_month: { type: 'string', example: '2026-07' },
            trend_summary: {
              type: 'object',
              properties: {
                income_trend: { type: 'string', enum: ['stable', 'increasing', 'decreasing'] },
                expense_trend: { type: 'string', enum: ['stable', 'increasing', 'decreasing'] },
                saving_trend: { type: 'string', enum: ['stable', 'increasing', 'decreasing'] },
              },
            },
            warnings: { type: 'array', items: { type: 'string' } },
            category_predictions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category_id: { type: 'integer' },
                  category_name: { type: 'string' },
                  predicted_amount: { type: 'number' },
                  trend: { type: 'string', enum: ['stable', 'increasing', 'decreasing'] },
                },
              },
            },
          },
        },
        ForecastCashflowPoint: {
          type: 'object',
          properties: {
            month: { type: 'string', example: '2026-06' },
            income: { type: 'number' },
            expense: { type: 'number' },
            saving: { type: 'number' },
            type: { type: 'string', enum: ['actual', 'predicted'] },
          },
        },
        ForecastCategory: {
          type: 'object',
          properties: {
            category_id: { type: 'integer' },
            category_name: { type: 'string' },
            predicted_amount: { type: 'number' },
            trend: { type: 'string', enum: ['stable', 'increasing', 'decreasing'] },
          },
        },
      },
    },
    paths: {
      '/': {
        get: {
          tags: ['سلامت سرویس'],
          summary: 'Health check',
          responses: {
            200: {
              description: 'API is running',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              message: { type: 'string', example: 'API مدیریت مالی در حال اجراست' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/api/incomes': {
        get: {
          tags: ['درآمدها'],
          summary: 'List all incomes',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'minAmount', in: 'query', schema: { type: 'number' } },
            { name: 'maxAmount', in: 'query', schema: { type: 'number' } },
          ],
          responses: {
            200: {
              description: 'List of incomes',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Income' } } } },
                    ],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['درآمدها'],
          summary: 'Create income',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/IncomeInput' } } },
          },
          responses: {
            201: {
              description: 'Income created',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      { properties: { data: { $ref: '#/components/schemas/Income' } } },
                    ],
                  },
                },
              },
            },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } } },
          },
        },
      },
      '/api/incomes/{id}': {
        put: {
          tags: ['درآمدها'],
          summary: 'Update income',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/IncomeInput' } } },
          },
          responses: {
            200: { description: 'Income updated' },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
        delete: {
          tags: ['درآمدها'],
          summary: 'Delete income',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Income deleted' },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/expenses': {
        get: {
          tags: ['هزینه‌ها'],
          summary: 'List all expenses',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'minAmount', in: 'query', schema: { type: 'number' } },
            { name: 'maxAmount', in: 'query', schema: { type: 'number' } },
          ],
          responses: {
            200: {
              description: 'List of expenses',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Expense' } } } },
                    ],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['هزینه‌ها'],
          summary: 'Create expense',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ExpenseInput' } } },
          },
          responses: {
            201: { description: 'Expense created' },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } } },
          },
        },
      },
      '/api/expenses/{id}': {
        put: {
          tags: ['هزینه‌ها'],
          summary: 'Update expense',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ExpenseInput' } } },
          },
          responses: {
            200: { description: 'Expense updated' },
            400: { description: 'Validation error' },
            404: { description: 'Not found' },
          },
        },
        delete: {
          tags: ['هزینه‌ها'],
          summary: 'Delete expense',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Expense deleted' },
            404: { description: 'Not found' },
          },
        },
      },
      '/api/budgets': {
        get: {
          tags: ['بودجه'],
          summary: 'List all budgets',
          responses: { 200: { description: 'List of budgets' } },
        },
        post: {
          tags: ['بودجه'],
          summary: 'Create budget',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/BudgetInput' } } },
          },
          responses: {
            201: { description: 'Budget created' },
            400: { description: 'Validation error' },
            409: { description: 'Duplicate category' },
          },
        },
      },
      '/api/budgets/status': {
        get: {
          tags: ['بودجه'],
          summary: 'Get budget status per category',
          responses: {
            200: {
              description: 'Budget status list',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/BudgetStatus' } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/api/budgets/{id}': {
        put: {
          tags: ['بودجه'],
          summary: 'Update budget',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/BudgetInput' } } },
          },
          responses: { 200: { description: 'Budget updated' }, 404: { description: 'Not found' } },
        },
        delete: {
          tags: ['بودجه'],
          summary: 'Delete budget',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Budget deleted' }, 404: { description: 'Not found' } },
        },
      },
      '/api/dashboard': {
        get: {
          tags: ['داشبورد'],
          summary: 'Dashboard summary',
          responses: {
            200: {
              description: 'Full dashboard overview',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      { properties: { data: { $ref: '#/components/schemas/DashboardSummary' } } },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/api/dashboard/balance': {
        get: {
          tags: ['داشبورد'],
          summary: 'Current balance',
          responses: {
            200: {
              description: 'Balance overview',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      { properties: { data: { $ref: '#/components/schemas/Balance' } } },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/api/dashboard/report': {
        get: {
          tags: ['داشبورد'],
          summary: 'Expense report',
          responses: {
            200: {
              description: 'Expense statistics',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      { properties: { data: { $ref: '#/components/schemas/ExpenseReport' } } },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/api/dashboard/monthly-report': {
        get: {
          tags: ['داشبورد'],
          summary: 'Monthly report',
          responses: {
            200: {
              description: 'Current month statistics',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      { properties: { data: { $ref: '#/components/schemas/MonthlyReport' } } },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/api/savings-goal': {
        get: {
          tags: ['Savings Goal'],
          summary: 'Get savings goal progress',
          responses: {
            200: { description: 'Savings goal progress' },
            404: { description: 'No goal set' },
          },
        },
        post: {
          tags: ['Savings Goal'],
          summary: 'Set savings goal',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SavingsGoalInput' } } },
          },
          responses: {
            201: { description: 'Savings goal created' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['احراز هویت'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    password: { type: 'string', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered' },
            400: { description: 'Validation error' },
            409: { description: 'Email already exists' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['احراز هویت'],
          summary: 'Login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['احراز هویت'],
          summary: 'Get current user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Current user profile' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/accounts': {
        get: {
          tags: ['حساب‌ها'],
          summary: 'List user accounts',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Account list' }, 401: { description: 'Unauthorized' } },
        },
        post: {
          tags: ['حساب‌ها'],
          summary: 'Create account',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Account created' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/categories': {
        get: {
          tags: ['دسته‌بندی‌ها'],
          summary: 'List user categories',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'type', in: 'query', schema: { type: 'string', enum: ['income', 'expense'] } }],
          responses: { 200: { description: 'Category list' }, 401: { description: 'Unauthorized' } },
        },
        post: {
          tags: ['دسته‌بندی‌ها'],
          summary: 'Create category',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Category created' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/transactions': {
        get: {
          tags: ['تراکنش‌ها'],
          summary: 'List transactions with filters',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'type', in: 'query', schema: { type: 'string' } },
            { name: 'category_id', in: 'query', schema: { type: 'integer' } },
            { name: 'account_id', in: 'query', schema: { type: 'integer' } },
            { name: 'min_amount', in: 'query', schema: { type: 'number' } },
            { name: 'max_amount', in: 'query', schema: { type: 'number' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Transaction list' }, 401: { description: 'Unauthorized' } },
        },
        post: {
          tags: ['تراکنش‌ها'],
          summary: 'Create transaction',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Transaction created' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/dashboard/summary': {
        get: {
          tags: ['داشبورد'],
          summary: 'Authenticated dashboard summary',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'month', in: 'query', schema: { type: 'integer' } },
            { name: 'year', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Dashboard summary' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/dashboard/category-breakdown': {
        get: {
          tags: ['داشبورد'],
          summary: 'Category breakdown for period',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'month', in: 'query', schema: { type: 'integer' } },
            { name: 'year', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Category breakdown' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/budgets/summary': {
        get: {
          tags: ['بودجه'],
          summary: 'User budget summary for month',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'month', in: 'query', schema: { type: 'integer' } },
            { name: 'year', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Budget summary' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/reports/overview': {
        get: {
          tags: ['گزارش‌ها'],
          summary: 'Financial overview report',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'from', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Overview report' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/reports/cashflow': {
        get: {
          tags: ['گزارش‌ها'],
          summary: 'Cashflow report',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'from', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Cashflow report' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/reports/categories': {
        get: {
          tags: ['گزارش‌ها'],
          summary: 'Categories report',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'from', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Categories report' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/reports/accounts': {
        get: {
          tags: ['گزارش‌ها'],
          summary: 'Accounts report',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'from', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Accounts report' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/forecast/next-month': {
        get: {
          tags: ['پیش‌بینی'],
          summary: 'Predict next month financial outlook',
          description: 'Uses up to the last 3 completed months of user transactions with a weighted moving average and simple trend adjustment.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Forecast generated or insufficient data message',
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      {
                        allOf: [
                          { $ref: '#/components/schemas/SuccessResponse' },
                          { properties: { data: { $ref: '#/components/schemas/ForecastNextMonth' } } },
                        ],
                      },
                      {
                        type: 'object',
                        properties: {
                          success: { type: 'boolean', example: false },
                          message: { type: 'string', example: 'داده تراکنش کافی برای تولید پیش‌بینی وجود ندارد' },
                          errors: { type: 'array', items: { type: 'string' } },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            500: { description: 'Internal Server Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/forecast/cashflow': {
        get: {
          tags: ['پیش‌بینی'],
          summary: 'Historical and predicted monthly cashflow',
          description: 'Returns up to 3 past months as actual values and the next month as predicted values, suitable for line/bar charts.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Cashflow forecast data',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              confidence_level: { type: 'string', enum: ['low', 'medium', 'high'] },
                              target_month: { type: 'string' },
                              cashflow: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/ForecastCashflowPoint' },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            500: { description: 'Internal Server Error' },
          },
        },
      },
      '/api/forecast/categories': {
        get: {
          tags: ['پیش‌بینی'],
          summary: 'پیش‌بینی هزینه ماه آینده بر اساس دسته‌بندی',
          description: 'خرج احتمالی هر دسته‌بندی هزینه را بر اساس حداکثر ۳ ماه گذشته پیش‌بینی می‌کند.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'داده پیش‌بینی دسته‌بندی‌ها' },
            401: { description: 'دسترسی غیرمجاز' },
            500: { description: 'خطای داخلی سرور' },
          },
        },
      },
      '/api/accounts/{id}': {
        get: {
          tags: ['حساب‌ها'],
          summary: 'دریافت یک حساب',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'جزئیات حساب' }, 401: { description: 'دسترسی غیرمجاز' }, 404: { description: 'یافت نشد' } },
        },
        put: {
          tags: ['حساب‌ها'],
          summary: 'ویرایش حساب',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'حساب ویرایش شد' }, 400: { description: 'خطای اعتبارسنجی' }, 401: { description: 'دسترسی غیرمجاز' }, 404: { description: 'یافت نشد' } },
        },
        delete: {
          tags: ['حساب‌ها'],
          summary: 'حذف حساب',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'حساب حذف شد' }, 401: { description: 'دسترسی غیرمجاز' }, 404: { description: 'یافت نشد' } },
        },
      },
      '/api/categories/{id}': {
        get: {
          tags: ['دسته‌بندی‌ها'],
          summary: 'دریافت یک دسته‌بندی',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'جزئیات دسته‌بندی' }, 401: { description: 'دسترسی غیرمجاز' }, 404: { description: 'یافت نشد' } },
        },
        put: {
          tags: ['دسته‌بندی‌ها'],
          summary: 'ویرایش دسته‌بندی',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'دسته‌بندی ویرایش شد' }, 400: { description: 'خطای اعتبارسنجی' }, 401: { description: 'دسترسی غیرمجاز' }, 404: { description: 'یافت نشد' } },
        },
        delete: {
          tags: ['دسته‌بندی‌ها'],
          summary: 'حذف دسته‌بندی',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'دسته‌بندی حذف شد' }, 401: { description: 'دسترسی غیرمجاز' }, 404: { description: 'یافت نشد' } },
        },
      },
      '/api/transactions/{id}': {
        get: {
          tags: ['تراکنش‌ها'],
          summary: 'دریافت یک تراکنش',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'جزئیات تراکنش' }, 401: { description: 'دسترسی غیرمجاز' }, 404: { description: 'یافت نشد' } },
        },
        put: {
          tags: ['تراکنش‌ها'],
          summary: 'ویرایش تراکنش',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'تراکنش ویرایش شد' }, 400: { description: 'خطای اعتبارسنجی' }, 401: { description: 'دسترسی غیرمجاز' }, 404: { description: 'یافت نشد' } },
        },
        delete: {
          tags: ['تراکنش‌ها'],
          summary: 'حذف تراکنش',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'تراکنش حذف شد' }, 401: { description: 'دسترسی غیرمجاز' }, 404: { description: 'یافت نشد' } },
        },
      },
      '/api/budgets/{id}': {
        get: {
          tags: ['بودجه'],
          summary: 'دریافت بودجه کاربر (نیاز به توکن)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'جزئیات بودجه' }, 401: { description: 'دسترسی غیرمجاز' }, 404: { description: 'یافت نشد' } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
