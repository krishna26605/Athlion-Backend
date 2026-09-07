import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import Registration from '@/lib/models/Registration';
import EarlyBirdConfig from '@/lib/models/EarlyBirdConfig';
import { requireAuth } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { user, errorResponse: authError } = await requireAuth(req);
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    const { eventId } = await params;
    await connectDB();

    const event = await Event.findById(eventId);
    if (!event) {
      return errorResponse('Event not found', 404);
    }

    const existingRegWithCoupon = await Registration.findOne({
      user: user.id,
      event: event._id,
      paymentStatus: 'completed',
      couponUsed: { $exists: true, $ne: null },
    });

    if (existingRegWithCoupon) {
      return jsonResponse({
        success: true,
        discount: { type: 'none', value: 0, label: 'Already registered with a coupon' },
        originalPrice: event.price,
        finalPrice: event.price,
      });
    }

    const ebConfig = await EarlyBirdConfig.findOne({ event: event._id, isActive: true });
    if (!ebConfig) {
      return jsonResponse({
        success: true,
        discount: { type: 'none', value: 0, label: '' },
        originalPrice: event.price,
        finalPrice: event.price,
      });
    }

    const confirmedCount = await Registration.countDocuments({
      event: event._id,
      paymentStatus: 'completed',
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

    return jsonResponse({
      success: true,
      discount,
      originalPrice: event.price,
      finalPrice,
      spotsRemaining:
        confirmedCount < ebConfig.superEarlyLimit ? ebConfig.superEarlyLimit - confirmedCount : null,
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
