import { NextResponse } from 'next/server';
import { verifyPassword, setAdminSession } from '../../../lib/auth';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const token = await verifyPassword(password);

    if (!token) {
      // Artificial delay to slow down brute-force attempts
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    await setAdminSession();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
