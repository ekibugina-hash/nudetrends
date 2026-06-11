import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { Video } from '../../types';

// Initialize Cloudflare R2 S3 Client
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function GET() {
  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;

    // Graceful check if credentials are missing
    if (!bucketName || !publicDomain || !process.env.R2_ACCOUNT_ID) {
      console.warn("R2 credentials not fully populated. Dynamic listing returned empty.");
      return NextResponse.json({ success: true, media: [] });
    }

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000,
    });

    const response = await s3.send(command);
    const contents = response.Contents || [];

    const parsedMedia: Video[] = [];

    for (const item of contents) {
      const key = item.Key || '';
      const size = item.Size || 0;
      const lastModified = item.LastModified || new Date();

      // Skip folders or system files
      if (key.endsWith('/') || !key) continue;

      const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(key);
      const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(key);

      // Skip unsupported files
      if (!isVideo && !isImage) continue;

      // Parse metadata from key path
      // E.g. videos/LeakVault/Amateur_Exam_Week.mp4
      const parts = key.split('/');
      const filenameWithExt = parts[parts.length - 1];
      const filename = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.')) || filenameWithExt;
      
      // Title: Humanized name
      const title = filename
        .replace(/[_-]+/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Creator: Check subfolder structure
      let creator = 'Premium Leak';
      if (parts.length >= 3) {
        // e.g. videos/LeakVault/file.mp4 -> creator is LeakVault
        creator = parts[1];
      }

      // Category placement based on key prefix
      let category = 'Trending Videos';
      if (isVideo) {
        category = 'Trending Videos';
      } else if (isImage) {
        category = 'Nudes';
      }

      // Double-check if parent folder is explicitly 'nudes' or 'images'
      if (key.toLowerCase().includes('/nudes/') || key.toLowerCase().startsWith('nudes/')) {
        category = 'Nudes';
      } else if (key.toLowerCase().includes('/videos/') || key.toLowerCase().startsWith('videos/')) {
        category = 'Trending Videos';
      }

      // Views formatting (derived from file size to keep it realistic)
      const rawViews = Math.floor((size % 900) + 120);
      const views = rawViews >= 100 ? `${(rawViews / 10).toFixed(1)}K views` : `${rawViews}K views`;

      // Time formatting (relative string from LastModified)
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

      // Build media object
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
        thumbnailUrl: ''
      };

      parsedMedia.push(mediaItem);
    }

    return NextResponse.json({
      success: true,
      media: parsedMedia,
    });
  } catch (err: any) {
    console.error('Error fetching dynamic R2 media list:', err);
    return NextResponse.json(
      { error: 'Internal server error while listing R2 media', details: err.message },
      { status: 500 }
    );
  }
}
