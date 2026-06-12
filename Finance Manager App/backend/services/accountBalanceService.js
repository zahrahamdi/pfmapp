const { run, get } = require('../database');

async function adjustAccountBalance(accountId, userId, delta) {
  const account = await get(
    'SELECT id, current_balance FROM accounts WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [accountId, userId]
  );

  if (!account) {
    return false;
  }

  await run(
    `UPDATE accounts SET current_balance = current_balance + ?, updated_at = datetime('now') WHERE id = ?`,
    [delta, accountId]
  );

  return true;
}

async function applyTransactionEffect({ userId, type, amount, accountId, targetAccountId }) {
  if (type === 'income') {
    return adjustAccountBalance(accountId, userId, amount);
  }

  if (type === 'expense') {
    return adjustAccountBalance(accountId, userId, -amount);
  }

  if (type === 'transfer') {
    const sourceOk = await adjustAccountBalance(accountId, userId, -amount);
    if (!sourceOk) {
      return false;
    }
    return adjustAccountBalance(targetAccountId, userId, amount);
  }

  return false;
}

async function reverseTransactionEffect(transaction) {
  const { user_id: userId, type, amount, account_id: accountId, target_account_id: targetAccountId } = transaction;

  if (type === 'income') {
    return adjustAccountBalance(accountId, userId, -amount);
  }

  if (type === 'expense') {
    return adjustAccountBalance(accountId, userId, amount);
  }

  if (type === 'transfer') {
    await adjustAccountBalance(accountId, userId, amount);
    await adjustAccountBalance(targetAccountId, userId, -amount);
    return true;
  }

  return false;
}

module.exports = {
  adjustAccountBalance,
  applyTransactionEffect,
  reverseTransactionEffect,
};
