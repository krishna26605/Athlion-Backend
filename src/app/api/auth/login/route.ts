import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { sendTokenResponse } from '@/lib/utils/sendTokenResponse';
import { errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Please provide an email and password', 400);
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse('Invalid credentials', 401);
    }

    return sendTokenResponse(user, 200);
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
