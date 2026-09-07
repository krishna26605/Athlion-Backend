import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Registration from '@/lib/models/Registration';
import '@/lib/models/Event';
import { requireAuth } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse: authError } = await requireAuth(req);
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const registrations = await Registration.find({
      user: user.id,
      paymentStatus: 'completed',
    }).populate('event');

    return jsonResponse({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
