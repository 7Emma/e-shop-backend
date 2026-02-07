import express from 'express';
import { generateOTP, verifyOTP, checkOTPStatus } from '../controllers/otpController.js';

const router = express.Router();

// Générer et envoyer un OTP
router.post('/generate', generateOTP);

// Vérifier un code OTP
router.post('/verify', verifyOTP);

// Vérifier le statut d'un OTP (accès autorisé)
router.post('/check', checkOTPStatus);

export default router;
