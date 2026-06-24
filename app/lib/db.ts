import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { Video } from '../types';
import { unstable_cache } from 'next/cache';

// ─── Shared S3 Client ──────────────────────────────────────────────────────
// Exported so other modules (delete, presigned-url) can reuse it without
// creating duplicate instances.
export const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

// ─── Deterministic gradient helper ────────────────────────────────────────
// Derives a gradient from the item's ID so the value is stable across renders,
// preventing SSR/CSR hydration mismatches from Math.random().
const GRADIENT_COLORS = ['#2b1201', '#1c0a00', '#140700', '#2d0f00', '#2c0e00', '#1d0701'];

function deterministicGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const color = GRADIENT_COLORS[hash % GRADIENT_COLORS.length];
  return `linear-gradient(135deg, ${color}, #000000)`;
}

// ─── JSON Database (backed by Cloudflare R2) ──────────────────────────────

/**
 * Reads a JSON database file from Cloudflare R2.
 * Falls back to the local `data/` folder if the file doesn't exist in R2.
 * Returns `any` so callers can handle both array and object payloads.
 */
export async function readDb(fileName: string): Promise<any> {
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
      return fallbackToLocal(fileName);
    }
    console.error(`Error reading ${fileName} from R2:`, err);
    return [];
  }
}

/**
 * Fallback mechanism to read local JSON files.
 */
async function fallbackToLocal(fileName: string): Promise<any> {
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
 * Writes any JSON-serializable value (array OR object) to Cloudflare R2.
 */
export async function writeDb(fileName: string, data: any): Promise<boolean> {
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
    throw err; // Bubble up the actual R2 error to the caller
  }
}

// ─── R2 Media Listing & Merge ──────────────────────────────────────────────

/**
 * Lists ALL objects in the R2 bucket, handling pagination automatically
 * so buckets with more than 1000 objects are fully scanned.
 */
async function listAllR2Objects(bucketName: string) {
  const allObjects: any[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000,
      ContinuationToken: continuationToken,
    });
    const response = await s3.send(command);
    if (response.Contents) allObjects.push(...response.Contents);
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return allObjects;
}

/**
 * Formats a LastModified date into a human-readable relative string.
 */
function formatRelativeTime(lastModified: Date): string {
  const diffMs = Date.now() - lastModified.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths > 0) return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  if (diffWeeks > 0) return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
  if (diffDays > 0) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  if (diffHours > 0) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  return 'Just now';
}

/**
 * Formats a view count from file size into a realistic-looking string.
 * Uses file size modulo to keep it deterministic (not random).
 * All results now display consistently as "X.XK views".
 */
function formatViews(size: number): string {
  const rawViews = (size % 900) + 120; // always 120–1019
  return `${(rawViews / 10).toFixed(1)}K views`;
}

/**
 * Scans Cloudflare R2 bucket and merges R2 files with local JSON database records,
 * returning a sorted list of active videos.
 */
async function getMergedVideosUncached(): Promise<Video[]> {
  // 1. Read JSON db videos
  const dbVideos = await readDb('videos.json');
  const activeDbVideos = Array.isArray(dbVideos) ? dbVideos.filter((v: any) => !v.deleted) : [];

  // 2. Scan Cloudflare R2 bucket
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
  const accountId = process.env.R2_ACCOUNT_ID;

  let r2Videos: Video[] = [];

  if (bucketName && publicDomain && accountId) {
    try {
      const contents = await listAllR2Objects(bucketName);

      for (const item of contents) {
        const key = item.Key || '';
        const size = item.Size || 0;
        const lastModified = item.LastModified || new Date();

        if (key.endsWith('/') || !key || key.startsWith('ads/') || key.startsWith('database/')) continue;

        const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(key);
        const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(key);

        if (!isVideo && !isImage) continue;

        const parts = key.split('/');

        let title = parts[parts.length - 1]?.split('.')[0] || 'Untitled';
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

        const id = `r2-${encodeURIComponent(key)}`;
        const publicUrl = `https://${publicDomain}/${key}`;

        const mediaItem: Video = {
          id,
          title,
          creator,
          views: formatViews(size),
          time: formatRelativeTime(lastModified),
          duration: isVideo ? '03:45' : 'IMAGE',
          desc: '',
          initials: creator.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'PL',
          gradient: deterministicGradient(id),
          category,
          type: isVideo ? 'video' : 'image',
          videoUrl: isVideo ? publicUrl : undefined,
          imageUrl: isImage ? publicUrl : undefined,
          thumbnailUrl: '',
          uploadedAt: lastModified.getTime(),
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
    if (!item?.id) return 0;
    if (item.id.startsWith('custom-')) {
      const ts = parseInt(item.id.split('-')[1], 10);
      if (!isNaN(ts)) return ts;
    }
    try {
      // Decode the ID first so the regex works on the actual path
      const decodedId = decodeURIComponent(item.id);
      const idMatch = decodedId.match(/(videos|nudes|images)\/(\d+)-/);
      if (idMatch && idMatch[2]) {
        const ts = parseInt(idMatch[2], 10);
        if (!isNaN(ts)) return ts;
      }
    } catch {
      return 0;
    }
    return 0;
  };

  // 4. Merge lists
  const mergedVideos: Video[] = [];

  activeDbVideos.forEach((dbVid: any) => {
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
        gradient: deterministicGradient(dbVid.id || r2Match.id),
        duration: dbVid.duration || r2Match.duration,
        uploadedAt: r2Match.uploadedAt || dbVid.uploadedAt,
      });
    } else {
      if (dbVid.videoUrl || dbVid.imageUrl) {
        mergedVideos.push({
          ...dbVid,
          gradient: deterministicGradient(dbVid.id),
        });
      }
    }
  });

  r2Videos.forEach((r2Vid) => {
    const existsInDb = (Array.isArray(dbVideos) ? dbVideos : []).some((dbVid: any) => {
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
