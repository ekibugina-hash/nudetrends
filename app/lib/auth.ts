/**
 * Server-side admin authentication utilities.
 *
 * Strategy: stateless HMAC-SHA256 token stored in an httpOnly cookie.
 * The token is HMAC("admin_authenticated", ADMIN_SECRET) so it cannot be
 * forged without knowing the secret, and it requires no database or session store.
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SECRET environment variable is not set.');
  }
  return secret;
}

/**
 * Compute an HMAC-SHA256 hex digest using the Web Crypto API
 * (available in Node 18+ / Edge runtime).
 */
async function hmac(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Constant-time string comparison to prevent timing attacks. */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Generates the expected session token value. */
async function generateToken(): Promise<string> {
  return hmac('admin_authenticated', getSecret());
}

/**
 * Verify the admin password and return the session cookie value to set.
 * Returns null if the password is wrong.
 */
export async function verifyPassword(password: string): Promise<string | null> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error('ADMIN_PASSWORD env var is not set');
    return null;
  }
  if (!safeCompare(password, expected)) return null;
  return generateToken();
}

/** Cookie options shared between set/clear operations. */
function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

/**
 * Set the admin session cookie (call from login API route).
 * Uses next/headers cookies() — only valid in Route Handlers / Server Actions.
 */
export async function setAdminSession(): Promise<void> {
  const token = await generateToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, cookieOptions(COOKIE_MAX_AGE));
}

/**
 * Clear the admin session cookie (call from logout API route).
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', cookieOptions(0));
}

/**
 * Verify that the incoming request has a valid admin session cookie.
 * Works in Edge middleware AND in Route Handlers (reads from NextRequest).
 */
export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const expected = await generateToken();
    return safeCompare(token, expected);
  } catch {
    return false;
  }
}

/**
 * Verify auth from inside a Route Handler that uses next/headers cookies().
 * Use this variant when you don't have access to the raw NextRequest.
 */
export async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const expected = await generateToken();
    return safeCompare(token, expected);
  } catch {
    return false;
  }
}
