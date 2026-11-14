#!/usr/bin/env python3
"""
NudeTrends Automated Content Ingestion Engine (Python)
======================================================
Crawls trending leaks, extracts direct video stream links (MP4/M3U8) and high-res
cover photos, and automatically publishes them into NudeTrends.

Features:
  - High-precision creator extraction from media directory paths (e.g. /nudes/dollar-baddie/ -> Dollar Baddie)
  - Multi-media support: Ingests all parts (Part 1, Part 2, etc.) under the same trend.
  - Skips ad banners and non-leak images (imgur promos, ads, logos).
  - Deduplication: Tracks seen posts in scripts/seen_cache.json.
  - Dry-run mode: Pass --dry-run to test without pushing to live database.
  - Cloud compatible: Runs locally or on GitHub Actions every 2 hours on autopilot.

Usage:
  python scripts/ingest.py
  python scripts/ingest.py --dry-run
"""

import os
import sys
import re
import json
import time
import hashlib
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime

# ── Configuration ─────────────────────────────────────────────────────────────
API_BASE = os.getenv("API_BASE", "https://nudetrends.afrozex.com").rstrip("/")
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")
SOURCE_URL = os.getenv("SOURCE_URL", "https://nodoleaks.com").rstrip("/")
DRY_RUN = "--dry-run" in sys.argv

CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seen_cache.json")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# ── Cache & Helper Functions ──────────────────────────────────────────────────

def load_seen_cache() -> set:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except Exception:
            return set()
    return set()

def save_seen_cache(seen: set):
    if DRY_RUN:
        return
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(list(seen), f, indent=2)
    except Exception as e:
        print(f"[!] Could not save cache: {e}")

def fetch_url(url: str, timeout: int = 20) -> str:
    """Fetch URL with realistic desktop headers."""
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"[!] Error fetching {url}: {e}")
        return ""

