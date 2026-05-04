const fs = require('fs');

const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';

const courses = [
  { id: 'osm-way-23454278', name: 'Cranham Golf Course', lat: 51.555764, lng: 0.282267 },
  { id: 'verified-belhus-park', name: 'Belhus Park Golf Club', lat: 51.507331, lng: 0.263364 },
  { id: 'verified-basildon', name: 'Basildon Golf Course', lat: 51.5746, lng: 0.4372 },
  { id: 'verified-castle-point-canvey', name: 'Canvey Island Golf Course', lat: 51.5354, lng: 0.5844 }
];

function overpassQuery(course, radius = 1300) {
  return `[out:json][timeout:40];
(
  way["golf"="hole"](around:${radius},${course.lat},${course.lng});
);
out tags geom center;`;
}

function holeNumber(tags = {}) {
  const candidates = [tags.ref, tags['hole'], tags['golf:hole'], tags.name];
  for (const value of candidates) {
    const match = String(value || '').match(/\b(\d{1,2})\b/);
    if (match) {
      const number = Number(match[1]);
      if (number >= 1 && number <= 18) {
        return number;
      }
    }
  }
  return null;
}

function lineGeometry(element) {
  if (Array.isArray(element.geometry) && element.geometry.length >= 2) {
    return element.geometry.map((point) => ({ lat: point.lat, lng: point.lon }));
  }
  const members = (element.members || [])
    .filter((member) => Array.isArray(member.geometry))
    .flatMap((member) => member.geometry.map((point) => ({ lat: point.lat, lng: point.lon })));
  return members.length >= 2 ? members : [];
}

function yardsBetween(a, b) {
  const radius = 6371000;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return Math.round((2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))) * 1.0936132983);
}

function candidateFromElement(element) {
  const number = holeNumber(element.tags);
  const geometry = lineGeometry(element);
  if (!number || geometry.length < 2) {
    return null;
  }
  const tee = geometry[0];
  const green = geometry[geometry.length - 1];
  return {
    number,
    osm: `${element.type}/${element.id}`,
    name: element.tags?.name || '',
    tee: {
      lat: Number(tee.lat.toFixed(6)),
      lng: Number(tee.lng.toFixed(6))
    },
    green: {
      lat: Number(green.lat.toFixed(6)),
      lng: Number(green.lng.toFixed(6))
    },
    yards: yardsBetween(tee, green)
  };
}

async function fetchCourse(course) {
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'User-Agent': 'PinScope local course coordinate lookup (contact: local-dev)'
    },
    body: new URLSearchParams({ data: overpassQuery(course) })
  });
  if (!response.ok) {
    throw new Error(`${course.name}: Overpass ${response.status}\n${await response.text()}`);
  }
  const payload = await response.json();
  const byHole = new Map();
  for (const element of payload.elements || []) {
    const candidate = candidateFromElement(element);
    if (!candidate) {
      continue;
    }
    const existing = byHole.get(candidate.number);
    if (!existing || candidate.yards > existing.yards) {
      byHole.set(candidate.number, candidate);
    }
  }
  return {
    ...course,
    holes: Array.from({ length: 18 }, (_, index) => byHole.get(index + 1) || null)
  };
}

(async () => {
  const wanted = process.argv[2] ? new Set(process.argv.slice(2)) : null;
  const selected = wanted
    ? courses.filter((course) => wanted.has(course.id) || wanted.has(course.name))
    : courses;
  const results = [];
  for (const course of selected) {
    results.push(await fetchCourse(course));
  }
  fs.mkdirSync('artifacts', { recursive: true });
  fs.writeFileSync('artifacts/hole-coordinates-osm.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.map((course) => ({
    id: course.id,
    name: course.name,
    found: course.holes.filter(Boolean).length,
    missing: course.holes.map((hole, index) => hole ? null : index + 1).filter(Boolean)
  })), null, 2));
})();
