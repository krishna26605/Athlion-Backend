import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import '@/lib/models/Sponsor';
import { requireAuth } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireAuth(req);
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const body = await req.json();
    const { code } = body;

    const coupon = await Coupon.findOne({ code, isActive: true }).populate('sponsor');
    if (!coupon) {
      return errorResponse('Invalid or inactive coupon code', 404);
    }

    if (coupon.usageCount >= coupon.usageLimit) {
      return errorResponse('Coupon usage limit reached', 400);
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return errorResponse('Coupon has expired', 400);
    }

    return jsonResponse({
      success: true,
      data: {
        id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        sponsor: (coupon.sponsor as any)?.name || '',
      },
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
