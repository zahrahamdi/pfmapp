const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const {
  getBalance,
  getReport,
  getDashboardSummary,
  getMonthlyReport,
} = require('../controllers/dashboardController');

const router = express.Router();

router.get('/', asyncHandler(getDashboardSummary));
router.get('/balance', asyncHandler(getBalance));
router.get('/report', asyncHandler(getReport));
router.get('/monthly-report', asyncHandler(getMonthlyReport));

module.exports = router;
