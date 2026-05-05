# PinScope Course Pack Inputs

Put exported PinScope course-pack JSON, mapper JSON, or OSM-derived course JSON
files in this folder, then run:

```powershell
node tools\build-course-pack.cjs --force
```

The generator writes saved hole images to `assets/snapshots/` and updates
`src/shared-course-defaults.js`.

In the app, run `OSM holes` or `Import mapper JSON`, then use `Export course
pack` to download `pinscope-course-pack.json`. Drop that file here before
running the generator.

Every hole with confirmed GPS for both `tee` and `greenCenter` gets a saved
Azure satellite snapshot. Holes without both points are skipped and keep using
the live satellite/GPS fallback in the app.

Use `--force` after rerunning OSM mapping or importing corrected mapper JSON.
That retakes the snapshots for all confirmed GPS holes instead of reusing any
older image files.

Accepted JSON shapes:

- one course object with `id` and `holes`
- an array of course objects
- `{ "courses": [...] }`
- `{ "course": { "id": "...", "holes": [...] } }`

Each hole can use PinScope mapper-style fields such as `tee`, `green`,
`greenCenter`, `greenFront`, `greenBack`, `greenPolygon`, `geometry.greenPolygon`,
`tees`, `yards`, `par`, and `strokeIndex`.
