import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import EarlyAccessLead from '@/lib/models/EarlyAccessLead';
import '@/lib/models/Event';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const source = searchParams.get('source');
    const gym = searchParams.get('gym');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    await connectDB();
    const query: any = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (source) {
      query.leadSource = source;
    }

    if (gym) {
      query.$or = [
        { gymReferralCode: { $regex: gym, $options: 'i' } },
        { gymName: { $regex: gym, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const leads = await EarlyAccessLead.find(query)
      .populate('convertedEventId', 'name date price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await EarlyAccessLead.countDocuments(query);

    return jsonResponse({
      success: true,
      count: leads.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: leads,
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
