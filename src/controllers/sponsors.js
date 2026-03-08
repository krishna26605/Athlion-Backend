const Sponsor = require('../models/Sponsor');
const Coupon = require('../models/Coupon');

// @desc    Create a sponsor
// @route   POST /api/sponsors
// @access  Private (Admin)
exports.createSponsor = async (req, res, next) => {
    try {
        const sponsor = await Sponsor.create(req.body);
        res.status(201).json({ success: true, data: sponsor });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Get all sponsors
// @route   GET /api/sponsors
// @access  Public
exports.getSponsors = async (req, res, next) => {
    try {
        const sponsors = await Sponsor.find();
        res.status(200).json({ success: true, data: sponsors });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Private (Admin)
exports.createCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ success: true, data: coupon });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Validate a coupon
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res, next) => {
    try {
        const { code, eventId } = req.body;

        const coupon = await Coupon.findOne({ code, isActive: true }).populate('sponsor');

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid or inactive coupon code' });
        }

        if (coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        if (new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        res.status(200).json({
            success: true,
            data: {
                id: coupon._id,
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                sponsor: coupon.sponsor.name
            }
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
// @desc    Delete a sponsor
// @route   DELETE /api/sponsors/:id
// @access  Private (Admin)
exports.deleteSponsor = async (req, res, next) => {
    try {
        const sponsor = await Sponsor.findByIdAndDelete(req.params.id);
        if (!sponsor) {
            return res.status(404).json({ message: 'Sponsor not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
