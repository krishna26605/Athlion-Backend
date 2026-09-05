const mongoose = require('mongoose');

const earlyAccessLeadSchema = new mongoose.Schema({
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
        type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('EarlyAccessLead', earlyAccessLeadSchema);
