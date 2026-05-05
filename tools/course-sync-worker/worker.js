const DATA_KEY = "published-courses";
const SNAPSHOT_ROUTE_PREFIX = "/snapshots/";
const SNAPSHOT_WIDTH = 900;
const SNAPSHOT_HEIGHT = 1300;
const SNAPSHOT_MIN_ZOOM = 14;
const SNAPSHOT_MAX_ZOOM = 19;
const SNAPSHOT_TILE_SIZE = 512;
const SNAPSHOT_PADDING = 0.18;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname.startsWith(SNAPSHOT_ROUTE_PREFIX)) {
        return serveSnapshotImage(url.pathname.slice(SNAPSHOT_ROUTE_PREFIX.length), env);
      }

      if (request.method === "GET") {
        return json(await readPublishedCourses(env));
      }

      if (request.method === "POST") {
        requireAdmin(request, env);
        const body = await request.json();
        let incomingCourses = normalizeIncomingCourses(body);
        if (!incomingCourses.length) {
          return json({ error: "No valid course data was supplied." }, 400);
        }

        let snapshots = { generated: [], skipped: [], errors: [] };
        if (body.generateSnapshots !== false) {
          const snapshotResult = await generateCourseSnapshots(incomingCourses, request, env, {
            force: body.forceSnapshots === true
          });
          incomingCourses = snapshotResult.courses;
          snapshots = snapshotResult.snapshots;
        }

        const current = await readPublishedCourses(env);
        const byId = new Map((current.courses || []).map((course) => [course.id, course]));
        const now = new Date().toISOString();

        incomingCourses.forEach((course) => {
          byId.set(course.id, {
            ...course,
            source: course.source || "shared",
            geometrySource: course.geometrySource || "PinScope Cloud",
            publishedAt: body.publishedAt || now,
            updatedAt: now
          });
        });

        const next = {
          schema: "pinscope-published-courses-v2",
          updatedAt: now,
          courses: Array.from(byId.values()).sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)))
        };

        await env.PINSCOPE_COURSES.put(DATA_KEY, JSON.stringify(next));
        return json({ ok: true, ...next, snapshots: summarizeSnapshots(snapshots) });
      }

      return json({ error: "Method not allowed." }, 405);
    } catch (error) {
      return json({ error: error.message || "Course sync failed." }, error.status || 500);
    }
  }
};

async function serveSnapshotImage(pathKey, env) {
  if (!env.PINSCOPE_SNAPSHOTS) {
    return json({ error: "PINSCOPE_SNAPSHOTS R2 bucket is not configured." }, 500);
  }
  const key = decodeURIComponent(pathKey || "").replace(/^\/+/, "");
  if (!key || key.includes("..")) {
    return json({ error: "Invalid snapshot key." }, 400);
  }
  const object = await env.PINSCOPE_SNAPSHOTS.get(key);
  if (!object) {
    return json({ error: "Snapshot not found." }, 404);
  }
  const headers = new Headers(corsHeaders);
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", headers.get("Cache-Control") || "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}

async function readPublishedCourses(env) {
  const stored = await env.PINSCOPE_COURSES.get(DATA_KEY, "json");
  if (stored && Array.isArray(stored.courses)) {
    return stored;
  }
  return { schema: "pinscope-published-courses-v2", updatedAt: null, courses: [] };
}

function requireAdmin(request, env) {
  const configuredToken = env.PINSCOPE_ADMIN_TOKEN || "";
  if (!configuredToken) {
    const error = new Error("PINSCOPE_ADMIN_TOKEN is not configured on the sync worker.");
    error.status = 500;
    throw error;
  }

  const header = request.headers.get("Authorization") || "";
  const suppliedToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!suppliedToken || suppliedToken !== configuredToken) {
    const error = new Error("Admin token is missing or invalid.");
    error.status = 401;
    throw error;
  }
}

function normalizeIncomingCourses(body) {
  const courses = Array.isArray(body?.courses) ? body.courses : body?.course ? [body.course] : [];
  return courses
    .filter((course) => course && typeof course === "object" && course.id && Array.isArray(course.holes))
    .map((course) => ({
      ...course,
      source: course.source || "shared",
      geometrySource: course.geometrySource || "PinScope Cloud"
    }));
}

