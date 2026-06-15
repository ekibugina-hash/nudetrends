import { NextRequest, NextResponse } from 'next/server';

const CANONICAL_HOST = 'nudetrends.afrozex.com';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname, search } = request.nextUrl;

  // 1. Strip www prefix — 301 permanent redirect to non-www canonical
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.port = '';
    return NextResponse.redirect(url, { status: 301 });
  }

  // 2. Enforce HTTPS in production (skip in local dev)
  const proto = request.headers.get('x-forwarded-proto');
  if (proto && proto !== 'https' && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static assets and API routes that don't need it
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|robots.txt|sitemap.xml|googleEs8WnK7FKiZYe07Dwcr8fHkzBt7nnOv_-DpvfvLWqwk\\.html).*)',
  ],
};
