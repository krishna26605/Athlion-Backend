import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEarlyAccessLead extends Document {
  fullName: string;
  email: string;
  phone: string;
  leadSource: 'meta_ads' | 'instagram_reel' | 'gym_referral' | 'direct' | 'other';
  gymReferralCode?: string;
  gymName?: string;
  notified: boolean;
  notifiedChannels: string[];
  notifiedAt?: Date;
  convertedToTicket: boolean;
  convertedEventId?: mongoose.Types.ObjectId;
  ticketAmountPaid: number;
  createdAt: Date;
}

const earlyAccessLeadSchema = new Schema<IEarlyAccessLead>({
  fullName: {
    type: String,
    required: [true, 'Please add a full name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    trim: true,
  },
  leadSource: {
    type: String,
    enum: ['meta_ads', 'instagram_reel', 'gym_referral', 'direct', 'other'],
    default: 'direct',
  },
  gymReferralCode: {
    type: String,
    default: '',
    trim: true,
    index: true,
  },
  gymName: {
    type: String,
    default: '',
    trim: true,
  },
  notified: {
    type: Boolean,
    default: false,
  },
  notifiedChannels: {
    type: [String],
    default: [],
  },
  notifiedAt: {
    type: Date,
  },
  convertedToTicket: {
    type: Boolean,
    default: false,
  },
  convertedEventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
  },
  ticketAmountPaid: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const EarlyAccessLead: Model<IEarlyAccessLead> = mongoose.models.EarlyAccessLead || mongoose.model<IEarlyAccessLead>('EarlyAccessLead', earlyAccessLeadSchema);
export default EarlyAccessLead;
