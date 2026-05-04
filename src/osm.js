import { createPlaceholderCourse, parseHolesCount, yardsBetween } from "./course-data.js";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const METERS_TO_YARDS = 1.0936132983;

export async function findNearbyOsmCourses(position, radiusMeters = 25000) {
  const radius = Math.min(Math.max(Number(radiusMeters) || 25000, 1000), 50000);
  const query = `
    [out:json][timeout:25];
    (
      node["leisure"="golf_course"](around:${radius},${position.lat},${position.lng});
      way["leisure"="golf_course"](around:${radius},${position.lat},${position.lng});
      relation["leisure"="golf_course"](around:${radius},${position.lat},${position.lng});
    );
    out center tags;
  `;

  const response = await overpassRequest(query);
  const payload = await response.json();
  return (payload.elements || []).map((element) => courseFromOsmElement(element, position)).filter(Boolean);
}

export async function fetchOsmCourseLayout(course, radiusMeters = 1900) {
  const location = course?.location;
  if (!location || !Number.isFinite(Number(location.lat)) || !Number.isFinite(Number(location.lng))) {
    throw new Error("This course needs a valid course lat/lng before OSM hole mapping can run.");
  }

  const radius = Math.min(Math.max(Number(radiusMeters) || 1900, 650), 3200);
  const query = `
    [out:json][timeout:40];
    (
      way["golf"~"^(hole|green|tee)$"](around:${radius},${location.lat},${location.lng});
      relation["golf"~"^(hole|green|tee)$"](around:${radius},${location.lat},${location.lng});
    );
    out tags geom center;
  `;

  const response = await overpassRequest(query);
  const payload = await response.json();
  return layoutFromOsmElements(payload.elements || [], course, radius);
}