async function generateCourseSnapshots(courses, request, env, options = {}) {
  const snapshots = { generated: [], skipped: [], errors: [] };
  if (!env.AZURE_MAPS_KEY) {
    return {
      courses,
      snapshots: {
        ...snapshots,
        error: "AZURE_MAPS_KEY is not configured, so only course geometry was saved."
      }
    };
  }
  if (!env.PINSCOPE_SNAPSHOTS) {
    return {
      courses,
      snapshots: {
        ...snapshots,
        error: "PINSCOPE_SNAPSHOTS R2 bucket is not configured, so only course geometry was saved."
      }
    };
  }

  const nextCourses = [];
  for (const course of courses) {
    const nextCourse = { ...course };
    nextCourse.holes = [];
    for (const hole of course.holes) {
      const nextHole = { ...hole };
      try {
        const snapshot = await createHoleSnapshot(course, hole, request, env, options);
        if (snapshot) {
          nextHole.snapshot = snapshot;
          snapshots.generated.push({ courseId: course.id, hole: Number(hole.number), imageUrl: snapshot.imageUrl });
        } else {
          snapshots.skipped.push({ courseId: course.id, hole: Number(hole.number), reason: "missing tee/green geometry" });
        }
      } catch (error) {
        snapshots.errors.push({ courseId: course.id, hole: Number(hole.number), error: error.message || "snapshot failed" });
      }
      nextCourse.holes.push(nextHole);
    }
    nextCourses.push(nextCourse);
  }
  return { courses: nextCourses, snapshots };
}

