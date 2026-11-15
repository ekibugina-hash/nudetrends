#!/usr/bin/env node
/**
 * NudeTrends Automated Content Ingestion Engine (Node.js)
 * ========================================================
 * Crawls trending leaks, extracts direct video stream links (MP4/M3U8) and high-res
 * cover photos, and automatically publishes them into NudeTrends.
 *
 * Usage:
 *   node scripts/ingest.js
 *   node scripts/ingest.js --dry-run
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = (process.env.API_BASE || 'https://nudetrends.afrozex.com').replace(/\/+$/, '');
const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'Badman256.';
let SESSION_COOKIE = '';

async function authenticate() {
  if (DRY_RUN) return true;
  const passcode = ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'Badman256.';
  const loginUrl = `${API_BASE}/api/auth/login`;
  try {
    const res = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': HEADERS['User-Agent'] },
      body: JSON.stringify({ password: passcode }),
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie && setCookie.includes('admin_session=')) {
      const parts = setCookie.split(';');
      for (const p of parts) {
        if (p.trim().startsWith('admin_session=')) {
          SESSION_COOKIE = p.trim();
          console.log('[✓] Authenticated successfully with live site as Admin.');
          return true;
        }
      }
    }
  } catch (e) {
    console.error('[!] Authentication notice:', e.message);
  }
  return false;
}
const SOURCE_URL = (process.env.SOURCE_URL || 'https://nodoleaks.com').replace(/\/+$/, '');
const DRY_RUN = process.argv.includes('--dry-run');

const CACHE_FILE = path.join(__dirname, 'seen_cache.json');

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

function loadSeenCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return new Set(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')));
    } catch (e) {
      return new Set();
    }
  }
  return new Set();
}

function saveSeenCache(seenSet) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Array.from(seenSet), null, 2), 'utf8');
  } catch (e) {
    console.error('[!] Could not save cache:', e.message);
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[-\s]+/g, '-')
    .slice(0, 80);
}

function extractTrendName(title, urlSlug = '') {
  let cleaned = title.trim();
  cleaned = cleaned.replace(/\b(leaked?|leak|nudes?|sex\s*tape|video|full\s*tape|scandal|viral|watch|photos?|trending|drops?|insane|thirst\s*trap|creator)\b/gi, '');
  cleaned = cleaned.replace(/\b(tiktoker|campus\s*girl|slay\s*queen|ugandan|kampala|chic|units|with\s*some|great|milkers|on\s*her)\b/gi, '');
  cleaned = cleaned.replace(/[^\w\s-]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]} ${words[1]}`.replace(/\b\w/g, (c) => c.toUpperCase());
  } else if (words.length === 1) {
    return words[0].replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return 'Viral Trend';
}

function generateTags(title) {
  const tags = ['#ViralLeaks'];
  const lower = title.toLowerCase();
  if (lower.includes('campus') || lower.includes('mubs') || lower.includes('student') || lower.includes('makerere')) tags.push('#Campus');
  if (lower.includes('kampala') || lower.includes('uganda')) tags.push('#Kampala');
  if (lower.includes('tiktok')) tags.push('#TikTok');
  if (lower.includes('snapchat') || lower.includes('snap')) tags.push('#Snapchat');
  if (lower.includes('sex') || lower.includes('tape')) tags.push('#Sextapes');
  if (tags.length < 3) tags.push('#Exclusive');
  return Array.from(new Set(tags)).slice(0, 4);
}

async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return '';
    return await res.text();
  } catch (err) {
    console.error(`[!] Failed fetching ${url}:`, err.message);
    return '';
  }
}

async function publishCreator(name, thumbnailUrl, bio) {
  if (DRY_RUN) {
    console.log(`    [DRY-RUN] Would sync Trend: "${name}"`);
    return true;
  }
  const url = `${API_BASE}/api/creators`;
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': HEADERS['User-Agent'],
  };
  if (ADMIN_SECRET) headers['x-api-key'] = ADMIN_SECRET;
  if (SESSION_COOKIE) headers['Cookie'] = SESSION_COOKIE;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        thumbnailUrl,
        bio: bio || `Stream all verified viral leaks and exclusive media of ${name} on NudeTrends Uganda.`,
      }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    console.error(`    [!] Creator publish failed for '${name}':`, e.message);
    return false;
  }
}

async function publishVideo(payload) {
  if (DRY_RUN) {
    console.log(`    [DRY-RUN] Would publish Video: "${payload.title}" -> ${payload.videoUrl?.slice(0, 45)}...`);
    return true;
  }
  const url = `${API_BASE}/api/videos`;
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': HEADERS['User-Agent'],
  };
  if (ADMIN_SECRET) headers['x-api-key'] = ADMIN_SECRET;
  if (SESSION_COOKIE) headers['Cookie'] = SESSION_COOKIE;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    console.error(`    [!] Video publish failed for '${payload.title}':`, e.message);
    return false;
  }
}

function discoverPosts(html, baseUrl) {
  const posts = [];
  const matches = html.matchAll(/<a[^>]+class=["'][^"']*post-title[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/g);
  for (const m of matches) {
    const fullUrl = new URL(m[1], baseUrl).toString();
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    posts.push({ url: fullUrl, title });
  }

  // Fallback to /s/ links
  if (posts.length === 0) {
    const sMatches = html.matchAll(/href=["'](\/s\/[^"']+)["']/g);
    for (const m of sMatches) {
      const fullUrl = new URL(m[1], baseUrl).toString();
      const rawTitle = m[1].replace('/s/', '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      posts.push({ url: fullUrl, title: rawTitle });
    }
  }

  const seen = new Set();
  return posts.filter((p) => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });
}

function extractMedia(html, postMeta, postUrl) {
  // 1. Find all /nudes/<folder>/ in the page to find the primary folder for this leak
  const folderMatches = Array.from(html.matchAll(/\/nudes\/([^/"'<>\s]+)\//g)).map((m) => m[1]);
  if (folderMatches.length === 0) return null;

  const counts = {};
  for (const f of folderMatches) counts[f] = (counts[f] || 0) + 1;
  const primaryFolder = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  // 2. STRICT: Only extract videos inside /nudes/<primaryFolder>/
  const escapedFolder = primaryFolder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const vidRegex = new RegExp(`["'](https?:\/\/[^"']*\/nudes\/${escapedFolder}\/[^"']*\.(?:mp4|m3u8|webm))["']`, 'gi');
  let videos = Array.from(html.matchAll(vidRegex)).map((m) => m[1]);
  videos = Array.from(new Set(videos));

  // Sort videos by number (1.mp4, 2.mp4, ...)
  videos.sort((a, b) => {
    const ma = a.match(/\/(\d+)\.mp4/);
    const mb = b.match(/\/(\d+)\.mp4/);
    return (ma ? parseInt(ma[1], 10) : 999) - (mb ? parseInt(mb[1], 10) : 999);
  });

  // 3. STRICT: Only extract images inside /nudes/<primaryFolder>/
  const imgRegex = new RegExp(`["'](https?:\/\/[^"']*\/nudes\/${escapedFolder}\/[^"']*\.(?:jpg|jpeg|webp|png|avif))["']`, 'gi');
  let photos = Array.from(html.matchAll(imgRegex)).map((m) => m[1].split('&quot;')[0].split('&#x3D;')[0]);
  photos = Array.from(new Set(photos));
  photos.sort((a, b) => {
    const aMain = a.toLowerCase().includes('main') ? 0 : (a.includes('/1.') ? 1 : 2);
    const bMain = b.toLowerCase().includes('main') ? 0 : (b.includes('/1.') ? 1 : 2);
    return aMain - bMain;
  });

  if (videos.length === 0 && photos.length === 0) return null;

  const trendName = primaryFolder.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const coverPhoto = photos[0] || `https://noodles.nodoleaks.com/nudes/${primaryFolder}/1.jpg`;

  return {
    trendName,
    title: postMeta.title,
    folder: primaryFolder,
    coverPhoto,
    videos,
    photos,
    tags: generateTags(postMeta.title),
    desc: `Watch all verified leaked videos and photos of ${trendName}. Full uncut media streaming online.`,
  };
}
async function run() {
  console.log('='.repeat(65));
  console.log('🚀 NUDETRENDS AUTOMATED INGESTION ENGINE (NODE.JS)');
  console.log(`[*] Source:     ${SOURCE_URL}`);
  console.log(`[*] Target API: ${API_BASE}`);
  console.log(`[*] Mode:       ${DRY_RUN ? 'DRY-RUN (Testing)' : 'LIVE AUTO-SYNC'}`);
  console.log(`[*] Time:       ${new Date().toISOString()}`);
  console.log('='.repeat(65));

  const seen = loadSeenCache();
  console.log(`[*] Loaded ${seen.size} previously ingested posts from cache.`);

  const homeHtml = await fetchText(SOURCE_URL);
  const posts = discoverPosts(homeHtml, SOURCE_URL);

  if (posts.length === 0) {
    console.log(`[!] No posts discovered on ${SOURCE_URL}.`);
    return;
  }

  console.log(`[+] Found ${posts.length} trending posts to inspect.\n`);

  let ingestedTrends = 0;
  let ingestedMedia = 0;

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const postHash = crypto.createHash('md5').update(p.url).digest('hex');

    if (seen.has(postHash)) continue;

    console.log(`[${i + 1}/${posts.length}] Checking: "${p.title.slice(0, 65)}"`);
    const pageHtml = await fetchText(p.url);
    const media = extractMedia(pageHtml, p, p.url);

    if (!media) {
      console.log('      [~] No streamable media found. Skipping.');
      seen.add(postHash);
      continue;
    }

    console.log(`      [★] Trend: "${media.trendName}" | ${media.videos.length} videos | ${media.photos.length} photos`);

    // 1. Sync Creator / Trend
    await publishCreator(media.trendName, media.coverPhoto, media.desc);
    ingestedTrends++;

    // 2. Publish all videos
    for (let vIdx = 0; vIdx < media.videos.length; vIdx++) {
      const vUrl = media.videos[vIdx];
      const partSuffix = media.videos.length > 1 ? ` (Part ${vIdx + 1})` : '';
      const vidTitle = `${p.title}${partSuffix}`;
      const hash = crypto.createHash('md5').update(vUrl).digest('hex').slice(0, 6);
      const itemId = slugify(`${media.trendName}-v${vIdx + 1}-${hash}`);
      const vThumb = media.photos[vIdx] || media.coverPhoto;

      const payload = {
        id: itemId,
        title: vidTitle,
        creator: media.trendName,
        videoUrl: vUrl,
        thumbnailUrl: vThumb,
        type: 'video',
        duration: '03:15',
        views: `${(1.8 + (p.title.length % 50) / 10).toFixed(1)}k views`,
        time: 'Just now',
        desc: media.desc,
        category: 'Trending',
        interestingTitles: media.tags,
        uploadedAt: Date.now(),
      };

      console.log(`      --> Publishing Video: ${vidTitle.slice(0, 55)}...`);
      if (await publishVideo(payload)) ingestedMedia++;
    }

    seen.add(postHash);
    saveSeenCache(seen);
    console.log('      [✓] Successfully ingested.\n');

    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('='.repeat(65));
  console.log(`🏁 COMPLETED: Ingested ${ingestedTrends} trends (${ingestedMedia} total media files).`);
  console.log('='.repeat(65));
}

run();
