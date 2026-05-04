const fs = require("fs");
const path = require("path");

const API_BASE = "https://api.golfcourseapi.com";
const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");
const OUTPUT_PATH = path.join(ROOT, "artifacts", "golfcourseapi-verified-courses.json");

const verifiedQueries = [
  { id: "osm-way-23454278", name: "Cranham Golf Course", queries: ["Cranham Golf Course", "Cranham"] },
  { id: "verified-belhus-park", name: "Belhus Park Golf Club", queries: ["Belhus Park Golf Club", "Belhus Park"] },
  { id: "verified-basildon", name: "Basildon Golf Course", queries: ["Basildon Golf Course", "Basildon Golf Club", "Basildon"] },
  { id: "verified-castle-point-canvey", name: "Canvey Island Golf Course", queries: ["Canvey Island Golf Course", "Castle Point Golf Club", "Castle Point Golf Course"] }
];

loadLocalEnv();

const apiKey = process.env.GOLFCOURSEAPI_KEY;
if (!apiKey) {
  console.error("Set GOLFCOURSEAPI_KEY in the environment or .env.local before running this tool.");
  process.exit(1);
}

function loadLocalEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    return;
  }
  const lines = fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function golfCourseApi(pathname, params = {}) {
  const url = new URL(pathname, API_BASE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: { Authorization: `Key ${apiKey}` }
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    const message = data?.error || data?.message || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }
  return data;
}

async function searchCourse(query) {
  const data = await golfCourseApi("/v1/search", { search_query: query });
  return Array.isArray(data?.courses) ? data.courses : [];
}

function hasHoleCoordinates(course) {
  const tees = [course?.tees?.male, course?.tees?.female].flat().filter(Boolean);
  return tees.some((tee) => (tee.holes || []).some((hole) => {
    return ["lat", "lng", "latitude", "longitude", "green_lat", "green_lng", "tee_lat", "tee_lng"]
      .some((key) => Object.prototype.hasOwnProperty.call(hole, key));
  }));
}

function summariseCourse(course) {
  return {
    providerId: course.id,
    clubName: course.club_name,
    courseName: course.course_name,
    location: course.location,
    teeSets: {
      male: (course.tees?.male || []).map((tee) => ({
        name: tee.tee_name,
        yards: tee.total_yards,
        par: tee.par_total,
        rating: tee.course_rating,
        slope: tee.slope_rating,
        holes: (tee.holes || []).length
      })),
      female: (course.tees?.female || []).map((tee) => ({
        name: tee.tee_name,
        yards: tee.total_yards,
        par: tee.par_total,
        rating: tee.course_rating,
        slope: tee.slope_rating,
        holes: (tee.holes || []).length
      }))
    },
    hasHoleCoordinates: hasHoleCoordinates(course)
  };
}

(async () => {
  const results = [];
  for (const verified of verifiedQueries) {
    const searches = [];
    let matched = null;
    for (const query of verified.queries) {
      const courses = await searchCourse(query);
      searches.push({ query, count: courses.length, matches: courses.map(summariseCourse) });
      if (!matched && courses.length) {
        matched = courses[0];
      }
      if (matched) {
        break;
      }
    }
    results.push({
      id: verified.id,
      name: verified.name,
      matched: matched ? summariseCourse(matched) : null,
      searches
    });
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
    source: "https://api.golfcourseapi.com",
    fetchedAt: new Date().toISOString(),
    results
  }, null, 2));

  console.log(JSON.stringify(results.map((item) => ({
    id: item.id,
    name: item.name,
    matched: item.matched ? `${item.matched.providerId}: ${item.matched.courseName}` : null,
    hasHoleCoordinates: Boolean(item.matched?.hasHoleCoordinates)
  })), null, 2));
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
