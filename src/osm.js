import { createPlaceholderCourse, parseHolesCount, yardsBetween } from "./course-data.js";

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://z.overpass-api.de/api/interpreter"
];
const METERS_TO_YARDS = 1.0936132983;
const DEFAULT_LAYOUT_RADIUS_METERS = 2600;
const MAX_LAYOUT_RADIUS_METERS = 4200;
const GREEN_SNAP_YARDS = 180;
const GREEN_EXISTING_SNAP_YARDS = 130;
const TEE_SNAP_YARDS = 160;
const FEATURE_ONLY_TEE_SNAP_YARDS = 120;
const COURSE_AREA_BUFFER_YARDS = 90;

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

export async function fetchOsmCourseLayout(course, radiusMeters = DEFAULT_LAYOUT_RADIUS_METERS) {
  const location = course?.location;
  if (!validPoint(location)) {
    throw new Error("This course needs a valid course lat/lng before OSM hole mapping can run.");
  }

  const radius = Math.min(Math.max(Number(radiusMeters) || DEFAULT_LAYOUT_RADIUS_METERS, 1000), MAX_LAYOUT_RADIUS_METERS);
  const layouts = [];
  let lastError = null;

  try {
    const overpassElements = await fetchOverpassLayoutElements(location, radius);
    layouts.push(layoutFromOsmElements(overpassElements, course, radius, "Overpass"));
  } catch (error) {
    lastError = error;
  }

  // Keep the same style of OSM hint loading as the standalone green mapper. It
  // renders exact OSM green/tee shapes well, so PinScope now imports those raw
  // shapes first, then matches them onto the existing holes.
  try {
    const focusedElements = await fetchOverpassLayoutElements(location, Math.min(radius + 700, MAX_LAYOUT_RADIUS_METERS));
    layouts.push(layoutFromOsmElements(focusedElements, course, Math.min(radius + 700, MAX_LAYOUT_RADIUS_METERS), "OSM hints"));
  } catch (error) {
    lastError = lastError || error;
  }

  // Fallback to the core OSM map extract. Some Overpass mirrors occasionally
  // return partial geometries. This mirrors the URL used in the verified-course
  // sources and rebuilds ways locally from the XML.
  try {
    const mapElements = await fetchOsmMapExtractElements(location, radius);
    layouts.push(layoutFromOsmElements(mapElements, course, radius, "OSM map extract"));
  } catch (error) {
    lastError = lastError || error;
  }

  const best = layouts
    .filter(Boolean)
    .sort((a, b) => scoreLayout(b) - scoreLayout(a))[0];

  if (best && (best.mappedCount || best.greenShapeCount || best.holes?.some(Boolean))) {
    return best;
  }

  throw lastError || new Error("No OSM golf geometry could be loaded for this course.");
}

async function fetchOverpassLayoutElements(location, radius) {
  const bbox = bboxFromCenter(location, radius);
  const query = `
    [out:json][timeout:50];
    (
      node["golf"~"^(hole|green|tee|pin)$"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
      way["golf"~"^(hole|green|tee|pin)$"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
      relation["golf"~"^(hole|green|tee|pin)$"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
      way["leisure"="golf_course"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
      relation["leisure"="golf_course"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
    );
    out center geom tags;
  `;

  const response = await overpassRequest(query);
  const payload = await response.json();
  return payload.elements || [];
}

