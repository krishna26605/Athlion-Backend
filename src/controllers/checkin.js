const Registration = require('../models/Registration');

// @desc    Check-in a participant by QR code
// @route   POST /api/checkin
// @access  Private (Staff/Admin)
exports.checkIn = async (req, res, next) => {
    try {
        const { qrCode } = req.body;

        if (!qrCode) {
            return res.status(400).json({ message: 'QR Code is required' });
        }

        const registration = await Registration.findOne({ qrCode }).populate('user event');

        if (!registration) {
            return res.status(404).json({ message: 'Invalid or unregistered QR Code' });
        }

        if (registration.paymentStatus !== 'completed') {
            return res.status(400).json({ message: 'Payment not completed for this registration' });
        }

        if (registration.checkInStatus) {
            return res.status(400).json({
                message: 'Participant already checked-in',
                data: {
                    name: registration.user.name,
                    checkedInAt: registration.verifiedAt // Or add a checkedInAt field
                }
            });
        }

        // Mark as checked-in
        registration.checkInStatus = true;
        await registration.save();

        res.status(200).json({
            success: true,
            message: `Check-in successful for ${registration.user.name}`,
            data: {
                name: registration.user.name,
                event: registration.event.name,
                batch: registration.batchNumber,
                time: registration.batchTime
            }
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Get all registrations for an event (batch-wise)
// @route   GET /api/checkin/event/:eventId
// @access  Private (Staff/Admin)
exports.getEventRegistrations = async (req, res, next) => {
    try {
        const registrations = await Registration.find({
            event: req.params.eventId,
            paymentStatus: 'completed'
        })
            .populate('user', 'name email phone')
            .sort('batchNumber');

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