async function createHoleSnapshot(course, hole, request, env, options = {}) {
  const plan = planHoleSnapshot(hole);
  if (!plan) {
    return null;
  }
  const geometrySignature = snapshotGeometrySignature(course, hole);
  const fingerprint = snapshotFingerprint(course, hole, plan);
  const key = `courses/${safeKeyPart(course.id)}/holes/${String(hole.number).padStart(2, "0")}-${fingerprint}.jpg`;
  const existing = options.force ? null : await env.PINSCOPE_SNAPSHOTS.head(key);
  if (!existing) {
    const response = await fetch(azureStaticImageUrl(plan, env.AZURE_MAPS_KEY), {
      headers: { Accept: "image/jpeg" }
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Azure snapshot failed (${response.status})${text ? `: ${text.slice(0, 140)}` : ""}`);
    }
    const contentType = response.headers.get("content-type") || "image/jpeg";
    await env.PINSCOPE_SNAPSHOTS.put(key, await response.arrayBuffer(), {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable"
      },
      customMetadata: {
        courseId: String(course.id),
        hole: String(hole.number),
        provider: "azure-maps",
        tileset: "microsoft.imagery",
        fingerprint
      }
    });
  }

  const origin = new URL(request.url).origin;
  return {
    imageUrl: `${origin}${SNAPSHOT_ROUTE_PREFIX}${key}`,
    storageKey: key,
    width: plan.width,
    height: plan.height,
    center: plan.center,
    zoom: plan.zoom,
    provider: "azure-maps",
    tileset: "microsoft.imagery",
    attribution: "Imagery: Azure Maps",
    generatedAt: new Date().toISOString(),
    fingerprint,
    geometrySignature
  };
}

function planHoleSnapshot(hole) {
  const points = snapshotGeoPointsForHole(hole);
  const tee = normalizePoint(hole?.tee);
  const green = normalizePoint(hole?.greenCenter || hole?.green);
  if (!tee || !green || points.length < 2) {
    return null;
  }

  let chosen = null;
  for (let zoom = SNAPSHOT_MAX_ZOOM; zoom >= SNAPSHOT_MIN_ZOOM; zoom -= 1) {
    const worldPoints = points.map((point) => geoToWorldPixel(point, zoom));
    const bounds = worldBounds(worldPoints);
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    if (width <= SNAPSHOT_WIDTH * (1 - SNAPSHOT_PADDING * 2) && height <= SNAPSHOT_HEIGHT * (1 - SNAPSHOT_PADDING * 2)) {
      chosen = { zoom, bounds };
      break;
    }
  }
  if (!chosen) {
    const worldPoints = points.map((point) => geoToWorldPixel(point, SNAPSHOT_MIN_ZOOM));
    chosen = { zoom: SNAPSHOT_MIN_ZOOM, bounds: worldBounds(worldPoints) };
  }

  const centerWorld = {
    x: (chosen.bounds.minX + chosen.bounds.maxX) / 2,
    y: (chosen.bounds.minY + chosen.bounds.maxY) / 2
  };
  const center = worldPixelToGeo(centerWorld, chosen.zoom);
  return {
    width: SNAPSHOT_WIDTH,
    height: SNAPSHOT_HEIGHT,
    center,
    zoom: chosen.zoom
  };
}

function snapshotGeoPointsForHole(hole) {
  const points = [
    normalizePoint(hole?.tee),
    normalizePoint(hole?.greenCenter),
    normalizePoint(hole?.greenFront),
    normalizePoint(hole?.greenBack)
  ];
  const teePoints = Array.isArray(hole?.geometry?.tees) ? hole.geometry.tees : Array.isArray(hole?.tees) ? hole.tees : [];
  teePoints.forEach((point) => points.push(normalizePoint(point)));
  const polygon = Array.isArray(hole?.geometry?.greenPolygon) ? hole.geometry.greenPolygon : [];
  polygon.forEach((point) => points.push(normalizePoint(point)));

  return points.filter(Boolean);
}

function azureStaticImageUrl(plan, key) {
  const params = new URLSearchParams({
    "api-version": "2024-04-01",
    tilesetId: "microsoft.imagery",
    center: `${plan.center.lng},${plan.center.lat}`,
    zoom: String(plan.zoom),
    width: String(plan.width),
    height: String(plan.height),
    format: "jpeg",
    view: "Auto",
    "subscription-key": key
  });
  return `https://atlas.microsoft.com/map/static?${params.toString()}`;
}

function snapshotFingerprint(course, hole, plan) {
  const source = JSON.stringify({
    course: course.id,
    hole: hole.number,
    tee: normalizePoint(hole.tee),
    green: normalizePoint(hole.greenCenter),
    front: normalizePoint(hole.greenFront),
    back: normalizePoint(hole.greenBack),
    polygon: Array.isArray(hole?.geometry?.greenPolygon) ? hole.geometry.greenPolygon.map(normalizePoint).filter(Boolean) : [],
    plan
  });
  return fnv1a(source).toString(16).padStart(8, "0");
}

function snapshotGeometrySignature(course, hole) {
  const source = JSON.stringify({
    course: course.id,
    hole: Number(hole.number),
    tee: normalizePoint(hole.tee),
    green: normalizePoint(hole.greenCenter),
    front: normalizePoint(hole.greenFront),
    back: normalizePoint(hole.greenBack),
    polygon: Array.isArray(hole?.geometry?.greenPolygon) ? hole.geometry.greenPolygon.map(normalizePoint).filter(Boolean) : []
  });
  return fnv1a(source).toString(16).padStart(8, "0");
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function summarizeSnapshots(snapshots) {
  const summary = {
    generated: snapshots.generated || [],
    skipped: snapshots.skipped || [],
    errors: snapshots.errors || []
  };
  if (snapshots.error) {
    summary.error = snapshots.error;
  }
  return summary;
}

function worldBounds(points) {
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y))
  };
}

function geoToWorldPixel(position, zoom) {
  const lat = Math.max(-85.05112878, Math.min(85.05112878, Number(position.lat)));
  const lng = Number(position.lng);
  const scale = SNAPSHOT_TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  };
}

function worldPixelToGeo(pixel, zoom) {
  const scale = SNAPSHOT_TILE_SIZE * 2 ** zoom;
  const lng = (pixel.x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * pixel.y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return roundPoint({ lat, lng });
}

function normalizePoint(value) {
  if (!value) {
    return null;
  }
  if (Array.isArray(value) && value.length >= 2) {
    const a = Number(value[0]);
    const b = Number(value[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
        return roundPoint({ lat: a, lng: b });
      }
      if (Math.abs(b) <= 90 && Math.abs(a) <= 180) {
        return roundPoint({ lat: b, lng: a });
      }
    }
    return null;
  }
  const lat = Number(value.lat ?? value.latitude);
  const lng = Number(value.lng ?? value.lon ?? value.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }
  return roundPoint({ lat, lng });
}

function roundPoint(point) {
  return {
    lat: Number(Number(point.lat).toFixed(6)),
    lng: Number(Number(point.lng).toFixed(6))
  };
}

function safeKeyPart(value) {
  return String(value || "course").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "course";
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
