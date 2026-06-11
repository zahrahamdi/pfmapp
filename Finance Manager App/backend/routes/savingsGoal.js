const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const {
  createSavingsGoal,
  getSavingsGoal,
} = require('../controllers/savingsGoalController');

const router = express.Router();

router.post('/', asyncHandler(createSavingsGoal));
router.get('/', asyncHandler(getSavingsGoal));

module.exports = router;
