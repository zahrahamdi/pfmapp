let savingsPeriod = null;
let savingsGoal = null;
let savingsChart = null;
let savingsMonthSelector = null;
let savingsInitialized = false;

function renderSavingsCards(goal, balance, period) {
  const container = document.getElementById('savings-cards');
  if (!container) return;

  const target = goal?.target || 0;
  const hasGoal = target > 0;
  const progress = hasGoal ? Math.min(100, (balance / target) * 100) : 0;
  const remaining = target - balance;
  const progressClass = progress >= 100 ? 'positive' : '';

  const goalCard = hasGoal ? `
    <div class="stat-card">
      <div class="stat-label">هدف پس‌انداز</div>
      <div class="stat-value">${displayAccountBalance(target)}</div>
      <button type="button" id="savings-edit-goal" class="btn-link">ویرایش ✏️</button>
    </div>
  ` : `
    <div class="stat-card">
      <div class="stat-label">هدف پس‌انداز</div>
      <div class="stat-value" style="font-size:1rem;color:var(--text-secondary)">هدف تعریف نشده</div>
      <button type="button" id="savings-set-goal" class="btn btn-secondary" style="width:auto;margin-top:12px">تعریف هدف 🎯</button>
    </div>
  `;

  const distanceCard = !hasGoal ? `
    <div class="stat-card">
      <div class="stat-label">فاصله تا هدف</div>
      <div class="stat-value" style="font-size:1rem;color:var(--text-secondary)">—</div>
    </div>
  ` : remaining > 0 ? `
    <div class="stat-card">
      <div class="stat-label">فاصله تا هدف</div>
      <div class="stat-value negative">مانده: ${displayAccountBalance(remaining)}</div>
    </div>
  ` : `
    <div class="stat-card">
      <div class="stat-label">فاصله تا هدف</div>
      <div class="stat-value positive">🎉 هدف محقق شد!</div>
    </div>
  `;

  container.innerHTML = `
    ${goalCard}
    <div class="stat-card">
      <div class="stat-label">موجودی ${getJalaliMonthName(period.month)}</div>
      <div class="stat-value ${balance >= 0 ? 'positive' : 'negative'}">${displayAccountBalance(balance)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">درصد پیشرفت</div>
      <div class="stat-value ${progressClass}">${hasGoal ? toPersianDigits(progress.toFixed(1)) + '٪' : '—'}</div>
      ${hasGoal ? `
        <div class="savings-progress-bar">
          <div class="savings-progress-fill" style="width:${Math.min(progress, 100)}%;${progress >= 100 ? 'background:var(--income-color)' : ''}"></div>
        </div>
      ` : ''}
    </div>
    ${distanceCard}
  `;

  document.getElementById('savings-set-goal')?.addEventListener('click', openSavingsGoalModal);
  document.getElementById('savings-edit-goal')?.addEventListener('click', openSavingsGoalModal);
}

function getDaysInPeriod(period) {
  const { startDate, endDate, year, month } = period;
  const effectiveEnd = getEffectiveEndDate(startDate, endDate, year, month);
  const start = new Date(startDate);
  const end = new Date(effectiveEnd);
  const days = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(formatGregorianDate(new Date(d)));
  }
  return days;
}

async function calculateDailyProgress(period, target) {
  const days = getDaysInPeriod(period);
  if (!days.length || !target) return { labels: [], values: [], balances: [] };

  const allTx = await api.getTransactions({
    from: period.startDate,
    to: getEffectiveEndDate(period.startDate, period.endDate, period.year, period.month),
  });

  const labels = [];
  const values = [];
  const balances = [];

  days.forEach((day) => {
    const dayTx = allTx.filter((t) => t.date <= day);
    let income = 0;
    let expense = 0;
    dayTx.forEach((t) => {
      if (t.type === 'income') income += Number(t.amount);
      if (t.type === 'expense') expense += Number(t.amount);
    });
    const balance = income - expense;
    const percent = Math.min(100, (balance / target) * 100);
    const j = toJalali(day);
    labels.push(toPersianDigits(String(j?.jd || '')));
    values.push(Number(percent.toFixed(1)));
    balances.push(balance);
  });

  return { labels, values, balances };
}

