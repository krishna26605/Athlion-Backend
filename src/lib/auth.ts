import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from './db';
import User from './models/User';

export interface AuthenticatedUser {
  _id: any;
  id: string;
  name: string;
  email: string;
  role: string;
  mobile?: string;
  [key: string]: any;
}

export async function getAuthUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
    await connectDB();
    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch (err) {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<{ user: AuthenticatedUser | null; errorResponse?: { message: string; status: number } }> {
  const user = await getAuthUser(req);
  if (!user) {
    return { user: null, errorResponse: { message: 'Not authorized to access this route', status: 401 } };
  }
  return { user };
}

export async function requireRole(req: NextRequest, ...roles: string[]): Promise<{ user: AuthenticatedUser | null; errorResponse?: { message: string; status: number } }> {
  const { user, errorResponse } = await requireAuth(req);
  if (errorResponse) {
    return { user: null, errorResponse };
  }

  if (!user || !roles.includes(user.role)) {
    return {
      user: null,
      errorResponse: {
        message: `User role ${user?.role || 'unknown'} is not authorized to access this route`,
        status: 403,
      },
    };
  }

  return { user };
}
