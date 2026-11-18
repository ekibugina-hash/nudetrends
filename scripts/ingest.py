#!/usr/bin/env python3
"""
NudeTrends Differential Ingestion & Auto-Sync Engine
- Checks content present on Nodoleaks vs content on NudeTrends
- Ignores all content already present on both sites
- Syncs only new / absent drops (both videos and photos)
- Maintains strict folder isolation and non-repeating thumbnails
- Automatically commits and pushes latest edits to GitHub
"""

import os
import sys
import re
import json
import time
import hashlib
import subprocess
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime

API_BASE = os.getenv("API_BASE", "https://nudetrends.afrozex.com").rstrip("/")
ADMIN_PASSCODE = os.getenv("ADMIN_SECRET", os.getenv("ADMIN_PASSWORD", "Badman256."))
SOURCE_URL = os.getenv("SOURCE_URL", "https://nodoleaks.com").rstrip("/")
DRY_RUN = "--dry-run" in sys.argv
FORCE_PURGE = "--force-purge" in sys.argv or "--purge" in sys.argv

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

def fetch_existing_trends_media() -> dict:
    """
    Fetches all current media and topics from NudeTrends.
    Used to skip any media already present on Trends.
    """
    print("[*] Checking content already present on NudeTrends...")
    existing = {
        "video_urls": set(),
        "image_urls": set(),
        "item_ids": set(),
        "creators": set(),
    }
    try:
        url = f"{API_BASE}/api/videos"
        req = urllib.request.Request(url, headers={"User-Agent": HEADERS["User-Agent"]})
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read().decode())
            media_list = data.get("media", [])
            for m in media_list:
                mid = m.get("id")
                if mid:
                    existing["item_ids"].add(mid.strip())
                v_url = m.get("videoUrl")
                if v_url:
                    clean_v = v_url.split("#")[0].strip()
                    existing["video_urls"].add(clean_v)
                img_url = m.get("imageUrl")
                if img_url:
                    existing["image_urls"].add(img_url.strip())
                creator = m.get("creator")
                if creator:
                    existing["creators"].add(creator.strip().lower())
        print(f"[✓] Found {len(media_list)} media items already live on Trends ({len(existing['video_urls'])} videos, {len(existing['image_urls'])} photos across {len(existing['creators'])} trends).\n")
    except Exception as e:
        print(f"[!] Warning: Could not fetch existing media from Trends ({e}). Proceeding carefully.")
    return existing

def purge_previous_ingested_media():
    """Only called if --force-purge or --purge flag is passed."""
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
        except Exception:
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

def publish_creator(name: str, thumbnail_url: str, bio: str = "", order: int = None) -> bool:
    if DRY_RUN:
        print(f"    [DRY-RUN] Trend: '{name}' (order: {order}, thumb: {thumbnail_url[:50]}...)")
        return True

    url = f"{API_BASE}/api/creators"
    payload = {
        "name": name,
        "thumbnailUrl": thumbnail_url,
        "bio": bio or f"Stream all verified viral leaks and exclusive media of {name} on NudeTrends Uganda."
    }
    if order is not None:
        payload["order"] = order
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

    primary_folder = max(folder_counts, key=folder_counts.get)

    # STRICT: Only extract videos inside /nudes/<primary_folder>/
    raw_videos = re.findall(rf'["\'](https?://[^"\']*/nudes/{re.escape(primary_folder)}/[^"\']*\.mp4)["\']', html, re.I)
    clean_videos = [v.split('&quot;')[0].split('&#x3D;')[0] for v in raw_videos]
    videos = list(dict.fromkeys(clean_videos))

    def sort_num(url: str):
        m = re.search(r'/(\d+)\.mp4$', url)
        return int(m.group(1)) if m else 999
    videos.sort(key=sort_num)

    # STRICT: Only extract images inside /nudes/<primary_folder>/
    raw_imgs = re.findall(rf'["\'](https?://[^"\']*/nudes/{re.escape(primary_folder)}/[^"\']*\.(?:jpg|jpeg|webp|png|avif))["\']', html, re.I)
    clean_imgs = [i.split('&quot;')[0].split('&#x3D;')[0] for i in raw_imgs]
    
    def sort_photo_key(p: str):
        m = re.search(r'/(\d+)\.[a-zA-Z0-9]+$', p)
        if m:
            return (0, int(m.group(1)))
        if 'main' in p.lower():
            return (1, 0)
        return (2, p)

    photos = list(dict.fromkeys(clean_imgs))
    photos.sort(key=sort_photo_key)

    if not videos and not photos:
        return None

    # Trend name derived from folder
    trend_name = " ".join([w.title() for w in primary_folder.replace("-", " ").split()])

    # Cover photo: prefer main.webp/avif if available, otherwise first photo
    main_photo = next((p for p in photos if 'main' in p.lower()), None)
    cover_photo = main_photo or (photos[0] if photos else f"https://noodles.nodoleaks.com/nudes/{primary_folder}/1.jpg")

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

