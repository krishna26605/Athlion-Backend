import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Sponsor from '@/lib/models/Sponsor';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const gymSponsors = await Sponsor.find().select('name description website logo');

    const customGyms = gymSponsors.map((g: any) => ({
      code: g.name.toUpperCase().replace(/\s+/g, '-'),
      name: g.name,
      description: g.description || '',
      website: g.website || '',
      logo: g.logo || '',
    }));

    return jsonResponse({
      success: true,
      data: customGyms,
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
