const AnalyticsVisit = require('../models/AnalyticsVisit');
const { v4: uuidv4 } = require('uuid');

// @desc    Track website visitor & referral UTM source
// @route   POST /api/analytics/track-visit
// @access  Public
exports.trackVisit = async (req, res, next) => {
    try {
        let { visitorId, utmSource, utmMedium, utmCampaign, gymReferralCode } = req.body;

        if (!visitorId) {
            visitorId = uuidv4();
        }

        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';

        const visit = await AnalyticsVisit.create({
            visitorId,
            utmSource: utmSource || 'direct',
            utmMedium: utmMedium || '',
            utmCampaign: utmCampaign || '',
            gymReferralCode: gymReferralCode || '',
            ipAddress,
            userAgent,
        });

        res.status(201).json({
            success: true,
            visitorId: visit.visitorId,
            message: 'Visit tracked successfully',
        });
    } catch (err) {
        next(err);
    }
};
