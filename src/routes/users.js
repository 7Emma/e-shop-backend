import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAllUsers,
  deleteUser,
} from '../controllers/userController.js';
import { verifyAdmin } from '../middlewares/auth.js';

const router = express.Router();

// ⚠️ Pas d'authentification requise pour les clients
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.put('/change-password', changePassword);
// Admin only
router.get('/all', verifyAdmin, getAllUsers);
router.delete('/:id', verifyAdmin, deleteUser);

export default router;
