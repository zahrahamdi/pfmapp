let allCategories = [];
let editingCategoryId = null;
let categoriesInitialized = false;

function renderCategoryRow(cat) {
  const typeLabel = cat.type === 'income' ? 'درآمد' : 'هزینه';
  return `
    <div class="category-row" data-id="${cat.id}">
      <span class="color-dot" style="background:${cat.color || '#3B5BDB'}"></span>
      <span class="tx-icon">${getCategoryDisplayIcon(cat)}</span>
      <span class="category-row-name">${getCategoryName(cat)}</span>
      <span class="type-badge">${typeLabel}</span>
      <button type="button" class="btn-icon btn-edit" data-action="edit-cat" data-id="${cat.id}" title="ویرایش">✏️</button>
    </div>
  `;
}

function renderCategoriesLists() {
  const expenseList = document.getElementById('expense-categories-list');
  const incomeList = document.getElementById('income-categories-list');
  const emptyEl = document.getElementById('categories-empty');

  const expenses = allCategories.filter((c) => c.type === 'expense');
  const incomes = allCategories.filter((c) => c.type === 'income');

  if (expenseList) expenseList.innerHTML = expenses.map(renderCategoryRow).join('');
  if (incomeList) incomeList.innerHTML = incomes.map(renderCategoryRow).join('');

  if (!allCategories.length) {
    emptyEl?.classList.remove('hidden');
  } else {
    emptyEl?.classList.add('hidden');
  }
}

async function loadCategories() {
  const expenseList = document.getElementById('expense-categories-list');
  if (expenseList) {
    expenseList.innerHTML = Array.from({ length: 3 }, () => '<div class="skeleton skeleton-line"></div>').join('');
  }

  try {
    allCategories = await api.getCategories();
    renderCategoriesLists();
  } catch {
    if (expenseList) expenseList.innerHTML = '<p class="error-text">بارگذاری دسته‌بندی‌ها ناموفق بود</p>';
  }
}

function getSelectedCatType() {
  const active = document.querySelector('#cat-type-toggle .toggle-btn.active');
  return active?.getAttribute('data-value') || 'expense';
}

function openAddCategoryModal() {
  document.getElementById('cat-name').value = '';
  document.querySelectorAll('#cat-type-toggle .toggle-btn').forEach((b, i) => {
    b.classList.toggle('active', i === 0);
  });
  renderIconPicker(document.getElementById('cat-icon-picker'), '📦', 'cat-icon');
  renderColorPicker(document.getElementById('cat-color-picker'), '#3B5BDB', 'cat-color');
  openModal('category-modal');
}

function openEditCategoryModal(cat) {
  editingCategoryId = cat.id;
  document.getElementById('edit-cat-name').value = cat.name;
  renderIconPicker(document.getElementById('edit-cat-icon-picker'), getCategoryDisplayIcon(cat), 'edit-cat-icon');
  renderColorPicker(document.getElementById('edit-cat-color-picker'), cat.color || '#3B5BDB', 'edit-cat-color');
  openModal('edit-category-modal');
}

async function handleCreateCategory(e) {
  e.preventDefault();

  const name = document.getElementById('cat-name').value.trim();
  const type = getSelectedCatType();
  const icon = document.getElementById('cat-icon').value || '📦';
  const color = document.getElementById('cat-color').value;

  if (!name || name.length < 2) {
    showToast('عنوان باید حداقل ۲ کاراکتر باشد', 'warning');
    return;
  }

  try {
    await api.createCategory({ name, type, icon, color });
    closeModal('category-modal');
    showToast('دسته‌بندی ایجاد شد', 'success');
    await loadCategories();
  } catch { /* api toast */ }
}

async function handleUpdateCategory(e) {
  e.preventDefault();
  if (!editingCategoryId) return;

  const cat = allCategories.find((c) => c.id === editingCategoryId);
  if (!cat) return;

  const name = document.getElementById('edit-cat-name').value.trim();
  const icon = document.getElementById('edit-cat-icon').value || '📦';
  const color = document.getElementById('edit-cat-color').value;

  if (!name || name.length < 2) {
    showToast('عنوان باید حداقل ۲ کاراکتر باشد', 'warning');
    return;
  }

  try {
    await api.updateCategory(editingCategoryId, { name, type: cat.type, icon, color });
    closeModal('edit-category-modal');
    showToast('دسته‌بندی به‌روزرسانی شد', 'success');
    editingCategoryId = null;
    await loadCategories();
  } catch { /* api toast */ }
}

async function handleDeleteCategory() {
  if (!editingCategoryId) return;

  try {
    const txs = await api.getTransactions({ category_id: editingCategoryId });
    if (Array.isArray(txs) && txs.length > 0) {
      showToast('این دسته‌بندی تراکنش دارد و قابل حذف نیست', 'error');
      return;
    }
  } catch { return; }

  const confirmed = await showConfirm('آیا از حذف این دسته‌بندی اطمینان دارید؟');
  if (!confirmed) return;

  try {
    await api.deleteCategory(editingCategoryId);
    closeModal('edit-category-modal');
    showToast('دسته‌بندی حذف شد', 'success');
    editingCategoryId = null;
    await loadCategories();
  } catch (err) {
    if (err.message?.includes('تراکنش')) {
      showToast('این دسته‌بندی تراکنش دارد و قابل حذف نیست', 'error');
    }
  }
}

function bindCategoriesEvents() {
  document.getElementById('add-category-btn')?.addEventListener('click', openAddCategoryModal);
  document.getElementById('category-form')?.addEventListener('submit', handleCreateCategory);
  document.getElementById('edit-category-form')?.addEventListener('submit', handleUpdateCategory);
  document.getElementById('edit-cat-delete')?.addEventListener('click', handleDeleteCategory);

  document.querySelectorAll('#cat-type-toggle .toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#cat-type-toggle .toggle-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('expense-categories-list')?.addEventListener('click', onCategoryListClick);
  document.getElementById('income-categories-list')?.addEventListener('click', onCategoryListClick);
}

function onCategoryListClick(e) {
  const btn = e.target.closest('[data-action="edit-cat"]');
  if (!btn) return;
  const id = Number(btn.getAttribute('data-id'));
  const cat = allCategories.find((c) => c.id === id);
  if (cat) openEditCategoryModal(cat);
}

function initCategories() {
  if (!categoriesInitialized) {
    bindCategoriesEvents();
    categoriesInitialized = true;
  }
  loadCategories();
}
