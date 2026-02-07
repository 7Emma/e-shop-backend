/**
 * ✅ Escape regex special characters for MongoDB regex queries
 * Prevents NoSQL injection through regex patterns
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for use in regex
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * ✅ Safely build MongoDB regex query
 * @param {string} searchTerm - The search term
 * @param {Object} options - Query options
 * @returns {Object} Safe MongoDB regex object
 */
export const buildSafeRegexQuery = (searchTerm, options = {}) => {
  const { caseSensitive = false, wholeWord = false } = options;

  const escapedTerm = escapeRegex(searchTerm);
  const pattern = wholeWord ? `\\b${escapedTerm}\\b` : escapedTerm;

  return {
    $regex: pattern,
    $options: caseSensitive ? '' : 'i'
  };
};

/**
 * ✅ Prevent NoSQL injection in object keys
 * Removes any keys starting with $ or .
 * @param {Object} obj - The object to sanitize
 * @returns {Object} Sanitized object
 */
export const sanitizeObjectKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    // Reject MongoDB operator keys
    if (key.startsWith('$') || key.startsWith('.')) {
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObjectKeys(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
