import { getMergedVideos } from '../../lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import WatchContent from './WatchContent';
import { absoluteUrl, formatIsoDuration, generateBreadcrumbSchema, SITE_URL } from '../../lib/seo';

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

// Generate fully dynamic SEO metadata per video
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const videos = await getMergedVideos();
  const video = videos.find((v) => v.id === decodedId);

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

  const imageUrl = absoluteUrl(video.imageUrl || video.thumbnailUrl);
  const canonicalUrl = `${SITE_URL}/watch/${encodeURIComponent(id)}`;
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

export default async function WatchPage({ params }: Props) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const videos = await getMergedVideos();
  const video = videos.find((v) => v.id === decodedId);

  // Show 404 page if the video ID doesn't match any content
  if (!video) {
    notFound();
  }

  // Pass full list for "related videos" on the client
  const related = videos.filter((v) => v.id !== video.id).slice(0, 8);

  const isVideo = video.type === 'video';
  const uploadDate = video.uploadedAt
    ? new Date(video.uploadedAt).toISOString()
    : new Date().toISOString();

  const canonicalUrl = `${SITE_URL}/watch/${encodeURIComponent(id)}`;
  const thumbUrl = absoluteUrl(video.thumbnailUrl || video.imageUrl);
  const mediaUrl = absoluteUrl(video.videoUrl || video.imageUrl);

  // 1. Breadcrumbs Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: video.creator || 'Trends', url: video.creator ? `/creator/${encodeURIComponent(video.creator)}` : '/' },
    { name: video.title || 'Stream', url: `/watch/${encodeURIComponent(id)}` },
  ]);

  // 2. VideoObject or ImageObject Schema
  const mediaSchema = isVideo
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: video.title || 'Exclusive Stream',
        description: video.desc || `Watch ${video.title || 'exclusive content'} on NudeTrends Uganda.`,
        thumbnailUrl: [thumbUrl],
        uploadDate: uploadDate,
        duration: formatIsoDuration(video.duration),
        contentUrl: mediaUrl,
        embedUrl: canonicalUrl,
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: { '@type': 'WatchAction' },
          userInteractionCount: parseInt((video.views || '1200').replace(/[^0-9]/g, ''), 10) || 1200,
        },
        author: {
          '@type': 'Person',
          name: video.creator || 'NudeTrends Uganda',
        },
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        name: video.title || 'Exclusive Photo Leak',
        description: video.desc || `High quality photo leak on NudeTrends Uganda.`,
        contentUrl: mediaUrl,
        thumbnailUrl: thumbUrl,
        datePublished: uploadDate,
        author: {
          '@type': 'Person',
          name: video.creator || 'NudeTrends Uganda',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mediaSchema) }}
      />
      <WatchContent video={video} relatedVideos={related} />
    </>
  );
}
