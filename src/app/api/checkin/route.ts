import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Registration from '@/lib/models/Registration';
import '@/lib/models/User';
import '@/lib/models/Event';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'staff', 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const body = await req.json();
    const { qrCode } = body;

    if (!qrCode) {
      return errorResponse('QR Code is required', 400);
    }

    const registration = await Registration.findOne({ qrCode }).populate('user event');

    if (!registration) {
      return errorResponse('Invalid or unregistered QR Code', 404);
    }

    if (registration.paymentStatus !== 'completed') {
      return errorResponse('Payment not completed for this registration', 400);
    }

    if (registration.checkInStatus) {
      return jsonResponse(
        {
          success: false,
          message: 'Participant already checked-in',
          data: {
            name: (registration.user as any)?.name,
            checkedInAt: registration.verifiedAt,
          },
        },
        400
      );
    }

    registration.checkInStatus = true;
    await registration.save();

    return jsonResponse({
      success: true,
      message: `Check-in successful for ${(registration.user as any)?.name}`,
      data: {
        name: (registration.user as any)?.name,
        event: (registration.event as any)?.name,
        batch: registration.batchNumber,
        time: registration.batchTime,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
