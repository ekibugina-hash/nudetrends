import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

async function main() {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: 'database/videos.json',
    });
    const response = await s3.send(command);
    const body = await response.Body.transformToString();
    const videos = JSON.parse(body);
    console.log('Total videos in R2 database:', videos.length);
    videos.forEach(v => {
      console.log(`- Title: "${v.title}", ID: "${v.id}", uploadedAt: ${v.uploadedAt}, videoUrl: ${v.videoUrl ? 'yes' : 'no'}`);
    });
  } catch (err) {
    console.error('Error fetching database:', err);
  }
}

main();
