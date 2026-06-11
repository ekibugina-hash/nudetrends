import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

// Initialize Cloudflare R2 S3 Client
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: Request) {
  try {
    const { fileUrl } = await request.json();

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'Missing fileUrl parameter in body' },
        { status: 400 }
      );
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json(
        { error: 'R2 bucket name is not configured on the server.' },
        { status: 500 }
      );
    }

    // Parse the file key from the URL
    // e.g. https://public-domain.com/videos/123-my_video.mp4
    let fileKey = '';
    try {
      const url = new URL(fileUrl);
      // Remove leading slash to get R2 Key
      fileKey = decodeURIComponent(url.pathname.substring(1));
    } catch (e) {
      // If it's not a full URL, assume it might be the key itself
      fileKey = fileUrl;
    }

    if (!fileKey) {
      return NextResponse.json(
        { error: 'Could not extract valid file key from the provided URL' },
        { status: 400 }
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    await s3.send(command);

    return NextResponse.json({
      success: true,
      message: `Object with key '${fileKey}' successfully deleted from R2.`,
    });
  } catch (err: any) {
    console.error('Error deleting Cloudflare R2 media:', err);
    return NextResponse.json(
      { error: 'Internal server error while deleting R2 media object', details: err.message },
      { status: 500 }
    );
  }
}
