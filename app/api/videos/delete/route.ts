import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Video } from '../../../types';
import { readDb, writeDb, s3 } from '../../../lib/db';
import { isAdminRequest } from '../../../lib/auth';
import { revalidateTag } from 'next/cache';

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

export async function POST(request: NextRequest) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
      // If it's a dynamic R2 video not in DB, add a record with deleted: true
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

    // @ts-ignore
    revalidateTag('videos');

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
