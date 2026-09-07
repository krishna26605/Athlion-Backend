import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISponsor extends Document {
  name: string;
  logo?: string;
  description: string;
  type: 'Sponsor' | 'Gym Partner' | 'Run Club';
  adImages?: string[];
  website?: string;
  createdAt: Date;
}

const sponsorSchema = new Schema<ISponsor>({
  name: {
    type: String,
    required: [true, 'Please add a sponsor name'],
    trim: true,
  },
  logo: {
    type: String,
  },
  description: {
    type: String,
    required: [true, 'Please add a sponsor description'],
  },
  type: {
    type: String,
    enum: ['Sponsor', 'Gym Partner', 'Run Club'],
    default: 'Sponsor',
  },
  adImages: [{
    type: String,
  }],
  website: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Sponsor: Model<ISponsor> = mongoose.models.Sponsor || mongoose.model<ISponsor>('Sponsor', sponsorSchema);
export default Sponsor;
