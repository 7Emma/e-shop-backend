import express from 'express';
import {
  getDashboardStats,
  getSalesStats,
  getTopProducts,
  getActiveUsers,
  getRevenue,
  getAllProducts,
  getAllUsers,
  getUser,
  changeUserRole,
  deleteUser,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  getAllReviews,
  deleteReview,
} from '../controllers/adminController.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Appliquer la vérification d'authentification et d'admin à toutes les routes
router.use(verifyToken, verifyAdmin);

// ============ STATISTIQUES ============
router.get('/stats', getDashboardStats);
router.get('/stats/sales', getSalesStats);
router.get('/stats/top-products', getTopProducts);
router.get('/stats/active-users', getActiveUsers);
router.get('/stats/revenue', getRevenue);

// ============ GESTION DES PRODUITS ============
router.get('/products', getAllProducts);

// ============ GESTION DES UTILISATEURS ============
router.get('/users', getAllUsers);
router.get('/users/:userId', getUser);
router.put('/users/:userId/role', changeUserRole);
router.delete('/users/:userId', deleteUser);

// ============ GESTION DES COMMANDES ============
router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrder);
router.put('/orders/:orderId', updateOrderStatus);

// ============ GESTION DES AVIS ============
router.get('/reviews', getAllReviews);
router.delete('/reviews/:reviewId', deleteReview);

export default router;
