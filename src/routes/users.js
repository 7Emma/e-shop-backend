import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAllUsers,
  deleteUser,
} from '../controllers/userController.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.put('/change-password', verifyToken, changePassword);
router.get('/all', verifyToken, verifyAdmin, getAllUsers);
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);

export default router;