def slugify(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", text)[:80]

def extract_trend_name(title: str, media_urls: list, post_url: str = "") -> str:
    """
    Extracts the person or trend name.
    1. First tries media path (e.g. /nudes/dollar-baddie/ -> 'Dollar Baddie')
    2. Falls back to parsing headline words.
    """
    for u in media_urls:
        m = re.search(r"/nudes/([^/]+)/", u)
        if m:
            raw = m.group(1).replace("-", " ").strip()
            # Clean common words if any
            return " ".join([w.title() for w in raw.split()])

    cleaned = title.strip()
    cleaned = re.sub(r"(?i)\b(leaked?|leak|nudes?|sex\s*tape|video|full\s*tape|scandal|viral|watch|photos?|trending|drops?|insane|thirst\s*trap|creator)\b", "", cleaned)
    cleaned = re.sub(r"(?i)\b(tiktoker|campus\s*girl|slay\s*queen|ugandan|kampala|chic|units|with\s*some|great|milkers|on\s*her)\b", "", cleaned)
    cleaned = re.sub(r"[^\w\s-]", " ", cleaned).strip()
    words = cleaned.split()
    
    if len(words) >= 2:
        return f"{words[0]} {words[1]}".title()
    elif len(words) == 1:
        return words[0].title()
    
    fallback = title.split()[:2]
    return " ".join(fallback).title() if fallback else "Viral Trend"

def generate_tags(title: str) -> list:
    tags = ["#ViralLeaks"]
    lower = title.lower()
    if any(k in lower for k in ["campus", "mubs", "makerere", "student", "kyambogo"]):
        tags.append("#Campus")
    if any(k in lower for k in ["kampala", "uganda"]):
        tags.append("#Kampala")
    if "tiktok" in lower:
        tags.append("#TikTok")
    if any(k in lower for k in ["snapchat", "snap"]):
        tags.append("#Snapchat")
    if any(k in lower for k in ["sex", "tape"]):
        tags.append("#Sextapes")
    if len(tags) < 3:
        tags.append("#Exclusive")
    return list(dict.fromkeys(tags))[:4]

# ── API Push Functions ────────────────────────────────────────────────────────

def publish_creator(name: str, thumbnail_url: str, bio: str = "") -> bool:
    if DRY_RUN:
        print(f"    [DRY-RUN] Would sync Trend: '{name}' (thumb: {thumbnail_url[:50]}...)")
        return True

    url = f"{API_BASE}/api/creators"
    payload = {
        "name": name,
        "thumbnailUrl": thumbnail_url,
        "bio": bio or f"Stream all verified viral leaks and exclusive media of {name} on NudeTrends Uganda."
    }
    headers = {"Content-Type": "application/json", "User-Agent": HEADERS["User-Agent"]}
    if ADMIN_SECRET:
        headers["x-api-key"] = ADMIN_SECRET

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as res:
            res_data = json.loads(res.read().decode())
            return res_data.get("success", False)
    except Exception as e:
        print(f"    [!] Error publishing creator '{name}': {e}")
        return False

def publish_video(video_data: dict) -> bool:
    media_url = video_data.get("videoUrl") or video_data.get("imageUrl") or ""
    if DRY_RUN:
        print(f"    [DRY-RUN] Would publish {video_data.get('type', 'media').upper()}: '{video_data.get('title')}' -> {media_url[:50]}...")
        return True

    url = f"{API_BASE}/api/videos"
    headers = {"Content-Type": "application/json", "User-Agent": HEADERS["User-Agent"]}
    if ADMIN_SECRET:
        headers["x-api-key"] = ADMIN_SECRET

    try:
        data = json.dumps(video_data).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as res:
            res_data = json.loads(res.read().decode())
            return res_data.get("success", False)
    except Exception as e:
        print(f"    [!] Error publishing video: {e}")
        return False

# ── Scraping Pipeline ─────────────────────────────────────────────────────────

def discover_post_links(source_url: str) -> list:
    print(f"[*] Fetching homepage: {source_url} ...")
    html = fetch_url(source_url)
    if not html:
        return []

    found_urls = []
    matches = re.findall(r'<a[^>]+class=["\'][^"\']*post-title[^"\']*["\'][^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL)
    for href, title in matches:
        full_url = urllib.parse.urljoin(source_url, href)
        clean_title = re.sub(r"<[^>]+>", "", title).strip()
        found_urls.append({"url": full_url, "title": clean_title})

    if not found_urls:
        slugs = re.findall(r'href=["\'](/s/[^"\']+)["\']', html)
        for s in set(slugs):
            full_url = urllib.parse.urljoin(source_url, s)
            raw_title = s.replace("/s/", "").replace("-", " ").title()
            found_urls.append({"url": full_url, "title": raw_title})

    seen_urls = set()
    unique_posts = []
    for p in found_urls:
        if p["url"] not in seen_urls:
            seen_urls.add(p["url"])
            unique_posts.append(p)

    return unique_posts

def scrape_post_media(post_url: str, post_title: str) -> dict:
    html = fetch_url(post_url)
    if not html:
        return None

    SOURCE_RE = '<source[^>]+src=["\\x27]([^"\\x27]+\\.(?:mp4|m3u8|webm)[^"\\x27]*)["\\x27]'
    VTAG_RE   = '<video[^>]+src=["\\x27]([^"\\x27]+\\.(?:mp4|m3u8|webm)[^"\\x27]*)["\\x27]'
    BARE_RE   = '["\\x27](https?://[^"\\x27]+\\.(?:mp4|m3u8))["\\x27]'
    IFRAME_RE = '<iframe[^>]*\\bsrc=["\\x27]([^"\\x27]*(?:embed|player|stream|video)[^"\\x27]*)["\\x27]'
    POSTER_RE = '<video[^>]+poster=["\\x27]([^"\\x27]+\\.(?:jpg|jpeg|png|webp)[^"\\x27]*)["\\x27]'
    IMGS_RE   = 'src=["\\x27]([^"\\x27]+\\.(?:jpg|jpeg|png|webp))["\\x27]'

    # 1. Direct video source files (.mp4 / .m3u8)
    video_sources = re.findall(SOURCE_RE, html, re.I)
    if not video_sources:
        video_sources = re.findall(VTAG_RE, html, re.I)
    if not video_sources:
        video_sources = re.findall(BARE_RE, html, re.I)

    # 2. Fallback: embed iframes
    if not video_sources:
        iframes = re.findall(IFRAME_RE, html, re.I)
        if iframes:
            video_sources = iframes

    videos = list(dict.fromkeys(video_sources))

    # 3. Video poster= attributes are the best per-video thumbnails
    poster_imgs = re.findall(POSTER_RE, html, re.I)
    poster_imgs = [urllib.parse.urljoin(post_url, p) for p in poster_imgs]

    # 4. All src= images, filtered
    all_imgs = re.findall(IMGS_RE, html, re.I)
    leak_imgs = []
    ad_hosts = [
        "imgur.com", "bkbnxqs", "logo", "flag", "ads", "icon",
        "banner", "pixel", "avatar", "xhcdn.com", "xvideos",
        "pornhub", "redtube", "xnxx",
    ]
    for img in all_imgs:
        lower = img.lower()
        if any(skip in lower for skip in ad_hosts):
            continue
        full_img_url = urllib.parse.urljoin(post_url, img)
        if full_img_url not in leak_imgs:
            leak_imgs.append(full_img_url)

    # Prefer /nudes/ path photos
    nudes_photos = [img for img in leak_imgs if "/nudes/" in img]
    all_good_photos = list(dict.fromkeys(
        poster_imgs + nudes_photos + [i for i in leak_imgs if i not in nudes_photos]
    ))

    if not videos and not all_good_photos:
        return None

    # Skip posts with no native /nudes/ media (off-site embeds from other sites)
    has_native_media = (
        any("/nudes/" in v for v in videos)
        or len(nudes_photos) > 0
        or len(poster_imgs) > 0
    )
    if not has_native_media:
        print(f"      [~] No native /nudes/ media (off-site embed). Skipping.")
        return None

    cover_photo = all_good_photos[0] if all_good_photos else "/images/v2.png"
    trend_name = extract_trend_name(post_title, videos + all_good_photos, post_url)

    return {
        "trend_name": trend_name,
        "title": post_title,
        "cover_photo": cover_photo,
        "videos": videos,
        "photos": all_good_photos,
        "tags": generate_tags(post_title),
        "desc": (
            f"Watch all verified leaked videos and photos of {trend_name}."
            " Full uncut media streaming online."
        ),
    }


# ── Main Orchestrator ─────────────────────────────────────────────────────────

def run_ingestion():
    print("=" * 65)
    print("🚀 NUDETRENDS AUTOMATED INGESTION ENGINE")
    print(f"[*] Source:     {SOURCE_URL}")
    print(f"[*] Target API: {API_BASE}")
    print(f"[*] Mode:       {'DRY-RUN (Testing)' if DRY_RUN else 'LIVE AUTO-SYNC'}")
    print(f"[*] Time:       {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65)

    if not ADMIN_SECRET and not DRY_RUN:
        print("[!] WARNING: ADMIN_SECRET not set. Publishing might be blocked by authentication.")

    seen_cache = load_seen_cache()
    print(f"[*] Loaded {len(seen_cache)} previously processed items from cache.")

    posts = discover_post_links(SOURCE_URL)
    if not posts:
        print(f"[!] No posts discovered on {SOURCE_URL}. Check network connection or site layout.")
        return

    print(f"[+] Found {len(posts)} trending posts to inspect.\n")

    ingested_trends = 0
    ingested_media_files = 0

    for i, p in enumerate(posts, 1):
        post_url = p["url"]
        post_title = p["title"]
        post_hash = hashlib.md5(post_url.encode()).hexdigest()

        if post_hash in seen_cache:
            print(f"[{i}/{len(posts)}] Already seen, skipping: \"{post_title[:55]}\"")
            continue

        print(f"[{i}/{len(posts)}] Checking: \"{post_title[:65]}\"")
        media = scrape_post_media(post_url, post_title)

        if not media:
            print("      [~] No streamable videos or photos found. Skipping.")
            seen_cache.add(post_hash)
            continue

        trend_name = media["trend_name"]
        cover_photo = media["cover_photo"]
        total_videos = len(media["videos"])
        total_photos = len(media["photos"])

        print(f"      [★] Trend: \"{trend_name}\" | {total_videos} videos | {total_photos} photos")
        print(f"      [🖼] Thumbnail: {cover_photo[:70]}...")

        # 1. Sync Trend Profile (Creator)
        publish_creator(trend_name, cover_photo, media["desc"])
        ingested_trends += 1

        # 2. Publish all Videos under this trend in order (Part 1, Part 2, ...)
        for v_idx, v_url in enumerate(media["videos"]):
            part_suffix = f" (Part {v_idx + 1})" if total_videos > 1 else ""
            vid_title = f"{post_title}{part_suffix}"
            item_id = slugify(f"{trend_name}-v{v_idx + 1}-{hashlib.md5(v_url.encode()).hexdigest()[:6]}")

            # Match each video with its own thumbnail where available
            v_thumb = media["photos"][v_idx] if v_idx < len(media["photos"]) else cover_photo

            video_payload = {
                "id": item_id,
                "title": vid_title,
                "creator": trend_name,
                "videoUrl": v_url,
                "thumbnailUrl": v_thumb,
                "type": "video",
                "duration": "03:15",
                "views": f"{round(1.8 + (hash(vid_title) % 70) / 10, 1)}k views",
                "time": "Just now",
                "desc": media["desc"],
                "category": "Trending",
                "interestingTitles": media["tags"],
                "uploadedAt": int(time.time() * 1000),
            }

            print(f"      --> Publishing Video: {vid_title[:55]}...")
            if publish_video(video_payload):
                ingested_media_files += 1

        # 3. If only photos (no videos), publish photo leaks
        if total_videos == 0 and total_photos > 0:
            for p_idx, p_url in enumerate(media["photos"][:4]):
                photo_title = f"{post_title} (Photo {p_idx + 1})" if total_photos > 1 else post_title
                item_id = slugify(f"{trend_name}-p{p_idx + 1}-{hashlib.md5(p_url.encode()).hexdigest()[:6]}")

                photo_payload = {
                    "id": item_id,
                    "title": photo_title,
                    "creator": trend_name,
                    "thumbnailUrl": p_url,
                    "imageUrl": p_url,
                    "type": "image",
                    "duration": "PHOTO",
                    "views": f"{round(1.5 + (hash(photo_title) % 60) / 10, 1)}k views",
                    "time": "Just now",
                    "desc": media["desc"],
                    "category": "Trending",
                    "interestingTitles": media["tags"],
                    "uploadedAt": int(time.time() * 1000),
                }
                print(f"      --> Publishing Photo: {photo_title[:55]}...")
                if publish_video(photo_payload):
                    ingested_media_files += 1

        # Mark post as processed
        seen_cache.add(post_hash)
        save_seen_cache(seen_cache)
        print(f"      [✓] Successfully processed.\n")

    print("=" * 65)
    print(f"🏁 COMPLETED: Processed {ingested_trends} trends ({ingested_media_files} total media files).")
    print("=" * 65)


if __name__ == "__main__":
    run_ingestion()
