let overviewPeriod = null;
let overviewAccountIds = [];
let overviewAccounts = [];
let overviewCategories = [];
let overviewMonthSelector = null;
let overviewAccountSelect = null;
let overviewInitialized = false;
let overviewCashflowChart = null;
let overviewIncomePie = null;
let overviewExpensePie = null;
let overviewOpeningBalance = 0;

function showOverviewSkeletons() {
  const sk = () => '<div class="stat-card skeleton" style="height:100px"></div>';
  ['overview-cards-row1', 'overview-cards-row2', 'overview-cards-row3', 'overview-cards-row3b'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = Array.from({ length: 3 }, sk).join('');
  });
  const row1 = document.getElementById('overview-cards-row1');
  if (row1) row1.innerHTML = Array.from({ length: 4 }, sk).join('');
}

function renderOverviewCards(overview, goal, txStats, totalBalance, monthlySaving) {
  const row1 = document.getElementById('overview-cards-row1');
  const row2 = document.getElementById('overview-cards-row2');
  const row3 = document.getElementById('overview-cards-row3');
  const row3b = document.getElementById('overview-cards-row3b');
  if (!row1) return;

  const target = goal?.target || 0;
  const progress = target > 0 ? Math.min(999, (monthlySaving / target) * 100) : null;
  const savingClass = monthlySaving >= 0 ? 'stat-green' : 'stat-red';

  row1.innerHTML = `
    ${renderStatCard('جمع درآمد', displayAccountBalance(overview.income.total), 'stat-green', '💰')}
    ${renderStatCard('جمع هزینه', displayAccountBalance(overview.expense.total), 'stat-red', '💸')}
    ${renderStatCard('موجودی', displayAccountBalance(totalBalance), 'stat-accent', '📊')}
    ${renderStatCard('پس‌انداز این ماه', displayAccountBalance(monthlySaving), savingClass, '💎')}
  `;

  row2.innerHTML = `
    ${renderStatCard('نرخ پس‌انداز', toPersianDigits(String(overview.saving_rate)) + '٪', '', '📈')}
    ${renderStatCard('هدف پس‌انداز', target > 0 ? displayAccountBalance(target) : 'تعریف نشده', '', '🎯')}
    ${renderStatCard('درصد پیشرفت', progress !== null ? toPersianDigits(progress.toFixed(1)) + '٪' : '—', progress >= 100 ? 'stat-green' : '', '⏳')}
  `;

  row3.innerHTML = `
    ${renderStatCard('تعداد کل تراکنش‌ها', toPersianDigits(String(txStats.totalCount)), '', '📝')}
    ${renderStatCard('تعداد انتقال‌ها', toPersianDigits(String(txStats.transferCount)), '', '🔄')}
    ${renderStatCard('حجم انتقال‌ها', displayAccountBalance(txStats.transferVolume), '', '↔️')}
  `;

  row3b.innerHTML = `
    ${renderStatCard('بیشترین مبلغ تراکنش', txStats.maxAmount ? displayAccountBalance(txStats.maxAmount) : '—', '', '⬆️')}
    ${renderStatCard('کمترین مبلغ تراکنش', txStats.minAmount ? displayAccountBalance(txStats.minAmount) : '—', '', '⬇️')}
    ${renderStatCard('میانگین مبلغ تراکنش‌ها', txStats.avgAmount ? displayAccountBalance(Math.round(txStats.avgAmount)) : '—', '', '📐')}
  `;
}

function renderPieLegend(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items.length) {
    el.innerHTML = '<p class="empty-state" style="padding:8px">داده‌ای موجود نیست</p>';
    return;
  }
  el.innerHTML = items.map((item) => `
    <span class="legend-item">
      <span class="legend-dot" style="background:${item.color}"></span>
      ${item.icon || ''} ${item.name}: ${toPersianDigits(String(Math.round(item.percent)))}٪
    </span>
  `).join('');
}

