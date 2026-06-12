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
    console.error('Error reading videos file in edit-title:', err);
    return [];
  }
}

async function writeVideosToFile(videos) {
  try {
    await fs.mkdir(path.dirname(VIDEOS_FILE_PATH), { recursive: true });
    await fs.writeFile(VIDEOS_FILE_PATH, JSON.stringify(videos, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing videos file in edit-title:', err);
    return false;
  }
}

async function testPOST() {
  try {
    const request = {
      json: async () => ({ id: 'r2-videos%2Fexample.mp4', interestingTitles: ['Awesome Video'] })
    };
    
    const { id, interestingTitles } = await request.json();

    if (!id || !Array.isArray(interestingTitles)) {
      console.log('400');
      return;
    }

    const dbVideos = await readVideosFromFile();
    const index = dbVideos.findIndex((v) => v.id === id);

    if (index > -1) {
      dbVideos[index].interestingTitles = interestingTitles;
    } else {
      // Create a skeleton entry for this video/image to store its custom titles
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
    if (!success) {
      throw new Error('Failed to write videos database file');
    }

    console.log('Success 200');
  } catch (err) {
    console.error('Error in POST /api/videos/edit-title:', err);
    console.log('500');
  }
}

testPOST();
