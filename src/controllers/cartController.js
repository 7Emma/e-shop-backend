import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export const getCart = async (req, res) => {
  try {
    // Si utilisateur connecté
    if (req.user) {
      let cart = await Cart.findOne({ user: req.user.id }).populate({
        path: 'items.product',
        select: '_id name description category price originalPrice image images stock rating reviews sku isActive createdAt'
      });
      if (!cart) {
        cart = new Cart({ user: req.user.id });
        await cart.save();
      }
      await cart.calculateTotal();
      res.json({ 
        success: true, 
        cart, 
        isGuest: false,
        itemCount: cart.items.length
      });
    } else {
      // Guest: retourner un panier vide structuré (pas null)
      res.json({ 
        success: true, 
        cart: { items: [], totalItems: 0, totalPrice: 0 }, 
        isGuest: true,
        itemCount: 0, 
        message: 'Les données du guest sont gérées en localStorage côté frontend' 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // ✅ Validate quantity
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantité invalide (doit être entre 1 et 100)' 
      });
    }

    // ✅ Validate productId
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'ID produit invalide' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Stock insuffisant' });
    }

    // Si utilisateur connecté
    if (req.user) {
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
      await cart.populate({
        path: 'items.product',
        select: '_id name description category price originalPrice image images stock rating reviews sku isActive createdAt'
      });
      await cart.calculateTotal();

      res.json({ 
        success: true, 
        message: 'Produit ajouté au panier', 
        cart, 
        isGuest: false,
        itemCount: cart.items.length
      });
    } else {
      // Guest: retourner le produit complet pour le localStorage
      res.json({ 
        success: true, 
        message: 'Produit ajouté au panier', 
        product: {
          _id: product._id,
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          images: product.images,
          stock: product.stock,
          rating: product.rating,
          reviews: product.reviews
        },
        quantity,
        isGuest: true 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    // ✅ Validate quantity
    if (quantity !== null && (quantity !== 0 && (!Number.isInteger(quantity) || quantity < 1 || quantity > 100))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantité invalide (doit être entre 1 et 100, ou 0 pour supprimer)' 
      });
    }

    // ✅ Validate productId
    const { productId } = req.params;
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'ID produit invalide' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    if (quantity > 0 && quantity > product.stock) {
      return res.status(400).json({ success: false, message: 'Stock insuffisant' });
    }

    // Si utilisateur connecté
    if (req.user) {
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
      await cart.populate({
        path: 'items.product',
        select: '_id name description category price originalPrice image images stock rating reviews sku isActive createdAt'
      });
      await cart.calculateTotal();

      res.json({ 
        success: true, 
        cart,
        isGuest: false,
        itemCount: cart.items.length
      });
    } else {
      // Guest: panier géré côté frontend
      // On retourne juste un OK - le frontend gère l'update localement
      res.json({ 
        success: true, 
        message: 'Quantité mise à jour', 
        isGuest: true,
        cart: { items: [], totalItems: 0, totalPrice: 0 } // Structure vide pour que le frontend ne se réinitialise pas
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    // Si utilisateur connecté
    if (req.user) {
      const cart = await Cart.findOne({ user: req.user.id });
      cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
      await cart.save();
      await cart.populate({
        path: 'items.product',
        select: '_id name description category price originalPrice image images stock rating reviews sku isActive createdAt'
      });
      await cart.calculateTotal();

      res.json({ 
        success: true, 
        message: 'Produit supprimé du panier', 
        cart,
        isGuest: false,
        itemCount: cart.items.length
      });
    } else {
      // Guest: panier géré côté frontend
      res.json({ 
        success: true, 
        message: 'Produit supprimé du panier', 
        isGuest: true,
        cart: { items: [], totalItems: 0, totalPrice: 0 } // Structure vide pour que le frontend ne se réinitialise pas
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    // Si utilisateur connecté
    if (req.user) {
      const cart = await Cart.findOne({ user: req.user.id });
      cart.items = [];
      cart.totalItems = 0;
      cart.totalPrice = 0;
      await cart.save();

      res.json({ 
        success: true, 
        message: 'Panier vidé', 
        cart,
        isGuest: false,
        itemCount: 0
      });
    } else {
      // Guest: panier géré côté frontend
      res.json({ 
        success: true, 
        message: 'Panier vidé', 
        isGuest: true 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
