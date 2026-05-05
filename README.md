# PinScope

Phone-first golf app foundation for local courses, GPS yardages, scoring, stats, and future watch support.

For future Codex conversations, start with [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md). It records the current app state, known issues, local commands, and the next recommended build step.

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
- Build-time course packs so mapped OSM/JSON holes and satellite snapshots ship inside the downloadable app.
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

Optional local-only API keys can be placed in `.env.local`; that file is ignored by git and is loaded only by the dev server.

```text
GOLFCOURSEAPI_KEY=your_key_here
```

The browser should call the local proxy path `/api/golfcourseapi/v1/...` rather than calling GolfCourseAPI directly.

For phone testing on the same Wi-Fi, run the server with LAN binding:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\dev-server.ps1 -Port 5173 -Bind 0.0.0.0
```

Then open `http://<your-computer-ip>:5173` on the phone.

## Data stance

OpenStreetMap data is open under ODbL and needs attribution. Baked course geometry should keep source attribution visible and be treated as a derived course database.

## Next step

Build out the course pack inputs in `data/course-pack/`, run the snapshot generator, then publish or package the static app so phone GPS can work reliably.

## Geometry import / OSM hole mapping

The app includes a selected-course geometry workflow for creating course-pack source JSON:

1. Select a course from the course list.
2. Click **OSM holes** to pull `golf=hole`, `golf=green`, and `golf=tee` geometry from OpenStreetMap around the course centre.
3. Or click **Import mapper JSON** and choose an export from the standalone PinScope Green Mapper.
4. Click **Export course pack** to download `pinscope-course-pack.json`.
5. Put that JSON file in `data/course-pack/`.
6. Run `node tools\build-course-pack.cjs --force` to generate saved satellite snapshots and rewrite `src/shared-course-defaults.js`.

Imported geometry is saved locally in the browser until you export it. The app deliberately keeps real GPS coordinates in `hole.tee`, `hole.greenCenter`, `hole.greenFront`, and `hole.greenBack`; it does not treat `visual.tee` or `visual.green` as GPS coordinates because those are screen/image percentage positions.

## Baked hole snapshots

PinScope snapshots are generated at build time and shipped as ordinary image assets.

```powershell
node tools\build-course-pack.cjs --force
```

Place mapper/OSM course JSON files in `data/course-pack/`. The generator saves one static image per mapped hole under `assets/snapshots/` and writes `src/shared-course-defaults.js`, so the app opens with those holes and images already populated. Use `--force` after changing/remapping holes to retake every confirmed snapshot.

The intended workflow is:

1. Run **OSM holes** or **Import mapper JSON** for each course in the app.
2. Export the course pack JSON.
3. Put the exported JSON in `data/course-pack/`.
4. Run `node tools\build-course-pack.cjs --force`.
5. Commit/deploy the updated `src/shared-course-defaults.js` and `assets/snapshots/` files.
