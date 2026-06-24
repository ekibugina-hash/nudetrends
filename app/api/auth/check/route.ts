import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '../../../lib/auth';

/** Lightweight endpoint for the admin page to verify its session cookie is valid. */
export async function GET(request: NextRequest) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
