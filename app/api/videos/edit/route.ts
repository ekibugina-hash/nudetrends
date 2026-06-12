import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const VIDEOS_FILE_PATH = path.join(process.cwd(), 'data', 'videos.json');

async function readVideosFromFile(): Promise<any[]> {
  try {
    const data = await fs.readFile(VIDEOS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function writeVideosToFile(videos: any[], retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.mkdir(path.dirname(VIDEOS_FILE_PATH), { recursive: true });
      await fs.writeFile(VIDEOS_FILE_PATH, JSON.stringify(videos, null, 2), 'utf-8');
      return true;
    } catch (err: any) {
      if ((err.code === 'EBUSY' || err.code === 'EPERM') && i < retries - 1) {
        await new Promise(res => setTimeout(res, 100 * (i + 1))); // Wait and retry
        continue;
      }
      console.error('Error writing videos file in edit/route:', err);
      return false;
    }
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { id } = payload;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing video id parameter' },
        { status: 400 }
      );
    }

    const dbVideos = await readVideosFromFile();
    const index = dbVideos.findIndex((v) => v.id === id);

    if (index > -1) {
      // Merge all provided payload fields into the existing entry.
      // This makes the endpoint type-agnostic: desc, type, imageUrl, videoUrl etc.
      // all get persisted regardless of media type.
      const { id: _id, ...fields } = payload;
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) {
          (dbVideos[index] as any)[key] = value;
        }
      });
    } else {
      // Create a skeleton entry with defaults for missing fields
      dbVideos.push({
        id,
        title: payload.title || '',
        creator: payload.creator || '',
        desc: payload.desc || '',
        type: payload.type || 'video',
        category: payload.category || '',
        imageUrl: payload.imageUrl || '',
        videoUrl: payload.videoUrl || '',
        thumbnailUrl: payload.thumbnailUrl || '',
        views: '',
        time: '',
        duration: '',
        initials: '',
        gradient: '',
        interestingTitles: [],
        deleted: false,
      });
    }

    const success = await writeVideosToFile(dbVideos);
    if (!success) {
      throw new Error('Failed to write videos database file');
    }

    return NextResponse.json({
      success: true,
      message: 'Media details updated successfully',
    });
  } catch (err: any) {
    console.error('Error in POST /api/videos/edit:', err);
    return NextResponse.json(
      { error: 'Internal server error while updating media details', details: err.message },
      { status: 500 }
    );
  }
}
