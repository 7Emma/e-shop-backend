import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    res.json({ success: true, reviews, avgRating, count: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;

    // Vérifier si l'utilisateur a acheté le produit
    const order = await Order.findOne({
      user: req.user.id,
      'items.product': productId,
    });

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.id,
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà évalué ce produit' });
    }

    const review = new Review({
      product: productId,
      user: req.user.id,
      rating,
      title,
      comment,
      isVerifiedPurchase: !!order,
    });

    await review.save();

    // Mettre à jour la note moyenne du produit
    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviews: allReviews.length,
    });

    res.status(201).json({ success: true, message: 'Avis publié', review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    review.rating = req.body.rating || review.rating;
    review.title = req.body.title || review.title;
    review.comment = req.body.comment || review.comment;

    await review.save();

    // Mettre à jour la note du produit
    const allReviews = await Review.find({ product: review.product });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Product.findByIdAndUpdate(review.product, {
      rating: Math.round(avgRating * 10) / 10,
    });

    res.json({ success: true, message: 'Avis mis à jour', review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);

    // Mettre à jour la note du produit
    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.length > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
      : 0;

    await Product.findByIdAndUpdate(productId, {
      rating: allReviews.length > 0 ? Math.round(avgRating * 10) / 10 : 0,
      reviews: allReviews.length,
    });

    res.json({ success: true, message: 'Avis supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
