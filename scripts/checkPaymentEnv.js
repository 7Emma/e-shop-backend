import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'env
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('\n' + '='.repeat(60));
console.log('🔍 VÉRIFICATION DES VARIABLES DE PAIEMENT');
console.log('='.repeat(60) + '\n');

// Résultats
const results = {
  errors: [],
  warnings: [],
  success: [],
};

// 1. Vérifier BACKEND_URL
console.log('1️⃣  BACKEND_URL');
if (!process.env.BACKEND_URL) {
  results.errors.push('BACKEND_URL manquante');
  console.log('   ❌ MANQUANTE');
} else {
  const backendUrl = process.env.BACKEND_URL.trim();
  console.log(`   Valeur: ${backendUrl}`);
  
  if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
    results.errors.push(`BACKEND_URL invalide: ${backendUrl}`);
    console.log('   ❌ INVALIDE - doit commencer par http:// ou https://');
  } else {
    results.success.push('BACKEND_URL valide');
    console.log('   ✅ VALIDE');
  }
}

// 2. Vérifier FRONTEND_URL
console.log('\n2️⃣  FRONTEND_URL');
if (!process.env.FRONTEND_URL) {
  results.errors.push('FRONTEND_URL manquante');
  console.log('   ❌ MANQUANTE');
} else {
  const frontendUrl = process.env.FRONTEND_URL.trim();
  console.log(`   Valeur: ${frontendUrl}`);
  
  if (!frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
    results.errors.push(`FRONTEND_URL invalide: ${frontendUrl}`);
    console.log('   ❌ INVALIDE - doit commencer par http:// ou https://');
  } else {
    results.success.push('FRONTEND_URL valide');
    console.log('   ✅ VALIDE');
  }
}

// 3. Vérifier STRIPE_SECRET_KEY
console.log('\n3️⃣  STRIPE_SECRET_KEY');
if (!process.env.STRIPE_SECRET_KEY) {
  results.errors.push('STRIPE_SECRET_KEY manquante');
  console.log('   ❌ MANQUANTE');
} else {
  const key = process.env.STRIPE_SECRET_KEY;
  if (key.startsWith('sk_test_') || key.startsWith('sk_live_')) {
    results.success.push('STRIPE_SECRET_KEY valide');
    console.log(`   ✅ VALIDE (${key.substring(0, 10)}...)`);
  } else {
    results.errors.push('STRIPE_SECRET_KEY format invalide');
    console.log(`   ❌ FORMAT INVALIDE - doit commencer par sk_test_ ou sk_live_`);
  }
}

// 4. Vérifier STRIPE_WEBHOOK_SECRET
console.log('\n4️⃣  STRIPE_WEBHOOK_SECRET');
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  results.errors.push('STRIPE_WEBHOOK_SECRET manquante');
  console.log('   ❌ MANQUANTE');
} else {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (secret.startsWith('whsec_')) {
    results.success.push('STRIPE_WEBHOOK_SECRET valide');
    console.log(`   ✅ VALIDE (${secret.substring(0, 15)}...)`);
  } else {
    results.warnings.push('STRIPE_WEBHOOK_SECRET ne commence pas par whsec_');
    console.log(`   ⚠️  ATTENTION: ne commence pas par whsec_`);
  }
}

// 5. Vérifier PORT
console.log('\n5️⃣  PORT');
const port = process.env.PORT || '5000';
console.log(`   Valeur: ${port}`);
if (port === '5000' || port === 5000) {
  results.success.push('PORT configuré');
  console.log('   ✅ OK (par défaut)');
} else {
  results.success.push(`PORT configuré à ${port}`);
  console.log(`   ✅ OK (${port})`);
}

// 6. Vérifier MONGODB_URI
console.log('\n6️⃣  MONGODB_URI');
if (!process.env.MONGODB_URI) {
  results.errors.push('MONGODB_URI manquante');
  console.log('   ❌ MANQUANTE');
} else {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri.includes('mongodb')) {
    results.success.push('MONGODB_URI configurée');
    console.log(`   ✅ CONFIGURÉE`);
  } else {
    results.errors.push('MONGODB_URI invalide');
    console.log('   ❌ FORMAT INVALIDE');
  }
}

// 7. Test de conversion d'URL image
console.log('\n7️⃣  TEST DE CONVERSION D\'URL IMAGE');
const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').trim();
const testImages = [
  '/uploads/products/image.jpg',
  'http://example.com/image.jpg',
  'https://cdn.example.com/image.jpg',
];

testImages.forEach(img => {
  let result = img;
  if (img && !img.startsWith('http://') && !img.startsWith('https://')) {
    result = `${backendUrl}${img}`;
  }
  console.log(`   "${img}"`);
  console.log(`   → "${result}"`);
});

// Résumé
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ');
console.log('='.repeat(60));

if (results.errors.length > 0) {
  console.log(`\n❌ ERREURS (${results.errors.length}):`);
  results.errors.forEach(e => console.log(`   • ${e}`));
}

if (results.warnings.length > 0) {
  console.log(`\n⚠️  AVERTISSEMENTS (${results.warnings.length}):`);
  results.warnings.forEach(w => console.log(`   • ${w}`));
}

if (results.success.length > 0) {
  console.log(`\n✅ OK (${results.success.length}):`);
  results.success.forEach(s => console.log(`   • ${s}`));
}

console.log('\n' + '='.repeat(60));

if (results.errors.length === 0) {
  console.log('🎉 SYSTÈME DE PAIEMENT PRÊT');
  console.log('\nActions recommandées:');
  console.log('1. Redémarrer le serveur: npm run dev');
  console.log('2. Tester le panier → Paiement');
  console.log('3. Vérifier les logs pour les URLs d\'image');
  process.exit(0);
} else {
  console.log('🔴 CONFIGURATION INCOMPLÈTE');
  console.log('\nActions requises:');
  console.log('1. Corriger les erreurs ci-dessus dans .env');
  console.log('2. Redémarrer le serveur');
  console.log('3. Relancer ce script');
  process.exit(1);
}
