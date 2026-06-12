const { run, get, all } = require('../database');
const { createHttpError, createValidationError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/response');
const { validateCategory } = require('../utils/validation');
const { MESSAGES } = require('../utils/messages');

const CATEGORY_FIELDS = 'id, user_id, name, type, icon, color, is_default, created_at, updated_at';

async function createCategory(req, res) {
  const { name, type, icon, color } = req.body;
  const validationErrors = validateCategory({ name, type, icon, color });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  try {
    const result = await run(
      `INSERT INTO categories (user_id, name, type, icon, color, is_default)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [req.user.id, name.trim(), type, icon || null, color || null]
    );

    const category = await get(`SELECT ${CATEGORY_FIELDS} FROM categories WHERE id = ?`, [result.id]);
    return sendSuccess(res, { ...category, is_default: Boolean(category.is_default) }, 201);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      throw createHttpError(409, MESSAGES.CATEGORY_EXISTS);
    }
    throw error;
  }
}

async function getCategories(req, res) {
  const conditions = ['user_id = ?'];
  const params = [req.user.id];

  if (req.query.type) {
    conditions.push('type = ?');
    params.push(req.query.type);
  }

  const categories = await all(
    `SELECT ${CATEGORY_FIELDS} FROM categories WHERE ${conditions.join(' AND ')} ORDER BY type ASC, name ASC`,
    params
  );

  return sendSuccess(
    res,
    categories.map((c) => ({ ...c, is_default: Boolean(c.is_default) }))
  );
}

async function getCategoryById(req, res) {
  const category = await get(
    `SELECT ${CATEGORY_FIELDS} FROM categories WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id]
  );

  if (!category) {
    throw createHttpError(404, MESSAGES.CATEGORY_NOT_FOUND);
  }

  return sendSuccess(res, { ...category, is_default: Boolean(category.is_default) });
}

async function updateCategory(req, res) {
  const existing = await get('SELECT * FROM categories WHERE id = ? AND user_id = ?', [
    req.params.id,
    req.user.id,
  ]);

  if (!existing) {
    throw createHttpError(404, MESSAGES.CATEGORY_NOT_FOUND);
  }

  const { name, type, icon, color } = req.body;
  const validationErrors = validateCategory({ name, type, icon, color });

  if (validationErrors.length > 0) {
    throw createValidationError(validationErrors);
  }

  try {
    await run(
      `UPDATE categories SET name = ?, type = ?, icon = ?, color = ?, updated_at = datetime('now') WHERE id = ?`,
      [name.trim(), type, icon || null, color || null, req.params.id]
    );

    const category = await get(`SELECT ${CATEGORY_FIELDS} FROM categories WHERE id = ?`, [req.params.id]);
    return sendSuccess(res, { ...category, is_default: Boolean(category.is_default) });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      throw createHttpError(409, MESSAGES.CATEGORY_EXISTS);
    }
    throw error;
  }
}

async function deleteCategory(req, res) {
  const existing = await get('SELECT * FROM categories WHERE id = ? AND user_id = ?', [
    req.params.id,
    req.user.id,
  ]);

  if (!existing) {
    throw createHttpError(404, MESSAGES.CATEGORY_NOT_FOUND);
  }

  const txCount = await get(
    'SELECT COUNT(*) AS count FROM transactions WHERE category_id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );

  if (txCount.count > 0) {
    throw createHttpError(400, MESSAGES.CATEGORY_HAS_TRANSACTIONS);
  }

  await run('DELETE FROM categories WHERE id = ?', [req.params.id]);
  return sendSuccess(res, { message: MESSAGES.CATEGORY_DELETED });
}

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
