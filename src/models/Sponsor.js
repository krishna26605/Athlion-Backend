const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a sponsor name'],
        trim: true,
    },
    logo: {
        type: String, // URL/Path to logo
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
        type: String, // URLs to ad images
    }],
    website: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Sponsor', sponsorSchema);
