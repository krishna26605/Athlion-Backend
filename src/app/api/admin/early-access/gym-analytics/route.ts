import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import EarlyAccessLead from '@/lib/models/EarlyAccessLead';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const gymStats = await EarlyAccessLead.aggregate([
      { $match: { gymReferralCode: { $ne: '' } } },
      {
        $group: {
          _id: { code: '$gymReferralCode', name: '$gymName' },
          totalLeads: { $sum: 1 },
          ticketBuyers: {
            $sum: { $cond: [{ $eq: ['$convertedToTicket', true] }, 1, 0] },
          },
          totalRevenue: { $sum: '$ticketAmountPaid' },
        },
      },
      { $sort: { totalLeads: -1 } },
    ]);

    const formatted = gymStats.map((item: any) => {
      const registeredCount = item.totalLeads;
      const thresholdReached = registeredCount >= 50;
      return {
        gymCode: item._id.code,
        gymName: item._id.name || item._id.code,
        totalLeads: registeredCount,
        ticketBuyers: item.ticketBuyers,
        totalRevenue: item.totalRevenue,
        thresholdReached,
        progressPercentage: Math.min(100, Math.round((registeredCount / 50) * 100)),
        royaltyEligible: thresholdReached,
      };
    });

    return jsonResponse({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
