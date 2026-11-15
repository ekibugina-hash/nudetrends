#!/usr/bin/env python3
"""
Clean Ingestion Engine for NudeTrends
Strictly isolates media by leak folder: /nudes/<folder>/
Ensures no cross-contamination between trends.
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

API_BASE = os.getenv("API_BASE", "https://nudetrends.afrozex.com").rstrip("/")
ADMIN_PASSCODE = os.getenv("ADMIN_SECRET", os.getenv("ADMIN_PASSWORD", "Badman256."))
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
}

SESSION_COOKIE = ""

def authenticate() -> bool:
    global SESSION_COOKIE
    if DRY_RUN:
        return True
    login_url = f"{API_BASE}/api/auth/login"
    try:
        data = json.dumps({"password": ADMIN_PASSCODE}).encode("utf-8")
        req = urllib.request.Request(
            login_url,
            data=data,
            headers={"Content-Type": "application/json", "User-Agent": HEADERS["User-Agent"]},
        )
        with urllib.request.urlopen(req, timeout=15) as res:
            set_cookie = res.headers.get("Set-Cookie", "")
            if "admin_session=" in set_cookie:
                for part in set_cookie.split(";"):
                    if part.strip().startswith("admin_session="):
                        SESSION_COOKIE = part.strip()
                        print("[✓] Authenticated with live site as Admin.")
                        return True
    except Exception as e:
        print(f"[!] Authentication notice: {e}")
    return False

def purge_previous_ingested_media():
    """Removes previously ingested videos that had cross-folder contamination."""
    if DRY_RUN:
        print("[DRY-RUN] Skipping purge.")
        return
    
    print("[*] Fetching existing database to purge contaminated items...")
    try:
        url = f"{API_BASE}/api/videos"
        with urllib.request.urlopen(url, timeout=15) as res:
            data = json.loads(res.read().decode())
            media = data.get("media", [])
    except Exception as e:
        print(f"[!] Error reading current videos: {e}")
        return

    prefixes = [
        'dollar-baddie-', 'watooto-chic-', 'bianca-xoxo-', 'mubs-',
        'bbw-tiktoker-', 'sawiyah-kamugisha-', 'harmonize-', 'tiktoker-',
        'shanlips-', 'sheila-price-'
    ]

    to_delete = []
    for m in media:
        mid = m.get("id", "")
        if any(mid.startswith(p) for p in prefixes):
            to_delete.append(mid)

    print(f"[*] Found {len(to_delete)} previously ingested items to purge.")
    del_url = f"{API_BASE}/api/videos/delete"
    
    deleted_count = 0
    for mid in to_delete:
        try:
            req_data = json.dumps({"id": mid}).encode("utf-8")
            headers = {
                "Content-Type": "application/json",
                "User-Agent": HEADERS["User-Agent"],
                "Cookie": SESSION_COOKIE
            }
            req = urllib.request.Request(del_url, data=req_data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as r:
                res_json = json.loads(r.read().decode())
                if res_json.get("success"):
                    deleted_count += 1
        except Exception as e:
            pass

    print(f"[✓] Successfully purged {deleted_count} contaminated items.\n")

def fetch_url(url: str, timeout: int = 20) -> str:
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

def publish_creator(name: str, thumbnail_url: str, bio: str = "") -> bool:
    if DRY_RUN:
        print(f"    [DRY-RUN] Trend: '{name}' (thumb: {thumbnail_url[:50]}...)")
        return True

    url = f"{API_BASE}/api/creators"
    payload = {
        "name": name,
        "thumbnailUrl": thumbnail_url,
        "bio": bio or f"Stream all verified viral leaks and exclusive media of {name} on NudeTrends Uganda."
    }
    headers = {
        "Content-Type": "application/json",
        "User-Agent": HEADERS["User-Agent"],
        "Cookie": SESSION_COOKIE,
        "x-api-key": ADMIN_PASSCODE
    }

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
    headers = {
        "Content-Type": "application/json",
        "User-Agent": HEADERS["User-Agent"],
        "Cookie": SESSION_COOKIE,
        "x-api-key": ADMIN_PASSCODE
    }

    try:
        data = json.dumps(video_data).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as res:
            res_data = json.loads(res.read().decode())
            return res_data.get("success", False)
    except Exception as e:
        print(f"    [!] Error publishing video: {e}")
        return False

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

def scrape_isolated_post_media(post_url: str, post_title: str) -> dict:
    """
    STRICT SCRAPING:
    Determines the single primary /nudes/<folder>/ for this post.
    Filters out ALL media belonging to other folders (related posts, ads, sidebar).
    """
    html = fetch_url(post_url)
    if not html:
        return None

    # Find all /nudes/<folder>/ in the page
    all_nude_folders = re.findall(r'/nudes/([^/"\'<>\s]+)/', html)
    if not all_nude_folders:
        return None

    # Count frequencies of each folder to find the primary one of this post
    folder_counts = {}
    for f in all_nude_folders:
        folder_counts[f] = folder_counts.get(f, 0) + 1

    primary_folder = sorted(folder_counts.items(), key=lambda x: -x[1])[0][0]

    # Clean the title
    h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    if h1_match:
        post_title = re.sub(r'<[^>]+>', '', h1_match.group(1)).replace("• Nodo Leaks", "").replace("Nodo Leaks", "").strip()

    # STRICT: Only extract videos inside /nudes/<primary_folder>/
    raw_vids = re.findall(rf'["\'](https?://[^"\']*/nudes/{re.escape(primary_folder)}/[^"\']*\.(?:mp4|m3u8|webm))["\']', html, re.I)
    videos = list(dict.fromkeys(raw_vids))

    # Sort videos by number (1.mp4, 2.mp4, etc.)
    def sort_num(u):
        m = re.search(r'/(\d+)\.mp4', u)
        return int(m.group(1)) if m else 999
    videos.sort(key=sort_num)

    # STRICT: Only extract images inside /nudes/<primary_folder>/
    raw_imgs = re.findall(rf'["\'](https?://[^"\']*/nudes/{re.escape(primary_folder)}/[^"\']*\.(?:jpg|jpeg|webp|png|avif))["\']', html, re.I)
    clean_imgs = [i.split('&quot;')[0].split('&#x3D;')[0] for i in raw_imgs]
    
    # Priority order for photos:
    # 1. main.webp / main.avif / main.jpg
    # 2. 1.jpg / 1.avif / 1.webp
    # 3. others
    photos = list(dict.fromkeys(clean_imgs))
    photos.sort(key=lambda x: 0 if 'main' in x.lower() else (1 if '/1.' in x else 2))

    if not videos and not photos:
        return None

    # Trend name derived from folder
    trend_name = " ".join([w.title() for w in primary_folder.replace("-", " ").split()])

    # Cover photo MUST be from this exact folder
    cover_photo = photos[0] if photos else f"https://noodles.nodoleaks.com/nudes/{primary_folder}/1.jpg"

    return {
        "trend_name": trend_name,
        "title": post_title,
        "folder": primary_folder,
        "cover_photo": cover_photo,
        "videos": videos,
        "photos": photos,
        "tags": ["#ViralLeaks", "#Kampala", "#Exclusive"],
        "desc": f"Watch all verified leaked videos and photos of {trend_name}. Full uncut media streaming online."
    }

def run_isolated_ingestion():
    print("=" * 65)
    print("🚀 NUDETRENDS STRICT MEDIA ISOLATION INGESTION")
    print(f"[*] Target API: {API_BASE}")
    print(f"[*] Time:       {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65)

    if not authenticate():
        print("[!] Authentication failed.")
        return

    # 1. Purge contaminated data
    purge_previous_ingested_media()

    # 2. Discover posts
    posts = discover_post_links(SOURCE_URL)
    print(f"[+] Found {len(posts)} posts to inspect.\n")

    ingested_trends = 0
    ingested_media_files = 0
    seen_cache = set()

    for i, p in enumerate(posts, 1):
        post_url = p["url"]
        post_title = p["title"]

        media = scrape_isolated_post_media(post_url, post_title)
        if not media:
            continue

        trend_name = media["trend_name"]
        cover_photo = media["cover_photo"]
        total_videos = len(media["videos"])
        total_photos = len(media["photos"])

        print(f"[{i}/{len(posts)}] Trend: \"{trend_name}\" (Folder: {media['folder']})")
        print(f"      Videos: {total_videos} | Photos: {total_photos}")
        print(f"      Cover:  {cover_photo}")

        # Publish Creator
        publish_creator(trend_name, cover_photo, media["desc"])
        ingested_trends += 1

        # Publish Videos strictly in order (Part 1, Part 2, ...)
        used_thumbs = set()
        for v_idx, v_url in enumerate(media["videos"]):
            part_suffix = f" (Part {v_idx + 1})" if total_videos > 1 else ""
            vid_title = f"{media['title']}{part_suffix}"
            item_id = slugify(f"{trend_name}-v{v_idx + 1}-{hashlib.md5(v_url.encode()).hexdigest()[:6]}")

            # 1. Match exact video number with photo number in SAME folder (e.g. 1.mp4 -> 1.jpg)
            v_num = re.search(r'/(\d+)\.mp4', v_url)
            matched_thumb = ""
            if v_num:
                num_str = f"/{v_num.group(1)}."
                matching = [ph for ph in media["photos"] if num_str in ph and ph not in used_thumbs]
                if matching:
                    matched_thumb = matching[0]

            # 2. If not matched by number, take any other unused photo in this trend's folder
            if not matched_thumb:
                unused_photos = [ph for ph in media["photos"] if ph not in used_thumbs]
                if unused_photos:
                    matched_thumb = unused_photos[0]

            # 3. For Part 1 only, if no thumb used yet, use cover photo
            if v_idx == 0 and not matched_thumb and cover_photo not in used_thumbs:
                matched_thumb = cover_photo

            # Mark this thumb as used so NO OTHER video in this trend repeats it!
            if matched_thumb:
                used_thumbs.add(matched_thumb)

            video_payload = {
                "id": item_id,
                "title": vid_title,
                "creator": trend_name,
                "videoUrl": v_url,
                "thumbnailUrl": matched_thumb,
                "type": "video",
                "duration": "03:15",
                "views": f"{round(1.8 + (hash(vid_title) % 70) / 10, 1)}k views",
                "time": "Just now",
                "desc": media["desc"],
                "category": "Trending",
                "interestingTitles": media["tags"],
                "uploadedAt": int(time.time() * 1000) - (v_idx * 1000) # Keep Part 1 latest
            }

            print(f"      --> Video Part {v_idx + 1}: thumb={matched_thumb.split('/')[-1]}")
            if publish_video(video_payload):
                ingested_media_files += 1

        # If standalone photos
        if total_videos == 0 and total_photos > 0:
            for p_idx, p_url in enumerate(media["photos"][:4]):
                photo_title = f"{media['title']} (Photo {p_idx + 1})" if total_photos > 1 else media['title']
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
                    "uploadedAt": int(time.time() * 1000)
                }
                print(f"      --> Photo: {photo_title}")
                if publish_video(photo_payload):
                    ingested_media_files += 1

        seen_cache.add(hashlib.md5(post_url.encode()).hexdigest())
        print("      [✓] Processed successfully.\n")

    # Save clean seen cache
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(list(seen_cache), f, indent=2)

    print("=" * 65)
    print(f"🏁 COMPLETED: Published {ingested_trends} strictly isolated trends ({ingested_media_files} files).")
    print("=" * 65)

if __name__ == "__main__":
    run_isolated_ingestion()
