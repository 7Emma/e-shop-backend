import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    // Try to get token from cookies first, then from Authorization header
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token manquant' });
    }

    // ✅ JWT_SECRET must be configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ CRITICAL: JWT_SECRET is not configured');
      return res.status(500).json({ success: false, message: 'Configuration serveur invalide' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

export const verifyAdmin = (req, res, next) => {
  try {
    // Try to get token from cookies first, then from Authorization header
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token manquant' });
    }

    // ✅ JWT_SECRET must be configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ CRITICAL: JWT_SECRET is not configured');
      return res.status(500).json({ success: false, message: 'Configuration serveur invalide' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès admin requis' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

// Authentification optionnelle (tous les clients sont connectés comme guest)
export const optionalAuth = (req, res, next) => {
  // Créer un utilisateur guest générique (utiliser _id pour Mongo)
  req.user = {
    _id: 'guest',
    id: 'guest', // compatibilité
    role: 'user',
    email: 'guest@example.com'
  };
  next();
};
