const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Sponsor = require('../models/Sponsor');
const Coupon = require('../models/Coupon');
const EarlyBirdConfig = require('../models/EarlyBirdConfig');
const EarlyAccessLead = require('../models/EarlyAccessLead');
const AnalyticsVisit = require('../models/AnalyticsVisit');
const { sendEarlyAccessNotification } = require('../services/email');
const { sendWhatsAppMessage, sendSMSMessage } = require('../services/whatsapp');
const crypto = require('crypto');
const eventsCache = require('../utils/eventsCache');

const EVENTS_CACHE_KEY = 'all_events';

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

        eventsCache.del(EVENTS_CACHE_KEY);

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
        eventsCache.del(EVENTS_CACHE_KEY);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all Early Access leads with filtering & pagination
// @route   GET /api/admin/early-access/leads
// @access  Private/Admin
exports.getEarlyAccessLeads = async (req, res, next) => {
    try {
        const { search, source, gym, page = 1, limit = 50 } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        if (source) {
            query.leadSource = source;
        }

        if (gym) {
            query.$or = [
                { gymReferralCode: { $regex: gym, $options: 'i' } },
                { gymName: { $regex: gym, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const leads = await EarlyAccessLead.find(query)
            .populate('convertedEventId', 'name date price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await EarlyAccessLead.countDocuments(query);

        res.status(200).json({
            success: true,
            count: leads.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: leads,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Early Access and Traffic Analytics Overview
// @route   GET /api/admin/early-access/analytics
// @access  Private/Admin
exports.getEarlyAccessAnalytics = async (req, res, next) => {
    try {
        const totalVisits = await AnalyticsVisit.countDocuments();
        const totalLeads = await EarlyAccessLead.countDocuments();
        const convertedLeadsToTicket = await EarlyAccessLead.countDocuments({ convertedToTicket: true });

        // Conversion rates
        const visitToLeadRate = totalVisits > 0 ? ((totalLeads / totalVisits) * 100).toFixed(2) : 0;
        const leadToTicketRate = totalLeads > 0 ? ((convertedLeadsToTicket / totalLeads) * 100).toFixed(2) : 0;

        // Revenue from early access leads
        const revenueResult = await EarlyAccessLead.aggregate([
            { $match: { convertedToTicket: true } },
            { $group: { _id: null, totalRevenue: { $sum: '$ticketAmountPaid' } } }
        ]);

        const totalEarlyAccessRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        // Source breakdown
        const sourceBreakdown = await EarlyAccessLead.aggregate([
            { $group: { _id: '$leadSource', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalVisits,
                totalLeads,
                convertedLeadsToTicket,
                visitToLeadRate: parseFloat(visitToLeadRate),
                leadToTicketRate: parseFloat(leadToTicketRate),
                totalEarlyAccessRevenue,
                sourceBreakdown,
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Gym Partner Referral Analytics & 50-member royalty progress
// @route   GET /api/admin/early-access/gym-analytics
// @access  Private/Admin
exports.getGymAnalytics = async (req, res, next) => {
    try {
        const gymStats = await EarlyAccessLead.aggregate([
            { $match: { gymReferralCode: { $ne: '' } } },
            {
                $group: {
                    _id: { code: '$gymReferralCode', name: '$gymName' },
                    totalLeads: { $sum: 1 },
                    ticketBuyers: {
                        $sum: { $cond: [{ $eq: ['$convertedToTicket', true] }, 1, 0] }
                    },
                    totalRevenue: { $sum: '$ticketAmountPaid' }
                }
            },
            { $sort: { totalLeads: -1 } }
        ]);

        const formatted = gymStats.map(item => {
            const registeredCount = item.totalLeads;
            const thresholdReached = registeredCount >= 50;
            return {
                gymCode: item._id.code,
                gymName: item._id.name || item._id.code,
                totalLeads: registeredCount,
                ticketBuyers: item.ticketBuyers,
                totalRevenue: item.totalRevenue,
                thresholdReached,
                progressPercentage: Math.min(100, Math.round((registeredCount / 50) * 100)),
                royaltyEligible: thresholdReached,
            };
        });

        res.status(200).json({
            success: true,
            count: formatted.length,
            data: formatted,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Send Multi-Channel Notification to Early Access Leads for launched event
// @route   POST /api/admin/early-access/notify
// @access  Private/Admin
exports.notifyEarlyAccessLeads = async (req, res, next) => {
    try {
        const { eventId, customMessage, channels } = req.body;

        if (!eventId) {
            return res.status(400).json({ success: false, message: 'Please provide eventId' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const activeChannels = Array.isArray(channels) && channels.length > 0
            ? channels
            : ['email'];

        const leads = await EarlyAccessLead.find({ notified: false });

        let emailSent = 0;
        let smsSent = 0;
        let whatsappSent = 0;

        for (const lead of leads) {
            const usedChannels = [];

            if (activeChannels.includes('email') && lead.email) {
                await sendEarlyAccessNotification(lead, event, customMessage);
                usedChannels.push('email');
                emailSent++;
            }

            if (activeChannels.includes('sms') && lead.phone) {
                const smsBody = `🔥 ATHLiON ALERT: ${event.name} is LIVE! Register now at https://athlion-frontend.vercel.app/events/${event._id}`;
                await sendSMSMessage(lead.phone, smsBody);
                usedChannels.push('sms');
                smsSent++;
            }

            if (activeChannels.includes('whatsapp') && lead.phone) {
                const waBody = `🏆 *ATHLiON EARLY ACCESS ALERT*\n\nHey *${lead.fullName}*!\nThe wait is over. *${event.name}* is officially OPEN for registration.\n\n📅 Date: ${new Date(event.date).toLocaleDateString()}\n📍 Address: ${event.venue?.address || 'TBA'}\n\n👉 Register now: https://athlion-frontend.vercel.app/events/${event._id}`;
                await sendWhatsAppMessage(lead.phone, waBody);
                usedChannels.push('whatsapp');
                whatsappSent++;
            }

            lead.notified = true;
            lead.notifiedChannels = usedChannels;
            lead.notifiedAt = new Date();
            await lead.save();
        }

        res.status(200).json({
            success: true,
            totalNotified: leads.length,
            breakdown: {
                emailSent,
                smsSent,
                whatsappSent,
            },
            message: `Successfully notified ${leads.length} early access leads across chosen channels!`,
        });
    } catch (err) {
        next(err);
    }
};

