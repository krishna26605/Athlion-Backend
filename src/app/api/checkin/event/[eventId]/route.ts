import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Registration from '@/lib/models/Registration';
import '@/lib/models/User';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'staff', 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    const { eventId } = await params;
    await connectDB();

    const registrations = await Registration.find({
      event: eventId,
      paymentStatus: 'completed',
    })
      .populate('user', 'name email phone')
      .sort('batchNumber');

    return jsonResponse({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
