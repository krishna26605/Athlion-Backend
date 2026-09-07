import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Sponsor from '@/lib/models/Sponsor';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    const { id } = await params;
    await connectDB();

    const sponsor = await Sponsor.findByIdAndDelete(id);
    if (!sponsor) {
      return errorResponse('Sponsor not found', 404);
    }

    return jsonResponse({ success: true, data: {} });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
