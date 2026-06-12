const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { authenticate } = require('../middlewares/auth');
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionsController');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getTransactions));
router.post('/', asyncHandler(createTransaction));
router.get('/:id', asyncHandler(getTransactionById));
router.put('/:id', asyncHandler(updateTransaction));
router.delete('/:id', asyncHandler(deleteTransaction));

module.exports = router;
