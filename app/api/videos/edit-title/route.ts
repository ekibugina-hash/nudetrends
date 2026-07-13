import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '../../../lib/db';
import { isAdminRequest } from '../../../lib/auth';
import { revalidateTag } from 'next/cache';

async function readVideosFromFile(): Promise<any[]> {
  return await readDb('videos.json');
}

async function writeVideosToFile(videos: any[]): Promise<void> {
  await writeDb('videos.json', videos);
}

export async function POST(request: NextRequest) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, interestingTitles } = await request.json();

    if (!id || !Array.isArray(interestingTitles)) {
      return NextResponse.json(
        { error: 'Missing video id or interestingTitles array parameter' },
        { status: 400 }
      );
    }

    // Validate each title is a non-empty string (max 200 chars)
    const sanitizedTitles = interestingTitles
      .filter((t: any) => typeof t === 'string' && t.trim().length > 0)
      .map((t: string) => t.trim().slice(0, 200));

    const dbVideos = await readVideosFromFile();
    const index = dbVideos.findIndex((v) => v.id === id);

    if (index > -1) {
      dbVideos[index].interestingTitles = sanitizedTitles;
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
        type: 'video',
        videoUrl: '',
        imageUrl: '',
        thumbnailUrl: '',
        interestingTitles: sanitizedTitles,
        deleted: false
      });
    }

    await writeVideosToFile(dbVideos);

    return NextResponse.json({
      success: true,
      message: 'Interesting titles updated successfully',
      interestingTitles: sanitizedTitles
    });
  } catch (err: any) {
    console.error('Error in POST /api/videos/edit-title:', err);
    return NextResponse.json(
      { error: 'Internal server error while updating interesting titles', details: err.message || String(err) },
      { status: 500 }
    );
  }
}
