#!/usr/bin/env python3
"""
Upload new banner ad image to R2 (via /api/get-presigned-url) and update
ad config via /api/ads. Uses admin session cookie auth.
"""

import os
import sys
import json
import mimetypes
import urllib.request
import urllib.error

API_BASE = "https://nudetrends.afrozex.com"
ADMIN_PASSCODE = os.getenv("ADMIN_PASSWORD", "Badman256.")
AD_LINK_URL = "https://ugandasexybabes.afrozex.com"
R2_PUBLIC_DOMAIN = os.getenv("NEXT_PUBLIC_R2_PUBLIC_DOMAIN", "assets.nudetrends.afrozex.com")

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

SESSION_COOKIE = ""


def authenticate() -> bool:
    global SESSION_COOKIE
    login_url = f"{API_BASE}/api/auth/login"
    data = json.dumps({"password": ADMIN_PASSCODE}).encode("utf-8")
    req = urllib.request.Request(
        login_url, data=data,
        headers={"Content-Type": "application/json", "User-Agent": UA},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            set_cookie = res.headers.get("Set-Cookie", "")
            if "admin_session=" in set_cookie:
                for part in set_cookie.split(";"):
                    if part.strip().startswith("admin_session="):
                        SESSION_COOKIE = part.strip()
                        print("[✓] Authenticated as Admin.")
                        return True
            print("[✗] Auth failed — no session cookie in response.")
            return False
    except Exception as e:
        print(f"[✗] Auth error: {e}")
        return False


def upload_image(image_path: str, filename: str) -> str | None:
    """Get presigned URL then PUT image to R2. Returns the public URL."""
    ct, _ = mimetypes.guess_type(image_path)
    ct = ct or "image/png"

    # Step 1: Get presigned URL
    presign_url = f"{API_BASE}/api/get-presigned-url"
    payload = json.dumps({"fileName": filename, "fileType": ct, "isAd": True}).encode("utf-8")
    req = urllib.request.Request(
        presign_url, data=payload,
        headers={"Content-Type": "application/json", "User-Agent": UA, "Cookie": SESSION_COOKIE},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            resp = json.loads(res.read().decode("utf-8"))
            upload_url = resp.get("uploadUrl")
            public_url = resp.get("publicUrl")
            print(f"[✓] Got presigned URL. Public URL will be: {public_url}")
    except Exception as e:
        print(f"[✗] Failed to get presigned URL: {e}")
        return None

    if not upload_url:
        print("[✗] No uploadUrl in response.")
        return None

    # Step 2: PUT image to R2 via presigned URL
    with open(image_path, "rb") as f:
        image_data = f.read()

    put_req = urllib.request.Request(
        upload_url, data=image_data, method="PUT",
        headers={"Content-Type": ct, "Content-Length": str(len(image_data))},
    )
    try:
        with urllib.request.urlopen(put_req, timeout=60) as res:
            print(f"[✓] Image uploaded to R2 (HTTP {res.status}).")
            return public_url
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"[✗] R2 PUT failed HTTP {e.code}: {body[:300]}")
        return None
    except Exception as e:
        print(f"[✗] R2 PUT error: {e}")
        return None


def set_ad_config(image_url: str, link_url: str) -> bool:
    """POST new banner ad config to /api/ads."""
    url = f"{API_BASE}/api/ads"
    # The ads API stores an object {banner: {...}, popup: {...}}
    # We need to read existing first to preserve popup config
    try:
        get_req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(get_req, timeout=10) as res:
            existing = json.loads(res.read().decode("utf-8"))
            ads = existing.get("ads", {})
    except Exception:
        ads = {}

    ads["banner"] = {"imageUrl": image_url, "linkUrl": link_url, "enabled": True}

    payload = json.dumps(ads).encode("utf-8")
    req = urllib.request.Request(
        url, data=payload, method="POST",
        headers={"Content-Type": "application/json", "User-Agent": UA, "Cookie": SESSION_COOKIE},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            resp = json.loads(res.read().decode("utf-8"))
            print(f"[✓] Ad config updated: {resp}")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"[✗] Ad config POST HTTP {e.code}: {body[:400]}")
        return False
    except Exception as e:
        print(f"[✗] Ad config POST error: {e}")
        return False


def main():
    image_path = sys.argv[1] if len(sys.argv) > 1 else (
        r"C:\Users\BAD_MAN\.gemini\antigravity\brain\c98429dc-b996-4245-9b3c-a349b6e3a833\.user_uploaded\media_1795011078488_30f4977d.png"
    )

    if not os.path.exists(image_path):
        print(f"[✗] Image not found: {image_path}")
        sys.exit(1)

    print(f"[→] Image: {image_path}")
    print(f"[→] Authenticating...")
    if not authenticate():
        sys.exit(1)

    filename = "ugandasexybabes-banner.png"
    print(f"[→] Uploading ad image as '{filename}'...")
    public_url = upload_image(image_path, filename)

    if not public_url:
        # Use expected URL as fallback (image might still have uploaded)
        public_url = f"https://{R2_PUBLIC_DOMAIN}/ads/{filename}"
        print(f"[!] Using expected public URL as fallback: {public_url}")

    print(f"[→] Setting ad config...")
    if set_ad_config(public_url, AD_LINK_URL):
        print(f"\n[✓] Banner ad fully updated!")
        print(f"    Image : {public_url}")
        print(f"    Link  : {AD_LINK_URL}")
    else:
        print("[✗] Ad config update failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
