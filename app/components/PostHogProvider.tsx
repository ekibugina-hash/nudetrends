'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// Initialize PostHog once, outside of React lifecycle
if (typeof window !== 'undefined' && POSTHOG_KEY && !posthog.__loaded) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // 'always' = track ALL visitors including anonymous ones (was 'identified_only' = broken)
    person_profiles: 'always',
    capture_pageview: false, // We fire manually below
    capture_pageleave: true,
    autocapture: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PostHog] Loaded. Distinct ID:', ph.get_distinct_id());
      }
    },
  });
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY || typeof window === 'undefined') return;
    if (!posthog.__loaded) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    posthog.capture('$pageview', {
      $current_url: window.location.origin + url,
    });
  }, [pathname, searchParams]);

  return null;
}

// Wrap PostHogPageView in Suspense as required by Next.js for useSearchParams
function SuspendedPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) {
    // No key = just render children, no analytics
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <SuspendedPageView />
      {children}
    </PHProvider>
  );
}
