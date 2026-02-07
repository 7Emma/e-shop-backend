import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './src/models/Order.js';

dotenv.config();

async function checkOrder() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eshop');
    
    const orderId = '695d10da668a62d2f731aefd';
    const order = await Order.findById(orderId);
    
    if (order) {
      console.log('✓ Commande trouvée:');
      console.log(`  ID: ${order._id}`);
      console.log(`  Tracking: ${order.trackingCode}`);
      console.log(`  User: ${order.user}`);
      console.log(`  Total: ${order.totalPrice}€`);
      console.log(`  Items: ${order.items?.length || 0}`);
    } else {
      console.log(`❌ Commande non trouvée avec ID: ${orderId}`);
      
      // Afficher les dernières commandes
      const recent = await Order.find().sort({ createdAt: -1 }).limit(5);
      console.log('\n📋 Dernières 5 commandes en base:');
      recent.forEach(o => {
        console.log(`  - ${o._id} | Tracking: ${o.trackingCode} | User: ${o.user}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkOrder();
