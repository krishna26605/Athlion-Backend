import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import Registration from '@/lib/models/Registration';
import { requireAuth } from '@/lib/auth';
import { calculateDiscount, finalizeRegistration } from '@/lib/registrations';
import { errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  if (process.env.NODE_ENV !== 'development') {
    return errorResponse('Forbidden. This endpoint is only available in development mode.', 403);
  }

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

    const userIdStr = (user.id || user._id || '').toString();

    const existingReg = await Registration.findOne({
      user: userIdStr,
      event: event._id,
      paymentStatus: 'completed',
    }, null, opts);

    if (existingReg) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
        session.endSession();
      }
      return errorResponse('Already registered for this event', 400);
    }

    const discount: any = await calculateDiscount(event._id, event.price, couponCode, session);

    const regData: any = {
      user: userIdStr,
      event: event._id,
      orderId: `test_order_${Date.now()}`,
      amountPaid: Math.max(event.price - (discount.value || 0), 0),
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
      verificationCode: 'TEST',
    };

    let registration;
    if (session) {
      const created = await Registration.create([regData], { session });
      registration = created[0];
    } else {
      registration = await Registration.create(regData);
    }

    return await finalizeRegistration(user, registration, event, `test_pay_${Date.now()}`, session);
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
    console.error('❌ [Test Register Route Error]', err);
    return errorResponse(err.message || 'An error occurred during test registration', 400);
  }
}
