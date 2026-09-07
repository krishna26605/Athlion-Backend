import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const body = await req.json();
    const coupon = await Coupon.create(body);
    return jsonResponse({ success: true, data: coupon }, 201);
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
