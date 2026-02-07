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
  getAdminProfile,
  getAdminSettings,
} from '../controllers/adminController.js';
import { verifyAdmin } from '../middlewares/auth.js';
import { validateObjectId } from '../middlewares/validation.js';
import { login } from '../controllers/authController.js';
import { authLimiter } from '../middlewares/rateLimiting.js';

const router = express.Router();

// ============ PROFIL ADMIN ============
// Route de connexion admin (alias pour /api/auth/login)
router.post('/login', authLimiter, login);

// ⚠️ Vérification admin seulement (pas d'auth requise mais admin check appliqué)
router.use(verifyAdmin);

// Obtenir le profil de l'admin par ID
router.get('/profile/:adminId', validateObjectId('adminId'), getAdminProfile);

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
// ✅ Validate ObjectId for user routes
router.get('/users/:userId', validateObjectId('userId'), getUser);
router.put('/users/:userId/role', validateObjectId('userId'), changeUserRole);
router.delete('/users/:userId', validateObjectId('userId'), deleteUser);

// ============ GESTION DES COMMANDES ============
router.get('/orders', getAllOrders);
// ✅ Validate ObjectId for order routes
router.get('/orders/:orderId', validateObjectId('orderId'), getOrder);
router.put('/orders/:orderId', validateObjectId('orderId'), updateOrderStatus);

// ============ GESTION DES AVIS ============
router.get('/reviews', getAllReviews);
// ✅ Validate ObjectId for review routes
router.delete('/reviews/:reviewId', validateObjectId('reviewId'), deleteReview);

// ============ PARAMÈTRES ADMIN ============
router.get('/settings', getAdminSettings);

export default router;
