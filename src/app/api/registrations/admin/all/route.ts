import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Registration from '@/lib/models/Registration';
import '@/lib/models/User';
import '@/lib/models/Event';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const registrations = await Registration.find({
      paymentStatus: 'completed',
    })
      .populate('user', 'name email phone')
      .populate('event', 'name')
      .sort('-createdAt');

    return jsonResponse({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
