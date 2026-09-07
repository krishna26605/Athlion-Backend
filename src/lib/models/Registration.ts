import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRegistration extends Document {
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  batchNumber?: number;
  batchTime?: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  checkInStatus: boolean;
  qrCode?: string;
  orderId: string;
  paymentId?: string;
  amountPaid: number;
  couponUsed?: mongoose.Types.ObjectId;
  height?: number;
  weight?: number;
  level?: 'elite' | 'classical';
  category: string;
  discountType: 'super_early' | 'early' | 'coupon' | 'none';
  discountValue: number;
  discountLabel: string;
  verificationCode: string;
  createdAt: Date;
  verifiedAt?: Date;
}

const registrationSchema = new Schema<IRegistration>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  batchNumber: {
    type: Number,
  },
  batchTime: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  checkInStatus: {
    type: Boolean,
    default: false,
  },
  qrCode: {
    type: String,
  },
  orderId: {
    type: String,
    required: true,
  },
  paymentId: {
    type: String,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  couponUsed: {
    type: Schema.Types.ObjectId,
    ref: 'Coupon',
  },
  height: {
    type: Number,
  },
  weight: {
    type: Number,
  },
  level: {
    type: String,
    enum: ['elite', 'classical'],
  },
  category: {
    type: String,
    default: 'Single',
  },
  discountType: {
    type: String,
    enum: ['super_early', 'early', 'coupon', 'none'],
    default: 'none',
  },
  discountValue: {
    type: Number,
    default: 0,
  },
  discountLabel: {
    type: String,
    default: '',
  },
  verificationCode: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  verifiedAt: {
    type: Date,
  },
});

registrationSchema.index({ user: 1, event: 1 }, { unique: true });
registrationSchema.index({ event: 1 });
registrationSchema.index(
  { qrCode: 1 },
  { unique: true, partialFilterExpression: { qrCode: { $type: 'string' } } }
);

const Registration: Model<IRegistration> = mongoose.models.Registration || mongoose.model<IRegistration>('Registration', registrationSchema);

export async function fixRegistrationIndexes() {
  try {
    const collection = mongoose.connection.collection('registrations');
    if (!collection) return;

    // Clean up any existing documents where qrCode is explicit null
    await collection.updateMany({ qrCode: null }, { $unset: { qrCode: '' } });

    const indexes = await collection.indexes();
    const qrIndex = indexes.find((i: any) => i.name === 'qrCode_1');
    if (qrIndex && (!qrIndex.partialFilterExpression || !qrIndex.partialFilterExpression.qrCode)) {
      console.log('🔄 Dropping legacy non-partial qrCode_1 index...');
      await collection.dropIndex('qrCode_1');
      await Registration.syncIndexes();
      console.log('✅ Partial filter qrCode_1 index recreated successfully.');
    }
  } catch (e: any) {
    // Ignore if collection doesn't exist yet
  }
}

export default Registration;
