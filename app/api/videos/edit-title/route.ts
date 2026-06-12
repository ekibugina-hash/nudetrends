import { NextResponse } from 'next/server';
import { Video } from '../../../types';
import fs from 'fs/promises';
import path from 'path';

const VIDEOS_FILE_PATH = path.join(process.cwd(), 'data', 'videos.json');

async function readVideosFromFile(): Promise<any[]> {
  try {
    const data = await fs.readFile(VIDEOS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading videos file in edit-title:', err);
    return [];
  }
}

async function writeVideosToFile(videos: any[]): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(VIDEOS_FILE_PATH), { recursive: true });
    await fs.writeFile(VIDEOS_FILE_PATH, JSON.stringify(videos, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing videos file in edit-title:', err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { id, interestingTitles } = await request.json();

    if (!id || !Array.isArray(interestingTitles)) {
      return NextResponse.json(
        { error: 'Missing video id or interestingTitles array parameter' },
        { status: 400 }
      );
    }

    const dbVideos = await readVideosFromFile();
    const index = dbVideos.findIndex((v) => v.id === id);

    if (index > -1) {
      dbVideos[index].interestingTitles = interestingTitles;
    } else {
      // Create a skeleton entry for this video/image to store its custom titles
      // This happens when an R2-sourced item hasn't been explicitly saved to the DB yet
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
        type: 'video', // Default to video, will be merged with R2 dynamically
        videoUrl: '',
        imageUrl: '',
        thumbnailUrl: '',
        interestingTitles,
        deleted: false
      });
    }

    const success = await writeVideosToFile(dbVideos);
    if (!success) {
      throw new Error('Failed to write videos database file');
    }

    return NextResponse.json({
      success: true,
      message: 'Interesting titles updated successfully',
      interestingTitles
    });
  } catch (err: any) {
    console.error('Error in POST /api/videos/edit-title:', err);
    return NextResponse.json(
      { error: 'Internal server error while updating interesting titles', details: err.message },
      { status: 500 }
    );
  }
}
