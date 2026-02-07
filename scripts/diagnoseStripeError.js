import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Cart from '../src/models/Cart.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';
import Stripe from 'stripe';

dotenv.config();

async function diagnoseStripeError() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DIAGNOSTIC COMPLET ERREUR STRIPE');
  console.log('='.repeat(80) + '\n');

  try {
    // Connexion BD
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eshop');
    console.log('✅ Connecté à MongoDB\n');

    // Configuration
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').trim();
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();

    console.log('🔧 Configuration:');
    console.log(`   BACKEND_URL: ${backendUrl}`);
    console.log(`   FRONTEND_URL: ${frontendUrl}`);
    console.log(`   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY?.substring(0, 20)}...`);
    console.log('');

    // Récupérer un utilisateur avec panier
    const user = await User.findOne();
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé');
      process.exit(1);
    }

    console.log('👤 Utilisateur:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log('');

    // Récupérer le panier
    let cart = await Cart.findOne({ user: user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      console.log('❌ Panier vide - création d\'un panier test');
      const product = await Product.findOne();
      if (!product) {
        console.log('❌ Aucun produit trouvé');
        process.exit(1);
      }

      cart = await Cart.create({
        user: user._id,
        items: [{ product: product._id, quantity: 1 }],
        totalItems: 1,
        totalPrice: product.price,
      });
      cart = await cart.populate('items.product');
    }

    console.log('🛒 Panier:');
    console.log(`   Articles: ${cart.items.length}`);
    cart.items.forEach(item => {
      console.log(`   - ${item.product.name} x ${item.quantity} = ${item.product.price}€`);
    });
    console.log(`   Total: ${cart.totalPrice}€`);
    console.log('');

    // Construire les line_items comme le contrôleur
    console.log('📝 Construction line_items:');

    const unescapeHTML = (str) => {
      const map = {
        '&#x2F;': '/',
        '&#x3A;': ':',
        '&quot;': '"',
        '&amp;': '&',
        '&#39;': "'",
        '&lt;': '<',
        '&gt;': '>',
      };
      let result = str;
      for (const [escaped, char] of Object.entries(map)) {
        result = result.replace(new RegExp(escaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), char);
      }
      return result;
    };

    const lineItems = cart.items.map((item) => {
      let imageUrl = null;

      if (item.product.image) {
        imageUrl = item.product.image.toString().trim();
        
        // ❌ REJETER les images base64
        if (imageUrl.startsWith('data:image') || imageUrl.startsWith('data:')) {
          console.log(`   [${item.product.name}] Image base64 (${imageUrl.length} chars) - OMISE`);
          imageUrl = null;
        } else {
          imageUrl = unescapeHTML(imageUrl);

          if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            imageUrl = `${backendUrl}${imageUrl}`;
          }
        }
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.product.name,
            description: item.product.description || 'Produit sans description',
            images: imageUrl && imageUrl.length > 0 ? [imageUrl] : undefined,
          },
          unit_amount: Math.round(item.product.price * 100),
        },
        quantity: item.quantity,
      };
    });

    console.log(`   Créés: ${lineItems.length} line items\n`);

    // Ajouter frais et taxes
    const subtotal = cart.totalPrice;
    const shippingCost = subtotal > 50 ? 0 : 10;
    const tax = subtotal * 0.2;

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Frais de livraison',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'Taxes (20%)',
        },
        unit_amount: Math.round(tax * 100),
      },
      quantity: 1,
    });

    console.log('💰 Totaux:');
    console.log(`   Sous-total: ${subtotal}€`);
    console.log(`   Livraison: ${shippingCost}€`);
    console.log(`   Taxes: ${(tax).toFixed(2)}€`);
    console.log(`   Total: ${(subtotal + shippingCost + tax).toFixed(2)}€`);
    console.log('');

    // Construire les URLs
    const successUrl = `${frontendUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/panier`;

    console.log('🔗 URLs Stripe:');
    console.log(`   Success URL: ${successUrl}`);
    console.log(`   Success URL length: ${successUrl.length} chars`);
    console.log(`   Cancel URL: ${cancelUrl}`);
    console.log(`   Cancel URL length: ${cancelUrl.length} chars`);

    if (successUrl.length > 2048) {
      console.log(`   ❌ SUCCESS_URL trop longue (${successUrl.length} > 2048)`);
    }
    if (cancelUrl.length > 2048) {
      console.log(`   ❌ CANCEL_URL trop longue (${cancelUrl.length} > 2048)`);
    }
    console.log('');

    // Créer une commande test
    console.log('📦 Création Order pour test:');
    const order = new Order({
      user: user._id,
      items: cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalPrice: cart.totalPrice,
      shippingAddress: {
        street: '123 Rue Test',
        city: 'Test City',
        zipCode: '75000',
        country: 'France',
        phone: '+33612345678',
      },
      status: 'pending',
      paymentStatus: 'pending',
    });

    await order.save();
    console.log(`   Order créée: ${order._id}\n`);

    // Tester Stripe
    console.log('💳 Test création session Stripe:');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    try {
      const sessionData = {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        client_reference_id: user._id.toString(),
        customer_email: user.email,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user._id.toString(),
          orderId: order._id.toString(),
          shippingAddress: JSON.stringify(order.shippingAddress),
        },
      };

      console.log(`   Envoi à Stripe...`);
      console.log(`   - line_items: ${JSON.stringify(lineItems).length} chars`);
      console.log(`   - metadata: ${JSON.stringify(sessionData.metadata).length} chars`);

      const session = await stripe.checkout.sessions.create(sessionData);

      console.log('\n✅ SESSION CRÉÉE AVEC SUCCÈS!');
      console.log(`   ID: ${session.id}`);
      console.log(`   URL: ${session.url}`);
    } catch (stripeError) {
      console.log('\n❌ ERREUR STRIPE:');
      console.log(`   Message: ${stripeError.message}`);
      console.log(`   Type: ${stripeError.type}`);
      console.log(`   Param: ${stripeError.param}`);
      console.log(`   Code: ${stripeError.code}`);

      if (stripeError.message.includes('2048')) {
        console.log('\n🔴 DIAGNOSTIC: URL TROP LONGUE');
        console.log('   Solution: Réduire les URLs ou utiliser session_id uniquement');
      }

      console.log('\n📋 Payload Stripe (JSON):');
      console.log(JSON.stringify(
        {
          payment_method_types: ['card'],
          line_items: `[${lineItems.length} items]`,
          mode: 'payment',
          client_reference_id: user._id.toString(),
          customer_email: user.email,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            userId: user._id.toString(),
            orderId: order._id.toString(),
          },
        },
        null,
        2
      ));
    }

    await mongoose.connection.close();
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

diagnoseStripeError();
