const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetStatusReport,
} = require('../controllers/budgetsController');

const router = express.Router();

router.post('/', asyncHandler(createBudget));
router.get('/', asyncHandler(getBudgets));
router.get('/status', asyncHandler(getBudgetStatusReport));
router.put('/:id', asyncHandler(updateBudget));
router.delete('/:id', asyncHandler(deleteBudget));

module.exports = router;
