# PinScope

PinScope is a phone-first golf companion PWA for course selection, active-round scoring, GPS yardages, shot planning, and club recommendations.

## ArcGIS satellite imagery

This version no longer ships baked satellite snapshots or uses Azure Maps.

Satellite imagery now loads at runtime through **ArcGIS Location Platform Basemap Styles** using **basemap sessions**:

- The real ArcGIS key must be stored only on the backend/serverless host as `ARCGIS_API_KEY`.
- The frontend calls `/api/arcgis/session`.
- The backend creates an ArcGIS basemap session and returns only the temporary `sessionToken`.
- The frontend uses that session token to request the ArcGIS imagery style/tiles.
- Do not commit static satellite images, ArcGIS keys, Azure keys, or `.env.local` files.

## Required ArcGIS setup

Create an ArcGIS Location Platform API key credential with this privilege:

```text
Location services → Basemaps → Basemap styles service
```

Set it in your deployment provider as:

```text
ARCGIS_API_KEY=your_arcgis_location_platform_api_key_here
```

For local testing, copy `.env.example` to `.env.local` and add your key there. Do not commit `.env.local`.

## Running locally

Because the ArcGIS key must stay server-side, use the included local server instead of opening `index.html` directly:

```bash
node dev-server.mjs
```

Then open:

```text
http://localhost:4174
```

## Deployment

Deploy to a host that supports `/api/arcgis/session`, such as Vercel-style serverless functions, or port the route in `api/arcgis/session.js` to your chosen backend.

GitHub Pages alone cannot protect `ARCGIS_API_KEY` because it only serves static files.

## Course data

Course and hole geometry still lives in the app/course packs. Keep using OSM or mapper JSON for:

- tee points
- green center/front/back points
- green polygons
- hole geometry
- scorecard data

ArcGIS only replaces the satellite/background imagery layer. PinScope overlays, GPS, scorecard, shot-planning, and club logic remain app-owned.

## Files to avoid committing

Do not commit:

```text
.env
.env.local
*API KEY*.txt
assets/snapshots/
```

## Commercial-safe imagery direction

The commercial-safe direction is live licensed imagery through ArcGIS sessions, not pre-generated local satellite JPGs.
