import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Guest orders have no user
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: false, // Guest orders may not have product refs
        },
        name: {
          type: String,
          required: false, // For guest orders
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      street: String,
      city: String,
      zipCode: String,
      country: String,
      phone: String,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    notes: String,
    trackingNumber: String,
    trackingCode: {
      type: String,
      unique: true,
      sparse: true,
      required: true,
      minlength: 8,
      maxlength: 12,
    },
    stripeSessionId: String,
    stripePaymentIntentId: String,
    receivedAt: Date,
    isReceived: {
      type: Boolean,
      default: false,
    },
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      ratedAt: Date,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
