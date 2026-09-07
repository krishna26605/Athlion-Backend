import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import EarlyAccessLead from '@/lib/models/EarlyAccessLead';
import { sendEarlyAccessNotification } from '@/lib/services/email';
import { sendWhatsAppMessage, sendSMSMessage } from '@/lib/services/whatsapp';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const body = await req.json();
    const { eventId, customMessage, channels } = body;

    if (!eventId) {
      return errorResponse('Please provide eventId', 400);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return errorResponse('Event not found', 404);
    }

    const activeChannels = Array.isArray(channels) && channels.length > 0 ? channels : ['email'];
    const leads = await EarlyAccessLead.find({ notified: false });

    let emailSent = 0;
    let smsSent = 0;
    let whatsappSent = 0;

    for (const lead of leads) {
      const usedChannels = [];

      if (activeChannels.includes('email') && lead.email) {
        await sendEarlyAccessNotification(lead, event, customMessage);
        usedChannels.push('email');
        emailSent++;
      }

      if (activeChannels.includes('sms') && lead.phone) {
        const smsBody = `🔥 ATHLiON ALERT: ${event.name} is LIVE! Register now at https://athlion-frontend.vercel.app/events/${event._id}`;
        await sendSMSMessage(lead.phone, smsBody);
        usedChannels.push('sms');
        smsSent++;
      }

      if (activeChannels.includes('whatsapp') && lead.phone) {
        const waBody = `🏆 *ATHLiON EARLY ACCESS ALERT*\n\nHey *${lead.fullName}*!\nThe wait is over. *${event.name}* is officially OPEN for registration.\n\n📅 Date: ${new Date(event.date).toLocaleDateString()}\n📍 Address: ${event.venue?.address || 'TBA'}\n\n👉 Register now: https://athlion-frontend.vercel.app/events/${event._id}`;
        await sendWhatsAppMessage(lead.phone, waBody);
        usedChannels.push('whatsapp');
        whatsappSent++;
      }

      lead.notified = true;
      lead.notifiedChannels = usedChannels;
      lead.notifiedAt = new Date();
      await lead.save();
    }

    return jsonResponse({
      success: true,
      totalNotified: leads.length,
      breakdown: {
        emailSent,
        smsSent,
        whatsappSent,
      },
      message: `Successfully notified ${leads.length} early access leads across chosen channels!`,
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
