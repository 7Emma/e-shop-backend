import mongoose from 'mongoose';

/**
 * ✅ Middleware to validate MongoDB ObjectId
 * Prevents invalid IDs from reaching the database
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `${paramName} invalide`
      });
    }

    next();
  };
};

/**
 * ✅ Escape regex special characters for MongoDB
 * Prevents NoSQL injection
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * ✅ Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * ✅ Validate password strength
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * ✅ Validate quantity
 */
export const validateQuantity = (quantity) => {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 100;
};

/**
 * ✅ Prevent NoSQL injection in query filters
 */
export const sanitizeQueryFilter = (filter) => {
  if (!filter || typeof filter !== 'object') return filter;

  const sanitized = {};
  for (const [key, value] of Object.entries(filter)) {
    // Reject keys starting with $
    if (key.startsWith('$')) {
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeQueryFilter(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
