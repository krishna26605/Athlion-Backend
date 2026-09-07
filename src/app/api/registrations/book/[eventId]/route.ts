import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import Registration from '@/lib/models/Registration';
import razorpay from '@/lib/services/razorpay';
import { requireAuth } from '@/lib/auth';
import { calculateDiscount } from '@/lib/registrations';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { user, errorResponse: authError } = await requireAuth(req);
  if (authError) {
    return errorResponse(authError.message, authError.status);
  }

  const { eventId } = await params;
  await connectDB();
  const body = await req.json();
  const { level, height, weight, category, batchTime, couponCode } = body;

  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (e) {
    session = null;
  }

  const opts = session ? { session } : {};

  try {
    const event = await Event.findById(eventId, null, opts);
    if (!event) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
        session.endSession();
      }
      return errorResponse('Event not found', 404);
    }

    if (event.status !== 'upcoming') {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
        session.endSession();
      }
      return errorResponse('Event is not open for registration', 400);
    }

    if (event.currentParticipants >= event.maxParticipants) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
        session.endSession();
      }
      return errorResponse('Event is fully booked', 400);
    }

    if (batchTime) {
      const waveCount = await Registration.countDocuments({
        event: event._id,
        batchTime,
        paymentStatus: 'completed',
      }, opts);

      if (waveCount >= 30) {
        if (session && session.inTransaction()) {
          await session.abortTransaction();
          session.endSession();
        }
        return errorResponse(`The ${batchTime} wave is sold out. Please select another timing.`, 400);
      }
    }

    const userIdStr = (user.id || user._id || '').toString();

    const existingReg = await Registration.findOne({
      user: userIdStr,
      event: event._id,
    }, null, opts);

    if (existingReg && existingReg.paymentStatus === 'completed') {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
        session.endSession();
      }
      return errorResponse('You are already registered for this event', 400);
    }

    const discount: any = await calculateDiscount(event._id, event.price, couponCode, session);
    if (discount.error) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
        session.endSession();
      }
      return errorResponse(discount.error, 400);
    }

    const finalPrice = Math.max(event.price - discount.value, 0);

    const options = {
      amount: finalPrice * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${userIdStr.substring(0, 5)}`,
    };

    const order = await razorpay.orders.create(options);

    let registration;
    if (existingReg) {
      existingReg.orderId = order.id;
      existingReg.amountPaid = finalPrice;
      existingReg.level = level;
      existingReg.height = height ? Number(height) : undefined;
      existingReg.weight = weight ? Number(weight) : undefined;
      existingReg.category = category || 'Single';
      existingReg.batchTime = batchTime;
      existingReg.discountType = discount.type;
      existingReg.discountValue = discount.value;
      existingReg.discountLabel = discount.label;
      existingReg.couponUsed = discount.couponId || undefined;
      existingReg.verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
      await existingReg.save(opts);
      registration = existingReg;
    } else {
      const regData: any = {
        user: userIdStr,
        event: event._id,
        orderId: order.id,
        amountPaid: finalPrice,
        paymentStatus: 'pending',
        level,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        category: category || 'Single',
        batchTime,
        discountType: discount.type,
        discountValue: discount.value,
        discountLabel: discount.label,
        couponUsed: discount.couponId || undefined,
        verificationCode: Math.floor(1000 + Math.random() * 9000).toString(),
      };

      if (session) {
        const created = await Registration.create([regData], { session });
        registration = created[0];
      } else {
        registration = await Registration.create(regData);
      }
    }

    if (session && session.inTransaction()) {
      await session.commitTransaction();
      session.endSession();
    }

    return jsonResponse(
      {
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
      },
      201
    );
  } catch (err: any) {
    if (session) {
      try {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
      } catch (e) {}
      try {
        session.endSession();
      } catch (e) {}
    }
    console.error('❌ [Booking Route Error]', err);
    const errorMessage = err.error?.description || err.message || 'An error occurred with the payment gateway';
    return errorResponse(errorMessage, 400);
  }
}
