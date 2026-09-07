import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import EarlyAccessLead from '@/lib/models/EarlyAccessLead';
import AnalyticsVisit from '@/lib/models/AnalyticsVisit';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { fullName, email, phone, leadSource, gymReferralCode, gymName, visitorId } = body;

    if (!fullName || !email || !phone) {
      return errorResponse('Please provide full name, email, and phone number', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    let lead = await EarlyAccessLead.findOne({ email: normalizedEmail });

    if (lead) {
      lead.fullName = fullName;
      lead.phone = phone;
      if (leadSource) lead.leadSource = leadSource;
      if (gymReferralCode) lead.gymReferralCode = gymReferralCode;
      if (gymName) lead.gymName = gymName;
      await lead.save();
    } else {
      lead = await EarlyAccessLead.create({
        fullName,
        email: normalizedEmail,
        phone,
        leadSource: leadSource || 'direct',
        gymReferralCode: gymReferralCode || '',
        gymName: gymName || '',
      });
    }

    if (visitorId) {
      await AnalyticsVisit.updateMany(
        { visitorId },
        { $set: { convertedToEarlyAccess: true, convertedUserEmail: normalizedEmail } }
      );
    }

    return jsonResponse(
      {
        success: true,
        data: lead,
        message: 'Successfully registered for Athlion Early Access!',
      },
      201
    );
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
