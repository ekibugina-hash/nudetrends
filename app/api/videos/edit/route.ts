import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '../../../lib/db';
import { isAdminRequest } from '../../../lib/auth';
import { revalidatePath } from 'next/cache';

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

    await writeVideosToFile(dbVideos);
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      message: 'Video details updated successfully',
    });
  } catch (err: any) {
    console.error('Error in POST /api/videos/edit:', err);
    return NextResponse.json(
      { error: 'Internal server error while updating video details', details: err.message || String(err) },
      { status: 500 }
    );
  }
}
