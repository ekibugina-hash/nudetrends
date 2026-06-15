import { NextResponse } from 'next/server';
import { Video } from '../../types';
import { readDb, writeDb, getMergedVideos } from '../../lib/db';

async function readVideosFromFile(): Promise<Video[]> {
  return await readDb('videos.json');
}

async function writeVideosToFile(videos: any[]): Promise<boolean> {
  try {
    await writeDb('videos.json', videos);
    return true;
  } catch (err: any) {
    return false;
  }
}

export async function GET() {
  try {
    const mergedVideos = await getMergedVideos();

    return NextResponse.json({
      success: true,
      media: mergedVideos,
    });
  } catch (err: any) {
    console.error('Error in GET /api/videos:', err);
    return NextResponse.json(
      { error: 'Internal server error while fetching videos', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const newVideo = await request.json();

    if (!newVideo || !newVideo.id || !newVideo.title) {
      return NextResponse.json(
        { error: 'Missing required video fields' },
        { status: 400 }
      );
    }

    const dbVideos = await readVideosFromFile();
    
    // Add new video, ensuring no ID duplicate (overwrite or append)
    const index = dbVideos.findIndex((v) => v.id === newVideo.id);
    if (index > -1) {
      dbVideos[index] = { ...dbVideos[index], ...newVideo, deleted: false };
    } else {
      dbVideos.push({ ...newVideo, deleted: false, interestingTitles: newVideo.interestingTitles || [] });
    }

    const success = await writeVideosToFile(dbVideos);
    if (!success) {
      throw new Error('Failed to write videos database file');
    }

    return NextResponse.json({
      success: true,
      video: newVideo,
    });
  } catch (err: any) {
    console.error('Error in POST /api/videos:', err);
    return NextResponse.json(
      { error: 'Internal server error while creating video', details: err.message },
      { status: 500 }
    );
  }
}
