const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { authenticate } = require('../middlewares/auth');
const {
  getBalance,
  getReport,
  getDashboardSummary,
  getMonthlyReport,
} = require('../controllers/dashboardController');
const {
  getUserSummary,
  getUserMonthlyReport,
  getCategoryBreakdown,
} = require('../controllers/userDashboardController');

const router = express.Router();

function withOptionalAuth(req, res, next) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  return next();
}

function dualHandler(legacyHandler, userHandler) {
  return asyncHandler(async (req, res) => {
    if (req.user) {
      return userHandler(req, res);
    }
    return legacyHandler(req, res);
  });
}

router.get('/', asyncHandler(getDashboardSummary));
router.get('/balance', asyncHandler(getBalance));
router.get('/report', asyncHandler(getReport));
router.get('/monthly-report', withOptionalAuth, dualHandler(getMonthlyReport, getUserMonthlyReport));

router.get('/summary', authenticate, asyncHandler(getUserSummary));
router.get('/category-breakdown', authenticate, asyncHandler(getCategoryBreakdown));

module.exports = router;
