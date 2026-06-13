/* eslint-disable no-unused-vars */
const ACCOUNT_TYPES = {
  cash:    { label: 'نقدی',     icon: '💵', gradient: 'linear-gradient(135deg, #2F9E44, #40C057)' },
  bank:    { label: 'بانک',     icon: '🏦', gradient: 'linear-gradient(135deg, #1E2B4A, #3B5BDB)' },
  wallet:  { label: 'کیف پول', icon: '👛', gradient: 'linear-gradient(135deg, #6741D9, #9775FA)' },
  savings: { label: 'پس‌انداز', icon: '🐷', gradient: 'linear-gradient(135deg, #E67700, #FFA94D)' },
  credit:  { label: 'اعتباری', icon: '💳', gradient: 'linear-gradient(135deg, #C92A2A, #FF6B6B)' },
  other:   { label: 'سایر',    icon: '📦', gradient: 'linear-gradient(135deg, #495057, #868E96)' },
};

const CATEGORY_ICONS = [
  '🍔','🍕','🛒','🏠','💡','🚿','🚗','🚕','🚌','✈️',
  '🛵','🚲','💊','🏥','🎮','🎬','📚','🎵','💼','💻',
  '💰','📈','🎁','🏆','🛍️','📄','💳','🔧','❓','📦',
  '🎓','🏋️','☕','🍽️','🎯','🏡','👔','🌟','🔑','📱',
];

const CURRENCY_OPTIONS = [
  { value: 'IRR', label: 'ریال' },
  { value: 'IRT', label: 'تومان' },
  { value: 'USD', label: 'دلار' },
  { value: 'EUR', label: 'یورو' },
];

const JALALI_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const TOKEN_KEY = 'chortke_token';
const USER_KEY = 'chortke_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function removeUser() {
  localStorage.removeItem(USER_KEY);
}

function isLoggedIn() {
  return !!getToken();
}

function clearAuth() {
  removeToken();
  removeUser();
}

function formatMoney(amount) {
  const num = Number(amount) || 0;
  return `${new Intl.NumberFormat('fa-IR').format(num)} تومان`;
}

/** Stored amounts are in ریال; display as تومان (÷ 10). */
function displayAccountBalance(amount) {
  return formatMoney((Number(amount) || 0) / 10);
}

function toPersianDigits(num) {
  if (num === null || num === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d, 10)]);
}

function formatPersianNumber(num) {
  return new Intl.NumberFormat('fa-IR').format(Number(num) || 0);
}

function toJalali(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function toGregorian(jalaliDate) {
  const { year, month, day } = jalaliDate;
  const g = jalaali.toGregorian(year, month, day);
  return new Date(g.gy, g.gm - 1, g.gd);
}

function formatGregorianDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const j = toJalali(dateStr);
  if (!j) return '—';
  return toPersianDigits(`${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`);
}

function getJalaliMonthName(month) {
  return JALALI_MONTH_NAMES[month - 1] || '';
}

function getCurrentJalaliMonth() {
  const now = new Date();
  const j = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return { year: j.jy, month: j.jm };
}

function getJalaliMonthRange(year, month) {
  const monthLength = jalaali.jalaaliMonthLength(year, month);
  const startG = jalaali.toGregorian(year, month, 1);
  const endG = jalaali.toGregorian(year, month, monthLength);
  const startDate = `${startG.gy}-${String(startG.gm).padStart(2, '0')}-${String(startG.gd).padStart(2, '0')}`;
  const endDate = `${endG.gy}-${String(endG.gm).padStart(2, '0')}-${String(endG.gd).padStart(2, '0')}`;
  return { startDate, endDate };
}

function getPersianMonthsInYear(year) {
  return JALALI_MONTH_NAMES.map((name, index) => ({
    month: index + 1,
    year,
    label: `${name} ${toPersianDigits(year)}`,
  }));
}

