import { NextResponse } from 'next/server';
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
    const { name, thumbnailUrl } = await req.json();
    if (!name || !thumbnailUrl) {
      return NextResponse.json({ success: false, error: 'Name and thumbnailUrl are required' }, { status: 400 });
    }

    const creators = await readDb('creators.json');
    const existingIndex = creators.findIndex((c: any) => c.name === name);

    if (existingIndex !== -1) {
      creators[existingIndex].thumbnailUrl = thumbnailUrl;
    } else {
      creators.push({ name, thumbnailUrl });
    }

    const success = await writeDb('creators.json', creators);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to write to DB' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
