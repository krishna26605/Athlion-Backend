const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Coupon = require('../models/Coupon');
const EarlyBirdConfig = require('../models/EarlyBirdConfig');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * Helper: Calculate discount for a user based on early bird config and coupon status
 */
const calculateDiscount = async (eventId, eventPrice, couponCode, session) => {
    let discount = { type: 'none', value: 0, label: '', couponId: null };

    // If user has a coupon code, validate and use it (takes priority, excludes early bird)
    if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true }).session(session);

        if (!coupon) {
            return { error: 'Invalid or inactive coupon code' };
        }
        if (coupon.usageCount >= coupon.usageLimit) {
            return { error: 'Coupon usage limit reached' };
        }
        if (new Date(coupon.expiryDate) < new Date()) {
            return { error: 'Coupon has expired' };
        }

        let discountAmount = 0;
        if (coupon.type === 'percentage') {
            discountAmount = Math.round((eventPrice * coupon.value) / 100);
            discount.label = `Coupon ${coupon.code} (${coupon.value}% off)`;
        } else {
            discountAmount = Math.min(coupon.value, eventPrice);
            discount.label = `Coupon ${coupon.code} (₹${coupon.value} off)`;
        }

        discount.type = 'coupon';
        discount.value = discountAmount;
        discount.couponId = coupon._id;
        return discount;
    }

    // No coupon code → check early bird config
    const ebConfig = await EarlyBirdConfig.findOne({ event: eventId, isActive: true }).session(session);
    if (!ebConfig) {
        return discount; // No early bird config → no discount
    }

    // Count confirmed registrations for this event
    const confirmedCount = await Registration.countDocuments({
        event: eventId,
        paymentStatus: 'completed'
    }).session(session);

    if (confirmedCount < ebConfig.superEarlyLimit) {
        // Super early bird discount
        let discountAmount = 0;
        if (ebConfig.superEarlyDiscountType === 'percentage') {
            discountAmount = Math.round((eventPrice * ebConfig.superEarlyDiscountValue) / 100);
            discount.label = `Super Early Bird (${ebConfig.superEarlyDiscountValue}% off)`;
        } else {
            discountAmount = Math.min(ebConfig.superEarlyDiscountValue, eventPrice);
            discount.label = `Super Early Bird (₹${ebConfig.superEarlyDiscountValue} off)`;
        }
        discount.type = 'super_early';
        discount.value = discountAmount;
    } else {
        // Early bird discount (for all remaining users)
        let discountAmount = 0;
        if (ebConfig.earlyDiscountType === 'percentage') {
            discountAmount = Math.round((eventPrice * ebConfig.earlyDiscountValue) / 100);
            discount.label = `Early Bird (${ebConfig.earlyDiscountValue}% off)`;
        } else {
            discountAmount = Math.min(ebConfig.earlyDiscountValue, eventPrice);
            discount.label = `Early Bird (₹${ebConfig.earlyDiscountValue} off)`;
        }
        discount.type = 'early';
        discount.value = discountAmount;
    }

    return discount;
};

// @desc    Step 1: Create a pending registration and Razorpay order
// @route   POST /api/registrations/book/:eventId
// @access  Private
exports.bookEvent = async (req, res, next) => {
    const { level, height, weight, category, batchTime, couponCode } = req.body;
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

        // --- DISCOUNT CALCULATION ---
        const discount = await calculateDiscount(event._id, event.price, couponCode, session);

        if (discount.error) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: discount.error });
        }

        const finalPrice = Math.max(event.price - discount.value, 0);

        // Create Razorpay Order with discounted amount
        const options = {
            amount: finalPrice * 100, // amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}_${req.user.id.substring(0, 5)}`,
        };

        const order = await razorpay.orders.create(options);

        // If registration exists but pending, update it, otherwise create new
        let registration;
        if (existingReg) {
            existingReg.orderId = order.id;
            existingReg.amountPaid = finalPrice;
            existingReg.level = level;
            existingReg.height = height;
            existingReg.weight = weight;
            existingReg.category = category || 'Single';
            existingReg.batchTime = batchTime;
            existingReg.discountType = discount.type;
            existingReg.discountValue = discount.value;
            existingReg.discountLabel = discount.label;
            existingReg.couponUsed = discount.couponId || undefined;
            existingReg.verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
            await existingReg.save({ session });
            registration = existingReg;
        } else {
            registration = await Registration.create([{
                user: req.user.id,
                event: event._id,
                orderId: order.id,
                amountPaid: finalPrice,
                paymentStatus: 'pending',
                level,
                height,
                weight,
                category: category || 'Single',
                batchTime,
                discountType: discount.type,
                discountValue: discount.value,
                discountLabel: discount.label,
                couponUsed: discount.couponId || undefined,
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
            discount: {
                type: discount.type,
                value: discount.value,
                label: discount.label,
            },
            originalPrice: event.price,
            finalPrice,
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: err.message });
    }
};

/**
 * Helper: Finalize a registration after payment (or test bypass)
 * Assigns batch, increments count, and sends notifications
 */
