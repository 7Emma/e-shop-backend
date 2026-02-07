import OTP from '../models/OTP.js';
import Order from '../models/Order.js';
import { sendOTPEmail } from '../services/emailService.js';

/**
 * Générer et envoyer un code OTP
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const generateOTP = async (req, res) => {
  try {
    const { trackingCode } = req.body;

    if (!trackingCode) {
      return res.status(400).json({
        success: false,
        message: 'Code de suivi requis',
      });
    }

    // Trouver la commande
    const order = await Order.findOne({ trackingCode });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    // Récupérer l'email du client (depuis la commande)
    const email = order.shippingAddress?.email || '';
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email non trouvé pour cette commande',
      });
    }

    // Générer un code OTP aléatoire (6 chiffres)
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Supprimer les anciens OTPs non vérifiés
    await OTP.deleteOne({
      trackingCode,
      verified: false,
    });

    // Créer un nouvel OTP valide 15 minutes
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    const otp = new OTP({
      trackingCode,
      email,
      code,
      expiresAt: otpExpiry,
    });

    await otp.save();

    // Envoyer l'OTP par email
    await sendOTPEmail(email, code, order.trackingCode);

    console.log(`✅ OTP généré pour ${trackingCode}: ${code} (expire à ${otpExpiry})`);

    res.json({
      success: true,
      message: 'Code OTP envoyé à votre email',
      maskedEmail: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Masquer l'email
    });
  } catch (error) {
    console.error('Erreur génération OTP:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du code OTP',
    });
  }
};

/**
 * Vérifier un code OTP
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const verifyOTP = async (req, res) => {
  try {
    const { trackingCode, code } = req.body;

    if (!trackingCode || !code) {
      return res.status(400).json({
        success: false,
        message: 'Code de suivi et code OTP requis',
      });
    }

    // Trouver l'OTP
    const otp = await OTP.findOne({ trackingCode });

    if (!otp) {
      return res.status(404).json({
        success: false,
        message: 'OTP non trouvé. Veuillez demander un nouveau code.',
      });
    }

    // Vérifier l'expiration
    if (new Date() > otp.expiresAt) {
      await OTP.deleteOne({ _id: otp._id });
      return res.status(400).json({
        success: false,
        message: 'Code OTP expiré. Veuillez demander un nouveau code.',
      });
    }

    // Vérifier le nombre de tentatives
    if (otp.attempts >= otp.maxAttempts) {
      await OTP.deleteOne({ _id: otp._id });
      return res.status(429).json({
        success: false,
        message: 'Trop de tentatives. Veuillez demander un nouveau code.',
      });
    }

    // Vérifier le code
    if (otp.code !== code) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({
        success: false,
        message: `Code incorrect. ${otp.maxAttempts - otp.attempts} tentative(s) restante(s)`,
        attemptsLeft: otp.maxAttempts - otp.attempts,
      });
    }

    // OTP valide
    otp.verified = true;
    await otp.save();

    // Créer un token temporaire pour accéder aux détails de la commande
    const token = Buffer.from(`${trackingCode}:${otp._id}`).toString('base64');

    console.log(`✅ OTP vérifié pour ${trackingCode}`);

    res.json({
      success: true,
      message: 'Code OTP vérifié avec succès',
      token, // Client stocke ce token pour accéder aux détails
    });
  } catch (error) {
    console.error('Erreur vérification OTP:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du code OTP',
    });
  }
};

/**
 * Vérifier si un OTP est déjà vérifié (avant d'afficher les détails)
 */
export const checkOTPStatus = async (req, res) => {
  try {
    const { trackingCode, token } = req.body;

    if (!trackingCode || !token) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres requis',
      });
    }

    // Décoder le token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [storedTrackingCode, otpId] = decoded.split(':');

    if (storedTrackingCode !== trackingCode) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide',
      });
    }

    // Vérifier que l'OTP existe et est vérifié
    const otp = await OTP.findById(otpId);
    if (!otp || !otp.verified) {
      return res.status(400).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    res.json({
      success: true,
      message: 'Accès autorisé',
    });
  } catch (error) {
    console.error('Erreur vérification statut OTP:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
    });
  }
};
