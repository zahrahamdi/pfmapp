const sqlite3 = require('sqlite3').verbose();
const {
  LEGACY_EXPENSE_CATEGORY_MAP,
  LEGACY_INCOME_CATEGORY_MAP,
} = require('./utils/constants');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH
  ? path.isAbsolute(process.env.DATABASE_PATH)
    ? process.env.DATABASE_PATH
    : path.join(__dirname, process.env.DATABASE_PATH)
  : path.join(__dirname, 'database', 'finance.db');

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

async function tableExists(table) {
  const row = await get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    [table]
  );
  return Boolean(row);
}

async function addColumnIfNotExists(table, column, definition) {
  if (!(await tableExists(table))) {
    return;
  }
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

  await addColumnIfNotExists('budgets', 'user_id', 'INTEGER');
  await addColumnIfNotExists('budgets', 'category_id', 'INTEGER');
  await addColumnIfNotExists('budgets', 'amount', 'INTEGER');
  await addColumnIfNotExists('budgets', 'month', 'INTEGER');
  await addColumnIfNotExists('budgets', 'year', 'INTEGER');
  await addColumnIfNotExists('budgets', 'created_at', 'TEXT');
  await addColumnIfNotExists('budgets', 'updated_at', 'TEXT');

  if (await columnExists('budgets', 'created_at')) {
    await run(`UPDATE budgets SET created_at = datetime('now') WHERE created_at IS NULL`);
  }
  if (await columnExists('budgets', 'updated_at')) {
    await run(`UPDATE budgets SET updated_at = datetime('now') WHERE updated_at IS NULL`);
  }
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'wallet', 'savings', 'credit', 'other')),
      initial_balance REAL NOT NULL DEFAULT 0,
      current_balance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'IRR',
      deleted_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      icon TEXT,
      color TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, name, type)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      category_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
      amount REAL NOT NULL CHECK(amount > 0),
      date TEXT NOT NULL,
      note TEXT,
      tags TEXT,
      payment_method TEXT,
      target_account_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (target_account_id) REFERENCES accounts(id)
    )
  `);

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
      category TEXT,
      limit_amount INTEGER CHECK(limit_amount IS NULL OR limit_amount > 0),
      user_id INTEGER,
      category_id INTEGER,
      amount INTEGER CHECK(amount IS NULL OR amount > 0),
      month INTEGER,
      year INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
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

  await run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_user_category_month_year
    ON budgets(user_id, category_id, month, year)
    WHERE user_id IS NOT NULL AND category_id IS NOT NULL
  `);
}

module.exports = {
  db,
  run,
  get,
  all,
  initDatabase,
  dbPath,
};
