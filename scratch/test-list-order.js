import { getMergedVideos } from '../app/lib/db.js';

async function main() {
  const videos = await getMergedVideos();
  console.log('Videos in order:');
  videos.forEach((v, i) => {
    console.log(`${i + 1}. Title: "${v.title}", ID: "${v.id}", uploadedAt: ${v.uploadedAt}`);
  });
}

main();
