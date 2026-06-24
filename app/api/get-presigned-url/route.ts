import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '../../lib/db';
import { isAdminRequest } from '../../lib/auth';

export async function POST(request: NextRequest) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileName, fileType, isAd } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'Missing fileName or fileType parameters in body' },
        { status: 400 }
      );
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;

    if (!bucketName || !publicDomain) {
      return NextResponse.json(
        { error: 'R2 bucket name or public domain is not configured on the server.' },
        { status: 500 }
      );
    }

    // Generate a unique object key under the appropriate folder path
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const isImage = fileType.toLowerCase().startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
    let folder = isImage ? 'images' : 'videos';
    if (isAd) folder = 'ads';
    const safeFileName = fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const fileKey = `${folder}/${Date.now()}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
    });

    // Generate a secure PUT upload URL that expires in 1 hour (3600 seconds)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const publicUrl = `https://${publicDomain}/${fileKey}`;

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err: any) {
    console.error('Error generating Cloudflare R2 presigned URL:', err);
    return NextResponse.json(
      { error: 'Internal server error while generating upload signer token', details: err.message },
      { status: 500 }
    );
  }
}
