import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import EarlyBirdConfig from '@/lib/models/EarlyBirdConfig';
import '@/lib/models/Event';
import eventsCache from '@/lib/utils/eventsCache';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

const EVENTS_CACHE_KEY = 'all_events';

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    const { eventId } = await params;
    await connectDB();

    const config = await EarlyBirdConfig.findOne({ event: eventId }).populate('event', 'name date price');
    if (!config) {
      return errorResponse('No early bird config found for this event', 404);
    }

    return jsonResponse({ success: true, data: config });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    const { eventId } = await params;
    await connectDB();

    const config = await EarlyBirdConfig.findOneAndDelete({ event: eventId });
    if (!config) {
      return errorResponse('No early bird config found for this event', 404);
    }

    eventsCache.del(EVENTS_CACHE_KEY);
    return jsonResponse({ success: true, data: {} });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
