import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du produit est requis'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    description: {
      type: String,
      required: [true, 'La description est requise'],
      maxlength: [5000, 'La description ne peut pas dépasser 5000 caractères'],
    },
    category: {
      type: String,
      required: [true, 'La catégorie est requise'],
      enum: ['Vêtements', 'Chaussures', 'Montres', 'Bijoux', 'Beauté'],
    },
    price: {
      type: Number,
      required: [true, 'Le prix est requis'],
      min: [0, 'Le prix doit être positif'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Le prix original doit être positif'],
    },
    image: {
      type: String,
      required: [true, 'Une image est requise'],
    },
    images: [
      {
        type: String,
      },
    ],
    stock: {
      type: Number,
      required: [true, 'Le stock est requis'],
      min: [0, 'Le stock doit être positif'],
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index pour les recherches
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

// Hook pre-save pour générer un SKU unique si vide
productSchema.pre('save', function() {
  if (!this.sku || (typeof this.sku === 'string' && this.sku.trim() === '')) {
    // Générer un SKU basé sur le nom et un timestamp
    const timestamp = Date.now();
    const sanitizedName = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .substring(0, 10);
    this.sku = `${sanitizedName}-${timestamp}`;
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