function getGregorianMonthYearFromRange(startDate) {
  const d = new Date(startDate);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function budgetStatusConfig(status) {
  const map = {
    'ایمن': { label: 'ایمن', color: '#2F9E44', badgeClass: 'badge-safe' },
    safe: { label: 'ایمن', color: '#2F9E44', badgeClass: 'badge-safe' },
    'هشدار': { label: 'هشدار', color: '#F08C00', badgeClass: 'badge-warning' },
    warning: { label: 'هشدار', color: '#F08C00', badgeClass: 'badge-warning' },
    'عبور از بودجه': { label: 'عبور از بودجه', color: '#E03131', badgeClass: 'badge-danger' },
    exceeded: { label: 'عبور از بودجه', color: '#E03131', badgeClass: 'badge-danger' },
  };
  return map[status] || { label: status || '—', color: '#6B7280', badgeClass: 'badge-neutral' };
}

function getCurrencyLabel(code) {
  const found = CURRENCY_OPTIONS.find((c) => c.value === code);
  return found ? found.label : code;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirm-overlay');
    const messageEl = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');

    if (!overlay || !messageEl || !yesBtn || !noBtn) {
      resolve(window.confirm(message));
      return;
    }

    messageEl.textContent = message;
    overlay.classList.remove('hidden');

    function cleanup(result) {
      overlay.classList.add('hidden');
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
      resolve(result);
    }

    function onYes() { cleanup(true); }
    function onNo() { cleanup(false); }

    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  });
}

function createMonthSelector(container, onChange, initialYear, initialMonth) {
  const current = getCurrentJalaliMonth();
  let year = initialYear ?? current.year;
  let month = initialMonth ?? current.month;

  container.innerHTML = '';
  container.className = 'month-selector';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'month-nav-btn';
  prevBtn.setAttribute('aria-label', 'ماه قبل');
  prevBtn.textContent = '→';

  const label = document.createElement('span');
  label.className = 'month-label';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'month-nav-btn';
  nextBtn.setAttribute('aria-label', 'ماه بعد');
  nextBtn.textContent = '←';

  container.append(prevBtn, label, nextBtn);

  function updateNextState() {
    const isCurrent = year === current.year && month === current.month;
    nextBtn.disabled = isCurrent;
    nextBtn.classList.toggle('disabled', isCurrent);
  }

  function render() {
    label.textContent = `${getJalaliMonthName(month)} ${toPersianDigits(year)}`;
    updateNextState();
  }

  function emitChange() {
    const range = getJalaliMonthRange(year, month);
    const gregorian = getGregorianMonthYearFromRange(range.startDate);
    if (typeof onChange === 'function') {
      onChange({
        year,
        month,
        startDate: range.startDate,
        endDate: range.endDate,
        gregorianMonth: gregorian.month,
        gregorianYear: gregorian.year,
      });
    }
  }

  prevBtn.addEventListener('click', () => {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    render();
    emitChange();
  });

  nextBtn.addEventListener('click', () => {
    if (year === current.year && month === current.month) return;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    if (year > current.year || (year === current.year && month > current.month)) {
      year = current.year;
      month = current.month;
    }
    render();
    emitChange();
  });

  render();
  emitChange();

  return {
    getValue() {
      const range = getJalaliMonthRange(year, month);
      const gregorian = getGregorianMonthYearFromRange(range.startDate);
      return {
        year,
        month,
        startDate: range.startDate,
        endDate: range.endDate,
        gregorianMonth: gregorian.month,
        gregorianYear: gregorian.year,
      };
    },
    setValue(newYear, newMonth) {
      year = newYear;
      month = newMonth;
      if (year > current.year || (year === current.year && month > current.month)) {
        year = current.year;
        month = current.month;
      }
      render();
    },
  };
}

