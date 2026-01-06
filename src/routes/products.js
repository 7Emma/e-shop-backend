import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../controllers/productController.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', verifyToken, verifyAdmin, createProduct);
router.put('/:id', verifyToken, verifyAdmin, updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

export default router;
