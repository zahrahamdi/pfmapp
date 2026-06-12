const { run } = require('../database');
const { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } = require('../utils/constants');

async function seedDefaultCategories(userId) {
  for (const category of DEFAULT_EXPENSE_CATEGORIES) {
    await run(
      `INSERT OR IGNORE INTO categories (user_id, name, type, icon, color, is_default)
       VALUES (?, ?, 'expense', ?, ?, 1)`,
      [userId, category.name, category.icon, category.color]
    );
  }

  for (const category of DEFAULT_INCOME_CATEGORIES) {
    await run(
      `INSERT OR IGNORE INTO categories (user_id, name, type, icon, color, is_default)
       VALUES (?, ?, 'income', ?, ?, 1)`,
      [userId, category.name, category.icon, category.color]
    );
  }
}

module.exports = {
  seedDefaultCategories,
};
