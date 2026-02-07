import Order from '../models/Order.js';
import Cart from '../models/Cart.js';

// 🔧 Utilitaire: Générer un trackingCode unique
const generateTrackingCode = async () => {
  let trackingCode;
  let exists = true;
  
  while (exists) {
    // Format: SHOP + date + random (ex: SHOP20240115ABC123)
    const date = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    trackingCode = `SHOP${date}${random}`;
    
    // Vérifier l'unicité
    const order = await Order.findOne({ trackingCode });
    exists = !!order;
  }
  
  return trackingCode;
};

// ⚠️ Application 100% GUEST - pas d'authentification requise

export const getUserOrders = async (req, res) => {
  // Pas de route utilisateurs (app guest)
  return res.status(403).json({ success: false, message: 'Non disponible en mode guest' });
};

export const getOrderById = async (req, res) => {
  // Pas d'accès par ID (app guest) - utiliser getOrderBySessionId à la place
  return res.status(403).json({ success: false, message: 'Non disponible en mode guest' });
};

export const createOrder = async (req, res) => {
  // Pas de création d'ordre ici (app guest) - utiliser le webhook Stripe à la place
  return res.status(403).json({ success: false, message: 'Non disponible en mode guest' });
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus, trackingNumber } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    console.log(`✅ Commande mise à jour: ${req.params.id}`);
    console.log(`   Nouveau statut: ${status || 'inchangé'}`);
    if (trackingNumber) console.log(`   Numéro de suivi: ${trackingNumber}`);

    res.json({ success: true, order });
  } catch (error) {
    console.error('Erreur mise à jour commande:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'firstName lastName email')
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📍 Récupérer une commande par code de suivi (PUBLIC - avec vérification OTP)
export const getOrderByTrackingCode = async (req, res) => {
  try {
    const { trackingCode } = req.params;
    const otpToken = req.headers['x-otp-token'] || req.query.token;

    if (!trackingCode || trackingCode.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code de suivi invalide' 
      });
    }

    // ⚠️ Vérifier le token OTP si présent
    if (otpToken) {
      try {
        const decoded = Buffer.from(otpToken, 'base64').toString('utf-8');
        const [storedTrackingCode, otpId] = decoded.split(':');
        
        if (storedTrackingCode !== trackingCode) {
          return res.status(403).json({ 
            success: false, 
            message: 'Token OTP invalide' 
          });
        }

        // Vérifier que l'OTP existe et est vérifié
        const OTP = require('../models/OTP.js').default;
        const otp = await OTP.findById(otpId);
        if (!otp || !otp.verified) {
          return res.status(403).json({ 
            success: false, 
            message: 'Accès refusé. OTP non vérifié' 
          });
        }
      } catch (err) {
        return res.status(403).json({ 
          success: false, 
          message: 'Token OTP invalide' 
        });
      }
    } else {
      // Si pas de token OTP, retourner juste les infos minimales
      const order = await Order.findOne({ trackingCode });
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: 'Commande non trouvée' 
        });
      }

      return res.json({ 
        success: true, 
        requiresOTP: true,
        message: 'OTP requis pour accéder aux détails complets',
        order: {
          trackingCode: order.trackingCode,
          status: order.status,
        }
      });
    }

    // Récupérer la commande complète
    const order = await Order.findOne({ trackingCode })
      .populate('user', 'firstName lastName email')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commande non trouvée' 
      });
    }

    // Retourner infos complètes (OTP vérifié)
    res.json({ 
      success: true, 
      requiresOTP: false,
      order: {
        _id: order._id,
        trackingCode: order.trackingCode,
        status: order.status,
        paymentStatus: order.paymentStatus,
        items: order.items,
        totalPrice: order.totalPrice,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }
    });
  } catch (error) {
    console.error('Erreur récupération commande:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📍 Récupérer une commande par stripeSessionId (pour la page de succès)
export const getOrderBySessionId = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Application guest - chercher uniquement par stripeSessionId
    const order = await Order.findOne({ 
      stripeSessionId: sessionId
    })
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commande non trouvée' 
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Erreur récupération commande:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Confirmer la réception d'une commande (bouton "Reçu")
export const confirmOrderReceived = async (req, res) => {
  try {
    const { trackingCode } = req.params;

    const order = await Order.findOne({ trackingCode });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commande non trouvée' 
      });
    }

    // Vérifier que le statut est "delivered"
    if (order.status !== 'delivered') {
      return res.status(400).json({ 
        success: false, 
        message: 'La commande doit être "Livré" pour confirmer la réception' 
      });
    }

    // Vérifier que ce n'est pas déjà marqué comme reçu
    if (order.isReceived) {
      return res.status(400).json({ 
        success: false, 
        message: 'La réception a déjà été confirmée' 
      });
    }

    order.isReceived = true;
    order.receivedAt = new Date();
    await order.save();

    console.log(`✅ Réception confirmée pour ${trackingCode}`);

    res.json({ 
      success: true, 
      message: 'Réception confirmée',
      order 
    });
  } catch (error) {
    console.error('Erreur confirmation réception:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ⭐ Noter un produit après réception
export const rateOrder = async (req, res) => {
  try {
    const { trackingCode } = req.params;
    const { score } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'La note doit être entre 1 et 5 étoiles' 
      });
    }

    const order = await Order.findOne({ trackingCode });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commande non trouvée' 
      });
    }

    // Vérifier que c'est reçu
    if (!order.isReceived) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vous devez confirmer la réception avant de noter' 
      });
    }

    // Vérifier que ce n'est pas déjà noté
    if (order.rating && order.rating.score) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vous avez déjà noté cette commande' 
      });
    }

    order.rating = {
      score: parseInt(score),
      ratedAt: new Date(),
    };
    await order.save();

    console.log(`⭐ Commande ${trackingCode} notée: ${score} étoiles`);

    res.json({ 
      success: true, 
      message: 'Merci pour votre notation !',
      order 
    });
  } catch (error) {
    console.error('Erreur notation:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
