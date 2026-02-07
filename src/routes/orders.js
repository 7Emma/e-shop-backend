import express from 'express';
import {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getAllOrders,
  getOrderByTrackingCode,
  getOrderBySessionId,
  confirmOrderReceived,
  rateOrder,
} from '../controllers/orderController.js';
import { generateReceipt } from '../controllers/receiptController.js';
import { generatePDFReceipt } from '../controllers/pdfReceiptController.js';
import { verifyAdmin } from '../middlewares/auth.js';
import Order from '../models/Order.js';

const router = express.Router();

// ⚠️ Pas d'authentification requise pour les clients
// Admin routes
router.get('/admin/all', verifyAdmin, getAllOrders);

// User routes (pas d'auth requise)
router.get('/', getUserOrders);
router.post('/', createOrder);

// ⚠️ ROUTES SPÉCIALES (avant les :id pour éviter les conflits)
// Routes PUT avec actions spécifiques (les plus précises)
router.put('/track/:trackingCode/confirm-received', confirmOrderReceived);
router.put('/track/:trackingCode/rate', rateOrder);
// Routes GET (moins spécifiques)
router.get('/track/:trackingCode', getOrderByTrackingCode);
router.get('/session/:sessionId', getOrderBySessionId);

// Mises à jour (routes PUT avant GET :id)
router.put('/:id', verifyAdmin, updateOrderStatus);
router.put('/:id/status', verifyAdmin, updateOrderStatus);

// Téléchargement du reçu (avant GET /:id)
router.get('/:id/receipt', generateReceipt);
router.get('/:id/receipt/pdf', generatePDFReceipt);

// Guest receipt download via tracking code
router.get('/track/:trackingCode/receipt/pdf', async (req, res) => {
  try {
    const { trackingCode } = req.params;
    const order = await Order.findOne({ trackingCode });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    // Mock user for generatePDFReceipt
    req.user = { id: null };
    req.params.id = order._id;
    
    return generatePDFReceipt(req, res);
  } catch (error) {
    console.error('Erreur accès PDF guest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Details générique (après toutes les routes spéciales)
router.get('/:id', getOrderById);

export default router;
