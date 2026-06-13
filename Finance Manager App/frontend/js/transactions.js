let txAccounts = [];
let txCategories = [];
let txTransactions = [];
let txSelectedAccountId = null;
let txEditingId = null;
let txCurrentType = 'expense';
let txDatePicker = null;
let txTransferDatePicker = null;
let txFilterFromPicker = null;
let txFilterToPicker = null;
let txSort = { field: 'date', order: 'desc' };
let txFilters = { type: '', category_id: '', from: '', to: '', min_amount: '', max_amount: '' };
let txInitialized = false;

function buildAccountOptions(accounts, selectedId) {
  return accounts.map((a) =>
    `<option value="${a.id}" ${Number(selectedId) === a.id ? 'selected' : ''}>${getAccountIcon(a)} ${a.name}</option>`
  ).join('');
}

function buildCategoryOptions(categories, type, selectedId) {
  const filtered = categories.filter((c) => c.type === type);
  return filtered.map((c) =>
    `<option value="${c.id}" ${Number(selectedId) === c.id ? 'selected' : ''}>${getCategoryDisplayIcon(c)} ${getCategoryName(c)}</option>`
  ).join('');
}

function renderTxAccountCards() {
  const container = document.getElementById('tx-account-cards');
  if (!container) return;

  const total = txAccounts.reduce((s, a) => s + (Number(a.current_balance) || 0), 0);
  const allSelected = txSelectedAccountId === null;

  let html = `
    <article class="account-card all-accounts ${allSelected ? 'selected' : ''}" data-account-id="">
      <div class="account-card-top">
        <span class="account-icon">💰</span>
        <span class="account-name">همه حساب‌ها</span>
      </div>
      <div class="account-balance">${displayAccountBalance(total)}</div>
    </article>
  `;

  html += txAccounts.map((acc) => {
    const info = ACCOUNT_TYPES[acc.type] || ACCOUNT_TYPES.other;
    const selected = txSelectedAccountId === acc.id;
    return `
      <article class="account-card ${selected ? 'selected' : ''}" data-account-id="${acc.id}" style="background:${info.gradient}">
        <div class="account-card-top">
          <span class="account-icon">${info.icon}</span>
          <span class="account-name">${acc.name}</span>
        </div>
        <div class="account-balance">${displayAccountBalance(acc.current_balance)}</div>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}

function getCategoryById(id) {
  return txCategories.find((c) => c.id === Number(id));
}

function getAccountById(id) {
  return txAccounts.find((a) => a.id === Number(id));
}

function sortTransactions(list) {
  const sorted = [...list];
  const dir = txSort.order === 'asc' ? 1 : -1;
  sorted.sort((a, b) => {
    if (txSort.field === 'amount') {
      return (Number(a.amount) - Number(b.amount)) * dir;
    }
    const dateCmp = a.date.localeCompare(b.date) * dir;
    if (dateCmp !== 0) return dateCmp;
    return (a.id - b.id) * dir;
  });
  return sorted;
}

function renderTransactionRow(tx) {
  const cat = getCategoryById(tx.category_id);
  const account = getAccountById(tx.account_id);
  const target = getAccountById(tx.target_account_id);

  let arrow = '↔️';
  let rowClass = 'tx-row-transfer';
  if (tx.type === 'income') { arrow = '↑'; rowClass = 'tx-row-income'; }
  if (tx.type === 'expense') { arrow = '↓'; rowClass = 'tx-row-expense'; }

  let title = tx.note || TX_TYPE_LABELS[tx.type] || '—';
  let meta = '';

  if (tx.type === 'transfer' && account && target) {
    title = tx.note || 'انتقال';
    meta = `${getAccountIcon(account)} ${account.name} ← ${getAccountIcon(target)} ${target.name}`;
  } else if (account) {
    meta = `<span class="tx-tag">${getAccountIcon(account)} ${account.name}</span>`;
    if (cat) meta += `<span class="tx-tag">${getCategoryName(cat)}</span>`;
  }

  const icon = tx.type === 'transfer' ? '↔️' : getCategoryDisplayIcon(cat);
  const iconBg = cat?.color || (tx.type === 'transfer' ? '#F08C00' : tx.type === 'income' ? '#2F9E44' : '#E03131');

  return `
    <div class="tx-row ${rowClass}" data-id="${tx.id}">
      <div class="tx-icon-circle" style="background:${iconBg}22;color:${iconBg}">${icon}</div>
      <span class="tx-arrow">${arrow}</span>
      <div class="tx-info">
        <div class="tx-title">${title}</div>
        <div class="tx-meta">${meta}</div>
      </div>
      ${formatTxAmount(tx.type, tx.amount)}
      <div class="tx-actions">
        <button type="button" class="btn-icon btn-edit" data-action="edit" data-id="${tx.id}" title="ویرایش">✏️</button>
        <button type="button" class="btn-icon btn-delete" data-action="delete" data-id="${tx.id}" title="حذف">🗑️</button>
      </div>
    </div>
  `;
}

function renderTransactionList() {
  const container = document.getElementById('tx-list-container');
  const emptyEl = document.getElementById('tx-empty');
  if (!container) return;

  const sorted = sortTransactions(txTransactions);

  if (!sorted.length) {
    container.innerHTML = '';
    emptyEl?.classList.remove('hidden');
    return;
  }

  emptyEl?.classList.add('hidden');

  const groups = {};
  sorted.forEach((tx) => {
    const key = tx.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });

  container.innerHTML = Object.entries(groups).map(([dateKey, items]) => `
    <div class="tx-date-group">
      <div class="tx-date-header">${formatDateHeader(dateKey)}</div>
      ${items.map(renderTransactionRow).join('')}
    </div>
  `).join('');
}

async function loadTransactionsData() {
  const container = document.getElementById('tx-list-container');
  if (container) {
    container.innerHTML = Array.from({ length: 4 }, () => '<div class="skeleton skeleton-line"></div>').join('');
  }

  try {
    const params = {};
    if (txFilters.type) params.type = txFilters.type;
    if (txFilters.category_id) params.category_id = txFilters.category_id;
    if (txSelectedAccountId) params.account_id = txSelectedAccountId;
    if (txFilters.from) params.from = txFilters.from;
    if (txFilters.to) params.to = txFilters.to;
    if (txFilters.min_amount) params.min_amount = txFilters.min_amount;
    if (txFilters.max_amount) params.max_amount = txFilters.max_amount;

    const [accounts, categories, transactions] = await Promise.all([
      api.getAccounts(),
      api.getCategories(),
      api.getTransactions(params),
    ]);

    txAccounts = accounts;
    txCategories = categories;
    txTransactions = transactions;

    renderTxAccountCards();
    populateFilterDropdowns();
    renderTransactionList();
  } catch {
    if (container) container.innerHTML = '<p class="error-text">بارگذاری تراکنش‌ها ناموفق بود</p>';
  }
}

function populateFilterDropdowns() {
  const catSel = document.getElementById('tx-filter-category');
  const type = txFilters.type || '';

  if (catSel) {
    const cats = type === 'income' || type === 'expense'
      ? txCategories.filter((c) => c.type === type)
      : txCategories;
    catSel.innerHTML = '<option value="">همه</option>' +
      cats.map((c) => `<option value="${c.id}" ${txFilters.category_id == c.id ? 'selected' : ''}>${getCategoryDisplayIcon(c)} ${getCategoryName(c)}</option>`).join('');
  }
}

function populatePaymentSelect() {
  const sel = document.getElementById('tx-payment');
  if (!sel) return;
  sel.innerHTML = '<option value="">—</option>' +
    PAYMENT_METHODS.map((p) => `<option value="${p.value}">${p.label}</option>`).join('');
}

function syncTxFormValidation(type) {
  const isTransfer = type === 'transfer';

  const incomeExpenseFields = [
    { id: 'tx-note', required: false },
    { id: 'tx-category', required: true },
    { id: 'tx-account', required: true },
    { id: 'tx-amount', required: true },
    { id: 'tx-payment', required: false },
  ];

  incomeExpenseFields.forEach(({ id, required }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = isTransfer;
    el.required = !isTransfer && required;
  });

  const transferFields = [
    { id: 'tx-transfer-note', required: false },
    { id: 'tx-source-account', required: true },
    { id: 'tx-target-account', required: true },
    { id: 'tx-transfer-amount', required: true },
  ];

  transferFields.forEach(({ id, required }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = !isTransfer;
    el.required = isTransfer && required;
  });

  document.getElementById('tx-inline-cat-name')?.toggleAttribute('disabled', isTransfer);
}

function setTxType(type) {
  txCurrentType = type;
  document.querySelectorAll('#tx-type-toggle .type-toggle').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-type') === type);
  });

  const ieFields = document.getElementById('tx-fields-income-expense');
  const trFields = document.getElementById('tx-fields-transfer');
  if (type === 'transfer') {
    ieFields?.classList.add('hidden');
    trFields?.classList.remove('hidden');
    populateTransferAccounts();
  } else {
    ieFields?.classList.remove('hidden');
    trFields?.classList.add('hidden');
    populateTxFormCategories(type);
    populateTxFormAccounts();
  }

  syncTxFormValidation(type);
}

function populateTxFormCategories(type) {
  const sel = document.getElementById('tx-category');
  if (sel) sel.innerHTML = buildCategoryOptions(txCategories, type || txCurrentType, '');
}

function populateTxFormAccounts() {
  const sel = document.getElementById('tx-account');
  if (sel) sel.innerHTML = buildAccountOptions(txAccounts, '');
}

function populateTransferAccounts() {
  const src = document.getElementById('tx-source-account');
  const tgt = document.getElementById('tx-target-account');
  if (src) src.innerHTML = buildAccountOptions(txAccounts, '');
  if (tgt) tgt.innerHTML = buildAccountOptions(txAccounts, '');
}

function openTxModal(editTx) {
  txEditingId = editTx ? editTx.id : null;
  document.getElementById('transaction-modal-title').textContent = editTx ? 'ویرایش تراکنش' : 'تراکنش جدید';
  document.getElementById('tx-inline-category-form')?.classList.add('hidden');

  const type = editTx?.type || 'expense';
  setTxType(type);

  if (!txDatePicker) txDatePicker = setupJalaliDatePicker(document.getElementById('tx-date-picker'), getTodayGregorian());
  if (!txTransferDatePicker) txTransferDatePicker = setupJalaliDatePicker(document.getElementById('tx-transfer-date-picker'), getTodayGregorian());

  if (editTx) {
    if (type === 'transfer') {
      document.getElementById('tx-source-account').innerHTML = buildAccountOptions(txAccounts, editTx.account_id);
      document.getElementById('tx-target-account').innerHTML = buildAccountOptions(txAccounts, editTx.target_account_id);
      document.getElementById('tx-transfer-amount').value = editTx.amount;
      document.getElementById('tx-transfer-note').value = editTx.note || '';
      txTransferDatePicker.setGregorian(editTx.date);
    } else {
      document.getElementById('tx-note').value = editTx.note || '';
      document.getElementById('tx-category').innerHTML = buildCategoryOptions(txCategories, type, editTx.category_id);
      document.getElementById('tx-account').innerHTML = buildAccountOptions(txAccounts, editTx.account_id);
      document.getElementById('tx-amount').value = editTx.amount;
      document.getElementById('tx-payment').value = editTx.payment_method || '';
      txDatePicker.setGregorian(editTx.date);
    }
  } else {
    document.getElementById('tx-note').value = '';
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-transfer-amount').value = '';
    document.getElementById('tx-transfer-note').value = '';
    document.getElementById('tx-payment').value = '';
    populateTxFormCategories('expense');
    populateTxFormAccounts();
    populateTransferAccounts();
    txDatePicker.setGregorian(getTodayGregorian());
    txTransferDatePicker.setGregorian(getTodayGregorian());
  }

  openModal('transaction-modal');
}

async function handleTxSubmit(e) {
  e.preventDefault();

  let body;
  if (txCurrentType === 'transfer') {
    const account_id = Number(document.getElementById('tx-source-account').value);
    const target_account_id = Number(document.getElementById('tx-target-account').value);
    const amount = Number(document.getElementById('tx-transfer-amount').value);
    const date = txTransferDatePicker.getGregorian();
    const note = document.getElementById('tx-transfer-note').value.trim();

    if (!account_id || !target_account_id || !amount || account_id === target_account_id) {
      showToast('اطلاعات انتقال نامعتبر است', 'warning');
      return;
    }

    body = { type: 'transfer', account_id, target_account_id, amount, date };
    if (note) body.note = note;
  } else {
    const note = document.getElementById('tx-note').value.trim();
    const category_id = Number(document.getElementById('tx-category').value);
    const account_id = Number(document.getElementById('tx-account').value);
    const amount = Number(document.getElementById('tx-amount').value);
    const date = txDatePicker.getGregorian();
    const payment_method = document.getElementById('tx-payment').value || undefined;

    if (!note || note.length < 2) {
      showToast('عنوان باید حداقل ۲ کاراکتر باشد', 'warning');
      return;
    }
    if (!category_id || !account_id || !amount) {
      showToast('لطفاً همه فیلدهای الزامی را پر کنید', 'warning');
      return;
    }

    body = { type: txCurrentType, note, category_id, account_id, amount, date };
    if (payment_method) body.payment_method = payment_method;
  }

  const submitBtn = document.getElementById('tx-submit');
  submitBtn.disabled = true;

  try {
    if (txEditingId) {
      await api.updateTransaction(txEditingId, body);
      showToast('تراکنش به‌روزرسانی شد', 'success');
    } else {
      await api.createTransaction(body);
      showToast('تراکنش ثبت شد', 'success');
    }
    closeModal('transaction-modal');
    await loadTransactionsData();
  } catch {
    /* api toast */
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleTxDelete(id) {
  const confirmed = await showConfirm('آیا از حذف این تراکنش اطمینان دارید؟');
  if (!confirmed) return;
  try {
    await api.deleteTransaction(id);
    showToast('تراکنش حذف شد', 'success');
    await loadTransactionsData();
  } catch { /* api toast */ }
}

async function handleInlineCategorySave() {
  const name = document.getElementById('tx-inline-cat-name').value.trim();
  const icon = document.getElementById('tx-inline-cat-icon').value || '📦';
  const color = document.getElementById('tx-inline-cat-color').value;

  if (!name || name.length < 2) {
    showToast('نام دسته باید حداقل ۲ کاراکتر باشد', 'warning');
    return;
  }

  try {
    const cat = await api.createCategory({ name, type: txCurrentType, icon, color });
    txCategories.push(cat);
    populateTxFormCategories(txCurrentType);
    document.getElementById('tx-category').value = cat.id;
    document.getElementById('tx-inline-category-form').classList.add('hidden');
    showToast('دسته‌بندی ایجاد شد', 'success');
  } catch { /* api toast */ }
}

function bindToggleGroup(containerId, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toggle-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      callback(btn.getAttribute('data-value'));
    });
  });
}

function applyFilters() {
  txFilters.from = txFilterFromPicker?.getGregorian() || '';
  txFilters.to = txFilterToPicker?.getGregorian() || '';
  txFilters.min_amount = document.getElementById('tx-filter-min')?.value || '';
  txFilters.max_amount = document.getElementById('tx-filter-max')?.value || '';
  txFilters.category_id = document.getElementById('tx-filter-category')?.value || '';
  loadTransactionsData();
}

function clearFilters() {
  txFilters = { type: '', category_id: '', from: '', to: '', min_amount: '', max_amount: '' };
  txSelectedAccountId = null;
  document.getElementById('tx-filter-min').value = '';
  document.getElementById('tx-filter-max').value = '';
  txFilterFromPicker?.setGregorian(getTodayGregorian());
  txFilterToPicker?.setGregorian(getTodayGregorian());

  document.querySelectorAll('#tx-filter-type .toggle-btn').forEach((b, i) => {
    b.classList.toggle('active', i === 0);
  });

  loadTransactionsData();
}

function bindTransactionsEvents() {
  document.getElementById('tx-add-btn')?.addEventListener('click', () => openTxModal(null));
  document.getElementById('transaction-form')?.addEventListener('submit', handleTxSubmit);

  document.querySelectorAll('#tx-type-toggle .type-toggle').forEach((btn) => {
    btn.addEventListener('click', () => setTxType(btn.getAttribute('data-type')));
  });

  document.getElementById('tx-add-category-inline')?.addEventListener('click', () => {
    document.getElementById('tx-inline-category-form').classList.remove('hidden');
    renderIconPicker(document.getElementById('tx-inline-icon-picker'), '📦', 'tx-inline-cat-icon');
    renderColorPicker(document.getElementById('tx-inline-color-picker'), '#3B5BDB', 'tx-inline-cat-color');
  });

  document.getElementById('tx-inline-cat-save')?.addEventListener('click', handleInlineCategorySave);

  document.getElementById('tx-account-cards')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-account-id]');
    if (!card) return;
    const id = card.getAttribute('data-account-id');
    txSelectedAccountId = id ? Number(id) : null;
    renderTxAccountCards();
    loadTransactionsData();
  });

  document.getElementById('tx-list-container')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = Number(btn.getAttribute('data-id'));
    const action = btn.getAttribute('data-action');
    const tx = txTransactions.find((t) => t.id === id);
    if (action === 'edit' && tx) openTxModal(tx);
    if (action === 'delete') handleTxDelete(id);
  });

  bindToggleGroup('tx-filter-type', (val) => {
    txFilters.type = val;
    populateFilterDropdowns();
  });

  bindToggleGroup('tx-sort-field', (val) => {
    txSort.field = val;
    renderTransactionList();
  });

  bindToggleGroup('tx-sort-order', (val) => {
    txSort.order = val;
    renderTransactionList();
  });

  document.getElementById('tx-apply-filter')?.addEventListener('click', applyFilters);
  document.getElementById('tx-clear-filter')?.addEventListener('click', clearFilters);
}

function initTransactions() {
  if (!txInitialized) {
    populatePaymentSelect();
    txFilterFromPicker = setupJalaliDatePicker(document.getElementById('tx-filter-from'), getTodayGregorian());
    txFilterToPicker = setupJalaliDatePicker(document.getElementById('tx-filter-to'), getTodayGregorian());
    bindTransactionsEvents();
    txInitialized = true;
  }
  loadTransactionsData();
}
