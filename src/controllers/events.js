const Event = require('../models/Event');
const EarlyBirdConfig = require('../models/EarlyBirdConfig');
const Registration = require('../models/Registration');
const eventsCache = require('../utils/eventsCache');

const CACHE_KEY = 'all_events';

// Compute discount fields from aggregated earlyBirdConfig + confirmedCount.
// Matches the exact shape the frontend expects.
function computeDiscountInfo(price, ebConfig, confirmedCount) {
    const info = { discountedPrice: price, discountLabel: null, discountType: 'none' };
    if (!ebConfig) return info;

    const isSuperEarly = confirmedCount < ebConfig.superEarlyLimit;
    const discountType = isSuperEarly ? ebConfig.superEarlyDiscountType : ebConfig.earlyDiscountType;
    const discountValue = isSuperEarly ? ebConfig.superEarlyDiscountValue : ebConfig.earlyDiscountValue;
    const tier = isSuperEarly ? 'Super Early Bird' : 'Early Bird';

    let amount = 0;
    if (discountType === 'percentage') {
        amount = Math.round((price * discountValue) / 100);
        info.discountLabel = `${tier} (${discountValue}% off)`;
    } else {
        amount = Math.min(discountValue, price);
        info.discountLabel = `${tier} (₹${discountValue} off)`;
    }

    info.discountedPrice = Math.max(price - amount, 0);
    info.discountType = isSuperEarly ? 'super_early' : 'early';
    return info;
}

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
    try {
        const cached = eventsCache.get(CACHE_KEY);
        if (cached) {
            console.log('Serving events from cache');
            return res.status(200).json(cached);
        }

        const events = await Event.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $sort: { date: -1 } },
            {
                $lookup: {
                    from: 'earlybirdconfigs',
                    let: { eventId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$event', '$$eventId'] },
                                        { $eq: ['$isActive', true] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'earlyBirdConfig'
                }
            },
            {
                $lookup: {
                    from: 'registrations',
                    let: { eventId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$event', '$$eventId'] },
                                        { $eq: ['$paymentStatus', 'completed'] }
                                    ]
                                }
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: 'registrationCount'
                }
            }
        ]);

        const enrichedEvents = events.map(event => {
            const ebConfig = event.earlyBirdConfig[0] || null;
            const confirmedCount = event.registrationCount[0]?.count ?? 0;
            const discountInfo = computeDiscountInfo(event.price, ebConfig, confirmedCount);

            const { earlyBirdConfig, registrationCount, ...eventDoc } = event;
            return { ...eventDoc, ...discountInfo };
        });

        const response = {
            success: true,
            count: enrichedEvents.length,
            data: enrichedEvents,
        };

        eventsCache.set(CACHE_KEY, response);

        res.status(200).json(response);
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
        const confirmedCount = ebConfig
            ? await Registration.countDocuments({ event: event._id, paymentStatus: 'completed' })
            : 0;

        const discountInfo = computeDiscountInfo(event.price, ebConfig, confirmedCount);

        res.status(200).json({
            success: true,
            data: { ...event._doc, ...discountInfo },
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
        req.body.createdBy = req.user.id;
        const event = await Event.create(req.body);
        eventsCache.del(CACHE_KEY);
        res.status(201).json({ success: true, data: event });
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

        eventsCache.del(CACHE_KEY);

        res.status(200).json({ success: true, data: event });
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

        event.status = 'cancelled';
        await event.save();

        eventsCache.del(CACHE_KEY);

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
