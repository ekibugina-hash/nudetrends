'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

function PostHogPageView() {
  const pathname = usePathname();

  useEffect(() => {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
    });
  }, [pathname]);

  return null;
}

function PostHogInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) {
      console.warn('[PostHog] No key found. Check NEXT_PUBLIC_POSTHOG_KEY in Vercel env vars.');
      return;
    }

    if (!posthog.__loaded) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: 'identified_only',
        capture_pageview: false, // We fire manually in PostHogPageView
        loaded: (ph) => {
          console.log('[PostHog] Loaded successfully. Distinct ID:', ph.get_distinct_id());
        },
      });
    }
  }, []);

  return <>{children}</>;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PostHogInit>
        <PostHogPageView />
        {children}
      </PostHogInit>
    </PHProvider>
  );
}
