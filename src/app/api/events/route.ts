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

export async function GET(req: NextRequest) {
  try {
    const cached = eventsCache.get(CACHE_KEY);
    if (cached) {
      return jsonResponse(cached, 200);
    }

    await connectDB();

    const events = await Event.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $sort: { date: -1 } },
      {
        $lookup: {
          from: 'earlybirdconfigs',
          let: { eventId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$event', '$$eventId'] },
                    { $eq: ['$isActive', true] }
                  ]
                }
              }
            }
          ],
          as: 'earlyBirdConfig'
        }
      },
      {
        $lookup: {
          from: 'registrations',
          let: { eventId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$event', '$$eventId'] },
                    { $eq: ['$paymentStatus', 'completed'] }
                  ]
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'registrationCount'
        }
      }
    ]);

    const enrichedEvents = events.map((event: any) => {
      const ebConfig = event.earlyBirdConfig[0] || null;
      const confirmedCount = event.registrationCount[0]?.count ?? 0;
      const discountInfo = computeDiscountInfo(event.price, ebConfig, confirmedCount);

      const { earlyBirdConfig, registrationCount, ...eventDoc } = event;
      return { ...eventDoc, ...discountInfo };
    });

    const response = {
      success: true,
      count: enrichedEvents.length,
      data: enrichedEvents,
    };

    eventsCache.set(CACHE_KEY, response);
    return jsonResponse(response, 200);
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const body = await req.json();
    body.createdBy = user.id;

    const event = await Event.create(body);
    eventsCache.del(CACHE_KEY);

    return jsonResponse({ success: true, data: event }, 201);
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
