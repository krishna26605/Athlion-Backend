import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Registration from '@/lib/models/Registration';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    const { id } = await params;
    await connectDB();

    const registration = await Registration.findById(id);
    if (!registration) {
      return errorResponse('Registration not found', 404);
    }

    if (registration.paymentStatus !== 'completed') {
      return errorResponse('Registration payment not completed', 400);
    }

    registration.checkInStatus = true;
    registration.verifiedAt = new Date();
    await registration.save();

    return jsonResponse({
      success: true,
      message: 'Athlete verified successfully',
      data: registration,
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
