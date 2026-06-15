import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
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
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      MaxKeys: 100,
    });
    const response = await s3.send(command);
    console.log('Total files in R2 bucket:', response.Contents?.length);
    response.Contents?.forEach(item => {
      console.log(`- Key: "${item.Key}", Size: ${item.Size}, LastModified: ${item.LastModified}`);
    });
  } catch (err) {
    console.error('Error listing R2 bucket:', err);
  }
}

main();
