import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { sendTokenResponse } from '@/lib/utils/sendTokenResponse';
import { errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password, phone, role } = body;

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'participant',
    });

    return sendTokenResponse(user, 201);
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
