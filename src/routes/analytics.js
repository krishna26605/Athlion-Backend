const express = require('express');
const { trackVisit } = require('../controllers/analyticsController');

const router = express.Router();

router.post('/track-visit', trackVisit);

module.exports = router;
