import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', verifyToken, getCart);
router.post('/add', verifyToken, addToCart);
router.put('/update/:productId', verifyToken, updateCartItem);
router.delete('/remove/:productId', verifyToken, removeFromCart);
router.delete('/clear', verifyToken, clearCart);

export default router;
