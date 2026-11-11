import type { Metadata } from 'next';
import { getMergedVideos, getCreators } from '../../lib/db';
import CreatorClient from './CreatorClient';

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
  const title = `${creatorName} - Leaks, Trends & Exclusive Media | NudeTrends`;
  const desc = (creatorObj?.bio || firstMedia?.desc || `Watch all exclusive video leaks and photo trends of ${creatorName} on NudeTrends.`).slice(0, 160);
  const image = creatorObj?.thumbnailUrl || firstMedia?.thumbnailUrl || firstMedia?.imageUrl || 'https://nudetrends.afrozex.com/images/sponsor-banner.jpg';
  const url = `https://nudetrends.afrozex.com/creator/${encodeURIComponent(name)}`;

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
      siteName: 'NudeTrends',
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
  
  return (
    <CreatorClient
      videos={finalVideos}
      creatorName={creatorObj?.name || creatorName}
      bio={creatorObj?.bio || finalVideos[0]?.desc}
      thumbnailUrl={thumbnailUrl}
    />
  );
}