function renderSkeleton(container, count = 3) {
  container.innerHTML = Array.from({ length: count }, () =>
    '<div class="skeleton skeleton-card"></div>'
  ).join('');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function updateSidebarUser() {
  const user = getUser();
  const avatarEl = document.getElementById('sidebar-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  if (!user) return;
  if (avatarEl) avatarEl.textContent = user.name ? user.name.charAt(0) : '?';
  if (nameEl) nameEl.textContent = user.name || '';
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

function bindModalClose(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(modalId));
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modalId);
  });
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقدی' },
  { value: 'card', label: 'کارت' },
  { value: 'transfer', label: 'انتقال' },
  { value: 'online', label: 'آنلاین' },
  { value: 'other', label: 'سایر' },
];

const TX_TYPE_LABELS = {
  income: 'درآمد',
  expense: 'هزینه',
  transfer: 'انتقال',
};

function getTodayGregorian() {
  return formatGregorianDate(new Date());
}

function gregorianToJalaliParts(dateStr) {
  const j = toJalali(dateStr);
  return j ? { year: j.jy, month: j.jm, day: j.jd } : null;
}

function jalaliPartsToGregorian(year, month, day) {
  const g = jalaali.toGregorian(Number(year), Number(month), Number(day));
  return `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`;
}

function setupJalaliDatePicker(container, defaultGregorian) {
  if (!container) return null;

  const parts = gregorianToJalaliParts(defaultGregorian || getTodayGregorian());
  const currentJy = getCurrentJalaliMonth().year;

  container.innerHTML = `
    <div class="jalali-date-picker">
      <select class="jalali-day" aria-label="روز"></select>
      <select class="jalali-month" aria-label="ماه"></select>
      <select class="jalali-year" aria-label="سال"></select>
    </div>
  `;

  const daySel = container.querySelector('.jalali-day');
  const monthSel = container.querySelector('.jalali-month');
  const yearSel = container.querySelector('.jalali-year');

  yearSel.innerHTML = Array.from({ length: 11 }, (_, i) => {
    const y = currentJy - 5 + i;
    return `<option value="${y}">${toPersianDigits(y)}</option>`;
  }).join('');

  monthSel.innerHTML = JALALI_MONTH_NAMES.map((name, i) =>
    `<option value="${i + 1}">${name}</option>`
  ).join('');

  function fillDays() {
    const y = Number(yearSel.value);
    const m = Number(monthSel.value);
    const len = jalaali.jalaaliMonthLength(y, m);
    const curDay = Number(daySel.value) || 1;
    daySel.innerHTML = Array.from({ length: len }, (_, i) => {
      const d = i + 1;
      return `<option value="${d}">${toPersianDigits(d)}</option>`;
    }).join('');
    daySel.value = String(Math.min(curDay, len));
  }

  yearSel.addEventListener('change', fillDays);
  monthSel.addEventListener('change', fillDays);

  if (parts) {
    yearSel.value = String(parts.year);
    monthSel.value = String(parts.month);
    fillDays();
    daySel.value = String(parts.day);
  } else {
    fillDays();
  }

  return {
    getGregorian() {
      return jalaliPartsToGregorian(yearSel.value, monthSel.value, daySel.value);
    },
    setGregorian(dateStr) {
      const p = gregorianToJalaliParts(dateStr);
      if (!p) return;
      yearSel.value = String(p.year);
      monthSel.value = String(p.month);
      fillDays();
      daySel.value = String(p.day);
    },
  };
}

function renderIconPicker(container, selectedIcon, inputId) {
  if (!container) return;
  container.innerHTML = CATEGORY_ICONS.map((icon) =>
    `<button type="button" class="icon-picker-btn${icon === selectedIcon ? ' selected' : ''}" data-icon="${icon}">${icon}</button>`
  ).join('');

  const hiddenInput = document.getElementById(inputId);
  if (hiddenInput && selectedIcon) hiddenInput.value = selectedIcon;

  container.querySelectorAll('.icon-picker-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.icon-picker-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      if (hiddenInput) hiddenInput.value = btn.getAttribute('data-icon');
    });
  });
}

function getAccountIcon(account) {
  if (!account) return '📦';
  return (ACCOUNT_TYPES[account.type] || ACCOUNT_TYPES.other).icon;
}

