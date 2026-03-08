const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Sponsor = require('../models/Sponsor');
const Coupon = require('../models/Coupon');
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
