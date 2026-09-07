import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyticsVisit extends Document {
  visitorId: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  gymReferralCode: string;
  ipAddress: string;
  userAgent: string;
  convertedToEarlyAccess: boolean;
  convertedUserEmail: string;
  createdAt: Date;
}

const analyticsVisitSchema = new Schema<IAnalyticsVisit>({
  visitorId: {
    type: String,
    required: true,
    index: true,
  },
  utmSource: {
    type: String,
    default: 'direct',
  },
  utmMedium: {
    type: String,
    default: '',
  },
  utmCampaign: {
    type: String,
    default: '',
  },
  gymReferralCode: {
    type: String,
    default: '',
    index: true,
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  convertedToEarlyAccess: {
    type: Boolean,
    default: false,
  },
  convertedUserEmail: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AnalyticsVisit: Model<IAnalyticsVisit> = mongoose.models.AnalyticsVisit || mongoose.model<IAnalyticsVisit>('AnalyticsVisit', analyticsVisitSchema);
export default AnalyticsVisit;
