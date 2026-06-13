let forecastInitialized = false;
let forecastExpensePie = null;
let forecastIncomePie = null;

const FC_NO_DATA = 'داده کافی برای پیش‌بینی وجود ندارد';
const INCOME_FORECAST_MONTHS = 3;

function showForecastSkeletons() {
  const sk = () => '<div class="stat-card skeleton" style="height:100px"></div>';
  const cur = document.getElementById('forecast-cards-current');
  const pred = document.getElementById('forecast-cards-predicted');
  if (cur) cur.innerHTML = Array.from({ length: 3 }, sk).join('');
  if (pred) pred.innerHTML = Array.from({ length: 4 }, sk).join('');
}

function updateForecastHeader() {
  const title = document.getElementById('forecast-header-title');
  if (title) title.textContent = `پیش‌بینی ${getNextJalaliMonthLabel()}`;
}

function getLastCompletedMonthsRange(count) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  const months = [];

  for (let i = 0; i < count; i += 1) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
    months.unshift({ year, month: month + 1 });
  }

  const first = months[0];
  const last = months[months.length - 1];
  const from = `${first.year}-${String(first.month).padStart(2, '0')}-01`;
  const lastDay = new Date(last.year, last.month, 0).getDate();
  const to = `${last.year}-${String(last.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return { from, to, months };
}

function buildIncomeCategoryPredictions(transactions, categories) {
  const { months } = getLastCompletedMonthsRange(INCOME_FORECAST_MONTHS);
  const monthKeys = months.map((m) => `${m.year}-${String(m.month).padStart(2, '0')}`);
  const byCategory = {};

  (transactions || []).forEach((t) => {
    if (!t.category_id) return;
    const monthKey = t.date.slice(0, 7);
    if (!monthKeys.includes(monthKey)) return;
    if (!byCategory[t.category_id]) byCategory[t.category_id] = {};
    byCategory[t.category_id][monthKey] = (byCategory[t.category_id][monthKey] || 0) + Number(t.amount);
  });

  const items = Object.entries(byCategory).map(([catId, monthTotals]) => {
    const monthlyAmounts = monthKeys.map((key) => monthTotals[key] || 0);
    const average = monthlyAmounts.reduce((sum, val) => sum + val, 0) / INCOME_FORECAST_MONTHS;
    const cat = categories.find((c) => c.id === Number(catId)) || {};
    return {
      category_id: Number(catId),
      name: getCategoryName(cat),
      color: cat.color || '#2F9E44',
      icon: getCategoryDisplayIcon(cat),
      amount: Math.round(average),
    };
  }).filter((item) => item.amount > 0);

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return items
    .map((item) => ({
      ...item,
      percent: total > 0 ? Number(((item.amount / total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function renderForecastCurrentCards(summary) {
  const el = document.getElementById('forecast-cards-current');
  if (!el) return;
  const monthlySaving = summary.monthly_saving ?? (summary.monthly_income - summary.monthly_expense);
  const savingClass = monthlySaving >= 0 ? 'stat-green' : 'stat-red';
  el.innerHTML = `
    ${renderStatCard('جمع ورودی این ماه', displayAccountBalance(summary.monthly_income), 'stat-green', '💰')}
    ${renderStatCard('جمع خروجی این ماه', displayAccountBalance(summary.monthly_expense), 'stat-red', '💸')}
    ${renderStatCard('پس‌انداز این ماه', displayAccountBalance(monthlySaving), savingClass, '💎')}
  `;
}

function renderForecastPredictedCards(forecast) {
  const el = document.getElementById('forecast-cards-predicted');
  if (!el) return;

  if (!forecast) {
    const msg = `<div class="stat-value" style="font-size:0.95rem;color:var(--text-secondary)">${FC_NO_DATA}</div>`;
    el.innerHTML = Array.from({ length: 4 }, (_, i) => {
      const labels = ['پیش‌بینی ورودی', 'پیش‌بینی خروجی', 'پیش‌بینی پس‌انداز', 'سطح اطمینان'];
      const cls = ['stat-light-green', 'stat-light-red', 'stat-light-blue', ''][i];
      return `<div class="stat-card ${cls}"><div class="stat-label">${labels[i]}</div>${msg}</div>`;
    }).join('');
    return;
  }

  const confColor = confidenceColor(forecast.confidence_level);
  el.innerHTML = `
    ${renderStatCard('پیش‌بینی ورودی', displayAccountBalance(forecast.predicted_income), 'stat-light-green', '📈')}
    ${renderStatCard('پیش‌بینی خروجی', displayAccountBalance(forecast.predicted_expense), 'stat-light-red', '📉')}
    ${renderStatCard('پیش‌بینی پس‌انداز', displayAccountBalance(forecast.predicted_saving), 'stat-light-blue', '🔮')}
    <div class="stat-card">
      <div class="stat-label">سطح اطمینان</div>
      <div class="stat-value" style="color:${confColor}">${forecast.confidence_level || '—'}</div>
    </div>
  `;
}

function renderTrendSummary(forecast) {
  const el = document.getElementById('forecast-trend-summary');
  if (!el) return;

  if (!forecast?.trend_summary) {
    el.classList.add('hidden');
    el.innerHTML = '';
    return;
  }

  const ts = forecast.trend_summary;
  el.classList.remove('hidden');
  el.innerHTML = `
    <span class="trend-item">روند درآمد: <strong>${trendDisplay(ts.income_trend)}</strong></span>
    <span class="trend-item">روند هزینه: <strong>${trendDisplay(ts.expense_trend)}</strong></span>
    <span class="trend-item">روند پس‌انداز: <strong>${trendDisplay(ts.saving_trend)}</strong></span>
  `;
}

function renderForecastWarnings(forecast) {
  const el = document.getElementById('forecast-warnings');
  if (!el) return;
  el.innerHTML = '';
  if (!forecast?.warnings?.length) return;
  el.innerHTML = forecast.warnings.map((w) => `<div class="warning-alert">⚠️ ${w}</div>`).join('');
}

function trendArrow(trend) {
  if (trend === 'افزایشی') return '📈';
  if (trend === 'کاهشی') return '📉';
  return '✅';
}

function renderForecastBreakdownPie(canvasId, legendId, chartRef, items, emptyMessage) {
  const canvas = document.getElementById(canvasId);
  const legend = document.getElementById(legendId);
  if (!canvas) return chartRef;

  chartRef = destroyChartInstance(chartRef);

  if (!items?.length) {
    if (legend) legend.innerHTML = `<p class="forecast-no-data">${emptyMessage}</p>`;
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
              const percent = item.percent != null
                ? toPersianDigits(String(Math.round(item.percent)))
                : '';
              const trendPart = item.trend ? ` ${trendArrow(item.trend)} ${item.trend}` : '';
              return `${item.name}: ${displayAccountBalance(item.amount)}${percent ? ` (${percent}٪)` : ''}${trendPart}`;
            },
          },
        },
      },
    },
  });

  if (legend) {
    legend.innerHTML = items.map((item) => `
      <span class="legend-item">
        <span class="legend-dot" style="background:${item.color}"></span>
        ${item.icon || ''} ${item.name}: ${item.percent != null
          ? `${toPersianDigits(String(Math.round(item.percent)))}٪`
          : displayAccountBalance(item.amount)}${item.trend ? ` ${trendArrow(item.trend)}` : ''}
      </span>
    `).join('');
  }

  return chartRef;
}

function renderForecastExpensePie(categories, allCategories) {
  if (!categories?.length) {
    forecastExpensePie = renderForecastBreakdownPie(
      'forecast-expense-pie',
      'forecast-expense-legend',
      forecastExpensePie,
      [],
      FC_NO_DATA
    );
    return;
  }

  const items = categories.map((c) => {
    const cat = allCategories.find((x) => x.id === c.category_id) || {};
    const amount = c.predicted_amount ?? c.amount;
    return {
      name: getCategoryName({ name: c.category_name, ...cat }),
      amount,
      color: cat.color || '#3B5BDB',
      icon: getCategoryDisplayIcon(cat),
      trend: c.trend,
    };
  });

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const withPercent = items.map((item) => ({
    ...item,
    percent: total > 0 ? Number(((item.amount / total) * 100).toFixed(2)) : 0,
  }));

  forecastExpensePie = renderForecastBreakdownPie(
    'forecast-expense-pie',
    'forecast-expense-legend',
    forecastExpensePie,
    withPercent,
    FC_NO_DATA
  );
}

function renderForecastIncomePie(incomeItems) {
  forecastIncomePie = renderForecastBreakdownPie(
    'forecast-income-pie',
    'forecast-income-legend',
    forecastIncomePie,
    incomeItems,
    'داده درآمدی برای پیش‌بینی یافت نشد'
  );
}

async function loadForecastPage() {
  const errEl = document.getElementById('forecast-error');
  errEl?.classList.add('hidden');
  showForecastSkeletons();
  updateForecastHeader();

  try {
    const cur = getCurrentJalaliMonth();
    const range = getJalaliMonthRange(cur.year, cur.month);
    const gregorian = getGregorianMonthYearFromRange(range.startDate);
    const incomeRange = getLastCompletedMonthsRange(INCOME_FORECAST_MONTHS);

    const [summary, forecast, catForecast, incomeTransactions, categories] = await Promise.all([
      api.getDashboardSummary({ month: gregorian.month, year: gregorian.year }),
      api.getForecastNextMonthOptional(),
      api.getForecastCategoriesOptional(),
      api.getTransactions({ type: 'income', from: incomeRange.from, to: incomeRange.to }),
      api.getCategories(),
    ]);

    const incomeCategories = (categories || []).filter((c) => c.type === 'income');
    const incomePredictions = buildIncomeCategoryPredictions(incomeTransactions, incomeCategories);

    renderForecastCurrentCards(summary);
    renderForecastPredictedCards(forecast);
    renderTrendSummary(forecast);
    renderForecastWarnings(forecast);
    renderForecastExpensePie(catForecast?.categories || forecast?.category_predictions, categories);
    renderForecastIncomePie(incomePredictions);
  } catch {
    if (errEl) {
      errEl.textContent = 'بارگذاری پیش‌بینی ناموفق بود';
      errEl.classList.remove('hidden');
    }
  }
}

function initForecast() {
  if (!forecastInitialized) {
    forecastInitialized = true;
  }
  loadForecastPage();
}
