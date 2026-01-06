import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import readline from 'readline';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

const createAdminInteractive = async () => {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  CRÉATION D\'UN COMPTE ADMINISTRATEUR   ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Connexion à la base de données
    console.log('🔄 Connexion à la base de données...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eshop');
    console.log('✅ Connecté à MongoDB');
    
    // Fermer la connexion proprement à la fin
    const closeConnection = async () => {
      await mongoose.connection.close();
      rl.close();
    };

    // Demander les informations
    const firstName = await question('👤 Prénom: ');
    const lastName = await question('👤 Nom: ');
    const email = await question('📧 Email: ');
    const password = await question('🔐 Mot de passe: ');

    // Validation
    if (!firstName || !lastName || !email || !password) {
      console.log('\n❌ Tous les champs sont requis');
      await closeConnection();
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('\n❌ Le mot de passe doit contenir au moins 6 caractères');
      await closeConnection();
      process.exit(1);
    }

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('\n⚠️ Un utilisateur avec cet email existe déjà');
      await closeConnection();
      process.exit(0);
    }

    // Hacher le mot de passe manuellement
    console.log('\n🔄 Création de l\'administrateur...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Utiliser insertOne pour bypasser les hooks Mongoose
    const db = mongoose.connection.getClient().db('eshop');
    await db.collection('users').insertOne({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   ✅ ADMIN CRÉÉ AVEC SUCCÈS!          ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log('📧 Email:      ', email);
    console.log('👤 Nom:        ', `${firstName} ${lastName}`);
    console.log('🔑 Rôle:       ', 'admin');
    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants.\n');

    await closeConnection();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    try {
      await mongoose.connection.close();
    } catch (e) {}
    rl.close();
    process.exit(1);
  }
};

createAdminInteractive();
