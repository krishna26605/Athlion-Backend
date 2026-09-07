import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEarlyBirdConfig extends Document {
  event: mongoose.Types.ObjectId;
  superEarlyLimit: number;
  superEarlyDiscountType: 'flat' | 'percentage';
  superEarlyDiscountValue: number;
  earlyDiscountType: 'flat' | 'percentage';
  earlyDiscountValue: number;
  isActive: boolean;
  createdAt: Date;
}

const earlyBirdConfigSchema = new Schema<IEarlyBirdConfig>({
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    unique: true,
  },
  superEarlyLimit: {
    type: Number,
    required: [true, 'Please set the super early bird registration limit'],
    min: 1,
  },
  superEarlyDiscountType: {
    type: String,
    enum: ['flat', 'percentage'],
    required: true,
  },
  superEarlyDiscountValue: {
    type: Number,
    required: [true, 'Please set the super early bird discount value'],
    min: 0,
  },
  earlyDiscountType: {
    type: String,
    enum: ['flat', 'percentage'],
    required: true,
  },
  earlyDiscountValue: {
    type: Number,
    required: [true, 'Please set the early bird discount value'],
    min: 0,
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

const EarlyBirdConfig: Model<IEarlyBirdConfig> = mongoose.models.EarlyBirdConfig || mongoose.model<IEarlyBirdConfig>('EarlyBirdConfig', earlyBirdConfigSchema);
export default EarlyBirdConfig;
