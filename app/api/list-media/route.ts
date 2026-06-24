/**
 * /api/list-media — Deprecated
 *
 * This endpoint previously duplicated the R2 listing logic already present in
 * /api/videos (which calls getMergedVideos from lib/db.ts).
 *
 * It now simply forwards to /api/videos so any existing consumers continue
 * to work without change.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.redirect(new URL('/api/videos', process.env.APP_URL || 'https://nudetrends.afrozex.com'));
}
