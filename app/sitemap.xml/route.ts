import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Video } from '../types';
import fs from 'fs/promises';
import path from 'path';

const VIDEOS_FILE_PATH = path.join(process.cwd(), 'data', 'videos.json');

// Initialize Cloudflare R2 S3 Client
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

async function readVideosFromFile(): Promise<Video[]> {
  try {
    const data = await fs.readFile(VIDEOS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

export async function GET() {
  try {
    const appUrl = process.env.APP_URL || 'https://nudetrends.afrozex.com';

    // 1. Read JSON db videos
    const dbVideos = await readVideosFromFile();
    const activeDbVideos = dbVideos.filter((v: any) => !v.deleted);

    // 2. Scan Cloudflare R2 bucket
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
    const accountId = process.env.R2_ACCOUNT_ID;

    let r2Videos: Video[] = [];

    if (bucketName && publicDomain && accountId) {
      try {
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 1000,
        });

        const response = await s3.send(command);
        const contents = response.Contents || [];

        for (const item of contents) {
          const key = item.Key || '';
          if (key.endsWith('/') || !key) continue;

          const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(key);
          const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(key);

          if (!isVideo && !isImage) continue;

          const publicUrl = `https://${publicDomain}/${key}`;
          const mediaItem: Video = {
            id: `r2-${encodeURIComponent(key)}`,
            title: '',
            creator: '',
            views: '',
            time: '',
            duration: '',
            desc: '',
            initials: '',
            gradient: '',
            category: '',
            type: isVideo ? 'video' : 'image',
            videoUrl: isVideo ? publicUrl : undefined,
            imageUrl: isImage ? publicUrl : undefined,
            interestingTitles: []
          };

          r2Videos.push(mediaItem);
        }
      } catch (err) {
        console.error('R2 scan failed in sitemap route:', err);
      }
    }

    // 3. Merge lists to get unique active items
    const mergedVideos = [...activeDbVideos];

    r2Videos.forEach((r2Vid) => {
      const existsInDb = dbVideos.some((dbVid: any) => {
        const urlMatch = (dbVid.videoUrl && r2Vid.videoUrl && dbVid.videoUrl === r2Vid.videoUrl) ||
                         (dbVid.imageUrl && r2Vid.imageUrl && dbVid.imageUrl === r2Vid.imageUrl);
        return dbVid.id === r2Vid.id || urlMatch;
      });

      if (!existsInDb) {
        mergedVideos.push(r2Vid);
      }
    });

    // 4. Generate XML content
    const currentDate = new Date().toISOString();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add landing page
    xml += `  <url>\n`;
    xml += `    <loc>${appUrl}/</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // Add category filters as dynamic pages
    xml += `  <url>\n`;
    xml += `    <loc>${appUrl}/?category=Trending%20Videos</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;

    xml += `  <url>\n`;
    xml += `    <loc>${appUrl}/?category=Nudes</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;

    // Add dynamic watch pages for all active videos
    mergedVideos.forEach((video) => {
      xml += `  <url>\n`;
      xml += `    <loc>${appUrl}/?watch=${video.id}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600'
      }
    });
  } catch (err: any) {
    console.error('Error generating sitemap XML:', err);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
