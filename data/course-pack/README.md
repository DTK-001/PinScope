# PinScope course packs

Place mapper/OSM course JSON files here, then use the app export/import flow or the existing course-pack tooling to update `src/shared-course-defaults.js`.

Satellite snapshots are no longer generated or shipped with PinScope. Runtime satellite imagery comes from ArcGIS Location Platform Basemap Styles using `/api/arcgis/session`.

Course packs should contain course/hole geometry and metadata only, such as tee points, green centers, green polygons, scorecard data, and attribution for non-imagery sources such as OpenStreetMap.
