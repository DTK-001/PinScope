# PinScope Course Pack Inputs

Put finished mapper or OSM-derived course JSON files in this folder, then run:

```powershell
$env:AZURE_MAPS_KEY="your_azure_maps_key"
node tools\build-course-pack.cjs
```

The generator writes saved hole images to `assets/snapshots/` and updates
`src/shared-course-defaults.js`.

Accepted JSON shapes:

- one course object with `id` and `holes`
- an array of course objects
- `{ "courses": [...] }`
- `{ "course": { "id": "...", "holes": [...] } }`

Each hole can use PinScope mapper-style fields such as `tee`, `green`,
`greenCenter`, `greenFront`, `greenBack`, `greenPolygon`, `geometry.greenPolygon`,
`tees`, `yards`, `par`, and `strokeIndex`.
