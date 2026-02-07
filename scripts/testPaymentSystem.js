import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Cart from '../src/models/Cart.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';

dotenv.config();

async function testPaymentSystem() {
  console.log('🔍 TEST DU SYSTÈME DE PAIEMENT\n');
  console.log('='.repeat(50));

  try {
    // Connexion MongoDB
    console.log('\n1️⃣ Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eshop');
    console.log('✅ Connecté à MongoDB');

    // Vérifier Stripe
    console.log('\n2️⃣ Configuration Stripe...');
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('❌ STRIPE_SECRET_KEY manquante');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('❌ STRIPE_WEBHOOK_SECRET manquante');
    }
    console.log('✅ Clés Stripe présentes');

    // Vérifier URLs
    console.log('\n3️⃣ Configuration des URLs...');
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    console.log(`  BACKEND_URL: ${backendUrl}`);
    console.log(`  FRONTEND_URL: ${frontendUrl}`);
    
    if (!backendUrl.startsWith('http')) {
      console.warn('⚠️  BACKEND_URL invalide');
    } else {
      console.log('✅ URLs valides');
    }

    // Compter les produits
    console.log('\n4️⃣ Vérification des produits...');
    const productCount = await Product.countDocuments();
    console.log(`  Total produits: ${productCount}`);
    
    if (productCount === 0) {
      console.warn('⚠️  Aucun produit en base de données');
    }

    // Vérifier les images des produits
    console.log('\n5️⃣ Vérification des images des produits...');
    const productsWithoutImage = await Product.countDocuments({ 
      image: { $in: [null, '', undefined] } 
    });
    const productsTotal = await Product.countDocuments();
    
    if (productsTotal > 0) {
      if (productsWithoutImage > 0) {
        console.warn(`⚠️  ${productsWithoutImage}/${productsTotal} produits SANS image`);
      } else {
        console.log(`✅ Tous les ${productsTotal} produits ont une image`);
      }

      // Afficher quelques exemples
      console.log('\n  Exemples de produits:');
      const samples = await Product.find().limit(3).select('name image');
      samples.forEach(p => {
        const status = p.image ? '✅' : '❌';
        console.log(`  ${status} ${p.name}: ${p.image || 'AUCUNE IMAGE'}`);
      });
    }

    // Vérifier les paniers
    console.log('\n6️⃣ Vérification des paniers...');
    const cartsCount = await Cart.countDocuments();
    const cartsWithItems = await Cart.countDocuments({ 'items.0': { $exists: true } });
    console.log(`  Total paniers: ${cartsCount}`);
    console.log(`  Paniers avec articles: ${cartsWithItems}`);

    // Test de construction d'URL pour les images
    console.log('\n7️⃣ Test de conversion d\'URL d\'image...');
    const testImages = [
      '/uploads/products/image.jpg',
      'http://localhost:5000/uploads/products/image.jpg',
      'https://example.com/image.jpg',
      '',
      null,
    ];

    testImages.forEach(img => {
      let result = null;
      if (img) {
        result = img.toString().trim();
        if (result && !result.startsWith('http://') && !result.startsWith('https://')) {
          result = `${backendUrl}${result}`;
        }
      }
      console.log(`  "${img}" → "${result || '(vide)'}"`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ Test complété\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

testPaymentSystem();
