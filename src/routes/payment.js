import express from 'express';
import {
  createCheckoutSession,
  getPaymentStatus,
  handleWebhook,
  handleCheckoutCompleted,
} from '../controllers/paymentController.js';

const router = express.Router();

// ⚠️ Application 100% guest - Pas d'authentification requise
// Créer une session de paiement Stripe
router.post('/checkout', createCheckoutSession);

// Récupérer le statut du paiement
router.get('/status/:sessionId', getPaymentStatus);

// ⚠️ Webhook Stripe déclaré dans server.js AVANT express.json()
// Route de test pour déclencher manuellement le webhook (DEV uniquement)
router.post('/webhook-test', async (req, res) => {
  try {
    // Simuler une session Stripe complète pour le test
    const shippingAddress = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
      street: '123 Rue de la Paix',
      city: 'Paris',
      zipCode: '75001',
      country: 'FR',
      phone: '+33612345678'
    };

    const body = typeof req.body === 'string' ? {} : (req.body || {});
    const fakeSession = {
      id: body.sessionId || 'cs_test_' + Date.now(),
      payment_intent: body.paymentIntent || 'pi_test_' + Date.now(),
      amount_total: 10618, // 106.18€ en centimes
      metadata: {
        isGuest: 'true',
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
        shippingAddress: JSON.stringify(shippingAddress)
      },
      customer_details: {
        email: shippingAddress.email,
        phone: shippingAddress.phone,
        address: {
          line1: shippingAddress.street,
          city: shippingAddress.city,
          postal_code: shippingAddress.zipCode,
          country: shippingAddress.country
        }
      },
      line_items: {
        data: [
          {
            quantity: 2,
            price: {
              unit_amount: 2999 // 29.99€
            },
            price_data: {
              product_data: {
                name: 'Produit Test 1'
              }
            }
          },
          {
            quantity: 1,
            price: {
              unit_amount: 2999 // 29.99€
            },
            price_data: {
              product_data: {
                name: 'Produit Test 2'
              }
            }
          },
          {
            quantity: 1,
            price: {
              unit_amount: 599 // 5.99€
            },
            price_data: {
              product_data: {
                name: 'Frais de livraison'
              }
            }
          }
        ]
      }
    };
    
    // Appeler directement le handler de webhook avec données complètes
    await handleCheckoutCompleted(fakeSession, true);
    res.json({ 
      success: true, 
      message: 'Webhook test déclenché',
      sessionId: fakeSession.id,
      trackingCode: 'Voir logs'
    });
  } catch (error) {
    console.error('❌ Erreur webhook test:', error.message);
    console.error(error.stack);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
