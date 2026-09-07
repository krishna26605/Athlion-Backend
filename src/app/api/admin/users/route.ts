import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return jsonResponse({ success: true, count: users.length, data: users });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
