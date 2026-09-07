import { NextRequest } from 'next/server';
import crypto from 'crypto';
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
    const { sponsorId, count, value, type, prefix, expiryDate } = body;

    if (!sponsorId || !count || !value || !expiryDate) {
      return errorResponse('Please provide all required fields', 400);
    }

    const coupons = [];
    for (let i = 0; i < count; i++) {
      const code = `${prefix || 'ATH'}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      coupons.push({
        code,
        sponsor: sponsorId,
        value,
        type: type || 'flat',
        expiryDate,
        usageLimit: 1,
        isSingleUse: true,
      });
    }

    await Coupon.insertMany(coupons);

    return jsonResponse(
      {
        success: true,
        count: coupons.length,
        message: `${count} coupons generated successfully`,
      },
      201
    );
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
