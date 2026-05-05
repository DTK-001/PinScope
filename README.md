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
- Local device storage for rounds and club distances.
- Cloud-published course geometry so mapped OSM/JSON holes can load automatically on every device.
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

OpenStreetMap data is open under ODbL and needs attribution. Published/shared course geometry should keep source attribution visible and be treated as a derived course database.

## Next step

Publish the static app to an HTTPS host such as GitHub Pages, Netlify, Vercel, or Cloudflare Pages so phone GPS can work reliably. After that, the next engineering layer is adding more verified local course packs and improving the round-planning/club recommendation flow on real phone GPS.

## Geometry import / OSM hole mapping

This build adds a selected-course geometry workflow for accurate satellite tee/green placement:

1. Select a course from the course list.
2. Click **OSM holes** to pull `golf=hole`, `golf=green`, and `golf=tee` geometry from OpenStreetMap around the course centre.
3. Or click **Import mapper JSON** and choose an export from the standalone PinScope Green Mapper.
4. Start a round and enable the satellite view. Holes with both `tee` and `greenCenter` now use those real GPS points instead of estimated placeholders.

Imported geometry is saved locally in the browser with the rest of the course data. The app deliberately keeps real GPS coordinates in `hole.tee`, `hole.greenCenter`, `hole.greenFront`, and `hole.greenBack`; it no longer treats `visual.tee` or `visual.green` as GPS coordinates because those are screen/image percentage positions.

## Sharing mapped courses across devices

This build now supports a real publish/read workflow instead of copying export files between devices.

Recommended production workflow:

1. Deploy the small Cloudflare Worker in `tools/course-sync-worker/`.
2. Put the worker URL into `src/sync-config.js` as `endpoint`, or paste it in the in-app **Cloud course sync** panel.
3. Keep `adminToken` blank in public source code. Save the admin token only on your own device through the **Cloud course sync** panel. If the public endpoint is already configured and the panel is hidden, open the app once with `?pinscopeAdmin=1` or `?pinscopeSyncToken=YOUR_TOKEN`.
4. On your admin device, run **OSM holes** and/or **Import mapper JSON** for a course.
5. PinScope automatically publishes that mapped course to the sync endpoint.
6. Any other device that opens the app loads the published holes automatically. Regular users do not need to run OSM mapping, import JSON, or copy files.

The old `src/shared-course-defaults.js` file still works as an offline fallback, but the preferred approach is the cloud sync endpoint because it lets you update course data without rebuilding the app every time. The service worker cache has been bumped to `local-loop-golf-v53`.
