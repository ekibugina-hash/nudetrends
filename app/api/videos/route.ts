import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { Video } from '../../types';
import { readDb, writeDb } from '../../lib/db';

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
  return await readDb('videos.json');
}

async function writeVideosToFile(videos: any[]): Promise<boolean> {
  try {
    await writeDb('videos.json', videos);
    return true;
  } catch (err: any) {
    return false;
  }
}

export async function GET() {
  try {
    // 1. Read JSON db videos
    const dbVideos = await readVideosFromFile();

    // 2. Filter out deleted videos
    const activeDbVideos = dbVideos.filter((v: any) => !v.deleted);

    // 3. Scan Cloudflare R2 bucket for dynamic media
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
          const size = item.Size || 0;
          const lastModified = item.LastModified || new Date();

          if (key.endsWith('/') || !key) continue;

          const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(key);
          const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(key);

          if (!isVideo && !isImage) continue;

          const parts = key.split('/');
          
          // Extract title from filename (remove extension and cleanup)
          let title = key.split('/').pop()?.split('.')[0] || 'Untitled';
          title = title.replace(/[-_]/g, ' ');
          // Strip out quality tags like SD, HD, 1080p, 720p from the title
          title = title.replace(/\b(SD|HD|1080p|720p|4K)\b/gi, '').trim();
          title = title.replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          
          let creator = 'Premium Leak';
          if (parts.length >= 3) {
            creator = parts[1];
          }

          let category = isVideo ? 'Trending Videos' : 'Nudes';
          if (key.toLowerCase().includes('/nudes/') || key.toLowerCase().startsWith('nudes/') || key.toLowerCase().includes('/images/') || key.toLowerCase().startsWith('images/')) {
            category = 'Nudes';
          } else if (key.toLowerCase().includes('/videos/') || key.toLowerCase().startsWith('videos/')) {
            category = 'Trending Videos';
          }

          const rawViews = Math.floor((size % 900) + 120);
          const views = rawViews >= 100 ? `${(rawViews / 10).toFixed(1)}K views` : `${rawViews}K views`;

          const diffMs = Date.now() - lastModified.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);
          const diffWeeks = Math.floor(diffDays / 7);
          const diffMonths = Math.floor(diffDays / 30);

          let time = 'Just now';
          if (diffMonths > 0) {
            time = diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
          } else if (diffWeeks > 0) {
            time = diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
          } else if (diffDays > 0) {
            time = diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
          } else if (diffHours > 0) {
            time = diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
          }

          const publicUrl = `https://${publicDomain}/${key}`;

          const mediaItem: Video = {
            id: `r2-${encodeURIComponent(key)}`,
            title,
            creator,
            views,
            time,
            duration: isVideo ? '03:45' : 'IMAGE',
            desc: '',
            initials: creator.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'PL',
            gradient: `linear-gradient(135deg, ${['#2b1201', '#1c0a00', '#140700', '#2d0f00', '#2c0e00', '#1d0701'][Math.floor(Math.random() * 6)]}, #000000)`,
            category,
            type: isVideo ? 'video' : 'image',
            videoUrl: isVideo ? publicUrl : undefined,
            imageUrl: isImage ? publicUrl : undefined,
            thumbnailUrl: '',
            interestingTitles: []
          };

          r2Videos.push(mediaItem);
        }
      } catch (err) {
        console.error('Error listing R2 media in GET /api/videos:', err);
      }
    }

    // 4. Helper to extract upload timestamp from ID or R2 key
    const getMediaTimestamp = (item: Video): number => {
      if (!item || !item.id) return 0;
      if (item.id.startsWith('custom-')) {
        const parts = item.id.split('-');
        if (parts.length > 1) {
          const ts = parseInt(parts[1], 10);
          if (!isNaN(ts)) return ts;
        }
      }
      try {
        const decodedId = decodeURIComponent(item.id);
        const idMatch = String(item.id).match(/(videos|nudes|images)\/(\d+)-/);
        if (idMatch && idMatch[2]) {
          const ts = parseInt(idMatch[2], 10);
          if (!isNaN(ts)) return ts;
        }
      } catch (e) {
        return 0;
      }
      return 0;
    };

    // 5. Merge JSON DB videos and R2 videos
    const mergedVideos: Video[] = [];

    // Process all active DB videos first, merging properties with R2 counterparts if matched
    activeDbVideos.forEach((dbVid) => {
      const r2Match = r2Videos.find((r2Vid) => {
        const urlMatch = (dbVid.videoUrl && r2Vid.videoUrl && dbVid.videoUrl === r2Vid.videoUrl) ||
                         (dbVid.imageUrl && r2Vid.imageUrl && dbVid.imageUrl === r2Vid.imageUrl);
        return dbVid.id === r2Vid.id || urlMatch;
      });

      if (r2Match) {
        mergedVideos.push({
          ...r2Match,
          ...dbVid,
          title: dbVid.title || r2Match.title,
          creator: dbVid.creator || r2Match.creator,
          category: dbVid.category || r2Match.category,
          type: dbVid.type || r2Match.type,
          videoUrl: dbVid.videoUrl || r2Match.videoUrl,
          imageUrl: dbVid.imageUrl || r2Match.imageUrl,
          id: dbVid.id || r2Match.id,
          // DB skeleton might not have gradient/initials/views/time, inherit from R2 if missing
          views: dbVid.views || r2Match.views,
          time: dbVid.time || r2Match.time,
          initials: dbVid.initials || r2Match.initials,
          gradient: dbVid.gradient || r2Match.gradient,
          duration: dbVid.duration || r2Match.duration
        });
      } else {
        mergedVideos.push(dbVid);
      }
    });

    // Add R2 videos that are not represented in the DB
    r2Videos.forEach((r2Vid) => {
      const existsInDb = dbVideos.some((dbVid) => {
        const urlMatch = (dbVid.videoUrl && r2Vid.videoUrl && dbVid.videoUrl === r2Vid.videoUrl) ||
                         (dbVid.imageUrl && r2Vid.imageUrl && dbVid.imageUrl === r2Vid.imageUrl);
        return dbVid.id === r2Vid.id || urlMatch;
      });

      if (!existsInDb) {
        mergedVideos.push(r2Vid);
      }
    });

    // Sort the merged videos so new uploads appear at the top
    mergedVideos.sort((a, b) => getMediaTimestamp(b) - getMediaTimestamp(a));

    return NextResponse.json({
      success: true,
      media: mergedVideos,
    });
  } catch (err: any) {
    console.error('Error in GET /api/videos:', err);
    return NextResponse.json(
      { error: 'Internal server error while fetching videos', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const newVideo = await request.json();

    if (!newVideo || !newVideo.id || !newVideo.title) {
      return NextResponse.json(
        { error: 'Missing required video fields' },
        { status: 400 }
      );
    }

    const dbVideos = await readVideosFromFile();
    
    // Add new video, ensuring no ID duplicate (overwrite or append)
    const index = dbVideos.findIndex((v) => v.id === newVideo.id);
    if (index > -1) {
      dbVideos[index] = { ...dbVideos[index], ...newVideo, deleted: false };
    } else {
      dbVideos.push({ ...newVideo, deleted: false, interestingTitles: newVideo.interestingTitles || [] });
    }

    const success = await writeVideosToFile(dbVideos);
    if (!success) {
      throw new Error('Failed to write videos database file');
    }

    return NextResponse.json({
      success: true,
      video: newVideo,
    });
  } catch (err: any) {
    console.error('Error in POST /api/videos:', err);
    return NextResponse.json(
      { error: 'Internal server error while creating video', details: err.message },
      { status: 500 }
    );
  }
}
