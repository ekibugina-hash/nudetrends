#!/usr/bin/env python3
"""
Purge dead 404 media items from NudeTrends.
"""

import os
import json
import urllib.request
import urllib.error

API_BASE = "https://nudetrends.afrozex.com"
ADMIN_PASSCODE = os.getenv("ADMIN_PASSWORD", "Badman256.")

# Authenticate
login_url = f"{API_BASE}/api/auth/login"
auth_data = json.dumps({"password": ADMIN_PASSCODE}).encode("utf-8")
req = urllib.request.Request(
    login_url,
    data=auth_data,
    headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
)

session_cookie = ""
with urllib.request.urlopen(req, timeout=15) as res:
    for part in res.headers.get("Set-Cookie", "").split(";"):
        if part.strip().startswith("admin_session="):
            session_cookie = part.strip()
            print("[✓] Authenticated as Admin.")
            break

if not session_cookie:
    print("[✗] Auth failed.")
    exit(1)

# Fetch all videos
videos_url = f"{API_BASE}/api/videos"
with urllib.request.urlopen(urllib.request.Request(videos_url, headers={"User-Agent": "Mozilla/5.0"})) as res:
    data = json.loads(res.read().decode())
    all_media = data.get("media", [])

print(f"Total media items on Trends: {len(all_media)}")

# Identify dead items
DEAD_HOSTS = ["nodocloud.herokuapp.com"]
KNOWN_DEAD_IDS = {"kabarebe-v1-abf78f", "lira-nudes-p6-ef7308", "lira-nudes-v5-4d5e7b"}

to_delete = []
for m in all_media:
    mid = m.get("id", "")
    thumb = m.get("thumbnailUrl", "")
    vurl = m.get("videoUrl", "")
    iurl = m.get("imageUrl", "")

    is_dead = (
        mid in KNOWN_DEAD_IDS or
        any(dh in thumb for dh in DEAD_HOSTS) or
        any(dh in vurl for dh in DEAD_HOSTS) or
        any(dh in iurl for dh in DEAD_HOSTS)
    )

    if is_dead:
        to_delete.append((mid, m.get("title", "")))

print(f"[*] Found {len(to_delete)} dead media items to purge:")
for mid, title in to_delete:
    print(f"  - [{mid}] {title}")

# Delete each via /api/videos/delete
deleted = 0
for mid, title in to_delete:
    try:
        del_payload = json.dumps({"id": mid}).encode("utf-8")
        del_req = urllib.request.Request(
            f"{API_BASE}/api/videos/delete",
            data=del_payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0",
                "Cookie": session_cookie
            },
            method="POST"
        )
        with urllib.request.urlopen(del_req, timeout=10) as del_res:
            res_json = json.loads(del_res.read().decode())
            if res_json.get("success"):
                deleted += 1
    except Exception as e:
        print(f"  [!] Error deleting {mid}: {e}")

print(f"\n[✓] Successfully purged {deleted} dead items from live database.")
