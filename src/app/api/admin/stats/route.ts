import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Event from '@/lib/models/Event';
import Registration from '@/lib/models/Registration';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments();

    const totalRevenue = await Registration.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]);

    return jsonResponse({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalRegistrations,
        revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
