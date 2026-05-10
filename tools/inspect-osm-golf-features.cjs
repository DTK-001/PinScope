const courses = [
  { id: 'verified-mid-kent', name: 'Mid Kent Golf Club', lat: 51.422099, lng: 0.365254 },
  { id: 'verified-st-cleres-hall', name: 'St Cleres Hall Golf Club', lat: 51.50759, lng: 0.410656 },
  { id: 'verified-top-meadow', name: 'Top Meadow Golf Club', lat: 51.541154, lng: 0.312411 },
  { id: 'verified-ingrebourne-links', name: 'Ingrebourne Links Golf & Country Club', lat: 51.513613, lng: 0.230958 },
  { id: 'verified-princes-park', name: 'Princes Park Golf Course', lat: 51.449228, lng: 0.234188 },
  { id: 'verified-gravesend-golf-centre', name: 'Gravesend Golf Centre', lat: 51.422422, lng: 0.405488 },
  { id: 'verified-langdon-hills', name: 'Langdon Hills Golf & Country Club', lat: 51.531174, lng: 0.365153 },
  { id: 'verified-dartford', name: 'Dartford Golf Club', lat: 51.435069, lng: 0.20045 },
  { id: 'verified-corinthian-fawkham-valley', name: 'Corinthian Sports Club', lat: 51.385299, lng: 0.294437 },
  { id: 'verified-barnehurst', name: 'Barnehurst Golf Course', lat: 51.460138, lng: 0.172763 }
];

const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';

function query(course, radius = 1300) {
  return `[out:json][timeout:40];
(
  node["golf"](around:${radius},${course.lat},${course.lng});
  way["golf"](around:${radius},${course.lat},${course.lng});
  relation["golf"](around:${radius},${course.lat},${course.lng});
);
out geom;`;
}

async function inspect(course) {
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'User-Agent': 'PinScope local course geometry audit (contact: local-dev)'
    },
    body: new URLSearchParams({ data: query(course) })
  });
  if (!response.ok) {
    throw new Error(`${course.name}: Overpass ${response.status}\n${await response.text()}`);
  }
  const payload = await response.json();
  const counts = {};
  const byType = {};
  const samples = {};
  for (const element of payload.elements || []) {
    const golf = element.tags?.golf || '(missing)';
    counts[golf] = (counts[golf] || 0) + 1;
    const key = `${element.type}:${golf}`;
    byType[key] = (byType[key] || 0) + 1;
    if (['hole', 'tee', 'green', 'pin'].includes(golf)) {
      samples[golf] ||= [];
    }
    if (samples[golf] && samples[golf].length < 5) {
      samples[golf].push({
        type: element.type,
        id: element.id,
        geometryLength: Array.isArray(element.geometry) ? element.geometry.length : 0,
        tags: element.tags
      });
    }
  }
  return { id: course.id, name: course.name, counts, byType, samples };
}

(async () => {
  const wanted = process.argv[2] ? new Set(process.argv.slice(2)) : null;
  const selected = wanted
    ? courses.filter((course) => wanted.has(course.id) || wanted.has(course.name))
    : courses;
  const results = [];
  for (const course of selected) {
    results.push(await inspect(course));
  }
  console.log(JSON.stringify(results, null, 2));
})();