def push_latest_edits_to_github(new_items_count: int):
    """
    Checks for uncommitted local edits (e.g. scripts, caches, data),
    commits them, and pushes directly to GitHub repository (origin main).
    """
    print("\n" + "=" * 65)
    print("🚀 GITHUB AUTO-SYNC")
    print("=" * 65)
    try:
        # Check if git status has local uncommitted changes
        status_res = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True
        )
        if status_res.returncode != 0:
            print(f"[!] Git status check failed: {status_res.stderr}")
            return

        has_changes = bool(status_res.stdout.strip())

        # Check if local commits are ahead of remote
        ahead_check = subprocess.run(
            ["git", "status"],
            capture_output=True,
            text=True
        )
        is_ahead = "ahead of" in ahead_check.stdout

        if not has_changes and not is_ahead:
            print("[✓] GitHub is already completely up to date with latest edits.")
            return

        if has_changes:
            print(f"[*] Staging local changes:\n{status_res.stdout.strip()}")
            subprocess.run(["git", "add", "."], check=True)
            time_str = datetime.now().strftime("%Y-%m-%d %H:%M")
            if new_items_count > 0:
                commit_msg = f"chore(sync): automated sync {new_items_count} new leaks from nodoleaks ({time_str})"
            else:
                commit_msg = f"chore(sync): update sync cache and scripts ({time_str})"

            subprocess.run(["git", "commit", "-m", commit_msg], check=True)
            print(f"[✓] Created commit: '{commit_msg}'")

        print("[*] Pushing latest edits to GitHub...")
        push_res = subprocess.run(
            ["git", "push", "origin", "main"],
            capture_output=True,
            text=True
        )
        if push_res.returncode == 0:
            print("[✓] Successfully pushed latest edits to GitHub (origin main)!")
        else:
            print(f"[!] Git push notice: {push_res.stderr.strip()}")
    except Exception as e:
        print(f"[!] Error during git push: {e}")