function formatTxAmount(type, amount) {
  const formatted = displayAccountBalance(amount);
  if (type === 'income') return `<span class="tx-amount income">${formatted}</span>`;
  if (type === 'expense') return `<span class="tx-amount expense">${formatted}</span>`;
  return `<span class="tx-amount transfer">${formatted}</span>`;
}

function getProgressBarClass(percent) {
  if (percent > 100) return 'progress-danger';
  if (percent >= 80) return 'progress-warning';
  return 'progress-safe';
}

function isCurrentJalaliMonth(year, month) {
  const cur = getCurrentJalaliMonth();
  return year === cur.year && month === cur.month;
}

function getEffectiveEndDate(startDate, endDate, jalaliYear, jalaliMonth) {
  if (!isCurrentJalaliMonth(jalaliYear, jalaliMonth)) return endDate;
  const today = getTodayGregorian();
  return today < endDate ? today : endDate;
}

function formatDateHeader(dateStr) {
  const j = toJalali(dateStr);
  if (!j) return '—';
  return `${toPersianDigits(j.jd)} ${getJalaliMonthName(j.jm)} ${toPersianDigits(j.jy)}`;
}

const LEGACY_ICON_MAP = {
  food: '🍔',
  transport: '🚗',
  home: '🏠',
  health: '💊',
  entertainment: '🎮',
  shopping: '🛍️',
  salary: '💰',
  freelance: '💼',
  investment: '📈',
};

const PRESET_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFA94D', '#FFD43B', '#69DB7C', '#38D9A9',
  '#4DABF7', '#748FFC', '#DA77F2', '#F783AC', '#A9E34B', '#63E6BE',
];

function getCategoryDisplayIcon(category) {
  if (!category?.icon) return '📦';
  const icon = String(category.icon).trim();
  if (CATEGORY_ICONS.includes(icon)) return icon;
  const mapped = LEGACY_ICON_MAP[icon.toLowerCase()];
  if (mapped) return mapped;
  if (/[\u{1F300}-\u{1FAFF}]/u.test(icon)) return icon;
  return '📦';
}

function getCategoryName(category) {
  return category?.name || '—';
}

function renderColorPicker(container, selectedColor, hiddenInputId) {
  if (!container) return;
  const color = selectedColor || PRESET_COLORS[0];
  container.innerHTML = PRESET_COLORS.map((c) =>
    `<button type="button" class="color-circle${c === color ? ' selected' : ''}" data-color="${c}" style="background:${c}" title="${c}">${c === color ? '✓' : ''}</button>`
  ).join('');

  const hiddenInput = document.getElementById(hiddenInputId);
  if (hiddenInput) hiddenInput.value = color;

  container.querySelectorAll('.color-circle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      container.querySelectorAll('.color-circle').forEach((b) => {
        b.classList.remove('selected');
        b.textContent = '';
      });
      btn.classList.add('selected');
      btn.textContent = '✓';
      if (hiddenInput) hiddenInput.value = btn.getAttribute('data-color');
    });
  });
}

function computeBudgetStatus(spent, budgetAmount) {
  if (!budgetAmount || budgetAmount <= 0) return 'ایمن';
  const ratio = spent / budgetAmount;
  if (ratio > 1) return 'عبور از بودجه';
  if (ratio >= 0.8) return 'هشدار';
  return 'ایمن';
}

function getBudgetStatusBadge(status) {
  const map = {
    'ایمن': { className: 'badge-status badge-status-safe', icon: '✅', label: 'ایمن' },
    'هشدار': { className: 'badge-status badge-status-warning', icon: '⚠️', label: 'هشدار' },
    'عبور از بودجه': { className: 'badge-status badge-status-danger', icon: '🔴', label: 'عبور از بودجه' },
    safe: { className: 'badge-status badge-status-safe', icon: '✅', label: 'ایمن' },
    warning: { className: 'badge-status badge-status-warning', icon: '⚠️', label: 'هشدار' },
    exceeded: { className: 'badge-status badge-status-danger', icon: '🔴', label: 'عبور از بودجه' },
  };
  return map[status] || map['ایمن'];
}

