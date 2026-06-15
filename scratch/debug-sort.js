import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
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
  // 1. db videos
  const dbCommand = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: 'database/videos.json'
  });
  const dbBody = await (await s3.send(dbCommand)).Body.transformToString();
  const dbVideos = JSON.parse(dbBody).filter(v => !v.deleted);

  // 2. r2 videos
  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET_NAME,
    MaxKeys: 1000
  });
  const r2Res = await s3.send(listCommand);
  const r2Videos = [];
  
  for (const item of r2Res.Contents || []) {
    const key = item.Key || '';
    if (key.endsWith('/') || !key || key.startsWith('ads/')) continue;
    const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(key);
    const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(key);
    if (!isVideo && !isImage) continue;

    r2Videos.push({
      id: `r2-${encodeURIComponent(key)}`,
      title: key,
      uploadedAt: item.LastModified.getTime()
    });
  }

  const getMediaTimestamp = (item) => {
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

  const mergedVideos = [];
  dbVideos.forEach(dbVid => {
    const r2Match = r2Videos.find(r2Vid => dbVid.id === r2Vid.id);
    if (r2Match) {
      mergedVideos.push({ ...r2Match, ...dbVid, uploadedAt: r2Match.uploadedAt || dbVid.uploadedAt });
    } else {
      mergedVideos.push(dbVid);
    }
  });

  r2Videos.forEach(r2Vid => {
    const exists = dbVideos.some(dbVid => dbVid.id === r2Vid.id);
    if (!exists) mergedVideos.push(r2Vid);
  });

  mergedVideos.sort((a, b) => {
    const timeA = getMediaTimestamp(a) || a.uploadedAt || 0;
    const timeB = getMediaTimestamp(b) || b.uploadedAt || 0;
    return timeB - timeA;
  });

  console.log("Top 10 videos after sort:");
  mergedVideos.slice(0, 10).forEach(v => {
    console.log(`- Title: ${v.title}, uploadedAt: ${v.uploadedAt}, getMediaTimestamp: ${getMediaTimestamp(v)}`);
  });
}

main();
