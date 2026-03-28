const mongoose = require('mongoose');

const earlyBirdConfigSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.ObjectId,
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

module.exports = mongoose.model('EarlyBirdConfig', earlyBirdConfigSchema);
