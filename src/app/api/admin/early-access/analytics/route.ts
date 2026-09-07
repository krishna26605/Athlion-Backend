import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import AnalyticsVisit from '@/lib/models/AnalyticsVisit';
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
    const totalVisits = await AnalyticsVisit.countDocuments();
    const totalLeads = await EarlyAccessLead.countDocuments();
    const convertedLeadsToTicket = await EarlyAccessLead.countDocuments({ convertedToTicket: true });

    const visitToLeadRate = totalVisits > 0 ? ((totalLeads / totalVisits) * 100).toFixed(2) : '0';
    const leadToTicketRate = totalLeads > 0 ? ((convertedLeadsToTicket / totalLeads) * 100).toFixed(2) : '0';

    const revenueResult = await EarlyAccessLead.aggregate([
      { $match: { convertedToTicket: true } },
      { $group: { _id: null, totalRevenue: { $sum: '$ticketAmountPaid' } } },
    ]);

    const totalEarlyAccessRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const sourceBreakdown = await EarlyAccessLead.aggregate([
      { $group: { _id: '$leadSource', count: { $sum: 1 } } },
    ]);

    return jsonResponse({
      success: true,
      data: {
        totalVisits,
        totalLeads,
        convertedLeadsToTicket,
        visitToLeadRate: parseFloat(visitToLeadRate),
        leadToTicketRate: parseFloat(leadToTicketRate),
        totalEarlyAccessRevenue,
        sourceBreakdown,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
