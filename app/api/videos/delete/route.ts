import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { Video } from '../../../types';
import fs from 'fs/promises';
import path from 'path';
import { readDb, writeDb } from '../../../lib/db';

// Initialize Cloudflare R2 S3 Client
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

async function readVideosFromFile(): Promise<any[]> {
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

export async function POST(request: Request) {
  try {
    const { id, fileUrl } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing video ID parameter' },
        { status: 400 }
      );
    }

    // 1. Mark as deleted in our server database JSON file
    const dbVideos = await readVideosFromFile();
    const index = dbVideos.findIndex((v) => v.id === id);

    if (index > -1) {
      dbVideos[index].deleted = true;
    } else {
      // If it's a dynamic R2 video or not in DB, add a record with deleted: true
      dbVideos.push({
        id,
        title: 'Deleted Video',
        creator: '',
        views: '0',
        time: '',
        duration: '',
        desc: '',
        initials: '',
        gradient: '',
        category: '',
        videoUrl: fileUrl || '',
        deleted: true
      });
    }

    const dbSuccess = await writeVideosToFile(dbVideos);
    if (!dbSuccess) {
      throw new Error('Failed to update videos database file');
    }

    // 2. If it's hosted in R2, delete the S3 object
    let r2Deleted = false;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (fileUrl && bucketName && (
      fileUrl.includes('r2.cloudflarestorage.com') ||
      fileUrl.includes(process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'nudetrends.afrozex.com') ||
      fileUrl.includes('nudetrends')
    )) {
      try {
        let fileKey = '';
        try {
          const url = new URL(fileUrl);
          fileKey = decodeURIComponent(url.pathname.substring(1));
        } catch (e) {
          fileKey = fileUrl;
        }

        if (fileKey) {
          const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
          });
          await s3.send(command);
          r2Deleted = true;
        }
      } catch (err) {
        console.error('R2 deletion failed during delete API call:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Video ${id} marked as deleted.`,
      r2Deleted
    });
  } catch (err: any) {
    console.error('Error in POST /api/videos/delete:', err);
    return NextResponse.json(
      { error: 'Internal server error while deleting video', details: err.message },
      { status: 500 }
    );
  }
}
