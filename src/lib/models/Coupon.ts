import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  sponsor: mongoose.Types.ObjectId;
  type: 'flat' | 'percentage';
  value: number;
  usageLimit: number;
  isSingleUse: boolean;
  usageCount: number;
  expiryDate: Date;
  isActive: boolean;
  createdAt: Date;
}

const couponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: [true, 'Please add a coupon code'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  sponsor: {
    type: Schema.Types.ObjectId,
    ref: 'Sponsor',
    required: true,
  },
  type: {
    type: String,
    enum: ['flat', 'percentage'],
    default: 'flat',
  },
  value: {
    type: Number,
    required: [true, 'Please add a discount value'],
  },
  usageLimit: {
    type: Number,
    default: 1,
  },
  isSingleUse: {
    type: Boolean,
    default: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please add an expiry date'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Coupon: Model<ICoupon> = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema);
export default Coupon;
