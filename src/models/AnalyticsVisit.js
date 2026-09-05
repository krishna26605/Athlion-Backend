const mongoose = require('mongoose');

const analyticsVisitSchema = new mongoose.Schema({
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

module.exports = mongoose.model('AnalyticsVisit', analyticsVisitSchema);
