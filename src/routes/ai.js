const express = require('express');
const rateLimit = require('express-rate-limit');
const { handleChat } = require('../controllers/aiController');
const { optionalProtect } = require('../middleware/auth');

const router = express.Router();

const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many AI requests, please slow down and try again in a minute' },
});

router.post('/chat', aiLimiter, optionalProtect, handleChat);

module.exports = router;
