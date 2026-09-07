import connectDB from './db';
import Event from './models/Event';
import Registration from './models/Registration';
import Coupon from './models/Coupon';
import EarlyBirdConfig from './models/EarlyBirdConfig';
import User from './models/User';
import EarlyAccessLead from './models/EarlyAccessLead';
import eventsCache from './utils/eventsCache';
import { sendWhatsAppMessage } from './services/whatsapp';
import { sendRegistrationConfirmation } from './services/email';
import { jsonResponse } from './api-response';

const EVENTS_CACHE_KEY = 'all_events';

export async function calculateDiscount(eventId: any, eventPrice: number, couponCode?: string, session?: any) {
  let discount = { type: 'none', value: 0, label: '', couponId: null };
  const opts = session ? { session } : {};

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true }, null, opts);

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
    discount.couponId = coupon._id as any;
    return discount;
  }

  const ebConfig = await EarlyBirdConfig.findOne({ event: eventId, isActive: true }, null, opts);
  if (!ebConfig) {
    return discount;
  }

  const confirmedCount = await Registration.countDocuments(
    { event: eventId, paymentStatus: 'completed' },
    opts
  );

  if (confirmedCount < ebConfig.superEarlyLimit) {
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
}

export async function finalizeRegistration(user: any, registration: any, event: any, paymentId: string, session?: any) {
  const opts = session ? { session } : {};

  const confirmedCount = await Registration.countDocuments(
    { event: event._id, paymentStatus: 'completed' },
    opts
  );

  const batchNumber = Math.floor(confirmedCount / event.batchSize) + 1;
  const minutesToAdd = (batchNumber - 1) * event.gapBetweenBatches;

  const [startHour, startMin] = (event.startTime || '09:00').split(':').map(Number);
  const date = new Date();
  date.setHours(startHour || 9, startMin || 0, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  const batchTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

  registration.paymentStatus = 'completed';
  registration.paymentId = paymentId || `test_${Date.now()}`;
  registration.verifiedAt = new Date();
  registration.verificationCode = verificationCode;
  registration.qrCode = `ATHLION-${event._id}-${registration._id}-${verificationCode}`;

  if (registration.couponUsed) {
    await Coupon.findByIdAndUpdate(registration.couponUsed, {
      $inc: { usageCount: 1 },
    }, opts);
  }

  await registration.save(opts);

  event.currentParticipants += 1;
  await event.save(opts);

  const userDoc = await User.findById(registration.user, null, opts);
  if (userDoc) {
    await EarlyAccessLead.updateMany(
      {
        $or: [
          { email: userDoc.email ? userDoc.email.toLowerCase() : '' },
          { phone: userDoc.phone || '' },
        ],
      },
      {
        $set: {
          convertedToTicket: true,
          convertedEventId: event._id,
          ticketAmountPaid: registration.amountPaid || event.price || 0,
        },
      },
      opts
    );
  }

  if (session && typeof session.inTransaction === 'function' && session.inTransaction()) {
    await session.commitTransaction();
    session.endSession();
  }

  eventsCache.del(EVENTS_CACHE_KEY);

  const body = `Hi ${user.name}! Your registration for ${event.name} is confirmed. \nSlot: ${batchTime}\nBatch: ${batchNumber}\nVenue: ${event.venue?.address || 'TBA'}\nGoogle Maps: ${event.venue?.googleMapsLink || ''}\nRegistration ID: ${registration.qrCode}\nSee you there!`;

  let waSuccess = true;
  try {
    await sendWhatsAppMessage(user.phone, body);
  } catch (err: any) {
    console.error('WhatsApp Fail:', err.message);
    waSuccess = false;
  }

  let emailSuccess = true;
  try {
    await sendRegistrationConfirmation(user, event, registration);
  } catch (err: any) {
    console.error('Email Fail:', err.message);
    emailSuccess = false;
  }

  return jsonResponse({
    success: true,
    data: registration,
    notifications: {
      whatsapp: waSuccess,
      email: emailSuccess,
    },
  });
}
