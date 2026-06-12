const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { authenticate } = require('../middlewares/auth');
const {
  getOverview,
  getCashflow,
  getCategoriesReport,
  getAccountsReport,
} = require('../controllers/reportsController');

const router = express.Router();

router.use(authenticate);

router.get('/overview', asyncHandler(getOverview));
router.get('/cashflow', asyncHandler(getCashflow));
router.get('/categories', asyncHandler(getCategoriesReport));
router.get('/accounts', asyncHandler(getAccountsReport));

module.exports = router;
