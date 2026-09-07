import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { requireAuth } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, errorResponse: authError } = await requireAuth(req);
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const user = await User.findById(authUser.id);
    return jsonResponse({
      success: true,
      data: user,
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
