import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    trackingCode: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto-delete expired OTPs
    },
  },
  { timestamps: true }
);

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