def run_isolated_ingestion():
    print("=" * 65)
    print("🚀 NUDETRENDS DIFFERENTIAL SYNC & INGESTION")
    print(f"[*] Source:     {SOURCE_URL}")
    print(f"[*] Target API: {API_BASE}")
    print(f"[*] Time:       {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65)

    if not authenticate():
        print("[!] Authentication failed.")
        return

    if FORCE_PURGE:
        purge_previous_ingested_media()

    # 1. Fetch current content on Trends (to diff and skip existing)
    existing = fetch_existing_trends_media()

    # 2. Discover posts on Nodoleaks
    posts = discover_post_links(SOURCE_URL)
    print(f"[+] Found {len(posts)} posts on Nodoleaks to inspect.\n")

    synced_trends = 0
    synced_videos = 0
    synced_photos = 0
    skipped_items = 0
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

        # Identify which videos are absent on Trends
        absent_videos = []
        for v_idx, v_url in enumerate(media["videos"]):
            v_clean = v_url.split('#')[0].strip()
            v_hash = hashlib.md5(v_url.encode()).hexdigest()[:6]
            item_id = slugify(f"{trend_name}-v{v_idx + 1}-{v_hash}")
            if v_clean in existing["video_urls"] or item_id in existing["item_ids"]:
                skipped_items += 1
            else:
                absent_videos.append((v_idx, v_url, item_id))

        # Identify which photos are absent on Trends
        absent_photos = []
        for p_idx, p_url in enumerate(media["photos"]):
            p_clean = p_url.strip()
            p_hash = hashlib.md5(p_url.encode()).hexdigest()[:6]
            item_id = slugify(f"{trend_name}-p{p_idx + 1}-{p_hash}")
            if p_clean in existing["image_urls"] or item_id in existing["item_ids"]:
                skipped_items += 1
            else:
                absent_photos.append((p_idx, p_url, item_id))

        # Check if entire trend is already present
        if not absent_videos and not absent_photos:
            print(f"[{i}/{len(posts)}] [=] Trend \"{trend_name}\": All {total_videos} videos and {total_photos} photos already present on Trends. (Ignored)")
            seen_cache.add(hashlib.md5(post_url.encode()).hexdigest())
            continue

        print(f"[{i}/{len(posts)}] [+] Trend: \"{trend_name}\" -> NEW CONTENT DETECTED ({len(absent_videos)} new videos, {len(absent_photos)} new photos)")

        # Ensure creator is published with strict Nodoleaks order
        trend_order = i - 1
        publish_creator(trend_name, cover_photo, media["desc"], order=trend_order)
        if trend_name.lower() not in existing["creators"]:
            existing["creators"].add(trend_name.lower())
            synced_trends += 1

        # Publish only absent videos
        used_thumbs = set()
        for v_idx, v_url, item_id in absent_videos:
            part_suffix = f" (Part {v_idx + 1})" if total_videos > 1 else ""
            vid_title = f"{media['title']}{part_suffix}"

            # Try to match video number with photo number in SAME folder (e.g. 1.mp4 -> 1.jpg)
            v_num = re.search(r'/(\d+)\.mp4', v_url)
            matched_thumb = ""
            if v_num:
                num_str = f"/{v_num.group(1)}."
                matching = [ph for ph in media["photos"] if num_str in ph and ph not in used_thumbs]
                if matching:
                    matched_thumb = matching[0]

            if not matched_thumb:
                unused_photos = [ph for ph in media["photos"] if ph not in used_thumbs]
                if unused_photos:
                    matched_thumb = unused_photos[0]

            if v_idx == 0 and not matched_thumb and cover_photo not in used_thumbs:
                matched_thumb = cover_photo

            if matched_thumb:
                used_thumbs.add(matched_thumb)

            # Align upload timestamp to match Nodoleaks homepage order (post 1 = newest)
            base_trend_time = int(time.time() * 1000) - ((i - 1) * 3600000)
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
                "uploadedAt": base_trend_time - (v_idx * 1000)
            }

            print(f"      --> [SYNC VIDEO] Part {v_idx + 1}: thumb={matched_thumb.split('/')[-1] if matched_thumb else 'NATIVE'}")
            if publish_video(video_payload):
                synced_videos += 1
                existing["video_urls"].add(v_url.split('#')[0].strip())
                existing["item_ids"].add(item_id)

        # Publish only absent photos
        for p_idx, p_url, item_id in absent_photos:
            part_suffix = f" (Photo {p_idx + 1})" if total_photos > 1 else " (Photo)"
            photo_title = f"{media['title']}{part_suffix}"
            base_trend_time = int(time.time() * 1000) - ((i - 1) * 3600000)
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
                "category": "Photos",
                "interestingTitles": media["tags"],
                "uploadedAt": base_trend_time - ((total_videos + p_idx) * 1000)
            }
            print(f"      --> [SYNC PHOTO] Photo {p_idx + 1}: {p_url.split('/')[-1]}")
            if publish_video(photo_payload):
                synced_photos += 1
                existing["image_urls"].add(p_url.strip())
                existing["item_ids"].add(item_id)

        seen_cache.add(hashlib.md5(post_url.encode()).hexdigest())

    # Save cache
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(list(seen_cache), f, indent=2)

    print("=" * 65)
    print("🏁 DIFFERENTIAL SYNC COMPLETED:")
    print(f"   * New videos synced:             {synced_videos}")
    print(f"   * New photos synced:             {synced_photos}")
    print(f"   * Already present items ignored: {skipped_items}")
    print("=" * 65)

    # Automatically push latest edits and changes to GitHub
    push_latest_edits_to_github(synced_videos + synced_photos)

if __name__ == "__main__":
    run_isolated_ingestion()
