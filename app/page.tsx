import { getCreators, getMergedVideos } from './lib/db';
import HomeClient from './HomeClient';

// Cache this page at the edge for 60 seconds.
export const revalidate = 60;

const SITE_URL = process.env.APP_URL || 'https://nudetrends.afrozex.com';

export default async function Page() {
  const [initialCreators, initialVideos] = await Promise.all([
    getCreators(),
    getMergedVideos()
  ]);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Trending Adult Leaks & Media Uganda',
    'itemListElement': initialCreators.slice(0, 20).map((creator, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': creator.name,
      'url': `${SITE_URL}/creator/${encodeURIComponent(creator.name)}`,
      'image': creator.thumbnailUrl || undefined,
      'description': creator.bio || creator.firstVideo?.desc || `Exclusive leaks and trending media from ${creator.name}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <HomeClient initialCreators={initialCreators} initialVideos={initialVideos} />
    </>
  );
}
