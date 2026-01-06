import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate('products');
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [] });
      await wishlist.save();
    }
    res.json({ success: true, wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [req.params.productId] });
    } else if (!wishlist.products.includes(req.params.productId)) {
      wishlist.products.push(req.params.productId);
    }

    await wishlist.save();
    await wishlist.populate('products');

    res.json({ success: true, message: 'Produit ajouté à la wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist non trouvée' });
    }

    wishlist.products = wishlist.products.filter((id) => id.toString() !== req.params.productId);
    await wishlist.save();
    await wishlist.populate('products');

    res.json({ success: true, message: 'Produit supprimé de la wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    const isWishlisted = wishlist && wishlist.products.includes(req.params.productId);

    res.json({ success: true, isWishlisted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