const CHART_FONT = { family: 'Vazirmatn' };

function destroyChartInstance(chart) {
  if (chart) chart.destroy();
  return null;
}

function chartPersianTooltip(extraCallbacks) {
  return {
    rtl: true,
    titleFont: CHART_FONT,
    bodyFont: CHART_FONT,
    callbacks: {
      label(ctx) {
        if (extraCallbacks?.label) return extraCallbacks.label(ctx);
        const ds = ctx.dataset.label || '';
        const val = ctx.parsed.y ?? ctx.parsed ?? 0;
        return `${ds}: ${displayAccountBalance(val)}`;
      },
      ...extraCallbacks,
    },
  };
}

function filterTransactionsByAccounts(transactions, accountIds) {
  if (!accountIds?.length) return transactions;
  const ids = new Set(accountIds.map(Number));
  return transactions.filter((t) => {
    if (t.type === 'transfer') {
      return ids.has(Number(t.account_id)) || ids.has(Number(t.target_account_id));
    }
    return ids.has(Number(t.account_id));
  });
}

function sumAllAccountsBalance(accounts, field = 'current_balance') {
  return (accounts || []).reduce((sum, acc) => sum + (Number(acc[field]) || 0), 0);
}

function computeIncomeExpenseNet(transactions) {
  let income = 0;
  let expense = 0;
  (transactions || []).forEach((t) => {
    if (t.type === 'income') income += Number(t.amount);
    if (t.type === 'expense') expense += Number(t.amount);
  });
  return { income, expense, net: income - expense };
}

function getTransactionsBeforeDate(transactions, beforeDate) {
  return (transactions || []).filter((t) => t.date < beforeDate);
}

function computePeriodOpeningBalance(accounts, transactionsBeforePeriod, accountIds) {
  const initialSum = sumAllAccountsBalance(accounts, 'initial_balance');
  const filtered = filterTransactionsByAccounts(transactionsBeforePeriod, accountIds);
  const { net } = computeIncomeExpenseNet(filtered);
  return initialSum + net;
}

function buildCumulativeBalanceSeries(dataPoints, openingBalance) {
  let balance = openingBalance;
  return dataPoints.map((point) => {
    balance += point.net;
    return balance;
  });
}

const doughnutPercentLabelsPlugin = {
  id: 'doughnutPercentLabels',
  afterDraw(chart) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    const total = (dataset.data || []).reduce((s, v) => s + Number(v), 0);
    if (!total) return;

    meta.data.forEach((arc, index) => {
      const value = Number(dataset.data[index]);
      if (!value) return;
      const percent = Math.round((value / total) * 100);
      if (percent < 4) return;
      const { x, y } = arc.tooltipPosition();
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Vazirmatn';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${toPersianDigits(String(percent))}٪`, x, y);
      ctx.restore();
    });
  },
};

function computeOverviewStats(transactions) {
  const income = transactions.filter((t) => t.type === 'income');
  const expense = transactions.filter((t) => t.type === 'expense');
  const transfer = transactions.filter((t) => t.type === 'transfer');
  const totalIncome = income.reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = expense.reduce((s, t) => s + Number(t.amount), 0);
  const netCashflow = totalIncome - totalExpense;
  return {
    income: { total: totalIncome, count: income.length },
    expense: { total: totalExpense, count: expense.length },
    transfer: { total: transfer.reduce((s, t) => s + Number(t.amount), 0), count: transfer.length },
    net_cashflow: netCashflow,
    saving_rate: totalIncome > 0 ? Number(((netCashflow / totalIncome) * 100).toFixed(2)) : 0,
  };
}

