import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { readDb, writeDb, getCreators } from '../../lib/db';

export async function GET() {
  try {
    const creators = await getCreators();
    return NextResponse.json({ success: true, creators });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    revalidateTag('creators');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
