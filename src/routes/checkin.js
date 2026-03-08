const express = require('express');
const { checkIn, getEventRegistrations } = require('../controllers/checkin');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('staff', 'admin'), checkIn);
router.get('/event/:eventId', protect, authorize('staff', 'admin'), getEventRegistrations);

module.exports = router;
