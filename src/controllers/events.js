const Event = require('../models/Event');
const EarlyBirdConfig = require('../models/EarlyBirdConfig');
const Registration = require('../models/Registration');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
    try {
        const events = await Event.find({ status: { $ne: 'cancelled' } }).sort('-date');
        
        // Enrich events with discount info
        const enrichedEvents = await Promise.all(events.map(async (event) => {
            const ebConfig = await EarlyBirdConfig.findOne({ event: event._id, isActive: true });
            let discountInfo = {
                discountedPrice: event.price,
                discountLabel: null,
                discountType: 'none'
            };

            if (ebConfig) {
                const confirmedCount = await Registration.countDocuments({
                    event: event._id,
                    paymentStatus: 'completed'
                });

                if (confirmedCount < ebConfig.superEarlyLimit) {
                    let discountValue = 0;
                    if (ebConfig.superEarlyDiscountType === 'percentage') {
                        discountValue = Math.round((event.price * ebConfig.superEarlyDiscountValue) / 100);
                        discountInfo.discountLabel = `Super Early Bird (${ebConfig.superEarlyDiscountValue}% off)`;
                    } else {
                        discountValue = Math.min(ebConfig.superEarlyDiscountValue, event.price);
                        discountInfo.discountLabel = `Super Early Bird (₹${ebConfig.superEarlyDiscountValue} off)`;
                    }
                    discountInfo.discountedPrice = Math.max(event.price - discountValue, 0);
                    discountInfo.discountType = 'super_early';
                } else {
                    let discountValue = 0;
                    if (ebConfig.earlyDiscountType === 'percentage') {
                        discountValue = Math.round((event.price * ebConfig.earlyDiscountValue) / 100);
                        discountInfo.discountLabel = `Early Bird (${ebConfig.earlyDiscountValue}% off)`;
                    } else {
                        discountValue = Math.min(ebConfig.earlyDiscountValue, event.price);
                        discountInfo.discountLabel = `Early Bird (₹${ebConfig.earlyDiscountValue} off)`;
                    }
                    discountInfo.discountedPrice = Math.max(event.price - discountValue, 0);
                    discountInfo.discountType = 'early';
                }
            }

            return {
                ...event._doc,
                ...discountInfo
            };
        }));

        res.status(200).json({
            success: true,
            count: enrichedEvents.length,
            data: enrichedEvents,
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

        const ebConfig = await EarlyBirdConfig.findOne({ event: event._id, isActive: true });
        let discountInfo = {
            discountedPrice: event.price,
            discountLabel: null,
            discountType: 'none'
        };

        if (ebConfig) {
            const confirmedCount = await Registration.countDocuments({
                event: event._id,
                paymentStatus: 'completed'
            });

            if (confirmedCount < ebConfig.superEarlyLimit) {
                let discountValue = 0;
                if (ebConfig.superEarlyDiscountType === 'percentage') {
                    discountValue = Math.round((event.price * ebConfig.superEarlyDiscountValue) / 100);
                    discountInfo.discountLabel = `Super Early Bird (${ebConfig.superEarlyDiscountValue}% off)`;
                } else {
                    discountValue = Math.min(ebConfig.superEarlyDiscountValue, event.price);
                    discountInfo.discountLabel = `Super Early Bird (₹${ebConfig.superEarlyDiscountValue} off)`;
                }
                discountInfo.discountedPrice = Math.max(event.price - discountValue, 0);
                discountInfo.discountType = 'super_early';
            } else {
                let discountValue = 0;
                if (ebConfig.earlyDiscountType === 'percentage') {
                    discountValue = Math.round((event.price * ebConfig.earlyDiscountValue) / 100);
                    discountInfo.discountLabel = `Early Bird (${ebConfig.earlyDiscountValue}% off)`;
                } else {
                    discountValue = Math.min(ebConfig.earlyDiscountValue, event.price);
                    discountInfo.discountLabel = `Early Bird (₹${ebConfig.earlyDiscountValue} off)`;
                }
                discountInfo.discountedPrice = Math.max(event.price - discountValue, 0);
                discountInfo.discountType = 'early';
            }
        }

        res.status(200).json({
            success: true,
            data: {
                ...event._doc,
                ...discountInfo
            },
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
