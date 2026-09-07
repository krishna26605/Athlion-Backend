import { NextResponse } from 'next/server';

export function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function errorResponse(message: string, status = 500, extra: Record<string, any> = {}) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...extra,
    },
    { status }
  );
}
