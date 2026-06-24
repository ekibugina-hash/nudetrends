import { NextRequest, NextResponse } from 'next/server';
import { Comment } from '../../types';
import { readDb, writeDb } from '../../lib/db';

async function readCommentsFromFile(): Promise<Comment[]> {
  return await readDb('comments.json');
}

async function writeCommentsToFile(comments: Comment[]): Promise<boolean> {
  try {
    await writeDb('comments.json', comments);
    return true;
  } catch {
    return false;
  }
}

/** Sanitizes a string: trims and strips HTML tags. */
function sanitizeStr(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/<[^>]*>/g, '') // strip any HTML tags
    .slice(0, maxLen);
}

/** Derives avatar initials from a display name. */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';
}

export async function GET(request: NextRequest) {
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
    const filteredComments = comments.filter((c) => c.videoId === videoId);

    return NextResponse.json({ success: true, comments: filteredComments });
  } catch (err: any) {
    console.error('Error in GET /api/comments:', err);
    return NextResponse.json(
      { error: 'Internal server error while fetching comments', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract only the fields we care about — never trust the rest
    const videoId = sanitizeStr(body.videoId, 500);
    const author = sanitizeStr(body.author, 40) || 'Anonymous';
    const text = sanitizeStr(body.text, 500);

    if (!videoId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: videoId and text' },
        { status: 400 }
      );
    }

    // Generate all sensitive fields on the server — never trust the client
    const newComment: Comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      videoId,
      author,
      time: 'Just now',
      text,
      avatarInitials: getInitials(author),
    };

    const comments = await readCommentsFromFile();
    comments.unshift(newComment);

    const success = await writeCommentsToFile(comments);
    if (!success) {
      throw new Error('Failed to write comments database file');
    }

    return NextResponse.json({ success: true, comment: newComment });
  } catch (err: any) {
    console.error('Error in POST /api/comments:', err);
    return NextResponse.json(
      { error: 'Internal server error while creating comment', details: err.message },
      { status: 500 }
    );
  }
}
