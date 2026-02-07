import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../controllers/productController.js';
import { verifyAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/categories', getCategories);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
// Admin only
router.post('/', verifyAdmin, createProduct);
router.put('/:id', verifyAdmin, updateProduct);
router.delete('/:id', verifyAdmin, deleteProduct);

export default router;
