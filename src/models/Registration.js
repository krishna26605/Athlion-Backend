const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    event: {
        type: mongoose.Schema.ObjectId,
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
        unique: true,
    },
    orderId: {
        type: String,
        required: true, // Razorpay Order ID
    },
    paymentId: {
        type: String,
    },
    amountPaid: {
        type: Number,
        required: true,
    },
    couponUsed: {
        type: mongoose.Schema.ObjectId,
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
        enum: ['advance', 'intermediate'],
    },
    category: {
        type: String,
        default: 'Single',
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

// Compound unique index to prevent duplicate user registration for same event
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
