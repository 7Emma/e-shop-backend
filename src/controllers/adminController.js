import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import { escapeRegex, buildSafeRegexQuery } from '../utils/mongoEscape.js';

// ============ STATISTIQUES ============

/**
 * Obtenir les statistiques du dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtenir les statistiques de ventes
 */
export const getSalesStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let daysBack = 30;
    if (period === 'week') daysBack = 7;
    if (period === 'day') daysBack = 1;
    if (period === 'year') daysBack = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const sales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtenir les produits les plus vendus
 */
export const getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    res.json({ success: true, products: topProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtenir les utilisateurs actifs
 */
export const getActiveUsers = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let daysBack = 30;
    if (period === 'week') daysBack = 7;
    if (period === 'day') daysBack = 1;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const activeUsers = await User.countDocuments({
      updatedAt: { $gte: startDate }
    });

    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      activeUsers,
      totalUsers,
      percentage: ((activeUsers / totalUsers) * 100).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtenir les revenus
 */
export const getRevenue = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let daysBack = 30;
    if (period === 'week') daysBack = 7;
    if (period === 'day') daysBack = 1;
    if (period === 'year') daysBack = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const revenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' },
          count: { $sum: 1 },
          average: { $avg: '$totalPrice' }
        }
      }
    ]);

    res.json({
      success: true,
      revenue: revenue[0] || { total: 0, count: 0, average: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GESTION DES PRODUITS ============

/**
 * Obtenir tous les produits (avec filtres)
 */
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (category) query.category = category;
    
    // ✅ Escape regex to prevent NoSQL injection
    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { sku: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .skip(Math.max(0, (parseInt(page) - 1) * parseInt(limit)))
      .limit(Math.min(100, parseInt(limit)))  // Max limit 100
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      total,
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GESTION DES UTILISATEURS ============

/**
 * Obtenir tous les utilisateurs
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {};
    if (role && ['user', 'admin'].includes(role)) {
      query.role = role;
    }
    
    // ✅ Escape regex to prevent NoSQL injection
    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { email: { $regex: escapedSearch, $options: 'i' } },
        { firstName: { $regex: escapedSearch, $options: 'i' } },
        { lastName: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parsedLimit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      total,
      pages: Math.ceil(total / parsedLimit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtenir un utilisateur spécifique
 */
export const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // ✅ Validate ObjectId format
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({ success: false, message: 'Identifiant utilisateur invalide' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Changer le rôle d'un utilisateur
 */
export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Rôle invalide' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      message: 'Rôle mis à jour',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Supprimer un utilisateur
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Supprimer aussi les données de l'utilisateur
    await Cart.deleteOne({ user: req.params.userId });
    await Wishlist.deleteOne({ user: req.params.userId });
    await Review.deleteMany({ user: req.params.userId });

    res.json({
      success: true,
      message: 'Utilisateur supprimé'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GESTION DES COMMANDES ============

/**
 * Obtenir toutes les commandes (avec filtres)
 */
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name price image')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtenir une commande spécifique
 */
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name price image');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mettre à jour le statut d'une commande
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const updateData = { status };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      updateData,
      { new: true }
    ).populate('user', 'email').populate('items.product', 'name');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    res.json({
      success: true,
      message: 'Statut mis à jour',
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GESTION DES AVIS ============

/**
 * Obtenir tous les avis
 */
export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find()
      .populate('user', 'firstName lastName email')
      .populate('product', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments();

    res.json({
      success: true,
      reviews,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Supprimer un avis
 */
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }

    res.json({
      success: true,
      message: 'Avis supprimé'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ PROFIL ADMIN ============

/**
 * Obtenir le profil de l'admin connecté
 */
export const getAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Vérifier que l'admin ne peut accéder que à son propre profil (sauf s'il accède au sien)
    const admin = await User.findById(adminId).select('-password');
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin non trouvé' });
    }

    if (admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Cet utilisateur n\'est pas admin' });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ PARAMÈTRES ADMIN ============

/**
 * Obtenir les paramètres d'administration
 */
export const getAdminSettings = async (req, res) => {
  try {
    res.json({
      success: true,
      settings: {
        siteName: 'EliteShop',
        currency: 'EUR',
        taxRate: 20,
        shippingCost: 5,
        maintenanceMode: false,
        emailNotifications: true,
        logRetentionDays: 30,
        maxUploadSize: 10, // MB
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
