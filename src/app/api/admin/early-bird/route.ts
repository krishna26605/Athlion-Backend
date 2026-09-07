import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import EarlyBirdConfig from '@/lib/models/EarlyBirdConfig';
import Event from '@/lib/models/Event';
import eventsCache from '@/lib/utils/eventsCache';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

const EVENTS_CACHE_KEY = 'all_events';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const configs = await EarlyBirdConfig.find().populate('event', 'name date price status').sort({ createdAt: -1 });
    return jsonResponse({ success: true, count: configs.length, data: configs });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const body = await req.json();
    const {
      eventId,
      superEarlyLimit,
      superEarlyDiscountType,
      superEarlyDiscountValue,
      earlyDiscountType,
      earlyDiscountValue,
      isActive,
    } = body;

    if (!eventId || !superEarlyLimit || !superEarlyDiscountType || superEarlyDiscountValue == null || !earlyDiscountType || earlyDiscountValue == null) {
      return errorResponse('Please provide all required fields', 400);
    }

    if (superEarlyDiscountType === 'percentage' && superEarlyDiscountValue > 100) {
      return errorResponse('Super early percentage cannot exceed 100%', 400);
    }
    if (earlyDiscountType === 'percentage' && earlyDiscountValue > 100) {
      return errorResponse('Early percentage cannot exceed 100%', 400);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return errorResponse('Event not found', 404);
    }

    const config = await EarlyBirdConfig.findOneAndUpdate(
      { event: eventId },
      {
        event: eventId,
        superEarlyLimit,
        superEarlyDiscountType,
        superEarlyDiscountValue,
        earlyDiscountType,
        earlyDiscountValue,
        isActive: isActive !== undefined ? isActive : true,
      },
      { upsert: true, new: true, runValidators: true }
    );

    eventsCache.del(EVENTS_CACHE_KEY);

    return jsonResponse({ success: true, data: config });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
