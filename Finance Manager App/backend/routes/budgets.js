const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { authenticate } = require('../middlewares/auth');
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetStatusReport,
} = require('../controllers/budgetsController');
const {
  createUserBudget,
  getUserBudgets,
  getUserBudgetById,
  updateUserBudgetHandler,
  deleteUserBudget,
  getUserBudgetSummary,
} = require('../controllers/userBudgetsController');

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

router.get('/summary', authenticate, asyncHandler(getUserBudgetSummary));
router.get('/status', asyncHandler(getBudgetStatusReport));

router.post('/', withOptionalAuth, dualHandler(createBudget, createUserBudget));
router.get('/', withOptionalAuth, dualHandler(getBudgets, getUserBudgets));
router.get('/:id', authenticate, asyncHandler(getUserBudgetById));
router.put('/:id', withOptionalAuth, dualHandler(updateBudget, updateUserBudgetHandler));
router.delete('/:id', withOptionalAuth, dualHandler(deleteBudget, deleteUserBudget));

module.exports = router;
