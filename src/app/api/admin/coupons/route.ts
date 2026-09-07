import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import '@/lib/models/Sponsor';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const coupons = await Coupon.find().populate('sponsor').sort({ createdAt: -1 });
    return jsonResponse({ success: true, count: coupons.length, data: coupons });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