function computeTxStats(transactions) {
  const amounts = transactions.map((t) => Number(t.amount)).filter((a) => a > 0);
  const incomeExpense = transactions.filter((t) => t.type === 'income' || t.type === 'expense');
  const transfers = transactions.filter((t) => t.type === 'transfer');
  return {
    totalCount: incomeExpense.length,
    transferCount: transfers.length,
    transferVolume: transfers.reduce((s, t) => s + Number(t.amount), 0),
    maxAmount: amounts.length ? Math.max(...amounts) : 0,
    minAmount: amounts.length ? Math.min(...amounts) : 0,
    avgAmount: amounts.length ? amounts.reduce((s, a) => s + a, 0) / amounts.length : 0,
  };
}

function buildDailyCashflow(transactions, from, to) {
  const dayMap = {};
  let d = new Date(from);
  const end = new Date(to);
  while (d <= end) {
    const key = formatGregorianDate(d);
    dayMap[key] = { date: key, income: 0, expense: 0 };
    d.setDate(d.getDate() + 1);
  }
  transactions.forEach((t) => {
    if (!dayMap[t.date]) return;
    if (t.type === 'income') dayMap[t.date].income += Number(t.amount);
    if (t.type === 'expense') dayMap[t.date].expense += Number(t.amount);
  });
  return Object.values(dayMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ ...row, net: row.income - row.expense }));
}

