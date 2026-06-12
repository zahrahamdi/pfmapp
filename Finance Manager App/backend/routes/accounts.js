const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { authenticate } = require('../middlewares/auth');
const {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} = require('../controllers/accountsController');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getAccounts));
router.post('/', asyncHandler(createAccount));
router.get('/:id', asyncHandler(getAccountById));
router.put('/:id', asyncHandler(updateAccount));
router.delete('/:id', asyncHandler(deleteAccount));

module.exports = router;
