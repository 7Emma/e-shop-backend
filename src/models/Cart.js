import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
      },
    ],
    totalItems: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Méthode pour calculer le total
cartSchema.methods.calculateTotal = async function () {
  await this.populate('items.product');
  let totalItems = 0;
  let totalPrice = 0;

  this.items.forEach((item) => {
    totalItems += item.quantity;
    totalPrice += item.product.price * item.quantity;
  });

  this.totalItems = totalItems;
  this.totalPrice = totalPrice;
  return this;
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
