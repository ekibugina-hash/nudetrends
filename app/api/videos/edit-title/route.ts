import { NextResponse } from 'next/server';
import { readDb, writeDb } from '../../lib/db';

async function readVideosFromFile(): Promise<any[]> {
  return await readDb('videos.json');
}

async function writeVideosToFile(videos: any[]): Promise<void> {
  await writeDb('videos.json', videos);
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

    await writeVideosToFile(dbVideos);

    return NextResponse.json({
      success: true,
      message: 'Interesting titles updated successfully',
      interestingTitles
    });
  } catch (err: any) {
    console.error('Error in POST /api/videos/edit-title:', err);
    return NextResponse.json(
      { error: 'Internal server error while updating interesting titles', details: err.message || String(err) },
      { status: 500 }
    );
  }
}
