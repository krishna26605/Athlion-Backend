import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/api-response';

/*
import OpenAI from 'openai';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import Registration from '@/lib/models/Registration';
import User from '@/lib/models/User';
import Coupon from '@/lib/models/Coupon';
import EarlyBirdConfig from '@/lib/models/EarlyBirdConfig';
import razorpay from '@/lib/services/razorpay';
import { getAuthUser } from '@/lib/auth';
import { jsonResponse } from '@/lib/api-response';

export const maxDuration = 300;
... (AI Chatbot implementations disabled)
*/

export async function POST(req: NextRequest) {
  // AI Chatbot endpoint disabled
  return errorResponse('AI Chatbot is currently disabled.', 503);
}
