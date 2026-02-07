import Stripe from 'stripe';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { generateTrackingCode } from '../utils/trackingCodeGenerator.js';
import { sendOrderConfirmation } from '../services/emailService.js';

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Créer une session de paiement Stripe (100% guest)
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { shippingAddress, cartItems } = req.body;

    // ✅ Clean logs - no PII
    console.log(`📦 Checkout guest reçu avec ${cartItems?.length || 0} articles`);

    // Validation
    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Adresse de livraison manquante' });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Le panier est vide' });
    }

    // ✅ Validate quantity and check inventory before creating session
    const lineItems = [];
    for (const item of cartItems) {
      if (!item || !item.product) {
        console.error('❌ Article invalide:', JSON.stringify(item));
        throw new Error('Article du panier invalide');
      }

      // ✅ Validate quantity
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return res.status(400).json({
          success: false,
          message: `Quantité invalide pour ${item.product.name}`
        });
      }

      // ✅ Check inventory
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produit ${item.product._id} non trouvé`
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Produit ${product.name} n'est plus disponible`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${product.name} (${product.stock} disponible, ${item.quantity} demandé)`
        });
      }

      // ✅ Add to lineItems with validated product
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: product.name,
            description: product.description || 'Produit',
          },
          unit_amount: Math.round(product.price * 100), // En centimes
        },
        quantity: item.quantity,
      });
    }

    // Calculer les frais de livraison et taxes
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const shippingCost = subtotal > 100 ? 0 : 5.99;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Frais de livraison' },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: 'TVA (18%)' },
        unit_amount: Math.round(tax * 100),
      },
      quantity: 1,
    });

    // URLs de redirection
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
    const successUrl = `${frontendUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/panier`;

    // ✅ Clean logs - no PII, generic amounts
    console.log('✅ Session Stripe créée');
    console.log(`   Total: ${(subtotal + shippingCost + tax).toFixed(2)}€`);

    // Créer la session Stripe
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: shippingAddress.email,
      line_items: lineItems,
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      customer_creation: 'if_required',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        isGuest: 'true',
        firstName: shippingAddress.firstName || '',
        lastName: shippingAddress.lastName || '',
        email: shippingAddress.email || '',
        phone: shippingAddress.phone || '',
        shippingAddress: JSON.stringify(shippingAddress),
      },
    });

    console.log('✅ Session Stripe créée:', session.id);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ Erreur création session Stripe:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Webhook Stripe - Traiter les paiements complétés
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('❌ Pas de header stripe-signature');
    return res.status(400).send('Webhook Error: Missing stripe-signature header');
  }

  try {
    const event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`✅ Webhook validé: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Erreur webhook:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

/**
 * Traiter un paiement complété
 */
export const handleCheckoutCompleted = async (session, isTest = false) => {
  try {
    console.log('📦 Traitement checkout complété:', session.id);

    // Si c'est un test ou si la session a déjà les données, utilise-la directement
    const stripeSession = (isTest || session.line_items) ? session : 
      await stripeInstance.checkout.sessions.retrieve(session.id, {
        expand: ['customer_details', 'line_items'],
      });

    const metadata = stripeSession.metadata || {};
    const shippingAddress = metadata.shippingAddress ? JSON.parse(metadata.shippingAddress) : {};

    // Ajouter infos client Stripe
    if (stripeSession.customer_details) {
      if (stripeSession.customer_details.phone) {
        shippingAddress.phone = stripeSession.customer_details.phone;
      }
      if (stripeSession.customer_details.address) {
        const addr = stripeSession.customer_details.address;
        if (addr.line1) shippingAddress.street = addr.line1;
        if (addr.city) shippingAddress.city = addr.city;
        if (addr.postal_code) shippingAddress.zipCode = addr.postal_code;
        if (addr.country) shippingAddress.country = addr.country;
      }
    }

    // Générer un code de suivi
    let trackingCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      trackingCode = generateTrackingCode();
      const existing = await Order.findOne({ trackingCode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      trackingCode = `${Date.now()}`.slice(-10);
    }

    // Récupérer les items depuis Stripe
    const lineItems = stripeSession.line_items?.data || [];
    const orderItems = lineItems
      .filter(item => {
        // Filtre les articles (pas les frais ni taxes)
        const name = item.price_data?.product_data?.name || item.description || 'Produit';
        return name && !name.includes('Frais') && !name.includes('TVA');
      })
      .map(item => ({
        product: null, // Guest orders, no product ID
        quantity: item.quantity,
        price: (item.price?.unit_amount || 0) / 100,
        name: item.price_data?.product_data?.name || item.description || 'Produit',
      }));

    // Créer la commande
    const order = new Order({
      user: null, // Guest
      items: orderItems,
      totalPrice: (stripeSession.amount_total || 0) / 100,
      shippingAddress,
      status: 'processing',
      paymentStatus: 'paid',
      trackingCode,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
    });

    await order.save();

    // Envoyer email avec les détails de la commande
    const userEmail = metadata.email || shippingAddress.email || 'unknown@example.com';
    await sendOrderConfirmation(userEmail, order, trackingCode);

    console.log(`✅ COMMANDE CRÉÉE: ${order._id}`);
    console.log(`   Code: ${trackingCode}`);
    console.log(`   Total: ${order.totalPrice}€`);
    console.log(`   Email: ${userEmail}`);
  } catch (error) {
    console.error('❌ Erreur traitement paiement:', error.message);
  }
};

/**
 * Récupérer le statut d'une session
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

    res.json({
      success: true,
      status: session.payment_status,
      paymentIntent: session.payment_intent,
    });
  } catch (error) {
    console.error('❌ Erreur récupération statut:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
