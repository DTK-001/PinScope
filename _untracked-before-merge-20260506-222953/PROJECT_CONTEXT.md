# PinScope Project Context

Use this file at the start of a new Codex conversation to recover the current project state quickly.

## Project

PinScope is a phone-first golf PWA for local courses around Grays Thurrock. The goal is to build a Golfshot-style experience for the user's local courses, starting with verified course data, realistic top-down hole imagery, scoring, shot planning, GPS yardages, and later watch support.

Repository:

- GitHub: https://github.com/DTK-001/PinScope
- Local workspace: `C:\Users\maste\Documents\Codex\2026-04-26\do-you-think-we-could-make`
- Likely GitHub Pages URL: `https://dtk-001.github.io/PinScope/`

## Current App State

- Static PWA with `index.html`, `manifest.webmanifest`, and `service-worker.js`.
- Mobile-first dark theme with pink/purple highlights.
- Local course library focused on a 20 mile radius from Grays Thurrock.
- Verified course packs for Cranham Golf Course and Belhus Park Golf Club.
- Top-down hole image rendering with tee/green alignment handles.
- Shot planning on the hole image with multiple draggable markers.
- Per-shot yardages and club recommendations from the saved bag distances.
- Pinch zoom, wheel zoom, and pan support on hole images.
- Group score entry modal with players, tees, score, putts, penalties, fairway, and GIR.
- Score modal freezes the page behind it.
- Save & Next closes the score modal and moves to the next hole.
- Belhus has a first-pass GPS marker that maps browser GPS onto the course image.

## Important Recent Changes

- `assets/belhus.png` was replaced with the user's newer Belhus aerial image from:
  `C:\Users\maste\Desktop\Belhus.png`
- Belhus image source id was changed to `belhus-user-topdown-20260428`.
- Belhus photo-edit localStorage key was bumped from `v1` to `v2` so old marker edits from the wrong image do not override the new image.
- Cranham image is stored at `assets/courses/cranham.png` and wired as a built-in photo source.
- Service worker cache is currently `local-loop-golf-v17`.
- Latest pushed commit at the time of writing:
  `53ecc6b Update Belhus image and GPS marker`

## Known Problem

The user says tee boxes and greens are still wrong. This is expected after replacing Belhus with a different aerial image because the old percentage coordinates were tied to the previous image.

Keep the manual Adjust mode for now. The next improvement should be a stronger calibration workflow rather than repeatedly hand-editing raw percentages.

## Recommended Next Step

Add a course image calibration mode:

1. Choose 3 or 4 known anchor points on the image.
2. Store the real GPS lat/lng for those anchors.
3. Use that transform to convert between image percentages and GPS coordinates.
4. Use it for live player dot, tee/green defaults, hazard positions, and distance calculations.

This is closer to how commercial golf apps work: they combine mapped course targets, calibrated imagery, and live GPS. Raw browser GPS alone only gives location; it does not know where the image pixels are unless the image is georeferenced or calibrated.

## Current GPS Thinking

The app has a simple Belhus bounding-box transform in `src/app.js`:

- `photoGeoToSourcePoint`
- `photoPointToGeo`
- `photoGpsMarker`

This is useful as a prototype, but not accurate enough for final play because the aerial image is not formally georeferenced. Replace it with a calibration transform when possible.

## Key Files

- `src/app.js`: main UI, GPS, photo rendering, scoring, shot planning.
- `src/styles.css`: dark theme and mobile UI styling.
- `src/verified-courses.js`: Cranham and Belhus verified course data.
- `src/belhus-photo-crops.js`: Belhus image source and tee/green percentage points.
- `src/cranham-photo-crops.js`: Cranham image source and tee/green percentage points.
- `assets/belhus.png`: current Belhus aerial image.
- `assets/courses/cranham.png`: current Cranham aerial image.
- `tools/photo-smoke-test.cjs`: Playwright smoke test for photo controls and score flow.
- `tools/dev-server.ps1`: local static server.

## Local Run

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\dev-server.ps1 -Port 5173
```

Open:

```text
http://localhost:5173
```

For LAN phone testing:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\dev-server.ps1 -Port 5173 -Bind 0.0.0.0
```

GPS requires HTTPS for normal phone/browser use, so GitHub Pages is the better test route.

## Verification

The main smoke test command used in this workspace:

```powershell
$env:NODE_PATH = "C:\Users\maste\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules"
& "C:\Users\maste\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tools\photo-smoke-test.cjs
```

It currently checks:

- Cranham built-in image loads.
- Shot planning creates multiple markers.
- Markers can be dragged.
- Wheel zoom and pan work.
- Pinch zoom simulation works.
- Clear shot path resets the route.
- Score modal opens, freezes page, then Save & Next advances to Hole 2.
- Belhus GPS marker renders with a mocked GPS location.

## User Preferences

- App name: PinScope.
- Phone-first experience.
- Futuristic but usable dark UI.
- Pink/purple highlights.
- Realistic and accurate top-down course images.
- Keep manual adjustment available until course imagery is correct.
- Later target: watch version.
