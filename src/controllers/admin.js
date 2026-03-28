const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Sponsor = require('../models/Sponsor');
const Coupon = require('../models/Coupon');
const EarlyBirdConfig = require('../models/EarlyBirdConfig');
const crypto = require('crypto');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        next(err);
    }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalEvents = await Event.countDocuments();
        const totalRegistrations = await Registration.countDocuments();
        const totalRevenue = await Registration.aggregate([
            { $match: { status: 'confirmed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalEvents,
                totalRegistrations,
                revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Bulk generate coupons for a sponsor/partner
// @route   POST /api/admin/coupons/bulk-generate
// @access  Private/Admin
exports.bulkGenerateCoupons = async (req, res, next) => {
    try {
        const { sponsorId, count, value, type, prefix, expiryDate } = req.body;

        if (!sponsorId || !count || !value || !expiryDate) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const coupons = [];
        for (let i = 0; i < count; i++) {
            const code = `${prefix || 'ATH'}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
            coupons.push({
                code,
                sponsor: sponsorId,
                value,
                type: type || 'flat',
                expiryDate,
                usageLimit: 1,
                isSingleUse: true
            });
        }

        await Coupon.insertMany(coupons);

        res.status(201).json({
            success: true,
            count: coupons.length,
            message: `${count} coupons generated successfully`
        });
    } catch (err) {
        next(err);
    }
};
// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Private/Admin
exports.getCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.find().populate('sponsor').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch (err) {
        next(err);
    }
};

// @desc    Create or update early bird config for an event
// @route   POST /api/admin/early-bird
// @access  Private/Admin
exports.createOrUpdateEarlyBirdConfig = async (req, res, next) => {
    try {
        const {
            eventId,
            superEarlyLimit,
            superEarlyDiscountType,
            superEarlyDiscountValue,
            earlyDiscountType,
            earlyDiscountValue,
            isActive
        } = req.body;

        if (!eventId || !superEarlyLimit || !superEarlyDiscountType || superEarlyDiscountValue == null || !earlyDiscountType || earlyDiscountValue == null) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Validate percentage values
        if (superEarlyDiscountType === 'percentage' && superEarlyDiscountValue > 100) {
            return res.status(400).json({ success: false, message: 'Super early percentage cannot exceed 100%' });
        }
        if (earlyDiscountType === 'percentage' && earlyDiscountValue > 100) {
            return res.status(400).json({ success: false, message: 'Early percentage cannot exceed 100%' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const config = await EarlyBirdConfig.findOneAndUpdate(
            { event: eventId },
            {
                event: eventId,
                superEarlyLimit,
                superEarlyDiscountType,
                superEarlyDiscountValue,
                earlyDiscountType,
                earlyDiscountValue,
                isActive: isActive !== undefined ? isActive : true,
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: config });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all early bird configs
// @route   GET /api/admin/early-bird
// @access  Private/Admin
exports.getAllEarlyBirdConfigs = async (req, res, next) => {
    try {
        const configs = await EarlyBirdConfig.find().populate('event', 'name date price status').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: configs.length, data: configs });
    } catch (err) {
        next(err);
    }
};

// @desc    Get early bird config for a specific event
// @route   GET /api/admin/early-bird/:eventId
// @access  Private/Admin
exports.getEarlyBirdConfig = async (req, res, next) => {
    try {
        const config = await EarlyBirdConfig.findOne({ event: req.params.eventId }).populate('event', 'name date price');
        if (!config) {
            return res.status(404).json({ success: false, message: 'No early bird config found for this event' });
        }
        res.status(200).json({ success: true, data: config });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete early bird config
// @route   DELETE /api/admin/early-bird/:eventId
// @access  Private/Admin
exports.deleteEarlyBirdConfig = async (req, res, next) => {
    try {
        const config = await EarlyBirdConfig.findOneAndDelete({ event: req.params.eventId });
        if (!config) {
            return res.status(404).json({ success: false, message: 'No early bird config found for this event' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
