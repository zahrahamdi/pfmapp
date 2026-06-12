const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { authenticate } = require('../middlewares/auth');
const {
  getNextMonthForecast,
  getCashflowForecast,
  getCategoriesForecast,
} = require('../controllers/forecastController');

const router = express.Router();

router.use(authenticate);

router.get('/next-month', asyncHandler(getNextMonthForecast));
router.get('/cashflow', asyncHandler(getCashflowForecast));
router.get('/categories', asyncHandler(getCategoriesForecast));

module.exports = router;
