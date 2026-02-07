import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from '../controllers/wishlistController.js';

const router = express.Router();

// ⚠️ Pas d'authentification requise - Accès libre
router.get('/', getWishlist);
router.post('/add/:productId', addToWishlist);
router.delete('/remove/:productId', removeFromWishlist);
router.post('/check/:productId', checkWishlist);

export default router;
