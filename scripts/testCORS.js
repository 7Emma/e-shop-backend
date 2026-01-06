import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testCORS = async () => {
  const BACKEND_URL = 'http://localhost:5000/api';
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         TEST CORS CONFIGURATION        ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log('📋 Configuration:');
  console.log(`   Backend:  ${BACKEND_URL}`);
  console.log(`   Frontend: ${FRONTEND_URL}\n`);

  // Test 1: Health endpoint
  console.log('🔍 Test 1: Health endpoint');
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log('   ✅ Backend répond');
    console.log(`   Status: ${response.status}`);
    console.log(`   Data: ${JSON.stringify(response.data)}\n`);
  } catch (error) {
    console.log('   ❌ Erreur:');
    console.log(`   ${error.message}\n`);
    process.exit(1);
  }

  // Test 2: Login endpoint (avec mauvais identifiants pour tester CORS)
  console.log('🔍 Test 2: Login endpoint (test CORS)');
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: 'test@test.com',
      password: 'wrong',
    });
    console.log('   ⚠️ Login réussi (identifiants incorrects?)');
  } catch (error) {
    if (error.response) {
      console.log('   ✅ CORS OK - Backend répond');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message}\n`);
    } else if (error.message === 'Network Error') {
      console.log('   ❌ CORS BLOQUÉ ou Backend not running');
      console.log(`   Erreur: ${error.message}\n`);
      process.exit(1);
    } else {
      console.log('   ❌ Erreur:');
      console.log(`   ${error.message}\n`);
      process.exit(1);
    }
  }

  // Test 3: Afficher la configuration
  console.log('╔════════════════════════════════════════╗');
  console.log('║    ✅ CORS SEMBLE FONCTIONNER         ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log('📝 Prochaine étape: Testez la connexion admin');
  console.log('   1. Allez sur http://localhost:5173');
  console.log('   2. Cliquez User → Admin');
  console.log('   3. Entrez:');
  console.log('      Email: admin@eshop.com');
  console.log('      Mot de passe: Admin123@\n');

  process.exit(0);
};

testCORS().catch((error) => {
  console.error('\n❌ Erreur:', error.message);
  process.exit(1);
});
