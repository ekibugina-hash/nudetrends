import type { Metadata } from 'next';
import { getMergedVideos, getCreators } from '../../lib/db';
import CreatorClient from './CreatorClient';
import { absoluteUrl, generateBreadcrumbSchema, generateTrendFaqSchema, SITE_URL } from '../../lib/seo';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const creatorName = decodeURIComponent(name);
  const [allVideos, creators] = await Promise.all([
    getMergedVideos(),
    getCreators()
  ]);

  const creatorObj = creators.find(
    c => c.name.toLowerCase() === creatorName.toLowerCase()
  );
  const creatorVideos = allVideos.filter(
    v => (v.creator && v.creator.toLowerCase() === creatorName.toLowerCase()) ||
         (v.title && v.title.toLowerCase() === creatorName.toLowerCase())
  );
  const firstMedia = creatorVideos[0] || creatorObj?.firstVideo;
  const title = `${creatorName} - Leaks, Trends & Exclusive Media | NudeTrends Uganda`;
  const desc = (creatorObj?.bio || firstMedia?.desc || `Watch all exclusive video leaks and photo trends of ${creatorName} on NudeTrends Uganda. Stream full videos and high quality leaks daily.`).slice(0, 160);
  const image = absoluteUrl(creatorObj?.thumbnailUrl || firstMedia?.thumbnailUrl || firstMedia?.imageUrl);
  const url = `${SITE_URL}/creator/${encodeURIComponent(name)}`;

  return {
    title,
    description: desc,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: 'NudeTrends Uganda',
      locale: 'en_UG',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${creatorName} Trend Leaks`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const creatorName = decodeURIComponent(name);
  const [allVideos, creators] = await Promise.all([
    getMergedVideos(),
    getCreators()
  ]);
  
  const creatorVideos = allVideos.filter(
    v => (v.creator && v.creator.toLowerCase() === creatorName.toLowerCase()) ||
         (v.title && v.title.toLowerCase() === creatorName.toLowerCase())
  );
  const creatorObj = creators.find(
    c => c.name.toLowerCase() === creatorName.toLowerCase()
  );
  
  const finalVideos = creatorVideos.length > 0
    ? creatorVideos
    : (creatorObj?.firstVideo ? [creatorObj.firstVideo] : []);

  const thumbnailUrl = creatorObj?.thumbnailUrl || finalVideos[0]?.thumbnailUrl || finalVideos[0]?.imageUrl;

  const videoCount = finalVideos.filter(v => v.type !== 'image').length;
  const photoCount = finalVideos.filter(v => v.type === 'image').length;

  // 4 other popular trends for crawl discovery & internal link equity
  const relatedCreators = creators
    .filter(c => c.name.toLowerCase() !== creatorName.toLowerCase())
    .slice(0, 4);

  // 1. Breadcrumbs Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Trends', url: '/#trending-videos' },
    { name: creatorName, url: `/creator/${encodeURIComponent(name)}` },
  ]);

  // 2. FAQ Schema for Google People Also Ask
  const faqSchema = generateTrendFaqSchema(creatorName, videoCount, photoCount);

  // 3. CollectionPage Schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${creatorName} Leaked Videos & Photos`,
    description: creatorObj?.bio || `Watch exclusive media and trending leaks of ${creatorName}.`,
    url: `${SITE_URL}/creator/${encodeURIComponent(name)}`,
    image: absoluteUrl(thumbnailUrl),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: finalVideos.slice(0, 10).map((vid, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: vid.title || `${creatorName} Media ${idx + 1}`,
        url: `${SITE_URL}/watch/${encodeURIComponent(vid.id)}`,
      })),
    },
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <CreatorClient
        videos={finalVideos}
        creatorName={creatorObj?.name || creatorName}
        bio={creatorObj?.bio || finalVideos[0]?.desc}
        thumbnailUrl={thumbnailUrl}
        relatedCreators={relatedCreators}
      />
    </>
  );
}
