const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add an event name'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
    },
    venue: {
        address: {
            type: String,
            required: [true, 'Please add a venue address'],
        },
        googleMapsLink: {
            type: String,
            required: [true, 'Please add a Google Maps link'],
        },
    },
    date: {
        type: Date,
        required: [true, 'Please add an event date'],
    },
    startTime: {
        type: String,
        required: [true, 'Please add a start time (e.g., 06:00)'],
    },
    batchSize: {
        type: Number,
        default: 10,
    },
    gapBetweenBatches: {
        type: Number,
        required: [true, 'Please add time gap between batches in minutes'],
    },
    maxParticipants: {
        type: Number,
        required: [true, 'Please add maximum total participants'],
    },
    currentParticipants: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming',
    },
    price: {
        type: Number,
        required: [true, 'Please add a registration price'],
        default: 0,
    },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=2085&auto=format&fit=crop',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
});

module.exports = mongoose.model('Event', eventSchema);
