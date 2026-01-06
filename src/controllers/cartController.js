import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) {
      cart = new Cart({ user: req.user.id });
      await cart.save();
    }
    await cart.calculateTotal();
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Stock insuffisant' });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const existingItem = cart.items.find((item) => item.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.calculateTotal();

    res.json({ success: true, message: 'Produit ajouté au panier', cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: 'Stock insuffisant' });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    const item = cart.items.find((item) => item.product.toString() === req.params.productId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé dans le panier' });
    }

    if (quantity === 0) {
      cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.calculateTotal();

    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
    await cart.save();
    await cart.calculateTotal();

    res.json({ success: true, message: 'Produit supprimé du panier', cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;
    await cart.save();

    res.json({ success: true, message: 'Panier vidé', cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
