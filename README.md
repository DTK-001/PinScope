# PinScope

Phone-first golf app foundation for local courses, GPS yardages, scoring, stats, and future watch support.

## What is in place

- Installable PWA shell with manifest and service worker.
- Mobile layout with bottom navigation.
- Local course library with manual course creation.
- Home area configured for Grays Thurrock with a 20 mile OpenStreetMap course lookup.
- OpenStreetMap nearby course import using the public Overpass API for small personal lookups.
- Verified local course packs for Cranham and Belhus Park.
- Top-down hole views with editable tee/green alignment.
- Shot planning with multiple draggable markers and per-segment yardages.
- Zoom and pan on hole images for phone testing.
- Club recommendations from the saved bag distances.
- Active round scoring with score, putts, penalties, fairways, GIR, and tee club.
- GPS hooks for front, middle, back, and hazard yardages when a course has coordinates.
- Local device storage for courses, rounds, and club distances.
- A neutral course schema that can later accept richer OSM tee, fairway, green, bunker, and water data.

## Run it locally

Use the included static server from this folder. The PWA service worker needs HTTP rather than opening `index.html` directly.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\dev-server.ps1 -Port 5173
```

Then open:

```text
http://localhost:5173
```

For phone testing on the same Wi-Fi, run the server with LAN binding:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\dev-server.ps1 -Port 5173 -Bind 0.0.0.0
```

Then open `http://<your-computer-ip>:5173` on the phone.

## Data stance

OpenStreetMap data is open under ODbL and needs attribution. The app stores imported course shells locally on the device. For a shared/public version we should keep source attribution visible and be careful with any derived course database we publish.

## Next step

Publish the static app to an HTTPS host such as GitHub Pages, Netlify, Vercel, or Cloudflare Pages so phone GPS can work reliably. After that, the next engineering layer is adding more verified local course packs and improving the round-planning/club recommendation flow on real phone GPS.
