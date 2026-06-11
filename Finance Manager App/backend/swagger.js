const swaggerJsdoc = require('swagger-jsdoc');
const { EXPENSE_CATEGORIES, INCOME_CATEGORIES } = require('./utils/constants');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Personal Finance Manager API',
      version: '1.0.0',
      description: 'RESTful API for managing personal finances — incomes, expenses, budgets, dashboard, and savings goals.',
    },
    servers: [
      {
        url: 'http://localhost:3458',
        description: 'Local development server',
      },
    ],
    components: {
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
            message: { type: 'string', example: 'Error description' },
          },
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: { type: 'string' },
              example: ['Title is required', 'Amount must be greater than 0'],
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
            status: { type: 'string', enum: ['OK', 'Warning', 'Exceeded'] },
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
      },
    },
    paths: {
      '/': {
        get: {
          tags: ['Health'],
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
                              message: { type: 'string', example: 'Finance Manager API is running' },
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
          tags: ['Incomes'],
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
          tags: ['Incomes'],
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
          tags: ['Incomes'],
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
          tags: ['Incomes'],
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
          tags: ['Expenses'],
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
          tags: ['Expenses'],
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
          tags: ['Expenses'],
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
          tags: ['Expenses'],
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
          tags: ['Budgets'],
          summary: 'List all budgets',
          responses: { 200: { description: 'List of budgets' } },
        },
        post: {
          tags: ['Budgets'],
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
          tags: ['Budgets'],
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
          tags: ['Budgets'],
          summary: 'Update budget',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/BudgetInput' } } },
          },
          responses: { 200: { description: 'Budget updated' }, 404: { description: 'Not found' } },
        },
        delete: {
          tags: ['Budgets'],
          summary: 'Delete budget',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Budget deleted' }, 404: { description: 'Not found' } },
        },
      },
      '/api/dashboard': {
        get: {
          tags: ['Dashboard'],
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
          tags: ['Dashboard'],
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
          tags: ['Dashboard'],
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
          tags: ['Dashboard'],
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
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
