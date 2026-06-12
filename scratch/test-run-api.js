import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_FILE_PATH = path.join(__dirname, '..', 'data', 'videos.json');

async function readVideosFromFile() {
  try {
    const data = await fs.readFile(VIDEOS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading:', err);
    return [];
  }
}

async function writeVideosToFile(videos) {
  try {
    await fs.mkdir(path.dirname(VIDEOS_FILE_PATH), { recursive: true });
    await fs.writeFile(VIDEOS_FILE_PATH, JSON.stringify(videos, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing:', err);
    return false;
  }
}

async function runTest() {
  try {
    const id = 'test-video';
    const interestingTitles = ['Test Title'];

    const dbVideos = await readVideosFromFile();
    console.log('dbVideos:', dbVideos);
    const index = dbVideos.findIndex((v) => v.id === id);

    if (index > -1) {
      dbVideos[index].interestingTitles = interestingTitles;
    } else {
      dbVideos.push({
        id,
        title: '',
        creator: '',
        views: '',
        time: '',
        duration: '',
        desc: '',
        initials: '',
        gradient: '',
        category: '',
        interestingTitles,
        deleted: false
      });
    }

    const success = await writeVideosToFile(dbVideos);
    console.log('Success:', success);
  } catch (err) {
    console.error('Run error:', err);
  }
}

runTest();
