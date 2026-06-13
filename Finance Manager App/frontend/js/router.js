const ROUTES = {
  login: { public: true, sectionId: 'page-login', init: null },
  register: { public: true, sectionId: 'page-register', init: null },
  overview: { public: false, sectionId: 'page-overview', init: () => typeof initOverview === 'function' && initOverview() },
  cashflow: { public: false, sectionId: 'page-cashflow', init: () => typeof initCashflow === 'function' && initCashflow() },
  forecast: { public: false, sectionId: 'page-forecast', init: () => typeof initForecast === 'function' && initForecast() },
  accounts: { public: false, sectionId: 'page-accounts', init: () => typeof initAccounts === 'function' && initAccounts() },
  transactions: { public: false, sectionId: 'page-transactions', init: () => typeof initTransactions === 'function' && initTransactions() },
  budgets: { public: false, sectionId: 'page-budgets', init: () => typeof initBudgets === 'function' && initBudgets() },
  savings: { public: false, sectionId: 'page-savings', init: () => typeof initSavings === 'function' && initSavings() },
  categories: { public: false, sectionId: 'page-categories', init: () => typeof initCategories === 'function' && initCategories() },
};

const DEFAULT_ROUTE = 'overview';

function getRouteFromHash() {
  const hash = window.location.hash.replace('#', '').trim();
  return hash || DEFAULT_ROUTE;
}

function showAuthLayout() {
  document.getElementById('auth-layout')?.classList.remove('hidden');
  document.getElementById('app-layout')?.classList.add('hidden');
}

function showAppLayout() {
  document.getElementById('auth-layout')?.classList.add('hidden');
  document.getElementById('app-layout')?.classList.remove('hidden');
  updateSidebarUser();
}

function hideAllSections() {
  document.querySelectorAll('.page-section').forEach((el) => el.classList.add('hidden'));
  document.querySelectorAll('.auth-page').forEach((el) => el.classList.add('hidden'));
}

function updateSidebarActive(routeName) {
  document.querySelectorAll('.nav-item').forEach((item) => {
    const route = item.getAttribute('data-route');
    item.classList.toggle('active', route === routeName);
  });
}

function navigate(routeName) {
  const route = ROUTES[routeName];
  if (!route) {
    window.location.hash = `#${DEFAULT_ROUTE}`;
    return;
  }

  const loggedIn = isLoggedIn();

  if (!route.public && !loggedIn) {
    window.location.hash = '#login';
    return;
  }

  if (route.public && loggedIn && (routeName === 'login' || routeName === 'register')) {
    window.location.hash = `#${DEFAULT_ROUTE}`;
    return;
  }

  hideAllSections();

  if (route.public) {
    showAuthLayout();
    const section = document.getElementById(route.sectionId);
    section?.classList.remove('hidden');
  } else {
    showAppLayout();
    const section = document.getElementById(route.sectionId);
    section?.classList.remove('hidden');
    updateSidebarActive(routeName);
    if (route.init) route.init();
  }
}

function initRouter() {
  if (!window.location.hash) {
    window.location.hash = isLoggedIn() ? `#${DEFAULT_ROUTE}` : '#login';
  }

  window.addEventListener('hashchange', () => navigate(getRouteFromHash()));
  navigate(getRouteFromHash());

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const route = item.getAttribute('data-route');
      if (route) window.location.hash = `#${route}`;
    });
  });

  document.getElementById('sidebar-user')?.addEventListener('click', () => {
    document.getElementById('logout-btn')?.classList.toggle('hidden');
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearAuth();
    showToast('با موفقیت خارج شدید', 'success');
    window.location.hash = '#login';
  });

  document.addEventListener('click', (e) => {
    const userArea = document.getElementById('sidebar-user');
    const logoutBtn = document.getElementById('logout-btn');
    if (userArea && logoutBtn && !userArea.contains(e.target) && !logoutBtn.contains(e.target)) {
      logoutBtn.classList.add('hidden');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthForms();
  bindModalClose('account-modal');
  bindModalClose('edit-account-modal');
  bindModalClose('transaction-modal');
  bindModalClose('budget-modal');
  bindModalClose('edit-budget-modal');
  bindModalClose('category-modal');
  bindModalClose('edit-category-modal');
  bindModalClose('savings-goal-modal');
  initRouter();
});