function renderSavingsChart(period, target) {
  const canvas = document.getElementById('savings-chart');
  const chartCard = canvas?.closest('.chart-card');
  if (!canvas || typeof Chart === 'undefined') return;

  if (savingsChart) {
    savingsChart.destroy();
    savingsChart = null;
  }

  chartCard?.querySelector('.chart-empty')?.remove();

  if (!target) {
    canvas.style.display = 'none';
    if (chartCard) {
      const empty = document.createElement('p');
      empty.className = 'chart-empty empty-state';
      empty.style.padding = '40px 0';
      empty.textContent = 'برای مشاهده نمودار، ابتدا هدف پس‌انداز را تعریف کنید';
      chartCard.appendChild(empty);
    }
    return;
  }

  canvas.style.display = 'block';

  calculateDailyProgress(period, target).then(({ labels, values, balances }) => {
    savingsChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'درصد پیشرفت',
            data: values,
            borderColor: '#3B5BDB',
            backgroundColor: 'rgba(59, 91, 219, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
          },
          {
            label: 'خط هدف',
            data: labels.map(() => 100),
            borderColor: '#E03131',
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { font: { family: 'Vazirmatn' } } },
          tooltip: {
            rtl: true,
            textDirection: 'rtl',
            callbacks: {
              title: (items) => `روز ${items[0]?.label || ''}`,
              label: (ctx) => {
                if (ctx.datasetIndex === 1) return 'خط هدف: ۱۰۰٪';
                const bal = balances[ctx.dataIndex] || 0;
                return [
                  `پیشرفت: ${toPersianDigits(String(ctx.raw))}٪`,
                  `موجودی: ${displayAccountBalance(bal)}`,
                ];
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: Math.max(100, ...values, 10),
            ticks: {
              callback: (v) => toPersianDigits(String(v)) + '٪',
              font: { family: 'Vazirmatn' },
            },
          },
          x: {
            ticks: { font: { family: 'Vazirmatn' } },
          },
        },
      },
    });
  });
}

async function loadSavingsPage() {
  if (!savingsPeriod) return;

  const cardsEl = document.getElementById('savings-cards');
  if (cardsEl) {
    cardsEl.innerHTML = Array.from({ length: 4 }, () =>
      '<div class="stat-card skeleton" style="height:120px"></div>'
    ).join('');
  }

  try {
    const { startDate, endDate, year, month } = savingsPeriod;
    const effectiveEnd = getEffectiveEndDate(startDate, endDate, year, month);

    const [goalData, overview] = await Promise.all([
      api.getSavingsGoalOptional(),
      api.getReportsOverview({ from: startDate, to: effectiveEnd }),
    ]);

    savingsGoal = goalData;
    const balance = overview?.net_cashflow || 0;
    const target = savingsGoal?.target || 0;

    renderSavingsCards(savingsGoal, balance, savingsPeriod);
    renderSavingsChart(savingsPeriod, target);
  } catch {
    if (cardsEl) cardsEl.innerHTML = '<p class="error-text">بارگذاری اطلاعات پس‌انداز ناموفق بود</p>';
  }
}

function openSavingsGoalModal() {
  document.getElementById('savings-goal-modal-title').textContent =
    savingsGoal?.target ? 'ویرایش هدف پس‌انداز' : 'تعریف هدف پس‌انداز';
  document.getElementById('savings-target').value = savingsGoal?.target || '';
  openModal('savings-goal-modal');
}

async function handleSavingsGoalSubmit(e) {
  e.preventDefault();
  const target_amount = Number(document.getElementById('savings-target').value);
  if (!target_amount || target_amount <= 0) {
    showToast('مبلغ هدف باید بزرگ‌تر از صفر باشد', 'warning');
    return;
  }

  try {
    await api.setSavingsGoal({ target_amount });
    closeModal('savings-goal-modal');
    showToast('هدف پس‌انداز ذخیره شد', 'success');
    await loadSavingsPage();
  } catch { /* api toast */ }
}

function bindSavingsEvents() {
  document.getElementById('savings-goal-form')?.addEventListener('submit', handleSavingsGoalSubmit);
}

function initSavings() {
  const container = document.getElementById('savings-month-selector');
  if (!savingsInitialized) {
    bindSavingsEvents();
    savingsInitialized = true;
  }

  if (container && !savingsMonthSelector) {
    savingsMonthSelector = createMonthSelector(container, (period) => {
      savingsPeriod = period;
      loadSavingsPage();
    });
  } else if (savingsPeriod) {
    loadSavingsPage();
  }
}
