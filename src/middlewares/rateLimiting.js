import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * ✅ Rate limiter for auth endpoints (login)
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 attempts max
  message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    // Rate limit by IP and email combination
    const ip = ipKeyGenerator(req, res);
    return `${ip}-${req.body?.email || 'unknown'}`;
  }
});

/**
 * ✅ Rate limiter for registration
 * Prevents account enumeration and spam
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 3,  // 3 registrations per hour
  message: 'Trop d\'enregistrements, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
});

/**
 * ✅ Rate limiter for OTP endpoints
 * Prevents brute force on OTP verification
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutes
  max: 3,  // 3 attempts max
  message: 'Trop de tentatives OTP, veuillez réessayer dans 10 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Rate limit by IP and phone/email
    const ip = ipKeyGenerator(req, res);
    return `${ip}-${req.body?.phone || req.body?.email || 'unknown'}`;
  }
});

/**
 * ✅ Rate limiter for sensitive operations
 * Prevents API abuse
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false
});
