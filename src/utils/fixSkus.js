import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixSkus() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eshop');
    
    // D'abord corriger les catégories sans accents
    console.log('Correction des catégories sans accents...');
    const corrections = [
      { from: 'Vetements', to: 'Vêtements' },
      { from: 'Beaute', to: 'Beauté' }
    ];

    for (const correction of corrections) {
      const result = await Product.updateMany(
        { category: correction.from },
        { category: correction.to }
      );
      if (result.modifiedCount > 0) {
        console.log(`✓ ${result.modifiedCount} produits: ${correction.from} -> ${correction.to}`);
      }
    }

    // Ensuite générer les SKU vides
    console.log('\nRecherche des produits avec SKU vide...');
    const products = await Product.find({
      $or: [
        { sku: null },
        { sku: '' },
        { sku: { $exists: false } }
      ]
    });

    console.log(`${products.length} produits trouvés avec SKU vide`);

    for (const product of products) {
      const timestamp = Date.now();
      const sanitizedName = product.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .substring(0, 10);
      const newSku = `${sanitizedName}-${timestamp}`;
      
      product.sku = newSku;
      await product.save();
      console.log(`✓ Produit "${product.name}" -> SKU: ${newSku}`);
    }

    console.log('\n✓ Tous les problèmes ont été résolus');
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

fixSkus();
