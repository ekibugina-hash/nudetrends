import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { Video } from '../types';
import { unstable_cache } from 'next/cache';

// Initialize Cloudflare R2 S3 Client
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Reads a JSON database file from Cloudflare R2.
 * If the file doesn't exist in R2 yet (e.g. first migration),
 * it gracefully falls back to reading the local data/ folder.
 */
export async function readDb(fileName: string): Promise<any[]> {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    console.warn('R2_BUCKET_NAME is not set, falling back to local file.');
    return fallbackToLocal(fileName);
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: `database/${fileName}`,
    });
    
    const response = await s3.send(command);
    const body = await response.Body?.transformToString();
    return body ? JSON.parse(body) : [];
  } catch (err: any) {
    if (err.name === 'NoSuchKey') {
      // It's not in R2 yet. Read from local system once so we can migrate it.
      return fallbackToLocal(fileName);
    }
    console.error(`Error reading ${fileName} from R2:`, err);
    return [];
  }
}

/**
 * Fallback mechanism to read local JSON files.
 */
async function fallbackToLocal(fileName: string): Promise<any[]> {
  try {
    const localPath = path.join(process.cwd(), 'data', fileName);
    const data = await fs.readFile(localPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading local fallback for ${fileName}:`, err);
    return [];
  }
}

/**
 * Writes a JSON database array to Cloudflare R2.
 * This completely avoids the Vercel EROFS read-only filesystem error.
 */
export async function writeDb(fileName: string, data: any[]): Promise<boolean> {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    console.error('Cannot write to DB: R2_BUCKET_NAME is not configured.');
    return false;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `database/${fileName}`,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    });
    
    await s3.send(command);
    return true;
  } catch (err) {
    console.error(`Error writing ${fileName} to R2:`, err);
    throw err; // Throw to bubble up the actual R2 error to the UI
  }
}

/**
 * Scans Cloudflare R2 bucket and merges R2 files with local JSON database records,
 * returning a sorted list of active videos.
 */
async function getMergedVideosUncached(): Promise<Video[]> {
  // 1. Read JSON db videos
  const dbVideos = await readDb('videos.json');
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
        const size = item.Size || 0;
        const lastModified = item.LastModified || new Date();

        if (key.endsWith('/') || !key || key.startsWith('ads/')) continue;

        const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(key);
        const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(key);

        if (!isVideo && !isImage) continue;

        const parts = key.split('/');
        
        let title = key.split('/').pop()?.split('.')[0] || 'Untitled';
        title = title.replace(/[-_]/g, ' ');
        title = title.replace(/\b(SD|HD|1080p|720p|4K)\b/gi, '').trim();
        title = title.replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        
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
          uploadedAt: lastModified.getTime(), // real R2 upload timestamp
          interestingTitles: []
        };

        r2Videos.push(mediaItem);
      }
    } catch (err) {
      console.error('Error listing R2 media in getMergedVideos:', err);
    }
  }

  // 3. Helper to extract upload timestamp from ID or R2 key
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

  // 4. Merge lists
  const mergedVideos: Video[] = [];

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
        views: dbVid.views || r2Match.views,
        time: dbVid.time || r2Match.time,
        initials: dbVid.initials || r2Match.initials,
        gradient: dbVid.gradient || r2Match.gradient,
        duration: dbVid.duration || r2Match.duration,
        uploadedAt: r2Match.uploadedAt || dbVid.uploadedAt, // prefer R2 real timestamp
      });
    } else {
      if (dbVid.videoUrl || dbVid.imageUrl) {
        mergedVideos.push(dbVid);
      }
    }
  });

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

  mergedVideos.sort((a, b) => {
    const timeA = getMediaTimestamp(a) || a.uploadedAt || 0;
    const timeB = getMediaTimestamp(b) || b.uploadedAt || 0;
    return timeB - timeA;
  });

  return mergedVideos;
}

export const getMergedVideos = unstable_cache(
  getMergedVideosUncached,
  ['merged-videos'],
  { revalidate: 60, tags: ['videos'] }
);
