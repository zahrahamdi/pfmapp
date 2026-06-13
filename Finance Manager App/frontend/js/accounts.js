let accountsCache = [];
let editingAccountId = null;

function buildAccountTypeOptions(selected) {
  return Object.entries(ACCOUNT_TYPES).map(([key, val]) =>
    `<option value="${key}" ${selected === key ? 'selected' : ''}>${val.icon} ${val.label}</option>`
  ).join('');
}

function buildCurrencyOptions(selected) {
  return CURRENCY_OPTIONS.map((c) =>
    `<option value="${c.value}" ${selected === c.value ? 'selected' : ''}>${c.label}</option>`
  ).join('');
}

function renderAccountCard(account) {
  const typeInfo = ACCOUNT_TYPES[account.type] || ACCOUNT_TYPES.other;
  const user = getUser();

  return `
    <article class="account-card" data-id="${account.id}" style="background: ${typeInfo.gradient}">
      <div class="account-card-top">
        <span class="account-icon">${typeInfo.icon}</span>
        <span class="account-name">${account.name}</span>
      </div>
      <div class="account-balance">${displayAccountBalance(account.current_balance)}</div>
      <div class="account-card-bottom">
        <span class="account-owner">${user?.name || ''}</span>
        <span class="account-currency">${getCurrencyLabel(account.currency)}</span>
      </div>
      <div class="account-actions">
        <button type="button" class="btn-icon btn-edit" data-action="edit" data-id="${account.id}" title="ویرایش">✏️</button>
        <button type="button" class="btn-icon btn-delete" data-action="delete" data-id="${account.id}" title="حذف">🗑️</button>
      </div>
    </article>
  `;
}

function renderAccountsPage(accounts) {
  const total = accounts.reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);
  const totalEl = document.getElementById('accounts-total-balance');
  const gridEl = document.getElementById('accounts-grid');
  const emptyEl = document.getElementById('accounts-empty');

  if (totalEl) totalEl.textContent = displayAccountBalance(total);

  if (!gridEl) return;

  if (!accounts.length) {
    gridEl.innerHTML = '';
    emptyEl?.classList.remove('hidden');
    return;
  }

  emptyEl?.classList.add('hidden');
  gridEl.innerHTML = accounts.map(renderAccountCard).join('');
}

async function loadAccounts() {
  const gridEl = document.getElementById('accounts-grid');
  if (gridEl) renderSkeleton(gridEl, 3);

  try {
    accountsCache = await api.getAccounts();
    renderAccountsPage(accountsCache);
  } catch {
    if (gridEl) gridEl.innerHTML = '<p class="error-text">بارگذاری حساب‌ها ناموفق بود</p>';
  }
}

function resetAccountForm() {
  document.getElementById('account-name').value = '';
  document.getElementById('account-type').innerHTML = buildAccountTypeOptions('cash');
  document.getElementById('account-balance').value = '';
  document.getElementById('account-currency').innerHTML = buildCurrencyOptions('IRR');
}

function resetEditAccountForm() {
  editingAccountId = null;
  document.getElementById('edit-account-name').value = '';
  document.getElementById('edit-account-type').innerHTML = buildAccountTypeOptions('cash');
  document.getElementById('edit-account-currency').innerHTML = buildCurrencyOptions('IRR');
  document.getElementById('edit-initial-balance').value = '';
}

function openAddAccountModal() {
  resetAccountForm();
  openModal('account-modal');
}

function openEditAccountModal(account) {
  editingAccountId = account.id;
  document.getElementById('edit-account-name').value = account.name;
  document.getElementById('edit-account-type').innerHTML = buildAccountTypeOptions(account.type);
  document.getElementById('edit-account-currency').innerHTML = buildCurrencyOptions(account.currency);
  document.getElementById('edit-initial-balance').value = account.initial_balance;
  openModal('edit-account-modal');
}

async function handleCreateAccount(e) {
  e.preventDefault();

  const name = document.getElementById('account-name').value.trim();
  const type = document.getElementById('account-type').value;
  const initial_balance = document.getElementById('account-balance').value;
  const currency = document.getElementById('account-currency').value;
  const submitBtn = document.getElementById('account-submit');

  if (!name || initial_balance === '') {
    showToast('لطفاً نام و موجودی اولیه را وارد کنید', 'warning');
    return;
  }

  submitBtn.disabled = true;

  try {
    await api.createAccount({ name, type, initial_balance: Number(initial_balance), currency });
    closeModal('account-modal');
    showToast('حساب با موفقیت ایجاد شد', 'success');
    await loadAccounts();
  } catch {
    /* toast shown by api */
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleUpdateAccount(e) {
  e.preventDefault();
  if (!editingAccountId) return;

  const name = document.getElementById('edit-account-name').value.trim();
  const type = document.getElementById('edit-account-type').value;
  const currency = document.getElementById('edit-account-currency').value;
  const initial_balance = document.getElementById('edit-initial-balance').value;
  const submitBtn = document.getElementById('edit-account-submit');

  if (!name) {
    showToast('نام حساب الزامی است', 'warning');
    return;
  }

  if (initial_balance === '') {
    showToast('موجودی اولیه الزامی است', 'warning');
    return;
  }

  submitBtn.disabled = true;

  try {
    await api.updateAccount(editingAccountId, {
      name,
      type,
      currency,
      initial_balance: Number(initial_balance),
    });
    closeModal('edit-account-modal');
    showToast('حساب با موفقیت به‌روزرسانی شد', 'success');
    await loadAccounts();
  } catch {
    /* toast shown by api */
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleDeleteAccount(accountId) {
  const account = accountsCache.find((a) => a.id === accountId);
  if (!account) return;

  const firstConfirm = await showConfirm('آیا از حذف این حساب اطمینان دارید؟');
  if (!firstConfirm) return;

  let hasTransactions = false;
  try {
    const txs = await api.getTransactions({ account_id: accountId });
    hasTransactions = Array.isArray(txs) && txs.length > 0;
  } catch {
    return;
  }

  if (hasTransactions) {
    const secondConfirm = await showConfirm('این حساب تراکنش دارد. آیا مطمئن هستید؟');
    if (!secondConfirm) return;
  }

  try {
    const result = await api.deleteAccount(accountId);
    const msg = result?.message?.includes('نرم')
      ? 'حساب به‌صورت نرم حذف شد (تراکنش‌ها حفظ شدند)'
      : 'حساب با موفقیت حذف شد';
    showToast(msg, 'success');
    await loadAccounts();
  } catch {
    /* toast shown by api */
  }
}

function bindAccountsEvents() {
  document.getElementById('add-account-btn')?.addEventListener('click', openAddAccountModal);
  document.getElementById('account-form')?.addEventListener('submit', handleCreateAccount);
  document.getElementById('edit-account-form')?.addEventListener('submit', handleUpdateAccount);

  document.getElementById('accounts-grid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id = Number(btn.getAttribute('data-id'));
    const action = btn.getAttribute('data-action');
    const account = accountsCache.find((a) => a.id === id);

    if (action === 'edit' && account) openEditAccountModal(account);
    if (action === 'delete') handleDeleteAccount(id);
  });
}

let accountsInitialized = false;

function initAccounts() {
  if (!accountsInitialized) {
    bindAccountsEvents();
    accountsInitialized = true;
  }
  loadAccounts();
}