const finalizeRegistration = async (req, res, registration, event, paymentId, session) => {
    // Atomic Batch Allocation
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
    registration.paymentId = paymentId || `test_${Date.now()}`;
    registration.verifiedAt = Date.now();
    registration.verificationCode = verificationCode;
    registration.qrCode = `ATHLION-${event._id}-${registration._id}-${verificationCode}`;

    if (registration.couponUsed) {
        await Coupon.findByIdAndUpdate(registration.couponUsed, {
            $inc: { usageCount: 1 }
        }).session(session);
    }

    await registration.save({ session });

    // Update Event current participants
    event.currentParticipants += 1;
    await event.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send WhatsApp Notification (Syncing for better testing error catch)
    const user = await req.user;
    const body = `Hi ${user.name}! Your registration for ${event.name} is confirmed. \nSlot: ${batchTime}\nBatch: ${batchNumber}\nVenue: ${event.venue.address}\nGoogle Maps: ${event.venue.googleMapsLink}\nRegistration ID: ${registration.qrCode}\nSee you there!`;

    const sendWhatsAppMessage = require('../services/whatsapp');
    let waSuccess = true;
    try {
        await sendWhatsAppMessage(user.phone, body);
    } catch (err) {
        console.error('WhatsApp Fail:', err.message);
        waSuccess = false;
    }

    // Send Email Confirmation (Syncing for better testing error catch)
    const { sendRegistrationConfirmation } = require('../services/email');
    let emailSuccess = true;
    try {
        await sendRegistrationConfirmation(user, event, registration);
    } catch (err) {
        console.error('Email Fail:', err.message);
        emailSuccess = false;
    }

    return res.status(200).json({
        success: true,
        data: registration,
        notifications: {
            whatsapp: waSuccess,
            email: emailSuccess
        }
    });
};

// @desc    Step 2: Verify Razorpay payment and assign batch atomically
// @route   POST /api/registrations/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Verify Signature (Only if not in development or if signature is present)
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

        if (event.currentParticipants >= event.maxParticipants) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Event reached maximum capacity during payment' });
        }

        await finalizeRegistration(req, res, registration, event, razorpay_payment_id, session);
    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: err.message });
    }
};

// @desc    Step 1 (Test): Directly register for testing purpose (No Payment)
// @route   POST /api/registrations/test-register/:eventId
// @access  Private (Only if process.env.NODE_ENV === 'development')
exports.testRegister = async (req, res, next) => {
    // SECURITY: Only allow this in development mode
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: 'Forbidden. This endpoint is only available in development mode.' });
    }

    const { level, height, weight, category, batchTime, couponCode } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const event = await Event.findById(req.params.eventId).session(session);

        if (!event) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Event not found' });
        }

        const existingReg = await Registration.findOne({
            user: req.user.id,
            event: event._id,
            paymentStatus: 'completed'
        }).session(session);

        if (existingReg) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        // Calculate discount (even for test mode to see it in db)
        const discount = await calculateDiscount(event._id, event.price, couponCode, session);

        const registration = await Registration.create([{
            user: req.user.id,
            event: event._id,
            orderId: `test_order_${Date.now()}`,
            amountPaid: Math.max(event.price - (discount.value || 0), 0),
            paymentStatus: 'pending',
            level,
            height,
            weight,
            category: category || 'Single',
            batchTime,
            discountType: discount.type,
            discountValue: discount.value,
            discountLabel: discount.label,
            couponUsed: discount.couponId || undefined,
            verificationCode: 'TEST'
        }], { session });

        await finalizeRegistration(req, res, registration[0], event, `test_pay_${Date.now()}`, session);
    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: err.message });
    }
};

// @desc    Check what discount a user would get for an event
// @route   GET /api/registrations/check-discount/:eventId
// @access  Private
exports.checkDiscount = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user already has a completed registration with a coupon for this event
        const existingRegWithCoupon = await Registration.findOne({
            user: req.user.id,
            event: event._id,
            paymentStatus: 'completed',
            couponUsed: { $exists: true, $ne: null }
        });

        if (existingRegWithCoupon) {
            return res.status(200).json({
                success: true,
                discount: { type: 'none', value: 0, label: 'Already registered with a coupon' },
                originalPrice: event.price,
                finalPrice: event.price,
            });
        }

        // Check early bird config for this event
        const ebConfig = await EarlyBirdConfig.findOne({ event: event._id, isActive: true });
        if (!ebConfig) {
            return res.status(200).json({
                success: true,
                discount: { type: 'none', value: 0, label: '' },
                originalPrice: event.price,
                finalPrice: event.price,
            });
        }

        const confirmedCount = await Registration.countDocuments({
            event: event._id,
            paymentStatus: 'completed'
        });

        let discount = { type: 'none', value: 0, label: '' };

        if (confirmedCount < ebConfig.superEarlyLimit) {
            if (ebConfig.superEarlyDiscountType === 'percentage') {
                discount.value = Math.round((event.price * ebConfig.superEarlyDiscountValue) / 100);
                discount.label = `Super Early Bird (${ebConfig.superEarlyDiscountValue}% off)`;
            } else {
                discount.value = Math.min(ebConfig.superEarlyDiscountValue, event.price);
                discount.label = `Super Early Bird (₹${ebConfig.superEarlyDiscountValue} off)`;
            }
            discount.type = 'super_early';
        } else {
            if (ebConfig.earlyDiscountType === 'percentage') {
                discount.value = Math.round((event.price * ebConfig.earlyDiscountValue) / 100);
                discount.label = `Early Bird (${ebConfig.earlyDiscountValue}% off)`;
            } else {
                discount.value = Math.min(ebConfig.earlyDiscountValue, event.price);
                discount.label = `Early Bird (₹${ebConfig.earlyDiscountValue} off)`;
            }
            discount.type = 'early';
        }

        const finalPrice = Math.max(event.price - discount.value, 0);

        res.status(200).json({
            success: true,
            discount,
            originalPrice: event.price,
            finalPrice,
            spotsRemaining: confirmedCount < ebConfig.superEarlyLimit
                ? ebConfig.superEarlyLimit - confirmedCount
                : null,
        });
    } catch (err) {
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
