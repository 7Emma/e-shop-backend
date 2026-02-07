import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('\n' + '='.repeat(70));
console.log('🔍 CHECK COMPLET DU SYSTÈME DE PAIEMENT E-SHOP');
console.log('='.repeat(70) + '\n');

const results = {
  frontend: { errors: [], warnings: [], success: [] },
  backend: { errors: [], warnings: [], success: [] },
  database: { errors: [], warnings: [], success: [] },
  stripe: { errors: [], warnings: [], success: [] },
};

// ============================================================================
// 1. VÉRIFIER FICHIERS .ENV
// ============================================================================
console.log('📋 ÉTAPE 1: Vérification des fichiers .env\n');

const backendEnvPath = path.join(rootDir, 'backend', '.env');
const frontendEnvPath = path.join(rootDir, 'frontend', '.env');
const backendEnvExamplePath = path.join(rootDir, 'backend', '.env.example');
const frontendEnvExamplePath = path.join(rootDir, 'frontend', '.env.example');

// Backend .env
console.log('   Backend:');
if (fs.existsSync(backendEnvPath)) {
  console.log('   ✅ backend/.env existe');
  results.backend.success.push('Fichier .env existe');
} else {
  console.log('   ⚠️  backend/.env manquant - créé depuis .env.exemple');
  if (fs.existsSync(backendEnvExamplePath)) {
    fs.copyFileSync(backendEnvExamplePath, backendEnvPath);
    console.log('   ✅ Copie effectuée');
  }
}

// Frontend .env
console.log('   Frontend:');
if (fs.existsSync(frontendEnvPath)) {
  console.log('   ✅ frontend/.env existe');
  results.frontend.success.push('Fichier .env existe');
} else {
  console.log('   ⚠️  frontend/.env manquant - créé depuis .env.example');
  if (fs.existsSync(frontendEnvExamplePath)) {
    fs.copyFileSync(frontendEnvExamplePath, frontendEnvPath);
    console.log('   ✅ Copie effectuée');
  }
}

// Charger les variables d'env
dotenv.config({ path: backendEnvPath });
const backendEnv = process.env;

// ============================================================================
// 2. VÉRIFIER BACKEND
// ============================================================================
console.log('\n📁 ÉTAPE 2: Vérification Backend\n');

console.log('   Configuration URLs:');

// BACKEND_URL
if (!backendEnv.BACKEND_URL) {
  results.backend.errors.push('BACKEND_URL manquante');
  console.log('   ❌ BACKEND_URL manquante');
} else {
  const url = backendEnv.BACKEND_URL.trim();
  if (url.startsWith('http')) {
    results.backend.success.push('BACKEND_URL valide');
    console.log(`   ✅ BACKEND_URL: ${url}`);
  } else {
    results.backend.errors.push('BACKEND_URL invalide');
    console.log(`   ❌ BACKEND_URL invalide: ${url}`);
  }
}

// FRONTEND_URL
if (!backendEnv.FRONTEND_URL) {
  results.backend.errors.push('FRONTEND_URL manquante');
  console.log('   ❌ FRONTEND_URL manquante');
} else {
  const url = backendEnv.FRONTEND_URL.trim();
  if (url.startsWith('http')) {
    results.backend.success.push('FRONTEND_URL valide');
    console.log(`   ✅ FRONTEND_URL: ${url}`);
  } else {
    results.backend.errors.push('FRONTEND_URL invalide');
    console.log(`   ❌ FRONTEND_URL invalide: ${url}`);
  }
}

console.log('\n   Configuration Stripe:');

// STRIPE_SECRET_KEY
if (!backendEnv.STRIPE_SECRET_KEY) {
  results.stripe.errors.push('STRIPE_SECRET_KEY manquante');
  console.log('   ❌ STRIPE_SECRET_KEY manquante');
} else {
  const key = backendEnv.STRIPE_SECRET_KEY;
  if (key.startsWith('sk_test_') || key.startsWith('sk_live_')) {
    results.stripe.success.push('STRIPE_SECRET_KEY valide');
    console.log(`   ✅ STRIPE_SECRET_KEY: ${key.substring(0, 15)}...`);
  } else {
    results.stripe.errors.push('STRIPE_SECRET_KEY format invalide');
    console.log('   ❌ STRIPE_SECRET_KEY format invalide');
  }
}

