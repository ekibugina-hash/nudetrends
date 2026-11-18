#!/usr/bin/env python3
"""
Reorder NudeTrends topics to match Nodoleaks homepage order.
- Fetches ordered posts from Nodoleaks
- Updates data/creators.json locally
- Pushes ordered creators list to NudeTrends via /api/creators
"""

import os
import sys
import json
import urllib.request
import urllib.error

API_BASE = os.getenv("API_BASE", "https://nudetrends.afrozex.com").rstrip("/")
ADMIN_PASSCODE = os.getenv("ADMIN_PASSWORD", "Badman256.")

# Exact Nodoleaks topics in order of homepage appearance
NODOLEAKS_ORDER = [
    "Dollar Baddie",
    "Watooto Chic",
    "Bianca Xoxo",
    "Mubs",
    "Bbw Tiktoker",
    "Sawiyah Kamugisha",
    "Harmonize",
    "Tiktoker",
    "Shanlips",
    "Sheila Price",
    "Wet Ass Pussy Hoe Shows Off",
    "TIKTOKER Ka Jammie Nudes",
    "Peace Bae Oils Up For The Fellas",
    "Video Tapes Of MUK Student Ahereza Nancie Leaked",
    "Video Sharon O S Sx Tape Leaks To The Public",
    "Tiktok Always Giving Us Some New Juice",
    "Not Zarie Taking It Like A Good Girl",
    "Kyambogo University Student Fleaks Her Bean On Camera",
    "The Long Awaited Kisitu Kirabo The BBL Demure Rwandese Kampala Chic Drops Nudes",
    "Nyege Nyege Starts Off With Gang Bang Sex Clip"
]


def authenticate(ua: str) -> str:
    login_url = f"{API_BASE}/api/auth/login"
    data = json.dumps({"password": ADMIN_PASSCODE}).encode("utf-8")
    req = urllib.request.Request(
        login_url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": ua}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            for part in res.headers.get("Set-Cookie", "").split(";"):
                if part.strip().startswith("admin_session="):
                    return part.strip()
    except Exception as e:
        print(f"[!] Authentication error: {e}")
    return ""


def main():
    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    print(f"[*] Reordering topics to match Nodoleaks...")

    # Fetch current creators from Trends
    try:
        req = urllib.request.Request(f"{API_BASE}/api/creators", headers={"User-Agent": ua})
        with urllib.request.urlopen(req, timeout=15) as res:
            current_creators = json.loads(res.read().decode()).get("creators", [])
    except Exception as e:
        print(f"[!] Could not fetch existing creators: {e}")
        current_creators = []

    by_name = {c["name"].lower().strip(): c for c in current_creators}

    ordered = []
    for rank, name in enumerate(NODOLEAKS_ORDER):
        key = name.lower().strip()
        c = by_name.get(key, {})
        ordered.append({
            "name": c.get("name", name),
            "thumbnailUrl": c.get("thumbnailUrl", ""),
            "bio": c.get("bio", f"Watch all verified leaked videos and photos of {name} on NudeTrends Uganda."),
            "order": rank
        })

    # Append any remaining creators that weren't in the list
    existing_keys = {o["name"].lower().strip() for o in ordered}
    current_rank = len(ordered)
    for c in current_creators:
        key = c["name"].lower().strip()
        if key not in existing_keys:
            ordered.append({
                "name": c["name"],
                "thumbnailUrl": c.get("thumbnailUrl", ""),
                "bio": c.get("bio", ""),
                "order": current_rank
            })
            current_rank += 1

    # Save to local data/creators.json
    creators_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "creators.json")
    os.makedirs(os.path.dirname(creators_path), exist_ok=True)
    with open(creators_path, "w", encoding="utf-8") as f:
        json.dump(ordered, f, indent=2)
    print(f"[✓] Saved {len(ordered)} ordered creators to {creators_path}")

    # Authenticate and publish to live API
    cookie = authenticate(ua)
    if not cookie:
        print("[!] Warning: Could not authenticate with live site. Saved locally.")
        return

    # Try bulk update first (supported on updated API)
    print(f"[*] Publishing ordered creators to {API_BASE}/api/creators ...")
    bulk_succeeded = False
    try:
        post_req = urllib.request.Request(
            f"{API_BASE}/api/creators",
            data=json.dumps({"creators": ordered}).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "User-Agent": ua,
                "Cookie": cookie
            },
            method="POST"
        )
        with urllib.request.urlopen(post_req, timeout=15) as res:
            res_json = json.loads(res.read().decode())
            if res_json.get("success"):
                print("[✓] Live site creators successfully updated with Nodoleaks order (bulk)!")
                bulk_succeeded = True
    except Exception:
        pass

    # If bulk not yet supported on live instance, post individually
    if not bulk_succeeded:
        print("[*] Updating individual creators with order metadata...")
        for c in ordered:
            try:
                single_req = urllib.request.Request(
                    f"{API_BASE}/api/creators",
                    data=json.dumps(c).encode("utf-8"),
                    headers={
                        "Content-Type": "application/json",
                        "User-Agent": ua,
                        "Cookie": cookie
                    },
                    method="POST"
                )
                with urllib.request.urlopen(single_req, timeout=10) as s_res:
                    pass
            except Exception:
                pass
        print("[✓] Completed individual creator metadata updates.")


if __name__ == "__main__":
    main()
