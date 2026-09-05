const express = require('express');
const { registerEarlyAccess, getGymPartners } = require('../controllers/earlyAccessController');

const router = express.Router();

router.post('/register', registerEarlyAccess);
router.get('/gyms', getGymPartners);

module.exports = router;