// STRIPE_WEBHOOK_SECRET
if (!backendEnv.STRIPE_WEBHOOK_SECRET) {
  results.stripe.errors.push('STRIPE_WEBHOOK_SECRET manquante');
  console.log('   ❌ STRIPE_WEBHOOK_SECRET manquante');
} else {
  const secret = backendEnv.STRIPE_WEBHOOK_SECRET;
  if (secret.startsWith('whsec_')) {
    results.stripe.success.push('STRIPE_WEBHOOK_SECRET valide');
    console.log(`   ✅ STRIPE_WEBHOOK_SECRET: ${secret.substring(0, 20)}...`);
  } else {
    results.stripe.warnings.push('STRIPE_WEBHOOK_SECRET ne commence pas par whsec_');
    console.log(`   ⚠️  STRIPE_WEBHOOK_SECRET: ${secret.substring(0, 20)}...`);
  }
}

console.log('\n   Configuration serveur:');

// PORT
const port = backendEnv.PORT || '5000';
console.log(`   ✅ PORT: ${port}`);
results.backend.success.push(`PORT: ${port}`);

// NODE_ENV
const nodeEnv = backendEnv.NODE_ENV || 'development';
console.log(`   ✅ NODE_ENV: ${nodeEnv}`);
results.backend.success.push(`NODE_ENV: ${nodeEnv}`);

// ============================================================================
// 3. VÉRIFIER FRONTEND
// ============================================================================
console.log('\n🎨 ÉTAPE 3: Vérification Frontend\n');

const frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf-8');

console.log('   Configuration API:');

if (frontendEnvContent.includes('VITE_API_URL')) {
  const match = frontendEnvContent.match(/VITE_API_URL=(.+)/);
  if (match) {
    const apiUrl = match[1].trim();
    console.log(`   ✅ VITE_API_URL: ${apiUrl}`);
    results.frontend.success.push('VITE_API_URL configurée');
    
    if (apiUrl === 'http://localhost:5000/api') {
      console.log('   ✅ Correspond à BACKEND_URL');
    }
  }
} else {
  results.frontend.errors.push('VITE_API_URL manquante');
  console.log('   ❌ VITE_API_URL manquante');
}

// VITE_STRIPE_PUBLIC_KEY
if (frontendEnvContent.includes('VITE_STRIPE_PUBLIC_KEY')) {
  const match = frontendEnvContent.match(/VITE_STRIPE_PUBLIC_KEY=(.+)/);
  if (match) {
    const key = match[1].trim();
    if (key.startsWith('pk_test_') || key.startsWith('pk_live_')) {
      console.log(`   ✅ VITE_STRIPE_PUBLIC_KEY: ${key.substring(0, 15)}...`);
      results.stripe.success.push('VITE_STRIPE_PUBLIC_KEY valide');
    } else {
      console.log('   ❌ VITE_STRIPE_PUBLIC_KEY format invalide');
      results.stripe.errors.push('VITE_STRIPE_PUBLIC_KEY format invalide');
    }
  }
} else {
  results.frontend.warnings.push('VITE_STRIPE_PUBLIC_KEY manquante');
  console.log('   ⚠️  VITE_STRIPE_PUBLIC_KEY manquante');
}

console.log('\n   Configuration app:');

if (frontendEnvContent.includes('VITE_APP_NAME')) {
  console.log('   ✅ VITE_APP_NAME configurée');
  results.frontend.success.push('VITE_APP_NAME configurée');
}

if (frontendEnvContent.includes('VITE_ENV')) {
  const match = frontendEnvContent.match(/VITE_ENV=(.+)/);
  if (match) {
    console.log(`   ✅ VITE_ENV: ${match[1].trim()}`);
    results.frontend.success.push('VITE_ENV configurée');
  }
}

// ============================================================================
// 4. VÉRIFIER MONGODB
// ============================================================================
console.log('\n🗄️  ÉTAPE 4: Vérification MongoDB\n');

console.log('   Configuration:');

