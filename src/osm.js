import { createPlaceholderCourse, parseHolesCount, yardsBetween } from "./course-data.js";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

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

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: new URLSearchParams({ data: query })
  });

  if (!response.ok) {
    throw new Error(`OpenStreetMap lookup failed (${response.status})`);
  }

  const payload = await response.json();
  return (payload.elements || []).map((element) => courseFromOsmElement(element, position)).filter(Boolean);
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
