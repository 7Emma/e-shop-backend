import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Cart from '../src/models/Cart.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';
import Stripe from 'stripe';

dotenv.config();

async function testCheckout() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST DU CHECKOUT');
  console.log('='.repeat(70) + '\n');

  try {
    // Connexion BD
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eshop');
    console.log('✅ Connecté à MongoDB\n');

    // Vérifier qu'il y a des produits
    const productCount = await Product.countDocuments();
    console.log(`📦 Produits en BD: ${productCount}`);

    if (productCount === 0) {
      console.log('   ❌ Aucun produit - ne peut pas tester');
      process.exit(1);
    }

    // Afficher un produit
    const product = await Product.findOne();
    console.log('\n📌 Premier produit:');
    console.log(`   Nom: ${product.name}`);
    console.log(`   Prix: ${product.price}€`);
    console.log(`   Image: ${product.image}`);
    console.log(`   Image type: ${typeof product.image}`);
    console.log(`   Image empty: ${!product.image || product.image.trim() === ''}`);

    // Vérifier les URLs
    console.log('\n🔗 Vérification des URLs:');
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').trim();
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();

    console.log(`   BACKEND_URL: ${backendUrl}`);
    console.log(`   FRONTEND_URL: ${frontendUrl}`);

    // Tester conversion d'image
    console.log('\n🖼️  Test conversion image:');
    let imageUrl = product.image;
    if (imageUrl) {
      imageUrl = imageUrl.toString().trim();
      console.log(`   Original (escaped): "${imageUrl}"`);
      
      // Décoder les entités HTML
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
      
      imageUrl = unescapeHTML(imageUrl);
      console.log(`   After unescaping: "${imageUrl}"`);
      
      if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = `${backendUrl}${imageUrl}`;
      }
      console.log(`   Final: "${imageUrl}"`);
    } else {
      console.log('   ❌ Image vide/undefined');
    }

    // Vérifier Stripe
    console.log('\n💳 Vérification Stripe:');
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('   ❌ STRIPE_SECRET_KEY manquante');
      process.exit(1);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Simuler la création d'une session
    console.log('\n📝 Simulation création session Stripe:');
    console.log('   Tentative de créer une session avec:');

    const lineItem = {
      price_data: {
        currency: 'eur',
        product_data: {
          name: product.name,
          description: product.description || 'Produit sans description',
          images: imageUrl ? [imageUrl] : undefined,
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: 1,
    };

    console.log(`   Produit: ${product.name}`);
    console.log(`   Prix: ${product.price}€ = ${Math.round(product.price * 100)} centimes`);
    console.log(`   Image: ${imageUrl || '(aucune)'}`);
    console.log(`   Images array: ${JSON.stringify(lineItem.price_data.product_data.images)}`);

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [lineItem],
        mode: 'payment',
        success_url: `${frontendUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/panier`,
      });

      console.log('\n✅ SESSION CRÉÉE AVEC SUCCÈS!');
      console.log(`   ID: ${session.id}`);
      console.log(`   URL: ${session.url}`);
    } catch (stripeError) {
      console.log('\n❌ ERREUR STRIPE:');
      console.log(`   Type: ${stripeError.type}`);
      console.log(`   Message: ${stripeError.message}`);
      console.log(`   Param: ${stripeError.param}`);
      console.log(`   Raw: ${JSON.stringify(stripeError.raw, null, 2)}`);

      if (stripeError.param === 'line_items[0][price_data][product_data][images][0]') {
        console.log('\n🔍 DIAGNOSTIC IMAGE:');
        console.log(`   L'image "${imageUrl}" n'est pas une URL valide pour Stripe`);
        console.log('   Solutions:');
        console.log('   1. Vérifier que BACKEND_URL est une URL valide');
        console.log('   2. Vérifier que le fichier image existe');
        console.log('   3. Tester: curl ' + imageUrl);
        console.log('   4. Utiliser une image Stripe hébergée');
      }
    }

    await mongoose.connection.close();
    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    process.exit(1);
  }
}

testCheckout();
