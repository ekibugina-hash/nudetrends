# Nude Trends

A Next.js 16 catalog for trending videos and photo leaks. Media and metadata are stored in Cloudflare R2, with a lightweight HMAC-protected admin dashboard for uploads and edits.

> This project contains adult content and is intended for adults only. Operators are responsible for complying with local law, consent/record-keeping requirements, and host/CDN policies.

## Stack

- **Next.js 16** (App Router, React Server Components)
- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Cloudflare R2** via `@aws-sdk/client-s3` (media storage + JSON metadata)
- **PostHog** (optional analytics)
- **lucide-react** icons

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the R2 and admin values.

3. Run the dev server:

   ```bash
   npm run dev
   ```

The app runs at `http://localhost:3000`. Without R2 credentials the app falls back to the JSON files in `data/` and runs in read-only mode (`writeDb` requires a bucket).

## Environment variables

See `.env.example`. The important ones:

| Variable | Purpose |
|---|---|
| `APP_URL` | Canonical site URL for metadata, sitemap and redirects |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 API token |
| `R2_BUCKET_NAME` | Bucket that holds media and the JSON database |
| `NEXT_PUBLIC_R2_PUBLIC_DOMAIN` | Public hostname for R2 objects |
| `ADMIN_PASSWORD` | Admin login password (server-only) |
| `ADMIN_SECRET` | Random secret used to sign the session cookie |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Optional analytics |

## Data model

R2 is the source of truth:

```
<bucket>/
  database/videos.json      # per-file overrides, deletions, custom titles, attachments
  database/creators.json    # custom trend thumbnails and bios
  database/comments.json    # user comments
  database/ads.json         # banner + popup ad config
  videos/                   # uploaded videos
  images/                   # uploaded images
  ads/                      # ad creatives
```

`app/lib/db.ts` lists the bucket, turns each media object into a catalog item, merges matching records from `database/videos.json`, and sorts newest-first. Trends/creators are derived by grouping media on the `creator` field; they are not a separate table.

Without a meaningful folder name (`videos/`, `images/`, etc.), the cleaned filename is used as the trend name.

## Routes

| Route | Description |
|---|---|
| `/` | Homepage catalog with hero slider, search and tabs |
| `/creator/[name]` | All media for one trend, stacked |
| `/watch/[id]` | Player/image viewer, comments and related media |
| `/login` | Admin login |
| `/ekibugina` | Admin dashboard (Manage, Add Item, Trends Control, Ads) |
| `/sitemap.xml` | Dynamic sitemap |

### API

| Endpoint | Methods | Notes |
|---|---|---|
| `/api/videos` | GET, POST | Public catalog; POST is admin-only |
| `/api/videos/edit` | POST | Admin field updates |
| `/api/videos/edit-title` | POST | Admin "interesting titles" |
| `/api/videos/delete` | POST | Soft-delete + remove R2 object |
| `/api/creators` | GET, POST | List trends; POST updates thumbnail/bio |
| `/api/comments` | GET, POST | Fetch by `videoId`; POST is public |
| `/api/ads` | GET, POST | Read ads; POST is admin-only |
| `/api/get-presigned-url` | POST | Admin direct-to-R2 upload URL |
| `/api/auth/login` / `check` / `logout` | POST/GET | Admin session lifecycle |

## Authentication

Admin sessions are stateless: `HMAC("admin_authenticated", ADMIN_SECRET)` stored in an `httpOnly`, `sameSite=lax` cookie for 8 hours. Every mutating API route calls `isAdminRequest`.

## Caching

`getMergedVideos` and `getCreators` are wrapped in `unstable_cache` with a 60-second revalidation window and the tags `videos` / `creators`. Admin mutations call `revalidateContent()` (in `app/lib/db.ts`), which clears both tags plus the layout path.

## Scripts

```bash
npm run dev     # local development
npm run build   # production build
npm run start   # serve the production build
```

## Notes

- `scratch/` contains ad-hoc debugging scripts and old component backups. It is not part of the app and can be removed.
- The project has no automated tests yet.
- Screenshot capture in the player requires R2 CORS to permit canvas access; otherwise the browser blocks the capture.
