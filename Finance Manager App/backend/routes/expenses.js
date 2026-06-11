const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} = require('../controllers/expensesController');

const router = express.Router();

router.post('/', asyncHandler(createExpense));
router.get('/', asyncHandler(getExpenses));
router.put('/:id', asyncHandler(updateExpense));
router.delete('/:id', asyncHandler(deleteExpense));

module.exports = router;
