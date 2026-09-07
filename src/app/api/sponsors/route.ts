import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Sponsor from '@/lib/models/Sponsor';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const sponsors = await Sponsor.find();
    return jsonResponse({ success: true, data: sponsors });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const body = await req.json();
    const sponsor = await Sponsor.create(body);
    return jsonResponse({ success: true, data: sponsor }, 201);
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
