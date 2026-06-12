import { NextResponse } from 'next/server';
import { Comment } from '../../types';
import { readDb, writeDb } from '../../lib/db';

async function readCommentsFromFile(): Promise<Comment[]> {
  return await readDb('comments.json');
}

async function writeCommentsToFile(comments: Comment[]): Promise<boolean> {
  try {
    await writeDb('comments.json', comments);
    return true;
  } catch (err) {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing videoId query parameter' },
        { status: 400 }
      );
    }

    const comments = await readCommentsFromFile();
    // Return comments filtered by videoId
    const filteredComments = comments.filter((c) => c.videoId === videoId);

    return NextResponse.json({
      success: true,
      comments: filteredComments,
    });
  } catch (err: any) {
    console.error('Error in GET /api/comments:', err);
    return NextResponse.json(
      { error: 'Internal server error while fetching comments', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const newComment = await request.json();

    if (!newComment || !newComment.id || !newComment.videoId || !newComment.author || !newComment.text) {
      return NextResponse.json(
        { error: 'Missing required comment fields (id, videoId, author, text)' },
        { status: 400 }
      );
    }

    const comments = await readCommentsFromFile();
    // Append at the beginning so newer comments display first
    comments.unshift(newComment);

    const success = await writeCommentsToFile(comments);
    if (!success) {
      throw new Error('Failed to write comments database file');
    }

    return NextResponse.json({
      success: true,
      comment: newComment,
    });
  } catch (err: any) {
    console.error('Error in POST /api/comments:', err);
    return NextResponse.json(
      { error: 'Internal server error while creating comment', details: err.message },
      { status: 500 }
    );
  }
}
