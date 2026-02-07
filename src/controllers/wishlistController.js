import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

export const getWishlist = async (req, res) => {
  try {
    // Si utilisateur connecté
    if (req.user) {
      let wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
        path: 'products',
        select: '_id name description category price originalPrice image images stock rating reviews sku isActive createdAt'
      });
      if (!wishlist) {
        wishlist = new Wishlist({ user: req.user.id, products: [] });
        await wishlist.save();
      }
      
      // Ajouter le champ inStock à chaque produit
      const productsWithInStock = wishlist.products.map(product => ({
        ...product.toObject(),
        inStock: product.stock > 0
      }));
      
      const wishlistData = {
        ...wishlist.toObject(),
        products: productsWithInStock
      };
      
      res.json({ 
        success: true, 
        wishlist: wishlistData,
        isGuest: false,
        productCount: wishlist.products.length 
      });
    } else {
      // Guest: retourner une wishlist vide structurée (pas null)
      res.json({ 
        success: true, 
        wishlist: { products: [] }, 
        isGuest: true,
        productCount: 0,
        message: 'Les données du guest sont gérées en localStorage côté frontend' 
      });
    }
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

    // Si utilisateur connecté
    if (req.user) {
      let wishlist = await Wishlist.findOne({ user: req.user.id });
      if (!wishlist) {
        wishlist = new Wishlist({ user: req.user.id, products: [req.params.productId] });
      } else if (!wishlist.products.includes(req.params.productId)) {
        wishlist.products.push(req.params.productId);
      }

      await wishlist.save();
      await wishlist.populate({
        path: 'products',
        select: '_id name description category price originalPrice image images stock rating reviews sku isActive createdAt'
      });

      // Ajouter le champ inStock à chaque produit
      const productsWithInStock = wishlist.products.map(product => ({
        ...product.toObject(),
        inStock: product.stock > 0
      }));
      
      const wishlistData = {
        ...wishlist.toObject(),
        products: productsWithInStock
      };

      res.json({ 
        success: true, 
        message: 'Produit ajouté à la wishlist', 
        wishlist: wishlistData, 
        isGuest: false,
        productCount: wishlist.products.length
      });
    } else {
      // Guest: retourner le produit ajouté pour le localStorage
      res.json({ 
        success: true, 
        message: 'Produit ajouté à la wishlist (gestion côté frontend)', 
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
          inStock: product.stock > 0,
          rating: product.rating,
          reviews: product.reviews
        },
        isGuest: true
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    // Si utilisateur connecté
    if (req.user) {
      const wishlist = await Wishlist.findOne({ user: req.user.id });
      if (!wishlist) {
        return res.status(404).json({ success: false, message: 'Wishlist non trouvée' });
      }

      wishlist.products = wishlist.products.filter((id) => id.toString() !== req.params.productId);
      await wishlist.save();
      await wishlist.populate({
        path: 'products',
        select: '_id name description category price originalPrice image images stock rating reviews sku isActive createdAt'
      });

      // Ajouter le champ inStock à chaque produit
      const productsWithInStock = wishlist.products.map(product => ({
        ...product.toObject(),
        inStock: product.stock > 0
      }));
      
      const wishlistData = {
        ...wishlist.toObject(),
        products: productsWithInStock
      };

      res.json({ 
        success: true, 
        message: 'Produit supprimé de la wishlist', 
        wishlist: wishlistData,
        productCount: wishlist.products.length
      });
    } else {
      // Guest: wishlist géré côté frontend
      res.json({ 
        success: true, 
        message: 'Produit supprimé de la wishlist', 
        wishlist: { products: [] }, 
        isGuest: true,
        productCount: 0
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkWishlist = async (req, res) => {
  try {
    // Si utilisateur connecté
    if (req.user) {
      const wishlist = await Wishlist.findOne({ user: req.user.id });
      const isWishlisted = wishlist && wishlist.products.includes(req.params.productId);
      res.json({ success: true, isWishlisted, isGuest: false });
    } else {
      // Guest: wishlist géré côté frontend (localStorage)
      res.json({ success: true, isWishlisted: false, isGuest: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
