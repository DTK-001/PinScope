const fs = require('fs');

const OSM_MAP_URL = 'https://api.openstreetmap.org/api/0.6/map';

const courses = [
  { id: 'osm-way-23454278', name: 'Cranham Golf Course', lat: 51.555764, lng: 0.282267, span: 0.018 },
  { id: 'verified-belhus-park', name: 'Belhus Park Golf Club', lat: 51.507331, lng: 0.263364, span: 0.023 },
  { id: 'verified-basildon', name: 'Basildon Golf Course', lat: 51.5746, lng: 0.4372, span: 0.026 },
  { id: 'verified-castle-point-canvey', name: 'Canvey Island Golf Course', lat: 51.5354, lng: 0.5844, span: 0.028 },
  { id: 'verified-mid-kent', name: 'Mid Kent Golf Club', lat: 51.422099, lng: 0.365254, span: 0.026 },
  { id: 'verified-st-cleres-hall', name: 'St Cleres Hall Golf Club', lat: 51.50759, lng: 0.410656, span: 0.018 },
  { id: 'verified-top-meadow', name: 'Top Meadow Golf Club', lat: 51.541154, lng: 0.312411, span: 0.026 },
  { id: 'verified-ingrebourne-links', name: 'Ingrebourne Links Golf & Country Club', lat: 51.513613, lng: 0.230958, span: 0.034 },
  { id: 'verified-princes-park', name: 'Princes Park Golf Course', lat: 51.449228, lng: 0.234188, span: 0.012 },
  { id: 'verified-gravesend-golf-centre', name: 'Gravesend Golf Centre', lat: 51.422422, lng: 0.405488, span: 0.014 },
  { id: 'verified-langdon-hills', name: 'Langdon Hills Golf & Country Club', lat: 51.531174, lng: 0.365153, span: 0.035 },
  { id: 'verified-dartford', name: 'Dartford Golf Club', lat: 51.435069, lng: 0.20045, span: 0.026 },
  { id: 'verified-corinthian-fawkham-valley', name: 'Corinthian Sports Club', lat: 51.385299, lng: 0.294437, span: 0.022 },
  { id: 'verified-barnehurst', name: 'Barnehurst Golf Course', lat: 51.460138, lng: 0.172763, span: 0.016 }
];

function bbox(course) {
  const latSpan = course.span;
  const lngSpan = course.span * 1.55;
  return {
    west: course.lng - lngSpan / 2,
    south: course.lat - latSpan / 2,
    east: course.lng + lngSpan / 2,
    north: course.lat + latSpan / 2
  };
}

function attrs(text) {
  const result = {};
  for (const match of text.matchAll(/(\w+)="([^"]*)"/g)) {
    result[match[1]] = match[2];
  }
  return result;
}

function parseOsm(xml) {
  const nodes = new Map();
  for (const match of xml.matchAll(/<node\b([^>]*)\/>/g)) {
    const attr = attrs(match[1]);
    nodes.set(attr.id, { lat: Number(attr.lat), lng: Number(attr.lon) });
  }
  const ways = [];
  for (const match of xml.matchAll(/<way\b([^>]*)>([\s\S]*?)<\/way>/g)) {
    const attr = attrs(match[1]);
    const body = match[2];
    const tags = {};
    for (const tagMatch of body.matchAll(/<tag\b([^>]*)\/>/g)) {
      const tag = attrs(tagMatch[1]);
      tags[tag.k] = tag.v;
    }
    const refs = Array.from(body.matchAll(/<nd\b[^>]*ref="([^"]+)"[^>]*\/>/g), (item) => item[1]);
    ways.push({ id: attr.id, tags, refs });
  }
  return { nodes, ways };
}

function holeNumber(tags = {}) {
  const candidates = [tags.ref, tags.hole, tags['golf:hole'], tags.name];
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

function extractHoles(osm) {
  const byHole = new Map();
  for (const way of osm.ways) {
    if (way.tags.golf !== 'hole') {
      continue;
    }
    const number = holeNumber(way.tags);
    const geometry = way.refs.map((ref) => osm.nodes.get(ref)).filter(Boolean);
    if (!number || geometry.length < 2) {
      continue;
    }
    const tee = geometry[0];
    const green = geometry[geometry.length - 1];
    const candidate = {
      number,
      osm: `way/${way.id}`,
      name: way.tags.name || '',
      tee: { lat: Number(tee.lat.toFixed(6)), lng: Number(tee.lng.toFixed(6)) },
      green: { lat: Number(green.lat.toFixed(6)), lng: Number(green.lng.toFixed(6)) },
      yards: yardsBetween(tee, green)
    };
    const existing = byHole.get(number);
    if (!existing || candidate.yards > existing.yards) {
      byHole.set(number, candidate);
    }
  }
  return Array.from({ length: 18 }, (_, index) => byHole.get(index + 1) || null);
}

async function fetchCourse(course) {
  const box = bbox(course);
  const url = `${OSM_MAP_URL}?bbox=${box.west.toFixed(6)},${box.south.toFixed(6)},${box.east.toFixed(6)},${box.north.toFixed(6)}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PinScope local course coordinate lookup (contact: local-dev)' }
  });
  if (!response.ok) {
    throw new Error(`${course.name}: OSM map ${response.status}\n${await response.text()}`);
  }
  const xml = await response.text();
  fs.mkdirSync('artifacts/osm-map-raw', { recursive: true });
  fs.writeFileSync(`artifacts/osm-map-raw/${course.id}.osm`, xml);
  return {
    ...course,
    sourceUrl: url,
    holes: extractHoles(parseOsm(xml))
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
  fs.writeFileSync('artifacts/hole-coordinates-osm-map.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.map((course) => ({
    id: course.id,
    name: course.name,
    found: course.holes.filter(Boolean).length,
    missing: course.holes.map((hole, index) => hole ? null : index + 1).filter(Boolean),
    sourceUrl: course.sourceUrl
  })), null, 2));
})();
