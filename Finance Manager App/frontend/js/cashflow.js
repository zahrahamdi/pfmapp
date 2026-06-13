let cashflowPeriod = null;
let cashflowAccountIds = [];
let cashflowAccounts = [];
let cashflowCategories = [];
let cashflowTransactions = [];
let cashflowDailyData = [];
let cashflowOpeningBalance = 0;
let cashflowMode = 'weekly';
let cashflowMonthSelector = null;
let cashflowAccountSelect = null;
let cashflowChart = null;
let cashflowInitialized = false;

const CF_NO_FORECAST = 'داده کافی برای پیش‌بینی وجود ندارد';

function showCashflowSkeletons() {
  const sk = () => '<div class="stat-card skeleton" style="height:100px"></div>';
  const cur = document.getElementById('cashflow-cards-current');
  const fc = document.getElementById('cashflow-cards-forecast');
  if (cur) cur.innerHTML = Array.from({ length: 3 }, sk).join('');
  if (fc) fc.innerHTML = Array.from({ length: 4 }, sk).join('');
}

function renderCashflowCurrentCards(overview, totalBalance) {
  const el = document.getElementById('cashflow-cards-current');
  if (!el) return;
  el.innerHTML = `
    ${renderStatCard('جمع ورودی', displayAccountBalance(overview.income.total), 'stat-green', '💰')}
    ${renderStatCard('جمع خروجی', displayAccountBalance(overview.expense.total), 'stat-red', '💸')}
    ${renderStatCard('موجودی', displayAccountBalance(totalBalance), 'stat-accent', '📊')}
  `;
}

function renderCashflowForecastCards(forecast) {
  const el = document.getElementById('cashflow-cards-forecast');
  if (!el) return;

  if (!forecast) {
    const msg = `<div class="stat-value" style="font-size:0.95rem;color:var(--text-secondary)">${CF_NO_FORECAST}</div>`;
    el.innerHTML = Array.from({ length: 4 }, (_, i) => {
      const labels = ['پیش‌بینی ورودی ماه آینده', 'پیش‌بینی خروجی ماه آینده', 'پیش‌بینی پس‌انداز', 'سطح اطمینان'];
      return `<div class="stat-card stat-light-${['green', 'red', 'blue', 'blue'][i]}"><div class="stat-label">${labels[i]}</div>${msg}</div>`;
    }).join('');
    return;
  }

  const confColor = confidenceColor(forecast.confidence_level);
  el.innerHTML = `
    ${renderStatCard('پیش‌بینی ورودی ماه آینده', displayAccountBalance(forecast.predicted_income), 'stat-light-green', '📈')}
    ${renderStatCard('پیش‌بینی خروجی ماه آینده', displayAccountBalance(forecast.predicted_expense), 'stat-light-red', '📉')}
    ${renderStatCard('پیش‌بینی پس‌انداز', displayAccountBalance(forecast.predicted_saving), 'stat-light-blue', '🔮')}
    <div class="stat-card">
      <div class="stat-label">سطح اطمینان</div>
      <div class="stat-value" style="color:${confColor}">${forecast.confidence_level || '—'}</div>
    </div>
  `;
}

function getCashflowPeriods() {
  if (cashflowMode === 'daily') {
    return cashflowDailyData.map((d) => {
      const j = toJalali(d.date);
      return {
        key: j ? toPersianDigits(String(j.jd)) : d.date,
        label: j ? toPersianDigits(String(j.jd)) : d.date,
        income: d.income,
        expense: d.expense,
        net: d.net,
        dates: [d.date],
      };
    });
  }
  return buildWeeklyPeriods(cashflowDailyData);
}

