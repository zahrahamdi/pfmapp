let budgetPeriod = null;
let budgetCategories = [];
let budgetSummary = [];
let budgetEditingId = null;
let budgetMonthSelector = null;
let budgetsInitialized = false;

function getBudgetCategoryMeta(categoryId) {
  return budgetCategories.find((c) => c.id === categoryId) || {};
}

function renderBudgetSummaryCards(totalBudget, totalSpent, remaining) {
  const container = document.getElementById('budget-summary-cards');
  if (!container) return;

  const remainClass = remaining >= 0 ? 'positive' : 'negative';

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">کل بودجه تعیین‌شده</div>
      <div class="stat-value">${displayAccountBalance(totalBudget)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">کل هزینه ماه</div>
      <div class="stat-value">${displayAccountBalance(totalSpent)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">مانده کل</div>
      <div class="stat-value ${remainClass}">${displayAccountBalance(Math.abs(remaining))}${remaining < 0 ? ' (کسری)' : ''}</div>
    </div>
  `;
}

function renderBudgetCard(item) {
  const cat = getBudgetCategoryMeta(item.category_id);
  const icon = getCategoryDisplayIcon(cat);
  const color = cat.color || '#3B5BDB';
  const categoryName = getCategoryName(cat) !== '—' ? getCategoryName(cat) : item.category_name;
  const percent = item.used_percent || 0;
  const barClass = getProgressBarClass(percent);
  const statusBadge = getBudgetStatusBadge(item.status);
  const barWidth = Math.min(percent, 100);

  return `
    <article class="budget-card" data-id="${item.budget_id}" style="border-left:4px solid ${color};background:${color}1A">
      <div class="budget-card-header">
        <div class="budget-cat-icon" style="background:${color};color:#fff">${icon}</div>
        <span class="budget-cat-name">${categoryName}</span>
      </div>
      <div class="budget-spent-text">
        ${displayAccountBalance(item.spent_amount)} از ${displayAccountBalance(item.budget_amount)}
      </div>
      <div class="progress-bar progress-bar-thick">
        <div class="progress-fill ${barClass}" style="width:${barWidth}%"></div>
      </div>
      <div class="budget-card-footer">
        <span class="${statusBadge.className}">${statusBadge.icon} ${statusBadge.label}</span>
        <div class="tx-actions">
          <button type="button" class="btn-icon btn-edit" data-action="edit-budget" data-id="${item.budget_id}" title="ویرایش">✏️</button>
          <button type="button" class="btn-icon btn-delete" data-action="delete-budget" data-id="${item.budget_id}" title="حذف">🗑️</button>
        </div>
      </div>
    </article>
  `;
}

function renderBudgetsGrid() {
  const grid = document.getElementById('budgets-grid');
  const empty = document.getElementById('budgets-empty');
  if (!grid) return;

  if (!budgetSummary.length) {
    grid.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');
  grid.innerHTML = budgetSummary.map(renderBudgetCard).join('');
}

async function loadBudgetsPage() {
  if (!budgetPeriod) return;

  const summaryEl = document.getElementById('budget-summary-cards');
  const gridEl = document.getElementById('budgets-grid');
  if (summaryEl) summaryEl.innerHTML = '<div class="stat-card skeleton" style="height:100px"></div>'.repeat(3);
  if (gridEl) renderSkeleton(gridEl, 3);

  try {
    const [categories, summaryData] = await Promise.all([
      api.getCategories({ type: 'expense' }),
      api.getBudgetSummary({
        month: budgetPeriod.gregorianMonth,
        year: budgetPeriod.gregorianYear,
      }),
    ]);

    budgetCategories = categories;
    const expenseTx = await api.getTransactions({
      from: budgetPeriod.startDate,
      to: budgetPeriod.endDate,
      type: 'expense',
    });

    budgetSummary = (summaryData.budgets || []).map((item) => {
      const spent = (expenseTx || [])
        .filter((t) => Number(t.category_id) === Number(item.category_id))
        .reduce((s, t) => s + Number(t.amount), 0);
      const used_percent = item.budget_amount > 0
        ? Number(((spent / item.budget_amount) * 100).toFixed(2))
        : 0;
      return {
        ...item,
        spent_amount: spent,
        remaining_amount: item.budget_amount - spent,
        used_percent,
        status: computeBudgetStatus(spent, item.budget_amount),
      };
    });

    const totalBudget = budgetSummary.reduce((s, b) => s + b.budget_amount, 0);
    const totalSpent = (expenseTx || []).reduce((s, t) => s + Number(t.amount), 0);

    renderBudgetSummaryCards(totalBudget, totalSpent, totalBudget - totalSpent);
    renderBudgetsGrid();
  } catch {
    if (gridEl) gridEl.innerHTML = '<p class="error-text">بارگذاری بودجه ناموفق بود</p>';
  }
}

function populateBudgetCategorySelect(selectId, excludeBudgetId, selectedId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  const usedCategoryIds = budgetSummary
    .filter((b) => b.budget_id !== excludeBudgetId)
    .map((b) => b.category_id);

  sel.innerHTML = '<option value="">انتخاب کنید...</option>' +
    budgetCategories.map((c) => {
    const disabled = usedCategoryIds.includes(c.id);
    return `<option value="${c.id}" ${disabled ? 'disabled' : ''} ${Number(selectedId) === c.id ? 'selected' : ''}>${getCategoryDisplayIcon(c)} ${getCategoryName(c)}${disabled ? ' (بودجه دارد)' : ''}</option>`;
    }).join('');
}

function openAddBudgetModal() {
  if (!budgetPeriod) return;
  document.getElementById('budget-amount').value = '';
  document.getElementById('budget-period-label').textContent =
    `${getJalaliMonthName(budgetPeriod.month)} ${toPersianDigits(budgetPeriod.year)}`;
  populateBudgetCategorySelect('budget-category', null, '');
  openModal('budget-modal');
}

function openEditBudgetModal(budgetId) {
  const item = budgetSummary.find((b) => b.budget_id === budgetId);
  if (!item) return;

  budgetEditingId = budgetId;
  document.getElementById('edit-budget-amount').value = item.budget_amount;
  populateBudgetCategorySelect('edit-budget-category', budgetId, item.category_id);
  openModal('edit-budget-modal');
}

async function handleCreateBudget(e) {
  e.preventDefault();
  if (!budgetPeriod) return;

  const category_id = Number(document.getElementById('budget-category').value);
  const amount = Number(document.getElementById('budget-amount').value);

  if (!category_id || !amount) {
    showToast('لطفاً دسته و مبلغ را وارد کنید', 'warning');
    return;
  }

  try {
    await api.createBudget({
      category_id,
      amount,
      month: budgetPeriod.gregorianMonth,
      year: budgetPeriod.gregorianYear,
    });
    closeModal('budget-modal');
    showToast('بودجه ایجاد شد', 'success');
    await loadBudgetsPage();
  } catch { /* api toast */ }
}

async function handleUpdateBudget(e) {
  e.preventDefault();
  if (!budgetEditingId || !budgetPeriod) return;

  const category_id = Number(document.getElementById('edit-budget-category').value);
  const amount = Number(document.getElementById('edit-budget-amount').value);

  try {
    await api.updateBudget(budgetEditingId, {
      category_id,
      amount,
      month: budgetPeriod.gregorianMonth,
      year: budgetPeriod.gregorianYear,
    });
    closeModal('edit-budget-modal');
    showToast('بودجه به‌روزرسانی شد', 'success');
    budgetEditingId = null;
    await loadBudgetsPage();
  } catch { /* api toast */ }
}

async function handleDeleteBudget(budgetId) {
  const confirmed = await showConfirm('آیا از حذف این بودجه اطمینان دارید؟');
  if (!confirmed) return;
  try {
    await api.deleteBudget(budgetId);
    showToast('بودجه حذف شد', 'success');
    await loadBudgetsPage();
  } catch { /* api toast */ }
}

function bindBudgetsEvents() {
  document.getElementById('add-budget-btn')?.addEventListener('click', openAddBudgetModal);
  document.getElementById('budget-form')?.addEventListener('submit', handleCreateBudget);
  document.getElementById('edit-budget-form')?.addEventListener('submit', handleUpdateBudget);

  document.getElementById('budgets-grid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = Number(btn.getAttribute('data-id'));
    if (btn.getAttribute('data-action') === 'edit-budget') openEditBudgetModal(id);
    if (btn.getAttribute('data-action') === 'delete-budget') handleDeleteBudget(id);
  });
}

function initBudgets() {
  const container = document.getElementById('budgets-month-selector');
  if (container && !budgetsInitialized) {
    budgetMonthSelector = createMonthSelector(container, (period) => {
      budgetPeriod = period;
      loadBudgetsPage();
    });
    bindBudgetsEvents();
    budgetsInitialized = true;
  } else if (budgetPeriod) {
    loadBudgetsPage();
  }
}
