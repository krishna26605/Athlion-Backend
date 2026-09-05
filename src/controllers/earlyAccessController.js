const EarlyAccessLead = require('../models/EarlyAccessLead');
const AnalyticsVisit = require('../models/AnalyticsVisit');
const Sponsor = require('../models/Sponsor');

// @desc    Register for Early Access
// @route   POST /api/early-access/register
// @access  Public
exports.registerEarlyAccess = async (req, res, next) => {
    try {
        const { fullName, email, phone, leadSource, gymReferralCode, gymName, visitorId } = req.body;

        if (!fullName || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide full name, email, and phone number',
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        let lead = await EarlyAccessLead.findOne({ email: normalizedEmail });

        if (lead) {
            // Update existing lead with latest info
            lead.fullName = fullName;
            lead.phone = phone;
            if (leadSource) lead.leadSource = leadSource;
            if (gymReferralCode) lead.gymReferralCode = gymReferralCode;
            if (gymName) lead.gymName = gymName;
            await lead.save();
        } else {
            lead = await EarlyAccessLead.create({
                fullName,
                email: normalizedEmail,
                phone,
                leadSource: leadSource || 'direct',
                gymReferralCode: gymReferralCode || '',
                gymName: gymName || '',
            });
        }

        // Mark visit as converted if visitorId supplied
        if (visitorId) {
            await AnalyticsVisit.updateMany(
                { visitorId },
                { $set: { convertedToEarlyAccess: true, convertedUserEmail: normalizedEmail } }
            );
        }

        res.status(201).json({
            success: true,
            data: lead,
            message: 'Successfully registered for Athlion Early Access!',
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Gym Partners for selection (Sponsored Gyms from DB only)
// @route   GET /api/early-access/gyms
// @access  Public
exports.getGymPartners = async (req, res, next) => {
    try {
        // Query all registered sponsors/gym partners from database
        const gymSponsors = await Sponsor.find().select('name description website logo');
        
        const customGyms = gymSponsors.map(g => ({
            code: g.name.toUpperCase().replace(/\s+/g, '-'),
            name: g.name,
            description: g.description || '',
            website: g.website || '',
            logo: g.logo || '',
        }));

        res.status(200).json({
            success: true,
            data: customGyms,
        });
    } catch (err) {
        next(err);
    }
};