async function overpassRequest(query) {
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: new URLSearchParams({ data: query })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenStreetMap lookup failed (${response.status})${detail ? `: ${detail.slice(0, 160)}` : ""}`);
  }
  return response;
}

function courseFromOsmElement(element, origin) {
  const tags = element.tags || {};
  if (shouldSkipCourse(tags)) {
    return null;
  }
  const name = tags.name || tags.operator || "Unnamed golf course";
  const holesCount = parseHolesCount(tags["golf:course"] || tags.holes);
  const town = tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || tags.operator || "";
  const course = createPlaceholderCourse({
    name,
    town,
    holesCount,
    source: "osm"
  });
  const location = element.center
    ? { lat: Number(element.center.lat), lng: Number(element.center.lon) }
    : { lat: Number(element.lat), lng: Number(element.lon) };

  course.id = `osm-${element.type}-${element.id}`;
  course.country = tags["addr:country"] || "";
  course.website = tags.website || tags["contact:website"] || "";
  course.phone = tags.phone || tags["contact:phone"] || "";
  course.location = Number.isFinite(location.lat) && Number.isFinite(location.lng) ? location : null;
  course.distanceMiles = course.location ? Number((yardsBetween(origin, course.location) / 1760).toFixed(1)) : null;
  course.postcode = tags["addr:postcode"] || tags.postal_code || "";
  course.par = tags["golf:par"] || "";
  course.holesTag = tags["golf:course"] || "";
  course.osm = {
    type: element.type,
    id: element.id
  };
  course.attribution = "Course shell from OpenStreetMap contributors under ODbL.";
  return course;
}

function shouldSkipCourse(tags) {
  const name = String(tags.name || "").toLowerCase();
  const courseType = String(tags["golf:course"] || "").toLowerCase();
  return (
    tags.disused === "yes" ||
    tags.golf === "driving_range" ||
    courseType === "driving_range" ||
    name.includes("closed") ||
    name.includes("driving range") ||
    name.includes("world of golf")
  );
}

function layoutFromOsmElements(elements, course, radiusMeters) {
  const holeLines = [];
  const greens = [];
  const tees = [];

  for (const element of elements) {
    const tags = element.tags || {};
    const golf = tags.golf;
    if (!golf) {
      continue;
    }
    const geometry = elementGeometry(element);
    const center = elementCenter(element, geometry);
    const ref = holeNumber(tags);
    const common = {
      osm: `${element.type}/${element.id}`,
      ref,
      name: tags.name || tags.ref || "",
      center,
      geometry,
      tags
    };
    if (golf === "hole") {
      const line = lineCandidate(element, geometry, tags);
      if (line) {
        holeLines.push(line);
      }
    } else if (golf === "green" && center) {
      greens.push(common);
    } else if (golf === "tee" && center) {
      tees.push(common);
    }
  }

  const count = Math.max(1, Number(course?.holesCount) || Number(course?.holes?.length) || 18);
  const byHole = new Map();

  for (const line of holeLines) {
    const current = byHole.get(line.number);
    if (!current || line.yards > current.yards) {
      byHole.set(line.number, line);
    }
  }

  for (const green of greens.filter((item) => item.ref)) {
    const current = byHole.get(green.ref) || { number: green.ref };
    byHole.set(green.ref, { ...current, green: green.center, greenPolygon: polygonFromGeometry(green.geometry), greenOsm: green.osm });
  }

  for (const tee of tees.filter((item) => item.ref)) {
    const current = byHole.get(tee.ref) || { number: tee.ref };
    byHole.set(tee.ref, { ...current, tee: tee.center, teeOsm: tee.osm });
  }

  const holes = [];
  for (let number = 1; number <= count; number += 1) {
    const base = byHole.get(number) || null;
    if (!base) {
      holes.push(null);
      continue;
    }

    const oriented = orientHoleLine(base, tees, greens);
    const lineGreen = base.green || oriented.green || null;
    const lineTee = base.tee || oriented.tee || null;
    const nearestGreen = lineGreen ? nearestFeature(lineGreen, greens, 90) : null;
    const nearestTee = lineTee ? nearestFeature(lineTee, tees, 90) : null;
    const greenCenter = nearestGreen?.center || lineGreen;
    const tee = nearestTee?.center || lineTee;
    const greenPolygon = polygonFromGeometry(nearestGreen?.geometry) || base.greenPolygon || [];
    const greenEdges = estimateGreenFrontBack(tee, greenCenter, greenPolygon);
    const teeGroup = tee
      ? nearbyFeatures(tee, tees, 95).map((item, index) => ({
          name: item.name || `OSM tee ${index + 1}`,
          lat: item.center.lat,
          lng: item.center.lng,
          osm: item.osm
        }))
      : [];

    holes.push({
      number,
      name: base.name || `Hole ${number}`,
      tee,
      greenCenter,
      greenFront: greenEdges.front,
      greenBack: greenEdges.back,
      greenPolygon,
      tees: teeGroup,
      osm: {
        hole: base.osm || null,
        green: nearestGreen?.osm || base.greenOsm || null,
        tee: nearestTee?.osm || base.teeOsm || null
      },
      yards: tee && greenCenter ? Math.round(yardsBetween(tee, greenCenter)) : base.yards || null
    });
  }

  return {
    schema: "pinscope-osm-course-layout-v1",
    source: "OpenStreetMap",
    attribution: "Hole geometry from OpenStreetMap contributors under ODbL.",
    radiusMeters,
    mappedCount: holes.filter(Boolean).length,
    holes
  };
}

function lineCandidate(element, geometry, tags) {
  const number = holeNumber(tags);
  if (!number || geometry.length < 2) {
    return null;
  }
  const tee = geometry[0];
  const green = geometry[geometry.length - 1];
  return {
    number,
    osm: `${element.type}/${element.id}`,
    name: tags.name || tags.ref || "",
    lineTee: roundPoint(tee),
    lineGreen: roundPoint(green),
    path: geometry.map(roundPoint),
    yards: Math.round(yardsBetween(tee, green))
  };
}

function elementGeometry(element) {
  if (Array.isArray(element.geometry)) {
    return element.geometry
      .map((point) => ({ lat: Number(point.lat), lng: Number(point.lon) }))
      .filter(validPoint);
  }
  if (Array.isArray(element.members)) {
    return element.members
      .filter((member) => Array.isArray(member.geometry))
      .flatMap((member) => member.geometry.map((point) => ({ lat: Number(point.lat), lng: Number(point.lon) })))
      .filter(validPoint);
  }
  return [];
}

function elementCenter(element, geometry) {
  const center = element.center
    ? { lat: Number(element.center.lat), lng: Number(element.center.lon) }
    : null;
  if (validPoint(center)) {
    return roundPoint(center);
  }
  if (geometry.length) {
    return centroid(geometry);
  }
  return null;
}

function centroid(points) {
  const valid = points.filter(validPoint);
  if (!valid.length) {
    return null;
  }
  const total = valid.reduce((sum, point) => ({ lat: sum.lat + point.lat, lng: sum.lng + point.lng }), { lat: 0, lng: 0 });
  return roundPoint({ lat: total.lat / valid.length, lng: total.lng / valid.length });
}

function polygonFromGeometry(geometry) {
  if (!Array.isArray(geometry) || geometry.length < 3) {
    return [];
  }
  return geometry.map(roundPoint);
}

function estimateGreenFrontBack(tee, greenCenter, polygon) {
  if (!validPoint(tee) || !validPoint(greenCenter)) {
    return { front: null, back: null };
  }
  const fairway = geoToLocalMeters(tee, greenCenter);
  const length = Math.hypot(fairway.x, fairway.y);
  if (length < 1) {
    return { front: null, back: null };
  }
  if (Array.isArray(polygon) && polygon.length >= 3) {
    let front = null;
    let back = null;
    let minProjection = Infinity;
    let maxProjection = -Infinity;
    for (const point of polygon) {
      const local = geoToLocalMeters(tee, point);
      const projection = (local.x * fairway.x + local.y * fairway.y) / length;
      if (projection < minProjection) {
        minProjection = projection;
        front = point;
      }
      if (projection > maxProjection) {
        maxProjection = projection;
        back = point;
      }
    }
    return { front: front ? roundPoint(front) : null, back: back ? roundPoint(back) : null };
  }
  const unit = { x: fairway.x / length, y: fairway.y / length };
  return {
    front: localMetersToGeo(greenCenter, { x: -unit.x * 10, y: -unit.y * 10 }),
    back: localMetersToGeo(greenCenter, { x: unit.x * 10, y: unit.y * 10 })
  };
}


function orientHoleLine(base, tees, greens) {
  const first = base.lineTee || null;
  const last = base.lineGreen || null;
  if (!validPoint(first) || !validPoint(last)) {
    return { tee: first, green: last };
  }
  const firstTee = nearestFeature(first, tees, 85);
  const firstGreen = nearestFeature(first, greens, 85);
  const lastTee = nearestFeature(last, tees, 85);
  const lastGreen = nearestFeature(last, greens, 85);
  const looksReversed = Boolean(firstGreen && lastTee && (!firstTee || !lastGreen));
  return looksReversed
    ? { tee: last, green: first }
    : { tee: first, green: last };
}

function nearestFeature(point, features, maxYards) {
  if (!validPoint(point)) {
    return null;
  }
  let best = null;
  let bestYards = Number(maxYards) || Infinity;
  for (const feature of features) {
    if (!validPoint(feature.center)) {
      continue;
    }
    const yards = yardsBetween(point, feature.center);
    if (yards < bestYards) {
      best = feature;
      bestYards = yards;
    }
  }
  return best;
}

function nearbyFeatures(point, features, maxYards) {
  if (!validPoint(point)) {
    return [];
  }
  return features
    .map((feature) => ({ feature, yards: validPoint(feature.center) ? yardsBetween(point, feature.center) : Infinity }))
    .filter((item) => item.yards <= maxYards)
    .sort((a, b) => a.yards - b.yards)
    .map((item) => item.feature);
}

function holeNumber(tags = {}) {
  const candidates = [tags.ref, tags.hole, tags["golf:hole"], tags.name];
  for (const value of candidates) {
    const match = String(value || "").match(/\b(\d{1,2})\b/);
    if (match) {
      const number = Number(match[1]);
      if (number >= 1 && number <= 45) {
        return number;
      }
    }
  }
  return null;
}

function geoToLocalMeters(origin, position) {
  const lat = Number(position.lat);
  const lng = Number(position.lng);
  const originLat = Number(origin.lat);
  const originLng = Number(origin.lng);
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos((originLat * Math.PI) / 180);
  return {
    x: (lng - originLng) * metersPerDegreeLng,
    y: (lat - originLat) * metersPerDegreeLat
  };
}

function localMetersToGeo(origin, point) {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos((Number(origin.lat) * Math.PI) / 180);
  return roundPoint({
    lat: Number(origin.lat) + Number(point.y) / metersPerDegreeLat,
    lng: Number(origin.lng) + Number(point.x) / metersPerDegreeLng
  });
}

function validPoint(point) {
  return Boolean(point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng)));
}

function roundPoint(point) {
  return {
    lat: Number(Number(point.lat).toFixed(6)),
    lng: Number(Number(point.lng).toFixed(6))
  };
}
