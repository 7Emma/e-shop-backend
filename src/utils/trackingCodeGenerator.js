/**
 * Générateur de code de suivi unique
 * Format: 8-12 caractères alphanumériques
 * Exemple: ABC12345, XYZ98765DEF
 */

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Génère un code de suivi aléatoire
 * @param {number} length - Longueur du code (8-12, default: 10)
 * @returns {string} Code généré
 */
export const generateTrackingCode = (length = 10) => {
  if (length < 8 || length > 12) {
    length = 10;
  }

  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  
  return code;
};

/**
 * Valide le format d'un code de suivi
 * @param {string} code - Code à valider
 * @returns {boolean} True si valide
 */
export const isValidTrackingCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  if (code.length < 8 || code.length > 12) return false;
  return /^[A-Z0-9]+$/.test(code);
};

export default { generateTrackingCode, isValidTrackingCode };
