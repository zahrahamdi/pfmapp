const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const {
  createIncome,
  getIncomes,
  updateIncome,
  deleteIncome,
} = require('../controllers/incomesController');

const router = express.Router();

router.post('/', asyncHandler(createIncome));
router.get('/', asyncHandler(getIncomes));
router.put('/:id', asyncHandler(updateIncome));
router.delete('/:id', asyncHandler(deleteIncome));

module.exports = router;
