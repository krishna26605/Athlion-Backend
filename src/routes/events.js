const express = require('express');
const {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
} = require('../controllers/events');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(getEvents)
    .post(protect, authorize('admin'), createEvent);

router.route('/:id')
    .get(getEvent)
    .put(protect, authorize('admin'), updateEvent)
    .delete(protect, authorize('admin'), deleteEvent);

module.exports = router;