async function fetchOsmMapExtractElements(location, radius) {
  const bbox = bboxFromCenter(location, Math.min(Math.max(radius, 2400), 3600));
  const url = `https://api.openstreetmap.org/api/0.6/map?bbox=${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`;
  const response = await fetch(url, { headers: { Accept: "application/xml,text/xml,*/*" } });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenStreetMap map extract failed (${response.status})${detail ? `: ${detail.slice(0, 160)}` : ""}`);
  }
  return elementsFromOsmXml(await response.text());
}

async function overpassRequest(query) {
  let lastError = null;
  for (const url of OVERPASS_URLS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: new URLSearchParams({ data: query })
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        lastError = new Error(`OpenStreetMap lookup failed (${response.status})${detail ? `: ${detail.slice(0, 160)}` : ""}`);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("OpenStreetMap lookup failed.");
}

function elementsFromOsmXml(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("OpenStreetMap returned XML that could not be parsed.");
  }

  const nodes = new Map();
  doc.querySelectorAll("node").forEach((node) => {
    const id = node.getAttribute("id");
    const lat = Number(node.getAttribute("lat"));
    const lon = Number(node.getAttribute("lon"));
    if (id && Number.isFinite(lat) && Number.isFinite(lon)) {
      nodes.set(id, { lat, lng: lon });
    }
  });

  const waysById = new Map();
  const elements = [];

  doc.querySelectorAll("way").forEach((way) => {
    const id = way.getAttribute("id");
    const tags = tagsFromXmlElement(way);
    const refs = Array.from(way.querySelectorAll("nd")).map((nd) => nd.getAttribute("ref")).filter(Boolean);
    const geometry = refs.map((ref) => nodes.get(ref)).filter(validPoint).map(roundPoint);
    const element = {
      type: "way",
      id: Number(id),
      tags,
      geometry: geometry.map((point) => ({ lat: point.lat, lon: point.lng }))
    };
    waysById.set(id, { ...element, geometryPoints: geometry });
    if (isGolfGeometryTag(tags.golf) || isCourseBoundaryTag(tags)) {
      elements.push(element);
    }
  });

  doc.querySelectorAll("relation").forEach((relation) => {
    const id = relation.getAttribute("id");
    const tags = tagsFromXmlElement(relation);
    if (!isGolfGeometryTag(tags.golf) && !isCourseBoundaryTag(tags)) {
      return;
    }
    const memberGeometries = Array.from(relation.querySelectorAll("member[type='way']"))
      .map((member) => waysById.get(member.getAttribute("ref")))
      .filter(Boolean)
      .map((way) => ({ geometry: way.geometry || [] }));
    elements.push({
      type: "relation",
      id: Number(id),
      tags,
      members: memberGeometries
    });
  });

  return elements;
}

function tagsFromXmlElement(element) {
  const tags = {};
  element.querySelectorAll("tag").forEach((tag) => {
    tags[tag.getAttribute("k")] = tag.getAttribute("v") || "";
  });
  return tags;
}

function isGolfGeometryTag(value) {
  return ["hole", "green", "tee", "pin"].includes(String(value || ""));
}

function isCourseBoundaryTag(tags = {}) {
  return String(tags.leisure || "") === "golf_course";
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
  course.location = validPoint(location) ? location : null;
  course.distanceMiles = course.location ? Number((yardsBetween(origin, course.location) / 1760).toFixed(1)) : null;
  course.postcode = tags["addr:postcode"] || tags.postal_code || "";
  course.par = tags["golf:par"] || "";
  course.holesTag = tags["golf:course"] || "";
  course.osm = { type: element.type, id: element.id };
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

function layoutFromOsmElements(elements, course, radiusMeters, method = "OpenStreetMap") {
  const parsedAll = parseGolfFeatures(elements);
  const courseAreaSelection = selectCourseArea(elements, course);
  const courseArea = courseAreaSelection?.unmatched ? null : courseAreaSelection;
  const fallbackCenter = courseAreaSelection?.unmatched ? null : course?.location;
  const parsed = filterParsedFeaturesToCourseArea(parsedAll, courseArea, fallbackCenter);
  const count = Math.max(1, Number(course?.holesCount) || Number(course?.holes?.length) || 18);
  const existingByNumber = new Map((course?.holes || []).map((hole) => [Number(hole.number), hole]));
  const linesByNumber = bestLinesByNumber(parsed.holeLines, parsed.tees, parsed.greens);
  const usedGreens = new Set();
  const usedTees = new Set();
  const holes = [];

  for (let number = 1; number <= count; number += 1) {
    const existing = existingByNumber.get(number) || {};
    const line = linesByNumber.get(number) || null;
    const teeSeed = validPoint(line?.tee) ? line.tee : normalizePoint(existing.tee);
    const greenSeed = validPoint(line?.green) ? line.green : normalizePoint(existing.greenCenter);

    const greenFeature = bestGreenForHole({
      number,
      line,
      seed: greenSeed,
      existing: normalizePoint(existing.greenCenter),
      greens: parsed.greens,
      used: usedGreens
    });
    const greenCenter = greenFeature?.center || greenSeed || null;

    if (greenFeature?.osm) {
      usedGreens.add(greenFeature.osm);
    }

    const teeFeature = bestTeeForHole({
      number,
      line,
      seed: teeSeed,
      existing: normalizePoint(existing.tee),
      tees: parsed.tees,
      used: usedTees
    });
    const tee = teeFeature?.center || teeSeed || null;

    if (teeFeature?.osm) {
      usedTees.add(teeFeature.osm);
    }

    const greenPolygon = greenFeature?.polygon?.length
      ? greenFeature.polygon.map(roundPoint)
      : normalizePolygon(existing.geometry?.greenPolygon || existing.greenPolygon || []);
    const greenEdges = estimateGreenFrontBack(tee, greenCenter, greenPolygon);
    const nearbyTees = tee
      ? nearbyFeatures(tee, parsed.tees, 130).map((item, index) => ({
          name: item.name || item.tags?.colour || item.tags?.color || `OSM tee ${index + 1}`,
          lat: item.center.lat,
          lng: item.center.lng,
          osm: item.osm
        }))
      : [];

    if (!tee && !greenCenter && !greenPolygon.length) {
      holes.push(null);
      continue;
    }

    holes.push({
      number,
      name: line?.name || existing.name || `Hole ${number}`,
      tee,
      greenCenter,
      greenFront: greenEdges.front,
      greenBack: greenEdges.back,
      greenPolygon,
      tees: nearbyTees,
      geometry: {
        greenPolygon,
        osmGreenShape: Boolean(greenPolygon.length),
        holeLine: line?.path || []
      },
      osm: {
        hole: line?.osm || null,
        green: greenFeature?.osm || null,
        tee: teeFeature?.osm || null,
        courseArea: courseArea?.osm || null
      },
      yards: tee && greenCenter ? Math.round(yardsBetween(tee, greenCenter)) : existing.yards || line?.yards || null
    });
  }

  return {
    schema: "pinscope-osm-course-layout-v5",
    source: `OpenStreetMap (${method}${courseArea ? ", course-locked" : ""})`,
    attribution: "Hole geometry from OpenStreetMap contributors under ODbL.",
    radiusMeters,
    courseArea: courseArea ? featureForExport(courseArea) : null,
    counts: {
      holeLines: parsed.holeLines.length,
      greens: parsed.greens.length,
      tees: parsed.tees.length,
      pins: parsed.pins.length,
      allHoleLines: parsedAll.holeLines.length,
      allGreens: parsedAll.greens.length,
      allTees: parsedAll.tees.length
    },
    mappedCount: holes.filter((hole) => hole?.tee && hole?.greenCenter).length,
    greenShapeCount: holes.filter((hole) => hole?.greenPolygon?.length || hole?.geometry?.greenPolygon?.length).length,
    holes,
    rawFeatures: {
      greens: parsed.greens.map(featureForExport),
      tees: parsed.tees.map(featureForExport),
      holes: parsed.holeLines.map((line) => ({
        number: line.number,
        osm: line.osm,
        tee: line.tee,
        green: line.green,
        path: line.path
      }))
    }
  };
}

function selectCourseArea(elements, course) {
  const boundaries = (elements || [])
    .filter((element) => isCourseBoundaryTag(element.tags || {}))
    .map((element) => courseAreaFromElement(element))
    .filter(Boolean);
  if (!boundaries.length) {
    return null;
  }
  const expectedOsm = courseOsmRef(course);
  const courseName = normalizeName(course?.name || "");
  const location = normalizePoint(course?.location);
  let best = null;
  let bestScore = -Infinity;
  let matched = false;
  for (const area of boundaries) {
    const name = normalizeName(area.tags?.name || area.tags?.operator || "");
    const sameOsm = expectedOsm && area.osm === expectedOsm;
    const nameMatch = courseName && name && (name.includes(courseName) || courseName.includes(name));
    const distance = validPoint(location) && validPoint(area.center) ? yardsBetween(location, area.center) : 999999;
    const containsCenter = validPoint(location) && area.polygon?.length ? pointInPolygon(location, area.polygon) : false;
    if (sameOsm || nameMatch || containsCenter) {
      matched = true;
    }
    const score = (sameOsm ? 100000 : 0) + (nameMatch ? 50000 : 0) + (containsCenter ? 12000 : 0) - Math.min(distance, 12000);
    if (score > bestScore) {
      best = area;
      bestScore = score;
    }
  }
  return matched ? best : { unmatched: true };
}

function courseOsmRef(course) {
  const type = String(course?.osm?.type || "").toLowerCase();
  const id = String(course?.osm?.id || "").trim();
  if (/^(node|way|relation)$/.test(type) && /^\d+$/.test(id)) {
    return `${type}/${id}`;
  }
  const encoded = String(course?.id || "").match(/(?:^|[-_])(node|way|relation)[-_](\d+)$/i);
  return encoded ? `${encoded[1].toLowerCase()}/${encoded[2]}` : "";
}

function courseAreaFromElement(element) {
  const geometry = elementGeometry(element);
  const polygon = polygonFromGeometry(geometry);
  const hull = polygon.length ? polygon : convexHullPolygon(geometry);
  const center = elementCenter(element, geometry);
  if (!validPoint(center) && !hull.length) {
    return null;
  }
  return {
    osm: `${element.type}/${element.id}`,
    ref: null,
    name: element.tags?.name || element.tags?.operator || "",
    center,
    geometry: geometry.map(roundPoint),
    polygon: hull,
    tags: element.tags || {}
  };
}

function convexHullPolygon(points) {
  const valid = (points || []).filter(validPoint).map(roundPoint);
  if (valid.length < 3) {
    return [];
  }
  const unique = Array.from(new Map(valid.map((point) => [`${point.lat},${point.lng}`, point])).values())
    .sort((a, b) => a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng);
  if (unique.length < 3) {
    return [];
  }
  const cross = (o, a, b) => (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
  const lower = [];
  for (const point of unique) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }
  const upper = [];
  for (const point of [...unique].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  return hull.length >= 3 ? [...hull, hull[0]] : [];
}

function filterParsedFeaturesToCourseArea(parsed, courseArea, fallbackCenter) {
  const center = normalizePoint(fallbackCenter);
  const maxFallbackYards = 2600;
  const keepFeature = (feature) => featureBelongsToCourse(feature, courseArea, center, maxFallbackYards);
  const keepLine = (line) => lineBelongsToCourse(line, courseArea, center, maxFallbackYards);
  return {
    holeLines: (parsed.holeLines || []).filter(keepLine),
    greens: (parsed.greens || []).filter(keepFeature),
    tees: (parsed.tees || []).filter(keepFeature),
    pins: (parsed.pins || []).filter(keepFeature)
  };
}

function featureBelongsToCourse(feature, courseArea, fallbackCenter, maxFallbackYards) {
  if (!feature || !validPoint(feature.center)) {
    return false;
  }
  if (courseArea?.polygon?.length) {
    if (pointInPolygon(feature.center, courseArea.polygon)) {
      return true;
    }
    if ((feature.geometry || []).some((point) => validPoint(point) && pointInPolygon(point, courseArea.polygon))) {
      return true;
    }
    return distanceToPolygonYards(feature.center, courseArea.polygon) <= COURSE_AREA_BUFFER_YARDS;
  }
  if (validPoint(courseArea?.center)) {
    return yardsBetween(feature.center, courseArea.center) <= maxFallbackYards;
  }
  return validPoint(fallbackCenter) ? yardsBetween(feature.center, fallbackCenter) <= maxFallbackYards : false;
}

function lineBelongsToCourse(line, courseArea, fallbackCenter, maxFallbackYards) {
  if (!line) {
    return false;
  }
  const points = [line.tee, line.green, ...(line.path || [])].filter(validPoint);
  if (!points.length) {
    return false;
  }
  if (courseArea?.polygon?.length) {
    const insideCount = points.filter((point) => pointInPolygon(point, courseArea.polygon) || distanceToPolygonYards(point, courseArea.polygon) <= COURSE_AREA_BUFFER_YARDS).length;
    return insideCount >= Math.max(1, Math.ceil(points.length * 0.35));
  }
  const center = validPoint(courseArea?.center) ? courseArea.center : fallbackCenter;
  return validPoint(center) ? points.some((point) => yardsBetween(point, center) <= maxFallbackYards) : false;
}

function bestGreenForHole({ number, line, seed, existing, greens, used }) {
  const candidates = (greens || []).filter((feature) => !used?.has(feature.osm));
  const byRef = candidates.filter((feature) => Number(feature.ref) === Number(number));
  if (line) {
    const byLine = bestGreenForLineEnd(line, byRef.length ? byRef : candidates, GREEN_SNAP_YARDS);
    if (byLine) {
      return byLine;
    }
  }
  if (byRef.length) {
    return bestFeatureByDistance(seed || existing || byRef[0].center, byRef, GREEN_SNAP_YARDS) || byRef[0];
  }
  if (line) {
    return bestGreenForLineEnd(line, candidates, GREEN_SNAP_YARDS);
  }
  return bestFeatureByDistance(seed || existing, candidates, existing ? GREEN_EXISTING_SNAP_YARDS : GREEN_SNAP_YARDS, used);
}

function bestGreenForLineEnd(line, features, maxYards) {
  const target = line?.green;
  if (!validPoint(target) || !Array.isArray(features)) {
    return null;
  }
  let best = null;
  let bestScore = Number(maxYards || GREEN_SNAP_YARDS);
  for (const feature of features) {
    if (!validPoint(feature.center)) {
      continue;
    }
    const centerDistance = yardsBetween(target, feature.center);
    const polygonDistance = feature.polygon?.length ? distanceToPolygonYards(target, feature.polygon) : centerDistance;
    const refPenalty = feature.ref && Number(feature.ref) !== Number(line.number) ? 80 : 0;
    // Use the end of the numbered OSM golf=hole line as the primary match.
    // Some fairways pass close to a neighbouring green, so using distance to
    // any point on the path can accidentally steal the wrong hole's green.
    const score = Math.min(centerDistance, polygonDistance) + refPenalty;
    if (score <= bestScore) {
      best = feature;
      bestScore = score;
    }
  }
  return best;
}

function bestTeeForHole({ number, line, seed, existing, tees, used }) {
  const candidates = (tees || []).filter((feature) => !used?.has(feature.osm));
  const byRef = candidates.filter((feature) => Number(feature.ref) === Number(number));
  const target = seed || line?.tee || existing;
  if (byRef.length) {
    return bestFeatureByDistance(target || byRef[0].center, byRef, TEE_SNAP_YARDS) || byRef[0];
  }
  return bestFeatureByDistance(target, candidates, line ? TEE_SNAP_YARDS : FEATURE_ONLY_TEE_SNAP_YARDS, used);
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/golf\s+club|golf\s+course|park|club|course/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function parseGolfFeatures(elements) {
  const holeLines = [];
  const greens = [];
  const tees = [];
  const pins = [];

  for (const element of elements || []) {
    const tags = element.tags || {};
    const golf = tags.golf;
    if (!isGolfGeometryTag(golf)) {
      continue;
    }
    const geometry = elementGeometry(element);
    const center = elementCenter(element, geometry);
    const polygon = polygonFromGeometry(geometry);
    const ref = holeNumber(tags);
    const common = {
      osm: `${element.type}/${element.id}`,
      ref,
      name: tags.name || tags.ref || "",
      center,
      geometry,
      polygon,
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
    } else if (golf === "pin" && center) {
      pins.push(common);
    }
  }

  // OSM pins are point-like green centres. Treat them as green candidates too,
  // but do not create polygons from them.
  for (const pin of pins) {
    if (!greens.some((green) => green.ref === pin.ref && yardsBetween(green.center, pin.center) < 60)) {
      greens.push({ ...pin, polygon: [] });
    }
  }

  return { holeLines, greens, tees, pins };
}

function lineCandidate(element, geometry, tags) {
  const number = holeNumber(tags);
  if (!number || geometry.length < 2) {
    return null;
  }
  return {
    number,
    osm: `${element.type}/${element.id}`,
    name: tags.name || tags.ref || "",
    rawStart: roundPoint(geometry[0]),
    rawEnd: roundPoint(geometry[geometry.length - 1]),
    tee: roundPoint(geometry[0]),
    green: roundPoint(geometry[geometry.length - 1]),
    path: geometry.map(roundPoint),
    yards: Math.round(yardsBetween(geometry[0], geometry[geometry.length - 1]))
  };
}

function bestLinesByNumber(lines, tees, greens) {
  const byNumber = new Map();
  for (const rawLine of lines) {
    const line = orientHoleLine(rawLine, tees, greens);
    const current = byNumber.get(line.number);
    if (!current || line.path.length > current.path.length || line.yards > current.yards) {
      byNumber.set(line.number, line);
    }
  }
  return byNumber;
}

function orientHoleLine(line, tees, greens) {
  const first = line.rawStart;
  const last = line.rawEnd;
  if (!validPoint(first) || !validPoint(last)) {
    return line;
  }
  const forwardScore = nearestDistanceYards(first, tees) + nearestDistanceYards(last, greens);
  const reverseScore = nearestDistanceYards(last, tees) + nearestDistanceYards(first, greens);
  if (reverseScore + 25 < forwardScore) {
    return {
      ...line,
      tee: last,
      green: first,
      path: [...line.path].reverse()
    };
  }
  return { ...line, tee: first, green: last };
}

function elementGeometry(element) {
  if (Array.isArray(element.geometry)) {
    return element.geometry
      .map((point) => ({ lat: Number(point.lat), lng: Number(point.lon ?? point.lng) }))
      .filter(validPoint);
  }
  if (Array.isArray(element.members)) {
    return element.members
      .filter((member) => Array.isArray(member.geometry))
      .flatMap((member) => member.geometry.map((point) => ({ lat: Number(point.lat), lng: Number(point.lon ?? point.lng) })))
      .filter(validPoint);
  }
  return [];
}

function elementCenter(element, geometry) {
  if (geometry.length >= 3 && samePoint(geometry[0], geometry[geometry.length - 1])) {
    return polygonCentroid(geometry);
  }
  if (geometry.length) {
    return centroid(geometry);
  }
  const center = element.center ? { lat: Number(element.center.lat), lng: Number(element.center.lon) } : null;
  if (validPoint(center)) {
    return roundPoint(center);
  }
  const point = { lat: Number(element.lat), lng: Number(element.lon) };
  return validPoint(point) ? roundPoint(point) : null;
}

function centroid(points) {
  const valid = (points || []).filter(validPoint);
  if (!valid.length) {
    return null;
  }
  const total = valid.reduce((sum, point) => ({ lat: sum.lat + point.lat, lng: sum.lng + point.lng }), { lat: 0, lng: 0 });
  return roundPoint({ lat: total.lat / valid.length, lng: total.lng / valid.length });
}

function polygonCentroid(points) {
  const valid = (points || []).filter(validPoint);
  if (valid.length < 3) {
    return centroid(valid);
  }
  let area = 0;
  let cx = 0;
  let cy = 0;
  const origin = valid[0];
  const projected = valid.map((point) => geoToLocalMeters(origin, point));
  for (let i = 0; i < projected.length - 1; i += 1) {
    const a = projected[i];
    const b = projected[i + 1];
    const cross = a.x * b.y - b.x * a.y;
    area += cross;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  if (Math.abs(area) < 0.0001) {
    return centroid(valid);
  }
  area *= 0.5;
  return localMetersToGeo(origin, { x: cx / (6 * area), y: cy / (6 * area) });
}

function polygonFromGeometry(geometry) {
  const points = normalizePolygon(geometry);
  if (points.length < 3) {
    return [];
  }
  if (!samePoint(points[0], points[points.length - 1])) {
    return [];
  }
  return points;
}

function bestFeatureForRef(ref, features, nearPoint, maxYards) {
  const matches = (features || []).filter((feature) => Number(feature.ref) === Number(ref));
  if (!matches.length) {
    return null;
  }
  return bestFeatureByDistance(nearPoint || matches[0].center, matches, maxYards || Infinity) || matches[0];
}

function bestFeatureByDistance(point, features, maxYards = Infinity, used = null) {
  if (!validPoint(point) || !Array.isArray(features)) {
    return null;
  }
  let best = null;
  let bestScore = Number.isFinite(Number(maxYards)) ? Number(maxYards) : Infinity;
  for (const feature of features) {
    if (!validPoint(feature.center) || (used && used.has(feature.osm))) {
      continue;
    }
    const centerYards = yardsBetween(point, feature.center);
    const polygonYards = feature.polygon?.length ? distanceToPolygonYards(point, feature.polygon) : centerYards;
    const score = Math.min(centerYards, polygonYards);
    if (score <= bestScore) {
      best = feature;
      bestScore = score;
    }
  }
  return best;
}

function nearestDistanceYards(point, features) {
  const match = bestFeatureByDistance(point, features, Infinity);
  return match ? yardsBetween(point, match.center) : 9999;
}

function nearbyFeatures(point, features, maxYards) {
  if (!validPoint(point)) {
    return [];
  }
  return (features || [])
    .map((feature) => ({ feature, yards: validPoint(feature.center) ? yardsBetween(point, feature.center) : Infinity }))
    .filter((item) => item.yards <= maxYards)
    .sort((a, b) => a.yards - b.yards)
    .map((item) => item.feature);
}

function holeNumber(tags = {}) {
  const candidates = [tags.ref, tags.hole, tags["golf:hole"], tags.name, tags["addr:housenumber"]];
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

function estimateGreenFrontBack(tee, greenCenter, polygon) {
  if (!validPoint(tee) || !validPoint(greenCenter)) {
    return { front: greenCenter || null, back: greenCenter || null };
  }
  const fairway = geoToLocalMeters(tee, greenCenter);
  const length = Math.hypot(fairway.x, fairway.y);
  if (length < 1) {
    return { front: greenCenter, back: greenCenter };
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
    return { front: front ? roundPoint(front) : greenCenter, back: back ? roundPoint(back) : greenCenter };
  }
  const unit = { x: fairway.x / length, y: fairway.y / length };
  return {
    front: localMetersToGeo(greenCenter, { x: -unit.x * 10, y: -unit.y * 10 }),
    back: localMetersToGeo(greenCenter, { x: unit.x * 10, y: unit.y * 10 })
  };
}

function featureForExport(feature) {
  return {
    osm: feature.osm,
    ref: feature.ref || null,
    name: feature.name || "",
    center: feature.center,
    polygon: feature.polygon || [],
    tags: feature.tags || {}
  };
}

function scoreLayout(layout) {
  return (layout.courseArea ? 5000 : 0) + (layout.mappedCount || 0) * 1000 + (layout.greenShapeCount || 0) * 30 + (layout.counts?.greens || 0) * 3 + (layout.counts?.holeLines || 0);
}

function pointInPolygon(point, polygon) {
  if (!validPoint(point) || !Array.isArray(polygon) || polygon.length < 3) {
    return false;
  }
  let inside = false;
  const x = Number(point.lng);
  const y = Number(point.lat);
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = Number(polygon[i].lng);
    const yi = Number(polygon[i].lat);
    const xj = Number(polygon[j].lng);
    const yj = Number(polygon[j].lat);
    const intersects = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi);
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function distanceToPolygonYards(point, polygon) {
  if (!validPoint(point) || !Array.isArray(polygon) || polygon.length < 2) {
    return Infinity;
  }
  let bestMeters = Infinity;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    if (!validPoint(a) || !validPoint(b)) {
      continue;
    }
    bestMeters = Math.min(bestMeters, distanceToSegmentMeters(point, a, b));
  }
  return bestMeters * METERS_TO_YARDS;
}

function distanceToSegmentMeters(point, a, b) {
  const origin = a;
  const p = geoToLocalMeters(origin, point);
  const end = geoToLocalMeters(origin, b);
  const lengthSquared = end.x * end.x + end.y * end.y;
  if (lengthSquared < 0.0001) {
    return Math.hypot(p.x, p.y);
  }
  const t = Math.max(0, Math.min(1, (p.x * end.x + p.y * end.y) / lengthSquared));
  return Math.hypot(p.x - end.x * t, p.y - end.y * t);
}

function bboxFromCenter(center, radiusMeters) {
  const radius = Math.max(250, Number(radiusMeters) || DEFAULT_LAYOUT_RADIUS_METERS);
  const lat = Number(center.lat);
  const lng = Number(center.lng);
  const latDelta = radius / 111320;
  const lngDelta = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: Number((lat - latDelta).toFixed(7)),
    minLng: Number((lng - lngDelta).toFixed(7)),
    maxLat: Number((lat + latDelta).toFixed(7)),
    maxLng: Number((lng + lngDelta).toFixed(7))
  };
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

function normalizePoint(point) {
  return validPoint(point) ? roundPoint(point) : null;
}

function normalizePolygon(points) {
  return Array.isArray(points) ? points.map(normalizePoint).filter(Boolean) : [];
}

function samePoint(a, b) {
  return validPoint(a) && validPoint(b) && Math.abs(a.lat - b.lat) < 0.0000001 && Math.abs(a.lng - b.lng) < 0.0000001;
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
