import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/db';
import AnalyticsVisit from '@/lib/models/AnalyticsVisit';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    let { visitorId, utmSource, utmMedium, utmCampaign, gymReferralCode } = body;

    if (!visitorId) {
      visitorId = uuidv4();
    }

    const ipAddress = req.headers.get('x-forwarded-for') || '';
    const userAgent = req.headers.get('user-agent') || '';

    const visit = await AnalyticsVisit.create({
      visitorId,
      utmSource: utmSource || 'direct',
      utmMedium: utmMedium || '',
      utmCampaign: utmCampaign || '',
      gymReferralCode: gymReferralCode || '',
      ipAddress,
      userAgent,
    });

    return jsonResponse(
      {
        success: true,
        visitorId: visit.visitorId,
        message: 'Visit tracked successfully',
      },
      201
    );
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