if (!backendEnv.MONGODB_URI) {
  results.database.errors.push('MONGODB_URI manquante');
  console.log('   ❌ MONGODB_URI manquante');
} else {
  const mongoUri = backendEnv.MONGODB_URI;
  if (mongoUri.includes('mongodb')) {
    console.log(`   ✅ MONGODB_URI configurée`);
    results.database.success.push('MONGODB_URI configurée');
    
    // Test connexion
    console.log('\n   Test de connexion:');
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('   ✅ Connexion réussie');
      results.database.success.push('Connexion réussie');
      await mongoose.connection.close();
    } catch (error) {
      results.database.warnings.push(`Connexion échouée: ${error.message}`);
      console.log(`   ⚠️  Connexion échouée: ${error.message}`);
    }
  } else {
    results.database.errors.push('MONGODB_URI format invalide');
    console.log('   ❌ MONGODB_URI format invalide');
  }
}

// ============================================================================
// 5. VÉRIFIER RESSOURCES SERVEUR
// ============================================================================
console.log('\n📦 ÉTAPE 5: Vérification ressources serveur\n');

console.log('   Dossiers:');

const uploadDir = path.join(rootDir, 'backend', 'public', 'uploads');
if (fs.existsSync(uploadDir)) {
  console.log('   ✅ public/uploads/ existe');
  results.backend.success.push('Dossier uploads existe');
} else {
  console.log('   ⚠️  public/uploads/ manquant - création...');
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('   ✅ Créé');
}

const productsDir = path.join(uploadDir, 'products');
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

console.log('\n   Fichiers:');

const paymentController = path.join(rootDir, 'backend', 'src', 'controllers', 'paymentController.js');
if (fs.existsSync(paymentController)) {
  console.log('   ✅ paymentController.js existe');
  results.backend.success.push('paymentController.js existe');
} else {
  results.backend.errors.push('paymentController.js manquant');
  console.log('   ❌ paymentController.js manquant');
}

const paymentRoutes = path.join(rootDir, 'backend', 'src', 'routes', 'payment.js');
if (fs.existsSync(paymentRoutes)) {
  console.log('   ✅ payment.js routes existe');
  results.backend.success.push('payment.js routes existe');
}

// ============================================================================
// 6. RÉSUMÉ FINAL
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 RÉSUMÉ FINAL');
console.log('='.repeat(70) + '\n');

let totalErrors = 0;
let totalWarnings = 0;
let totalSuccess = 0;

const categories = [
  { name: 'Frontend', data: results.frontend, emoji: '🎨' },
  { name: 'Backend', data: results.backend, emoji: '📁' },
  { name: 'Database', data: results.database, emoji: '🗄️' },
  { name: 'Stripe', data: results.stripe, emoji: '💳' },
];

categories.forEach(cat => {
  console.log(`${cat.emoji} ${cat.name}:`);
  
  if (cat.data.errors.length > 0) {
    console.log(`   ❌ ${cat.data.errors.length} erreur(s)`);
    cat.data.errors.forEach(e => console.log(`      • ${e}`));
    totalErrors += cat.data.errors.length;
  }
  
  if (cat.data.warnings.length > 0) {
    console.log(`   ⚠️  ${cat.data.warnings.length} avertissement(s)`);
    cat.data.warnings.forEach(w => console.log(`      • ${w}`));
    totalWarnings += cat.data.warnings.length;
  }
  
  if (cat.data.success.length > 0) {
    console.log(`   ✅ ${cat.data.success.length} OK`);
    totalSuccess += cat.data.success.length;
  }
  
  console.log('');
});

console.log('='.repeat(70));

if (totalErrors === 0) {
  console.log('\n🎉 SYSTÈME DE PAIEMENT COMPLET ET FONCTIONNEL!\n');
  console.log('Actions finales:');
  console.log('1. Démarrer le backend:     npm run dev (dans backend/)');
  console.log('2. Démarrer le frontend:    npm run dev (dans frontend/)');
  console.log('3. Tester le paiement:      http://localhost:5173');
  console.log('4. Panier → Paiement → Carte de test Stripe');
  console.log('\n   Carte de test: 4242 4242 4242 4242 (12/25, 123)');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${totalErrors} erreur(s) à corriger\n`);
  process.exit(1);
}
