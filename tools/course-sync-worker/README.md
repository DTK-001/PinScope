# PinScope Course Sync + Snapshot Worker

This backend lets you publish a course once and have every device load the finished course data automatically.

It now stores two things:

- course/hole geometry JSON in Cloudflare KV
- saved Azure satellite snapshot images in Cloudflare R2

## What it does

- `GET /` returns the published course library.
- `GET /snapshots/...` serves saved hole snapshot images from R2.
- `POST /` saves/replaces published course data, protected by an admin token.
- When `POST /` receives mapped tee/green data, it can call Azure Maps Static Image API, save one satellite image per mapped hole, and return the snapshot URLs inside the saved course JSON.

Public users do not need the admin token, the Azure Maps key, OSM import, or JSON import. They only read the finished course library and image URLs.

## Setup summary

1. Install Wrangler if you do not have it already.
2. Copy `wrangler.example.toml` to `wrangler.toml`.
3. Create a KV namespace:

```bash
wrangler kv namespace create PINSCOPE_COURSES
```

4. Paste the returned KV namespace id into `wrangler.toml`.
5. Create an R2 bucket:

```bash
wrangler r2 bucket create pinscope-hole-snapshots
```

6. Make sure the `[[r2_buckets]]` section in `wrangler.toml` points to that bucket.
7. Set the private admin token:

```bash
wrangler secret put PINSCOPE_ADMIN_TOKEN
```

8. Set your private Azure Maps key on the worker:

```bash
wrangler secret put AZURE_MAPS_KEY
```

9. Deploy the worker:

```bash
wrangler deploy
```

10. In PinScope, open **Cloud course sync**, paste the worker URL as the Sync endpoint, and save it.
11. On your admin device only, enter the admin token as well.
12. Run **OSM holes** or **Import mapper JSON** for a course. PinScope will publish the course and ask the worker to generate the saved Azure satellite snapshots.

## Public app setup

For public builds, set only the endpoint in `src/sync-config.js`:

```js
export const pinscopeSyncConfig = {
  endpoint: "https://your-worker.your-account.workers.dev",
  adminToken: ""
};
```

Do not put your admin token or Azure Maps key in the public frontend.

## Notes

- Each generated snapshot uses Azure Maps `microsoft.imagery` static imagery.
- Snapshot images are cached heavily because their file names include a geometry fingerprint.
- If the Azure key or R2 bucket is missing, the worker will still save course geometry, but it will report that snapshot generation was skipped.
