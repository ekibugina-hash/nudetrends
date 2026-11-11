import { getCreators, getMergedVideos } from './lib/db';
import HomeClient from './HomeClient';
import { absoluteUrl, SITE_URL } from './lib/seo';

// Cache this page at the edge for 60 seconds.
export const revalidate = 60;

export default async function Page() {
  const [initialCreators, initialVideos] = await Promise.all([
    getCreators(),
    getMergedVideos()
  ]);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Trending Adult Leaks & Media Uganda',
    description: 'Daily updated catalog of trending leaks and viral videos in Uganda.',
    itemListElement: initialCreators.slice(0, 20).map((creator, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: creator.name,
      url: `${SITE_URL}/creator/${encodeURIComponent(creator.name)}`,
      image: absoluteUrl(creator.thumbnailUrl),
      description: creator.bio || creator.firstVideo?.desc || `Exclusive leaks and trending media from ${creator.name}`,
    })),
  };

  const homeFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is NudeTrends Uganda?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'NudeTrends Uganda is the leading adult network providing daily updated trending leaks, exclusive videos, and photos from Kampala and East Africa.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are the trending videos and nudes free to watch?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all media files and trends on NudeTrends Uganda are completely free to stream directly on web and mobile browsers.',
        },
      },
      {
        '@type': 'Question',
        name: 'How often are new trends and leaks added?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'New viral trends, leaked videos, and photos are updated multiple times daily as soon as they break.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqSchema) }}
      />
      <HomeClient initialCreators={initialCreators} initialVideos={initialVideos} />
    </>
  );
}
