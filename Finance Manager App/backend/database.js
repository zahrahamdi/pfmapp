const sqlite3 = require('sqlite3').verbose();
const {
  LEGACY_EXPENSE_CATEGORY_MAP,
  LEGACY_INCOME_CATEGORY_MAP,
} = require('./utils/constants');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database', 'finance.db');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function columnExists(table, column) {
  const columns = await all(`PRAGMA table_info(${table})`);
  return columns.some((col) => col.name === column);
}

async function addColumnIfNotExists(table, column, definition) {
  const exists = await columnExists(table, column);
  if (!exists) {
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function migrateLegacyCategories(table, columnMap) {
  for (const [legacy, persian] of Object.entries(columnMap)) {
    await run(`UPDATE ${table} SET category = ? WHERE category = ?`, [persian, legacy]);
  }
}

async function migrateDatabase() {
  await addColumnIfNotExists('incomes', 'category', "TEXT DEFAULT 'سایر'");
  await addColumnIfNotExists('incomes', 'date', "TEXT DEFAULT '2000-01-01'");

  if (await columnExists('incomes', 'created_at')) {
    await run(`
      UPDATE incomes
      SET date = date(created_at)
      WHERE date IS NULL OR date = '' OR date = '2000-01-01'
    `);
  } else {
    await run(`
      UPDATE incomes
      SET date = date('now')
      WHERE date IS NULL OR date = '' OR date = '2000-01-01'
    `);
  }

  await run(`UPDATE incomes SET category = 'سایر' WHERE category IS NULL OR category = ''`);
  await migrateLegacyCategories('incomes', LEGACY_INCOME_CATEGORY_MAP);

  await addColumnIfNotExists('expenses', 'date', "TEXT DEFAULT '2000-01-01'");

  if (await columnExists('expenses', 'created_at')) {
    await run(`
      UPDATE expenses
      SET date = date(created_at)
      WHERE date IS NULL OR date = '' OR date = '2000-01-01'
    `);
  } else {
    await run(`
      UPDATE expenses
      SET date = date('now')
      WHERE date IS NULL OR date = '' OR date = '2000-01-01'
    `);
  }

  await migrateLegacyCategories('expenses', LEGACY_EXPENSE_CATEGORY_MAP);
  await migrateLegacyCategories('budgets', LEGACY_EXPENSE_CATEGORY_MAP);
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS incomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK(amount > 0),
      category TEXT NOT NULL,
      date TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK(amount > 0),
      category TEXT NOT NULL,
      date TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL UNIQUE,
      limit_amount INTEGER NOT NULL CHECK(limit_amount > 0)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_amount INTEGER NOT NULL CHECK(target_amount > 0),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await migrateDatabase();
}

module.exports = {
  db,
  run,
  get,
  all,
  initDatabase,
};
