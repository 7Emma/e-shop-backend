/**
 * ✅ CSRF Protection Middleware
 * 
 * Note: With httpOnly cookies + SameSite=strict, CSRF is mostly protected.
 * This provides additional protection for traditional form submissions.
 */

/**
 * Simple CSRF token generator
 * In production, use 'csrf' package
 */
export const generateCSRFToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

/**
 * Store CSRF tokens in memory (in production, use Redis or sessions)
 */
const csrfTokens = new Map();

/**
 * Middleware to generate and store CSRF token
 */
export const csrfProtection = (req, res, next) => {
  // Create unique session ID if doesn't exist
  if (!req.sessionID) {
    req.sessionID = require('crypto').randomBytes(16).toString('hex');
  }

  // Generate token for GET requests (forms)
  if (req.method === 'GET' && !csrfTokens.has(req.sessionID)) {
    const token = generateCSRFToken();
    csrfTokens.set(req.sessionID, token);
    res.locals.csrfToken = token;
  }

  // Verify token for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.body?._csrf || req.headers['x-csrf-token'];
    const storedToken = csrfTokens.get(req.sessionID);

    if (!storedToken || token !== storedToken) {
      // ⚠️ Only enforce for non-API calls
      if (!req.path.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          message: 'CSRF token invalide'
        });
      }
    }
  }

  next();
};

/**
 * Middleware to provide CSRF token in response
 */
export const csrfToken = (req, res, next) => {
  if (!csrfTokens.has(req.sessionID)) {
    const token = generateCSRFToken();
    csrfTokens.set(req.sessionID, token);
    res.locals.csrfToken = token;
  } else {
    res.locals.csrfToken = csrfTokens.get(req.sessionID);
  }
  next();
};

/**
 * Utility to attach CSRF token to JSON response
 */
export const attachCSRFToken = (req, res) => {
  return {
    csrfToken: res.locals.csrfToken || generateCSRFToken()
  };
};
