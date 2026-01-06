import express from 'express';
import {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getAllOrders,
} from '../controllers/orderController.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', verifyToken, getUserOrders);
router.get('/:id', verifyToken, getOrderById);
router.post('/', verifyToken, createOrder);
router.put('/:id/status', verifyToken, verifyAdmin, updateOrderStatus);
router.get('/admin/all', verifyToken, verifyAdmin, getAllOrders);

export default router;
