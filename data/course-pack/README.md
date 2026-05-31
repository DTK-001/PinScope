# PinScope Course Pack Inputs

Put exported PinScope course-pack JSON, mapper JSON, or OSM-derived course JSON
files in this folder, then run:

```powershell
node tools\build-course-pack.cjs
```

The builder updates `src/shared-course-defaults.js` with course geometry.
Satellite imagery is loaded at runtime from ArcGIS Location Platform Basemap
Styles sessions and is not generated or committed as static assets.

In the app, run `OSM holes` or `Import mapper JSON`, then use `Export course
pack` to download `pinscope-course-pack.json`. Drop that file here before
running the builder.

Accepted JSON shapes:

- one course object with `id` and `holes`
- an array of course objects
- `{ "courses": [...] }`

Each hole can use PinScope mapper-style fields such as `tee`, `green`,
`greenCenter`, `greenFront`, `greenBack`, `greenPolygon`, `geometry.greenPolygon`,
`tees`, `yards`, `par`, and `strokeIndex`.
