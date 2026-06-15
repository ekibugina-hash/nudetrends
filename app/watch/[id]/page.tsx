import { getMergedVideos } from '../../lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import WatchContent from './WatchContent';

const SITE_URL = process.env.APP_URL || 'https://nudetrends.afrozex.com';

interface Props {
  params: { id: string };
}

// Generate fully dynamic SEO metadata per video — this is what gives each video its own Google footprint
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const videos = await getMergedVideos();
  const video = videos.find((v) => v.id === decodeURIComponent(params.id));

  if (!video) {
    return {
      title: 'Content Not Found | NudeTrends Uganda',
      description: 'This video or image could not be found. Browse the latest trending nudes and premium videos on NudeTrends Uganda.',
    };
  }

  const title = video.title
    ? `${video.title} | NudeTrends Uganda`
    : 'Premium Exclusive Content | NudeTrends Uganda';

  const description = video.desc
    ? `${video.desc.slice(0, 160)} — Watch on NudeTrends Uganda.`
    : `Watch ${video.title || 'this exclusive premium content'} on NudeTrends Uganda — Uganda's #1 source for trending nudes and leaked videos.`;

  const imageUrl = video.imageUrl || video.thumbnailUrl || `${SITE_URL}/logo.png`;
  const canonicalUrl = `${SITE_URL}/watch/${params.id}`;
  const videoType = video.type === 'video' ? 'video.other' : 'article';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'NudeTrends Uganda',
      locale: 'en_UG',
      type: videoType,
      images: [
        {
          url: imageUrl,
          width: 1280,
          height: 720,
          alt: video.title || 'NudeTrends Content',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function WatchPage({ params }: Props) {
  const videos = await getMergedVideos();
  const video = videos.find((v) => v.id === decodeURIComponent(params.id));

  // Show 404 page if the video ID doesn't match any content
  if (!video) {
    notFound();
  }

  // Pass full list for "related videos" on the client
  const related = videos.filter((v) => v.id !== video.id).slice(0, 8);

  return (
    <>
      {/* Inject structured data (VideoObject schema) directly in the page for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': video.type === 'video' ? 'VideoObject' : 'ImageObject',
            name: video.title || 'Untitled Content',
            description: video.desc || `Premium exclusive content on NudeTrends Uganda.`,
            thumbnailUrl: video.imageUrl || video.thumbnailUrl || `${SITE_URL}/logo.png`,
            uploadDate: new Date().toISOString(),
            contentUrl: video.videoUrl || video.imageUrl || '',
            embedUrl: `${SITE_URL}/watch/${params.id}`,
            author: {
              '@type': 'Person',
              name: video.creator || 'NudeTrends Uganda',
            },
          }),
        }}
      />
      <WatchContent video={video} relatedVideos={related} />
    </>
  );
}
