import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from '../controllers/wishlistController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', verifyToken, getWishlist);
router.post('/add/:productId', verifyToken, addToWishlist);
router.delete('/remove/:productId', verifyToken, removeFromWishlist);
router.post('/check/:productId', verifyToken, checkWishlist);

export default router;
