import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '../../lib/auth';
import { revalidatePath } from 'next/cache';
import { readDb, writeDb, getCreators } from '../../lib/db';

export async function GET() {
  try {
    const creators = await getCreators();
    return NextResponse.json({ success: true, creators });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { name, thumbnailUrl, bio } = await req.json();
    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const creators = await readDb('creators.json');
    const existingIndex = creators.findIndex((c: any) => c.name === name);

    if (existingIndex !== -1) {
      if (thumbnailUrl !== undefined) creators[existingIndex].thumbnailUrl = thumbnailUrl;
      if (bio !== undefined) creators[existingIndex].bio = bio;
    } else {
      creators.push({ name, thumbnailUrl, bio });
    }

    const success = await writeDb('creators.json', creators);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to write to DB' }, { status: 500 });
    }

    // Clear global cache so the site updates immediately
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
