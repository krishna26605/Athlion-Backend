import { NextRequest } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import Registration from '@/lib/models/Registration';
import { finalizeRegistration } from '@/lib/registrations';
import { requireAuth } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth(req);
  if (authError) {
    return errorResponse(authError.message, authError.status);
  }

  await connectDB();
  const body = await req.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (e) {
    session = null;
  }

  const opts = session ? { session } : {};

  try {
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
        session.endSession();
      }
      return errorResponse('Invalid payment signature', 400);
    }

    const registration = await Registration.findOne({ orderId: razorpay_order_id }, null, opts);
    if (!registration) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
        session.endSession();
      }
      return errorResponse('Registration not found', 404);
    }

    if (registration.paymentStatus === 'completed') {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
        session.endSession();
      }
      return jsonResponse({ success: true, message: 'Already verified' });
    }

    const event = await Event.findById(registration.event, null, opts);
    if (event.currentParticipants >= event.maxParticipants) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
        session.endSession();
      }
      return errorResponse('Event reached maximum capacity during payment', 400);
    }

    return await finalizeRegistration(user, registration, event, razorpay_payment_id, session);
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
    console.error('❌ [Verify Route Error]', err);
    return errorResponse(err.error?.description || err.message || 'An error occurred with the payment gateway', 400);
  }
}