function buildCategoryBreakdownFromTx(transactions, type, categories) {
  const filtered = transactions.filter((t) => t.type === type && t.category_id);
  const map = {};
  filtered.forEach((t) => {
    const id = t.category_id;
    map[id] = (map[id] || 0) + Number(t.amount);
  });
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map)
    .map(([id, amount]) => {
      const cat = categories.find((c) => c.id === Number(id));
      return {
        category_id: Number(id),
        name: getCategoryName(cat),
        color: cat?.color || '#3B5BDB',
        icon: getCategoryDisplayIcon(cat),
        amount,
        percent: total > 0 ? Number(((amount / total) * 100).toFixed(2)) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

function getPeriodToDate(period) {
  return getEffectiveEndDate(period.startDate, period.endDate, period.year, period.month);
}

function getNextJalaliMonthLabel() {
  const cur = getCurrentJalaliMonth();
  let m = cur.month + 1;
  let y = cur.year;
  if (m > 12) { m = 1; y += 1; }
  return `${getJalaliMonthName(m)} ${toPersianDigits(y)}`;
}

function confidenceColor(level) {
  if (level === 'بالا') return 'var(--income-color)';
  if (level === 'متوسط') return 'var(--warning-color)';
  if (level === 'کم') return 'var(--expense-color)';
  return 'var(--text-secondary)';
}

function trendDisplay(trend) {
  if (trend === 'افزایشی') return '📈 افزایشی';
  if (trend === 'کاهشی') return '📉 کاهشی';
  return '✅ پایدار';
}

function createAccountMultiSelect(container, onChange) {
  let accounts = [];
  let selectedIds = new Set();
  let selectAll = true;
  let open = false;

  function emit() {
    if (typeof onChange === 'function') {
      onChange(selectAll ? [] : Array.from(selectedIds));
    }
  }

  function getLabel() {
    if (selectAll || selectedIds.size === 0) return 'همه حساب‌ها';
    if (selectedIds.size === 1) {
      const acc = accounts.find((a) => selectedIds.has(a.id));
      return acc ? acc.name : '۱ حساب';
    }
    return `${toPersianDigits(selectedIds.size)} حساب`;
  }

  function renderPanel() {
    if (!container) return;
    container.className = 'account-multiselect-wrap';
    container.innerHTML = `
      <div class="account-multiselect">
        <button type="button" class="account-multiselect-btn">${getLabel()} ▾</button>
        <div class="account-multiselect-panel ${open ? '' : 'hidden'}">
          <label class="ms-option"><input type="checkbox" class="ms-all" ${selectAll ? 'checked' : ''}> انتخاب همه</label>
          ${accounts.map((a) => `
            <label class="ms-option">
              <input type="checkbox" class="ms-account" value="${a.id}" ${selectAll || selectedIds.has(a.id) ? 'checked' : ''}>
              ${getAccountIcon(a)} ${a.name}
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (container) {
    container.addEventListener('click', (e) => {
      if (e.target.closest('.account-multiselect-btn')) {
        e.stopPropagation();
        open = !open;
        container.querySelector('.account-multiselect-panel')?.classList.toggle('hidden', !open);
        return;
      }

      if (e.target.classList.contains('ms-all')) {
        selectAll = e.target.checked;
        if (selectAll) selectedIds.clear();
        renderPanel();
        emit();
        return;
      }

      if (e.target.classList.contains('ms-account')) {
        selectAll = false;
        selectedIds.clear();
        container.querySelectorAll('.ms-account:checked').forEach((c) => {
          selectedIds.add(Number(c.value));
        });
        if (selectedIds.size === accounts.length) {
          selectAll = true;
          selectedIds.clear();
        }
        const allCb = container.querySelector('.ms-all');
        if (allCb) allCb.checked = selectAll;
        const btn = container.querySelector('.account-multiselect-btn');
        if (btn) btn.textContent = `${getLabel()} ▾`;
        emit();
      }
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        open = false;
        container.querySelector('.account-multiselect-panel')?.classList.add('hidden');
      }
    });
  }

  renderPanel();

  return {
    setAccounts(accs) {
      accounts = accs || [];
      renderPanel();
    },
    getSelectedIds() {
      return selectAll ? [] : Array.from(selectedIds);
    },
    reset() {
      selectAll = true;
      selectedIds.clear();
      renderPanel();
    },
  };
}

function buildWeeklyPeriods(dailyData) {
  const weeks = [];
  let current = { label: '', income: 0, expense: 0, dates: [] };
  let weekNum = 1;

  dailyData.forEach((day, i) => {
    const j = toJalali(day.date);
    const dayLabel = j ? toPersianDigits(String(j.jd)) : day.date;
    if (current.dates.length === 0) {
      current.label = `هفته ${toPersianDigits(weekNum)}`;
    }
    current.income += day.income;
    current.expense += day.expense;
    current.dates.push(day.date);
    if (current.dates.length >= 7 || i === dailyData.length - 1) {
      weeks.push({
        ...current,
        net: current.income - current.expense,
        key: current.label,
      });
      weekNum += 1;
      current = { label: '', income: 0, expense: 0, dates: [] };
    }
  });
  return weeks;
}

function renderStatCard(label, value, className, icon) {
  return `
    <div class="stat-card ${className || ''}">
      <div class="stat-label">${icon ? `${icon} ` : ''}${label}</div>
      <div class="stat-value">${value}</div>
    </div>
  `;
}

function renderBudgetCardMini(item, cat) {
  const icon = getCategoryDisplayIcon(cat);
  const color = cat?.color || '#3B5BDB';
  const name = getCategoryName(cat) !== '—' ? getCategoryName(cat) : item.category_name;
  const percent = item.used_percent || 0;
  const barClass = getProgressBarClass(percent);
  const statusBadge = getBudgetStatusBadge(item.status);
  const barWidth = Math.min(percent, 100);

  return `
    <article class="budget-card budget-card-mini" style="border-left:4px solid ${color};background:${color}1A">
      <div class="budget-card-header">
        <div class="budget-cat-icon" style="background:${color};color:#fff">${icon}</div>
        <span class="budget-cat-name">${name}</span>
      </div>
      <div class="budget-spent-text">${displayAccountBalance(item.spent_amount)} از ${displayAccountBalance(item.budget_amount)}</div>
      <div class="progress-bar progress-bar-thick"><div class="progress-fill ${barClass}" style="width:${barWidth}%"></div></div>
      <span class="${statusBadge.className}">${statusBadge.icon} ${statusBadge.label}</span>
    </article>
  `;
}
