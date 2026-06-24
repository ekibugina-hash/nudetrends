import { NextResponse } from 'next/server';
import { clearAdminSession } from '../../../lib/auth';

export async function POST() {
  try {
    await clearAdminSession();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
