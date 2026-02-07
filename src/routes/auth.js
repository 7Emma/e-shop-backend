import express from 'express';
import { login, logout } from '../controllers/authController.js';
import { authLimiter } from '../middlewares/rateLimiting.js';

const router = express.Router();

// ⚠️ Inscription DISABLED pour sécurité - admin only
router.post('/register', (req, res) => {
  return res.status(403).json({ 
    success: false, 
    message: 'Inscription désactivée. Contactez l\'administrateur.' 
  });
});

router.post('/login', authLimiter, login);
router.post('/logout', logout);

export default router;
