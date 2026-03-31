const express = require('express');
const { handleChat } = require('../controllers/aiController');
const { optionalProtect } = require('../middleware/auth');

const router = express.Router();

router.post('/chat', optionalProtect, handleChat);

module.exports = router;
