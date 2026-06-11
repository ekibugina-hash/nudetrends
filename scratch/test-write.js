import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  const VIDEOS_FILE_PATH = path.join(__dirname, '..', 'data', 'videos.json');
  console.log('Path:', VIDEOS_FILE_PATH);
  try {
    const data = await fs.readFile(VIDEOS_FILE_PATH, 'utf-8');
    console.log('Read data:', data);
    const parsed = JSON.parse(data);
    console.log('Parsed:', parsed);
    parsed.push({ test: true });
    await fs.writeFile(VIDEOS_FILE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    console.log('Write success!');
    // Revert it
    await fs.writeFile(VIDEOS_FILE_PATH, '[]', 'utf-8');
    console.log('Revert success!');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
