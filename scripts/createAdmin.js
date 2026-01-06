import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eshop');
    console.log('✅ Connecté à MongoDB');

    // Données de l'admin
    const email = process.env.ADMIN_EMAIL || 'admin@eshop.com';
    const plainPassword = process.env.ADMIN_PASSWORD || 'Admin123@';

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('⚠️ Un admin avec cet email existe déjà:', email);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Hacher le mot de passe manuellement
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Créer le nouvel admin avec le mot de passe haché
    const adminData = {
      firstName: 'Admin',
      lastName: 'EliteShop',
      email,
      password: hashedPassword,
      role: 'admin',
    };

    // Utiliser insertOne pour bypasser les hooks Mongoose
    const db = mongoose.connection.getClient().db('eshop');
    const result = await db.collection('users').insertOne(adminData);

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   ✅ ADMIN CRÉÉ AVEC SUCCÈS!          ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log('📧 Email:      ', email);
    console.log('👤 Nom:        ', 'Admin EliteShop');
    console.log('🔑 Rôle:       ', 'admin');
    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants.\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

createAdmin();
