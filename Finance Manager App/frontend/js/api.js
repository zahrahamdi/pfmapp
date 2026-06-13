const API_BASE = 'http://localhost:3465';

async function apiRequest(method, path, body, options = {}) {
  const { skipAuth = false, silent = false } = options;
  const headers = { 'Content-Type': 'application/json' };

  if (!skipAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body !== undefined && body !== null) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, config);
    let data = null;

    try {
      data = await response.json();
    } catch {
      data = { success: false, message: 'پاسخ نامعتبر از سرور' };
    }

    if (response.status === 401 && !skipAuth) {
      clearAuth();
      window.location.hash = '#login';
      if (!silent) showToast('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.', 'error');
      const err = new Error(data.message || 'Unauthorized');
      err.status = 401;
      throw err;
    }

    if (response.status === 404 && options.allow404) {
      return null;
    }

    if (!response.ok || data.success === false) {
      const err = new Error(data.message || 'خطا در ارتباط با سرور');
      err.status = response.status;
      err.errors = data.errors || [];
      err.data = data;
      throw err;
    }

    return data.data;
  } catch (error) {
    if (error.status === 401) throw error;
    if (!silent) showToast(error.message || 'خطا در ارتباط با سرور', 'error');
    throw error;
  }
}

function buildQuery(params) {
  const entries = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return `?${new URLSearchParams(entries).toString()}`;
}

const api = {
  register(body) {
    return apiRequest('POST', '/api/auth/register', body, { skipAuth: true, silent: true });
  },

  login(body) {
    return apiRequest('POST', '/api/auth/login', body, { skipAuth: true, silent: true });
  },

  getMe() {
    return apiRequest('GET', '/api/auth/me');
  },

  getAccounts() {
    return apiRequest('GET', '/api/accounts');
  },

  getAccount(id) {
    return apiRequest('GET', `/api/accounts/${id}`);
  },

  createAccount(body) {
    return apiRequest('POST', '/api/accounts', body);
  },

  updateAccount(id, body) {
    return apiRequest('PUT', `/api/accounts/${id}`, body);
  },

  deleteAccount(id) {
    return apiRequest('DELETE', `/api/accounts/${id}`);
  },

  getCategories(params) {
    return apiRequest('GET', `/api/categories${buildQuery(params)}`);
  },

  createCategory(body) {
    return apiRequest('POST', '/api/categories', body);
  },

  updateCategory(id, body) {
    return apiRequest('PUT', `/api/categories/${id}`, body);
  },

  deleteCategory(id) {
    return apiRequest('DELETE', `/api/categories/${id}`);
  },

  getTransactions(params) {
    return apiRequest('GET', `/api/transactions${buildQuery(params)}`);
  },

  getTransaction(id) {
    return apiRequest('GET', `/api/transactions/${id}`);
  },

  createTransaction(body) {
    return apiRequest('POST', '/api/transactions', body);
  },

  updateTransaction(id, body) {
    return apiRequest('PUT', `/api/transactions/${id}`, body);
  },

  deleteTransaction(id) {
    return apiRequest('DELETE', `/api/transactions/${id}`);
  },

  getBudgets(params) {
    return apiRequest('GET', `/api/budgets${buildQuery(params)}`);
  },

  createBudget(body) {
    return apiRequest('POST', '/api/budgets', body);
  },

  updateBudget(id, body) {
    return apiRequest('PUT', `/api/budgets/${id}`, body);
  },

  deleteBudget(id) {
    return apiRequest('DELETE', `/api/budgets/${id}`);
  },

  getBudgetSummary(params) {
    return apiRequest('GET', `/api/budgets/summary${buildQuery(params)}`);
  },

  getDashboardSummary(params) {
    return apiRequest('GET', `/api/dashboard/summary${buildQuery(params)}`);
  },

  getDashboardMonthlyReport(params) {
    return apiRequest('GET', `/api/dashboard/monthly-report${buildQuery(params)}`);
  },

  getDashboardCategoryBreakdown(params) {
    return apiRequest('GET', `/api/dashboard/category-breakdown${buildQuery(params)}`);
  },

  getReportsOverview(params) {
    return apiRequest('GET', `/api/reports/overview${buildQuery(params)}`);
  },

  getReportsCashflow(params) {
    return apiRequest('GET', `/api/reports/cashflow${buildQuery(params)}`);
  },

  getReportsCategories(params) {
    return apiRequest('GET', `/api/reports/categories${buildQuery(params)}`);
  },

  getReportsAccounts(params) {
    return apiRequest('GET', `/api/reports/accounts${buildQuery(params)}`);
  },

  getForecastNextMonth() {
    return apiRequest('GET', '/api/forecast/next-month');
  },

  getForecastNextMonthOptional() {
    return apiRequest('GET', '/api/forecast/next-month', null, { silent: true }).catch((err) => {
      if (err.message?.includes('داده')) return null;
      throw err;
    });
  },

  getForecastCashflow() {
    return apiRequest('GET', '/api/forecast/cashflow');
  },

  getForecastCashflowOptional() {
    return apiRequest('GET', '/api/forecast/cashflow', null, { silent: true }).catch((err) => {
      if (err.message?.includes('داده')) return null;
      throw err;
    });
  },

  getForecastCategories() {
    return apiRequest('GET', '/api/forecast/categories');
  },

  getForecastCategoriesOptional() {
    return apiRequest('GET', '/api/forecast/categories', null, { silent: true }).catch((err) => {
      if (err.message?.includes('داده')) return null;
      throw err;
    });
  },

  getSavingsGoal() {
    return apiRequest('GET', '/api/savings-goal');
  },

  getSavingsGoalOptional() {
    return apiRequest('GET', '/api/savings-goal', null, { silent: true }).catch((err) => {
      if (err.status === 404) return null;
      throw err;
    });
  },

  setSavingsGoal(body) {
    return apiRequest('POST', '/api/savings-goal', body);
  },
};