function renderCashflowChart() {
  const canvas = document.getElementById('cashflow-chart');
  const wrap = document.getElementById('cashflow-chart-wrap');
  if (!canvas || typeof Chart === 'undefined') return;

  cashflowChart = destroyChartInstance(cashflowChart);
  wrap?.classList.toggle('scroll-mode', cashflowMode === 'daily');

  const periods = getCashflowPeriods();
  const labels = periods.map((p) => p.label || p.key);
  const incomes = periods.map((p) => p.income);
  const expenses = periods.map((p) => p.expense);
  const balanceLine = buildCumulativeBalanceSeries(periods, cashflowOpeningBalance);

  cashflowChart = new Chart(canvas, {
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'ورودی',
          data: incomes,
          backgroundColor: 'rgba(47, 158, 68, 0.75)',
          order: 2,
        },
        {
          type: 'bar',
          label: 'خروجی',
          data: expenses,
          backgroundColor: 'rgba(224, 49, 49, 0.75)',
          order: 3,
        },
        {
          type: 'line',
          label: 'موجودی',
          data: balanceLine,
          borderColor: '#3B5BDB',
          tension: 0.3,
          pointRadius: cashflowMode === 'daily' ? 1 : 3,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: CHART_FONT } },
        tooltip: chartPersianTooltip({
          title: (items) => (cashflowMode === 'weekly' ? items[0]?.label : `روز ${items[0]?.label}`),
        }),
      },
      scales: {
        x: { ticks: { font: CHART_FONT } },
        y: {
          ticks: {
            font: CHART_FONT,
            callback: (v) => formatPersianNumber(Math.round(v / 10)),
          },
        },
      },
    },
  });

  renderCashflowTable(periods);
}

function formatCellAmount(amount) {
  if (amount === null || amount === undefined) return '—';
  return displayAccountBalance(amount);
}

function buildCategoryRows(transactions, categories, periods, type) {
  const catIds = new Set();
  transactions.filter((t) => t.type === type && t.category_id).forEach((t) => {
    catIds.add(t.category_id);
  });

  return Array.from(catIds).map((catId) => {
    const cat = categories.find((c) => c.id === Number(catId)) || {};
    const amounts = periods.map((p) =>
      transactions
        .filter((t) => t.type === type && t.category_id === Number(catId) && p.dates.includes(t.date))
        .reduce((s, t) => s + Number(t.amount), 0)
    );
    return {
      name: getCategoryName(cat),
      icon: getCategoryDisplayIcon(cat),
      amounts,
    };
  });
}

function renderCashflowTable(periods) {
  const table = document.getElementById('cashflow-table');
  const wrap = document.getElementById('cashflow-table-wrap');
  if (!table) return;

  wrap?.classList.toggle('scroll-mode', cashflowMode === 'daily');

  const incomeRows = buildCategoryRows(cashflowTransactions, cashflowCategories, periods, 'income');
  const expenseRows = buildCategoryRows(cashflowTransactions, cashflowCategories, periods, 'expense');

  const opening = [];
  const closing = [];
  let running = cashflowOpeningBalance;
  periods.forEach((p, i) => {
    opening[i] = running;
    running += p.net;
    closing[i] = running;
  });

  const colHeaders = periods.map((p) => `<th>${p.label || p.key}</th>`).join('');

  const incomeSection = incomeRows.map((r) => `
    <tr class="cat-row income-cat-row">
      <td>${r.icon} ${r.name}</td>
      ${r.amounts.map((a) => `<td>${a ? displayAccountBalance(a) : '—'}</td>`).join('')}
    </tr>
  `).join('');

  const expenseSection = expenseRows.map((r) => `
    <tr class="cat-row expense-cat-row">
      <td>${r.icon} ${r.name}</td>
      ${r.amounts.map((a) => `<td>${a ? displayAccountBalance(a) : '—'}</td>`).join('')}
    </tr>
  `).join('');

  table.innerHTML = `
    <thead>
      <tr><th>شرح</th>${colHeaders}</tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>موجودی ابتدای دوره</strong></td>
        ${opening.map((v) => `<td>${formatCellAmount(v)}</td>`).join('')}
      </tr>
      <tr class="section-header-row" data-section="income">
        <td colspan="${periods.length + 1}">▼ درآمدها</td>
      </tr>
      ${incomeSection || `<tr class="cat-row income-cat-row"><td colspan="${periods.length + 1}" style="text-align:center;color:var(--text-secondary)">درآمدی ثبت نشده</td></tr>`}
      <tr class="section-header-row" data-section="expense">
        <td colspan="${periods.length + 1}">▼ هزینه‌ها</td>
      </tr>
      ${expenseSection || `<tr class="cat-row expense-cat-row"><td colspan="${periods.length + 1}" style="text-align:center;color:var(--text-secondary)">هزینه‌ای ثبت نشده</td></tr>`}
      <tr>
        <td><strong>موجودی انتهای دوره</strong></td>
        ${closing.map((v) => `<td>${formatCellAmount(v)}</td>`).join('')}
      </tr>
    </tbody>
  `;

  table.querySelectorAll('.section-header-row').forEach((row) => {
    row.addEventListener('click', () => {
      const section = row.dataset.section;
      const selector = section === 'income' ? '.income-cat-row' : '.expense-cat-row';
      const rows = table.querySelectorAll(selector);
      const collapsed = row.classList.toggle('collapsed');
      rows.forEach((r) => { r.style.display = collapsed ? 'none' : ''; });
      row.querySelector('td').textContent = (collapsed ? '▶' : '▼') + (section === 'income' ? ' درآمدها' : ' هزینه‌ها');
    });
  });
}

