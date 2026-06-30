# PinScope Course Sync Worker

## Supabase accounts

The PinScope frontend supports optional email sign-in and local-first cloud sync. The public project URL/key live in `src/supabase-config.js`; never put a secret or `service_role` key in frontend code.

Before testing accounts, run `supabase/schema.sql` in the Supabase SQL Editor and set Authentication -> URL Configuration -> Site URL to the deployed app URL, currently `https://dtk-001.github.io/PinScope/`. Add `http://localhost:4174` only as an extra local redirect for desktop development; phone email links must use the deployed URL because `localhost` points at the phone itself. Rounds, bags, and settings are cached per account on the device and synchronized when a connection is available.

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
