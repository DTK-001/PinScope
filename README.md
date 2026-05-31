# PinScope Course Sync Worker

This is the small backend that lets you publish mapped course geometry once and have every device load it automatically.

## What it does

- `GET /` returns the published course library.
- `POST /` saves/replaces published course data, protected by an admin token.
- Public users do not need the admin token. They only read the data.

## Setup summary

1. Install Wrangler if you do not have it already.
2. Copy `wrangler.example.toml` to `wrangler.toml`.
3. Create a KV namespace:

```bash
wrangler kv namespace create PINSCOPE_COURSES
```

4. Paste the returned KV namespace id into `wrangler.toml`.
5. Set a private admin token:

```bash
wrangler secret put PINSCOPE_ADMIN_TOKEN
```

6. Deploy the worker:

```bash
wrangler deploy
```

7. In PinScope, open **Cloud course sync**, paste the worker URL as the Sync endpoint, and save it.
8. On your admin device only, enter the admin token as well. Then when you run **OSM holes** or **Import mapper JSON**, the mapped course is automatically published.

For public builds, keep `src/sync-config.js` with the endpoint only and no admin token. Users will load the published holes automatically without importing files.
