import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import EarlyBirdConfig from '@/lib/models/EarlyBirdConfig';
import Registration from '@/lib/models/Registration';
import eventsCache from '@/lib/utils/eventsCache';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

const CACHE_KEY = 'all_events';

function computeDiscountInfo(price: number, ebConfig: any, confirmedCount: number) {
  const info: { discountedPrice: number; discountLabel: string | null; discountType: string } = {
    discountedPrice: price,
    discountLabel: null,
    discountType: 'none',
  };
  if (!ebConfig) return info;

  const isSuperEarly = confirmedCount < ebConfig.superEarlyLimit;
  const discountType = isSuperEarly ? ebConfig.superEarlyDiscountType : ebConfig.earlyDiscountType;
  const discountValue = isSuperEarly ? ebConfig.superEarlyDiscountValue : ebConfig.earlyDiscountValue;
  const tier = isSuperEarly ? 'Super Early Bird' : 'Early Bird';

  let amount = 0;
  if (discountType === 'percentage') {
    amount = Math.round((price * discountValue) / 100);
    info.discountLabel = `${tier} (${discountValue}% off)`;
  } else {
    amount = Math.min(discountValue, price);
    info.discountLabel = `${tier} (₹${discountValue} off)`;
  }

  info.discountedPrice = Math.max(price - amount, 0);
  info.discountType = isSuperEarly ? 'super_early' : 'early';
  return info;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const event = await Event.findById(id);
    if (!event) {
      return errorResponse('Event not found', 404);
    }

    const ebConfig = await EarlyBirdConfig.findOne({ event: event._id, isActive: true });
    const confirmedCount = ebConfig
      ? await Registration.countDocuments({ event: event._id, paymentStatus: 'completed' })
      : 0;

    const discountInfo = computeDiscountInfo(event.price, ebConfig, confirmedCount);

    return jsonResponse({
      success: true,
      data: { ...(event as any)._doc, ...discountInfo },
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    const { id } = await params;
    await connectDB();
    const body = await req.json();

    let event = await Event.findById(id);
    if (!event) {
      return errorResponse('Event not found', 404);
    }

    event = await Event.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    eventsCache.del(CACHE_KEY);
    return jsonResponse({ success: true, data: event });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    const { id } = await params;
    await connectDB();

    const event = await Event.findById(id);
    if (!event) {
      return errorResponse('Event not found', 404);
    }

    event.status = 'cancelled';
    await event.save();

    eventsCache.del(CACHE_KEY);
    return jsonResponse({ success: true, data: {} });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