async function loadCashflowPage() {
  if (!cashflowPeriod) return;

  const errEl = document.getElementById('cashflow-error');
  errEl?.classList.add('hidden');
  showCashflowSkeletons();

  try {
    const { startDate } = cashflowPeriod;
    const effectiveEnd = getPeriodToDate(cashflowPeriod);

    const [accounts, transactions, txsBeforePeriod, forecast, categories] = await Promise.all([
      api.getAccounts(),
      api.getTransactions({ from: startDate, to: effectiveEnd }),
      api.getTransactions({ to: startDate }),
      api.getForecastNextMonthOptional(),
      api.getCategories(),
    ]);

    cashflowAccounts = accounts || [];
    if (cashflowAccountSelect) cashflowAccountSelect.setAccounts(cashflowAccounts);

    cashflowCategories = categories || [];
    cashflowTransactions = filterTransactionsByAccounts(transactions, cashflowAccountIds);
    const beforePeriod = getTransactionsBeforeDate(txsBeforePeriod, startDate);

    cashflowOpeningBalance = computePeriodOpeningBalance(cashflowAccounts, beforePeriod, cashflowAccountIds);
    const totalBalance = sumAllAccountsBalance(cashflowAccounts, 'current_balance');
    const overview = computeOverviewStats(cashflowTransactions);
    cashflowDailyData = buildDailyCashflow(cashflowTransactions, startDate, effectiveEnd);

    renderCashflowCurrentCards(overview, totalBalance);
    renderCashflowForecastCards(forecast);
    renderCashflowChart();
  } catch {
    if (errEl) {
      errEl.textContent = 'بارگذاری جریان نقدی ناموفق بود';
      errEl.classList.remove('hidden');
    }
  }
}

function bindCashflowEvents() {
  document.getElementById('cashflow-mode-toggle')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.chart-toggle-btn');
    if (!btn) return;
    cashflowMode = btn.dataset.mode;
    document.querySelectorAll('#cashflow-mode-toggle .chart-toggle-btn').forEach((b) => {
      b.classList.toggle('active', b === btn);
    });
    renderCashflowChart();
  });
}

function initCashflow() {
  if (!cashflowInitialized) {
    bindCashflowEvents();
    cashflowInitialized = true;
  }

  const monthContainer = document.getElementById('cashflow-month-selector');
  const accountContainer = document.getElementById('cashflow-account-filter');

  if (accountContainer && !cashflowAccountSelect) {
    cashflowAccountSelect = createAccountMultiSelect(accountContainer, (ids) => {
      cashflowAccountIds = ids;
      loadCashflowPage();
    });
  }

  if (monthContainer && !cashflowMonthSelector) {
    cashflowMonthSelector = createMonthSelector(monthContainer, (period) => {
      cashflowPeriod = period;
      loadCashflowPage();
    });
  } else if (cashflowPeriod) {
    loadCashflowPage();
  }
}
