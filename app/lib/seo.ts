export const SITE_URL = process.env.APP_URL || 'https://nudetrends.afrozex.com';

/**
 * Ensures an image or page URL is an absolute URL for OpenGraph and Schema.org.
 */
export function absoluteUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return `${SITE_URL}/logo.png`;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Formats duration strings like '03:45' or '12:30' into ISO 8601 duration format (e.g., 'PT3M45S')
 * required by Google Search for VideoObject rich snippets.
 */
export function formatIsoDuration(durationStr?: string | null): string {
  if (!durationStr || typeof durationStr !== 'string') return 'PT3M30S';
  const trimmed = durationStr.trim();
  const parts = trimmed.split(':').map(Number);
  if (parts.some(isNaN)) return 'PT3M30S';
  
  if (parts.length === 2) {
    const [mins, secs] = parts;
    return `PT${mins}M${secs}S`;
  }
  if (parts.length === 3) {
    const [hours, mins, secs] = parts;
    return `PT${hours}H${mins}M${secs}S`;
  }
  return 'PT3M30S';
}

/**
 * Generates Google-compliant BreadcrumbList Schema.
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

/**
 * Generates an FAQPage Schema for a specific trend to earn People Also Ask (PAA) rich snippets.
 */
export function generateTrendFaqSchema(creatorName: string, videoCount: number, photoCount: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Where can I watch ${creatorName} leaked videos and photos?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `You can stream and watch all exclusive media, leaked photos, and videos of ${creatorName} directly on NudeTrends Uganda with high speed streaming.`,
        },
      },
      {
        '@type': 'Question',
        name: `How many videos and photos are available for ${creatorName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `There are currently ${videoCount} videos and ${photoCount} photos available for ${creatorName} on NudeTrends Uganda, updated regularly.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is ${creatorName} content available on mobile devices?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes, all content for ${creatorName} is fully optimized for mobile devices with responsive layouts and lightweight thumbnail previews.`,
        },
      },
    ],
  };
}
