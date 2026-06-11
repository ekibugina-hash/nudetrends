import { NextResponse } from 'next/server';
import { Comment } from '../../types';
import fs from 'fs/promises';
import path from 'path';

const COMMENTS_FILE_PATH = path.join(process.cwd(), 'data', 'comments.json');

async function readCommentsFromFile(): Promise<Comment[]> {
  try {
    const data = await fs.readFile(COMMENTS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function writeCommentsToFile(comments: Comment[]): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(COMMENTS_FILE_PATH), { recursive: true });
    await fs.writeFile(COMMENTS_FILE_PATH, JSON.stringify(comments, null, 2), 'utf-8');
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
