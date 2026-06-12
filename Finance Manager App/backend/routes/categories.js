const express = require('express');
const { asyncHandler } = require('../middlewares/errorHandler');
const { authenticate } = require('../middlewares/auth');
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoriesController');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getCategories));
router.post('/', asyncHandler(createCategory));
router.get('/:id', asyncHandler(getCategoryById));
router.put('/:id', asyncHandler(updateCategory));
router.delete('/:id', asyncHandler(deleteCategory));

module.exports = router;
