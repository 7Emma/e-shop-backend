/**
 * Script de test pour le système OTP de suivi de commande
 * Utiliser: node test-otp.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import Order from './src/models/Order.js';
import OTP from './src/models/OTP.js';
import { sendOTPEmail } from './src/services/emailService.js';

dotenv.config();

async function testOTPSystem() {
  try {
    console.log('🔧 Démarrage des tests OTP...\n');

    // Connexion à la base de données
    await connectDB();
    console.log('✅ Base de données connectée\n');

    // 1. Vérifier les commandes existantes
    console.log('📦 Commandes existantes:');
    const orders = await Order.find().limit(5);
    if (orders.length === 0) {
      console.log('   ⚠️  Aucune commande trouvée\n');
    } else {
      orders.forEach(order => {
        console.log(`   - ${order._id}: trackingCode=${order.trackingCode}, email=${order.shippingAddress?.email}`);
      });
      console.log();
    }

    // 2. Tester avec une commande existante
    if (orders.length > 0) {
      const testOrder = orders[0];
      console.log(`\n📧 Test avec la commande: ${testOrder._id}`);
      console.log(`   trackingCode: ${testOrder.trackingCode}`);
      console.log(`   email: ${testOrder.shippingAddress?.email}`);

      if (!testOrder.trackingCode || !testOrder.shippingAddress?.email) {
        console.log('   ⚠️  trackingCode ou email manquant!\n');
      } else {
        // Générer un OTP de test
        const testOTP = '123456';
        console.log(`   Génération d'un OTP test: ${testOTP}`);

        // Créer l'OTP en base de données
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
        const otp = new OTP({
          trackingCode: testOrder.trackingCode,
          email: testOrder.shippingAddress.email,
          code: testOTP,
          expiresAt: otpExpiry,
        });

        await otp.save();
        console.log('   ✅ OTP créé en base de données');

        // Envoyer l'email OTP
        console.log('   📬 Envoi de l\'email OTP...');
        const emailSent = await sendOTPEmail(
          testOrder.shippingAddress.email,
          testOTP,
          testOrder.trackingCode
        );

        if (emailSent) {
          console.log('   ✅ Email OTP envoyé avec succès!');
        } else {
          console.log('   ❌ Erreur lors de l\'envoi de l\'email');
        }
      }
    }

    // 3. Vérifier les OTP existants
    console.log('\n\n🔐 OTP en base de données:');
    const otps = await OTP.find().limit(5);
    if (otps.length === 0) {
      console.log('   Aucun OTP trouvé');
    } else {
      otps.forEach(otp => {
        console.log(`   - trackingCode=${otp.trackingCode}, verified=${otp.verified}, attempts=${otp.attempts}`);
      });
    }

    console.log('\n\n✅ Tests terminés!');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Vérifier que le service email fonctionne (MailHog ou Gmail)');
    console.log('   2. Aller sur http://localhost:5173/track');
    console.log('   3. Entrer un trackingCode existant');
    console.log('   4. Vérifier que vous recevez l\'email OTP');
    console.log('   5. Entrer le code OTP');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Déconnexion de la base de données');
  }
}

testOTPSystem();
