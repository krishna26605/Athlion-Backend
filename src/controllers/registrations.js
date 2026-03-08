const Event = require('../models/Event');
const Registration = require('../models/Registration');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');

// @desc    Step 1: Create a pending registration and Razorpay order
// @route   POST /api/registrations/book/:eventId
// @access  Private
exports.bookEvent = async (req, res, next) => {
    const { level, height, weight, category, batchTime } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const event = await Event.findById(req.params.eventId).session(session);

        if (!event) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.status !== 'upcoming') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Event is not open for registration' });
        }

        if (event.currentParticipants >= event.maxParticipants) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Event is fully booked' });
        }

        // --- ATHLION WAVE CAPACITY CHECK ---
        if (batchTime) {
            const waveCount = await Registration.countDocuments({
                event: event._id,
                batchTime,
                paymentStatus: 'completed'
            }).session(session);

            if (waveCount >= 30) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: `The ${batchTime} wave is sold out. Please select another timing.` });
            }
        }

        // Check if user already registered
        const existingReg = await Registration.findOne({
            user: req.user.id,
            event: event._id,
        }).session(session);

        if (existingReg && existingReg.paymentStatus === 'completed') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'You are already registered for this event' });
        }

        // Create Razorpay Order
        const options = {
            amount: event.price * 100, // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${Date.now()}_${req.user.id.substring(0, 5)}`,
        };

        const order = await razorpay.orders.create(options);

        // If registration exists but pending, update it, otherwise create new
        let registration;
        if (existingReg) {
            existingReg.orderId = order.id;
            existingReg.amountPaid = event.price;
            existingReg.level = level;
            existingReg.height = height;
            existingReg.weight = weight;
            existingReg.category = category || 'Single';
            existingReg.batchTime = batchTime;
            // Generate temporary verification code (will be overwritten on verify)
            existingReg.verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
            await existingReg.save({ session });
            registration = existingReg;
        } else {
            registration = await Registration.create([{
                user: req.user.id,
                event: event._id,
                orderId: order.id,
                amountPaid: event.price,
                paymentStatus: 'pending',
                level,
                height,
                weight,
                category: category || 'Single',
                batchTime,
                verificationCode: Math.floor(1000 + Math.random() * 9000).toString()
            }], { session });
            registration = registration[0];
        }

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            order,
            registrationId: registration._id,
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: err.message });
    }
};

// @desc    Step 2: Verify Razorpay payment and assign batch atomically
// @route   POST /api/registrations/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Verify Signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Atomic Batch Allocation
        const registration = await Registration.findOne({ orderId: razorpay_order_id }).session(session);
        if (!registration) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Registration not found' });
        }

        if (registration.paymentStatus === 'completed') {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({ success: true, message: 'Already verified' });
        }

        const event = await Event.findById(registration.event).session(session);

        // Final capacity check
        if (event.currentParticipants >= event.maxParticipants) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Event reached maximum capacity during payment' });
        }

        // Calculate Batch
        const confirmedCount = await Registration.countDocuments({
            event: event._id,
            paymentStatus: 'completed'
        }).session(session);

        const batchNumber = Math.floor(confirmedCount / event.batchSize) + 1;
        const minutesToAdd = (batchNumber - 1) * event.gapBetweenBatches;

        // Calculate batch time
        const [startHour, startMin] = event.startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(startHour, startMin, 0, 0);
        date.setMinutes(date.getMinutes() + minutesToAdd);
        const batchTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        // Generate final verification code
        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Update Registration
        registration.paymentStatus = 'completed';
        registration.paymentId = razorpay_payment_id;
        registration.verifiedAt = Date.now();
        registration.verificationCode = verificationCode;
        // Generate a simple QR code data string
        registration.qrCode = `ATHLION-${event._id}-${registration._id}-${verificationCode}`;

        await registration.save({ session });

        // Update Event current participants
        event.currentParticipants += 1;
        await event.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Send WhatsApp Notification (Async)
        const user = await req.user; // User is already in req.user from protect middleware
        const body = `Hi ${user.name}! Your registration for ${event.name} is confirmed. \nSlot: ${batchTime}\nBatch: ${batchNumber}\nVenue: ${event.venue.address}\nGoogle Maps: ${event.venue.googleMapsLink}\nRegistration ID: ${registration.qrCode}\nSee you there!`;

        // We don't await this to avoid blocking the response, or we can await it if we want to ensure it's sent
        const sendWhatsAppMessage = require('../services/whatsapp');
        sendWhatsAppMessage(user.phone, body).catch(err => console.error('WhatsApp Fail:', err.message));

        res.status(200).json({
            success: true,
            data: registration,
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: err.message });
    }
};

// @desc    Get user's confirmed registrations
// @route   GET /api/registrations/my
// @access  Private
exports.getMyRegistrations = async (req, res, next) => {
    try {
        const registrations = await Registration.find({
            user: req.user.id,
            paymentStatus: 'completed'
        }).populate('event');

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations,
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Get all registrations (Admin only)
// @route   GET /api/registrations/admin/all
// @access  Private/Admin
exports.getAllRegistrations = async (req, res, next) => {
    try {
        const registrations = await Registration.find({
            paymentStatus: 'completed'
        })
            .populate('user', 'name email phone')
            .populate('event', 'name')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations,
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Verify athlete at venue (Admin only)
// @route   POST /api/registrations/admin/verify/:id
// @access  Private/Admin
exports.verifyAthlete = async (req, res, next) => {
    try {
        const registration = await Registration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        if (registration.paymentStatus !== 'completed') {
            return res.status(400).json({ message: 'Registration payment not completed' });
        }

        registration.checkInStatus = true;
        registration.verifiedAt = Date.now();
        await registration.save();

        res.status(200).json({
            success: true,
            message: 'Athlete verified successfully',
            data: registration
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
