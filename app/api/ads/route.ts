import { NextResponse } from 'next/server';
import { readDb, writeDb } from '../../lib/db';

async function readAdsFromFile(): Promise<any> {
  try {
    const data = await readDb('ads.json');
    if (Array.isArray(data) && data.length === 0) {
      return { banner: null, popup: null };
    }
    return data;
  } catch (err) {
    return { banner: null, popup: null };
  }
}

async function writeAdsToFile(ads: any): Promise<boolean> {
  try {
    await writeDb('ads.json', ads);
    return true;
  } catch (err) {
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

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const success = await writeAdsToFile(payload);
    if (!success) throw new Error('Failed to save ads');
    return NextResponse.json({ success: true, message: 'Ads saved successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
