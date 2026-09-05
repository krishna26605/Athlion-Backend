const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a blog title'],
        trim: true,
    },
    slug: {
        type: String,
        required: [true, 'Please add a blog slug'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    content: {
        type: String,
        required: [true, 'Please add blog content'],
    },
    excerpt: {
        type: String,
        required: [true, 'Please add a short excerpt for SEO summary'],
        trim: true,
    },
    category: {
        type: String,
        default: 'Functional Fitness',
        trim: true,
    },
    coverImage: {
        type: String,
        default: '',
    },
    author: {
        type: String,
        default: 'Athlion Team',
        trim: true,
    },
    readTime: {
        type: String,
        default: '5 min read',
        trim: true,
    },
    tags: [{
        type: String,
        trim: true,
    }],
    metaTitle: {
        type: String,
        trim: true,
    },
    metaDescription: {
        type: String,
        trim: true,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Blog', blogSchema);
