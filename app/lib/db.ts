import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';

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
