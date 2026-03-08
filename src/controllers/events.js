const Event = require('../models/Event');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
    try {
        const events = await Event.find({ status: { $ne: 'cancelled' } }).sort('-date');
        res.status(200).json({
            success: true,
            count: events.length,
            data: events,
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({
            success: true,
            data: event,
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Admin)
exports.createEvent = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.createdBy = req.user.id;

        const event = await Event.create(req.body);

        res.status(201).json({
            success: true,
            data: event,
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin)
exports.updateEvent = async (req, res, next) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        event = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: event,
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Delete event (Soft delete by changing status)
// @route   DELETE /api/events/:id
// @access  Private (Admin)
exports.deleteEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // We do a soft delete for record keeping
        event.status = 'cancelled';
        await event.save();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
