import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '../../lib/auth';
import { readDb, writeDb, getCreators, revalidateContent } from '../../lib/db';

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
    const body = await req.json();

    // Support bulk list updates (e.g. reordering all creators)
    const bulkList = Array.isArray(body) ? body : Array.isArray(body?.creators) ? body.creators : null;
    if (bulkList) {
      const success = await writeDb('creators.json', bulkList);
      if (!success) {
        return NextResponse.json({ success: false, error: 'Failed to write to DB' }, { status: 500 });
      }
      revalidateContent();
      return NextResponse.json({ success: true, count: bulkList.length });
    }

    const { name, thumbnailUrl, bio, order } = body;
    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const creators = await readDb('creators.json');
    const existingIndex = creators.findIndex((c: any) => c.name?.toLowerCase() === name.toLowerCase());

    if (existingIndex !== -1) {
      if (thumbnailUrl !== undefined) creators[existingIndex].thumbnailUrl = thumbnailUrl;
      if (bio !== undefined) creators[existingIndex].bio = bio;
      if (order !== undefined) creators[existingIndex].order = order;
    } else {
      creators.push({ name, thumbnailUrl, bio, ...(order !== undefined ? { order } : {}) });
    }

    const success = await writeDb('creators.json', creators);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to write to DB' }, { status: 500 });
    }

    // Clear global cache so the site updates immediately
    revalidateContent();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
