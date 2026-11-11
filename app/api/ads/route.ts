import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '../../lib/db';
import { isAdminRequest } from '../../lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Ads config is an object { banner: {...}, popup: {...} }, not an array.
 * readDb returns any[] for arrays but we handle the object case gracefully here.
 */
async function readAdsFromFile(): Promise<any> {
  try {
    const data = await readDb('ads.json');
    // If stored as array (initial/empty), return default shape
    if (Array.isArray(data)) {
      return { banner: null, popup: null };
    }
    return data;
  } catch {
    return { banner: null, popup: null };
  }
}

async function writeAdsToFile(ads: any): Promise<boolean> {
  try {
    // Pass the object directly; writeDb accepts any serializable value
    await writeDb('ads.json', ads as any);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const ads = await readAdsFromFile();
    return NextResponse.json({ success: true, ads });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const success = await writeAdsToFile(payload);
    if (!success) throw new Error('Failed to save ads');
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, message: 'Ads saved successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