function renderOverviewCashflowChart(dailyData, openingBalance) {
  const canvas = document.getElementById('overview-cashflow-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  overviewCashflowChart = destroyChartInstance(overviewCashflowChart);

  const labels = dailyData.map((d) => {
    const j = toJalali(d.date);
    return j ? toPersianDigits(String(j.jd)) : d.date;
  });
  const incomes = dailyData.map((d) => d.income);
  const expenses = dailyData.map((d) => d.expense);
  const balanceLine = buildCumulativeBalanceSeries(dailyData, openingBalance);

  overviewCashflowChart = new Chart(canvas, {
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'درآمد',
          data: incomes,
          backgroundColor: 'rgba(47, 158, 68, 0.75)',
          order: 2,
        },
        {
          type: 'bar',
          label: 'هزینه',
          data: expenses,
          backgroundColor: 'rgba(224, 49, 49, 0.75)',
          order: 3,
        },
        {
          type: 'line',
          label: 'موجودی تجمعی',
          data: balanceLine,
          borderColor: '#3B5BDB',
          backgroundColor: 'rgba(59, 91, 219, 0.1)',
          tension: 0.3,
          pointRadius: 2,
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
          title: (items) => `روز ${items[0]?.label || ''}`,
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
}

function renderOverviewPie(canvasId, chartRef, items, legendId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return chartRef;

  chartRef = destroyChartInstance(chartRef);

  if (!items.length) {
    renderPieLegend(legendId, []);
    return chartRef;
  }

  chartRef = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: items.map((i) => i.name),
      datasets: [{
        data: items.map((i) => i.amount),
        backgroundColor: items.map((i) => i.color),
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    plugins: [doughnutPercentLabelsPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          titleFont: CHART_FONT,
          bodyFont: CHART_FONT,
          callbacks: {
            label(ctx) {
              const item = items[ctx.dataIndex];
              return `${item.name}: ${displayAccountBalance(item.amount)} (${toPersianDigits(String(Math.round(item.percent)))}٪)`;
            },
          },
        },
      },
    },
  });

  renderPieLegend(legendId, items);
  return chartRef;
}

function renderOverviewBudgets(summary, categories) {
  const grid = document.getElementById('overview-budgets-grid');
  const empty = document.getElementById('overview-budgets-empty');
  if (!grid) return;

  if (!summary?.length) {
    grid.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');
  grid.innerHTML = summary.map((item) => {
    const cat = categories.find((c) => c.id === item.category_id) || {};
    return renderBudgetCardMini(item, cat);
  }).join('');
}

async function loadOverviewPage() {
  if (!overviewPeriod) return;

  const errEl = document.getElementById('overview-error');
  errEl?.classList.add('hidden');
  showOverviewSkeletons();

  try {
    const { startDate, gregorianMonth, gregorianYear } = overviewPeriod;
    const effectiveEnd = getPeriodToDate(overviewPeriod);

    const [accounts, transactions, txsBeforePeriod, goal, budgetData, categories] = await Promise.all([
      api.getAccounts(),
      api.getTransactions({ from: startDate, to: effectiveEnd }),
      api.getTransactions({ to: startDate }),
      api.getSavingsGoalOptional(),
      api.getBudgetSummary({ month: gregorianMonth, year: gregorianYear }),
      api.getCategories(),
    ]);

    overviewAccounts = accounts || [];
    if (overviewAccountSelect) overviewAccountSelect.setAccounts(overviewAccounts);

    overviewCategories = categories || [];
    const filtered = filterTransactionsByAccounts(transactions, overviewAccountIds);
    const beforePeriod = getTransactionsBeforeDate(txsBeforePeriod, startDate);

    const overview = computeOverviewStats(filtered);
    const txStats = computeTxStats(filtered);
    const totalBalance = sumAllAccountsBalance(overviewAccounts, 'current_balance');
    const monthlySaving = overview.income.total - overview.expense.total;
    overviewOpeningBalance = computePeriodOpeningBalance(overviewAccounts, beforePeriod, overviewAccountIds);

    const dailyData = buildDailyCashflow(filtered, startDate, effectiveEnd);
    const incomeBreakdown = buildCategoryBreakdownFromTx(filtered, 'income', overviewCategories);
    const expenseBreakdown = buildCategoryBreakdownFromTx(filtered, 'expense', overviewCategories);

    const expenseTx = filtered.filter((t) => t.type === 'expense');
    const budgetSummary = (budgetData?.budgets || []).map((item) => {
      const spent = expenseTx
        .filter((t) => Number(t.category_id) === Number(item.category_id))
        .reduce((s, t) => s + Number(t.amount), 0);
      const used_percent = item.budget_amount > 0
        ? Number(((spent / item.budget_amount) * 100).toFixed(2))
        : 0;
      return {
        ...item,
        spent_amount: spent,
        used_percent,
        status: computeBudgetStatus(spent, item.budget_amount),
      };
    });

    renderOverviewCards(overview, goal, txStats, totalBalance, monthlySaving);
    renderOverviewCashflowChart(dailyData, overviewOpeningBalance);
    overviewIncomePie = renderOverviewPie('overview-income-pie', overviewIncomePie, incomeBreakdown, 'overview-income-legend');
    overviewExpensePie = renderOverviewPie('overview-expense-pie', overviewExpensePie, expenseBreakdown, 'overview-expense-legend');
    renderOverviewBudgets(budgetSummary, overviewCategories);
  } catch (err) {
    if (errEl) {
      errEl.textContent = 'بارگذاری مرور کلی ناموفق بود';
      errEl.classList.remove('hidden');
    }
  }
}

function initOverview() {
  if (!overviewInitialized) {
    overviewInitialized = true;
  }

  const monthContainer = document.getElementById('overview-month-selector');
  const accountContainer = document.getElementById('overview-account-filter');

  if (accountContainer && !overviewAccountSelect) {
    overviewAccountSelect = createAccountMultiSelect(accountContainer, (ids) => {
      overviewAccountIds = ids;
      loadOverviewPage();
    });
  }

  if (monthContainer && !overviewMonthSelector) {
    overviewMonthSelector = createMonthSelector(monthContainer, (period) => {
      overviewPeriod = period;
      loadOverviewPage();
    });
  } else if (overviewPeriod) {
    loadOverviewPage();
  }
}
