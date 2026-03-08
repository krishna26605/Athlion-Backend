const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please add a coupon code'],
        unique: true,
        uppercase: true,
        trim: true,
    },
    sponsor: {
        type: mongoose.Schema.ObjectId,
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

module.exports = mongoose.model('Coupon', couponSchema);
