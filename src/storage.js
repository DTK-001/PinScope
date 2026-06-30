import { defaultBags, defaultClubs, seedCourses, yardsBetween } from "./course-data.js";
import { verifiedCourses } from "./verified-courses.js";
import { verifiedGreenDefaults } from "./verified-green-defaults.js";
import { sharedCourseDefaults } from "./shared-course-defaults.js";

const STORAGE_KEY = "local-loop-golf:v1";
const LAST_ACCOUNT_KEY = "pinscope:last-account-id:v1";
let activeAccountId = readLastAccountId();
const REMOVED_BUILT_IN_COURSE_IDS = new Set(["demo-starter-nine", "osm-way-262444890"]);
const GPS_FIELDS = ["tee", "greenFront", "greenCenter", "greenBack"];
const MIN_PLAUSIBLE_GPS_YARDAGE_RATIO = 0.45;
const MAX_PLAUSIBLE_GPS_YARDAGE_RATIO = 1.65;
const MAX_PLAUSIBLE_GPS_YARDAGE_DIFF = 250;
const DUPLICATE_COURSE_MATCH_DISTANCE_YARDS = 1760;

const builtInCourses = applyVerifiedGreenDefaults(buildBuiltInCourses());


function buildBuiltInCourses() {
  const baseCourses = [...verifiedCourses, ...seedCourses];
  const sharedCourses = normalizeSharedCourseDefaults(sharedCourseDefaults);
  if (!sharedCourses.length) {
    return baseCourses;
  }

  const sharedById = new Map(sharedCourses.map((course) => [course.id, course]));
  const baseIds = new Set(baseCourses.map((course) => course.id));
  const mergedBaseCourses = baseCourses.map((course) => {
    const sharedCourse = sharedById.get(course.id);
    return sharedCourse ? mergeSharedCourseDefault(course, sharedCourse) : course;
  });
  const extraSharedCourses = sharedCourses
    .filter((course) => !baseIds.has(course.id))
    .map((course) => ({
      ...course,
      source: course.source || "shared",
      geometrySource: course.geometrySource || "PinScope shared defaults"
    }));

  return [...mergedBaseCourses, ...extraSharedCourses];
}

function normalizeSharedCourseDefaults(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((course) => course && typeof course === "object" && course.id && Array.isArray(course.holes))
    .map((course) => ({
      ...course,
      holes: course.holes.filter((hole) => hole && typeof hole === "object")
    }));
}

function mergeSharedCourseDefault(baseCourse, sharedCourse) {
  const next = {
    ...sharedCourse,
    ...baseCourse,
    geometrySource: sharedCourse.geometrySource || baseCourse.geometrySource || "PinScope shared defaults",
    attribution: mergeAttribution(baseCourse.attribution, sharedCourse.attribution)
  };

  if (Array.isArray(baseCourse.holes) && Array.isArray(sharedCourse.holes)) {
    const sharedByNumber = new Map(sharedCourse.holes.map((hole) => [Number(hole.number), hole]));
    next.holes = baseCourse.holes.map((baseHole) => mergeSharedHoleDefault(baseHole, sharedByNumber.get(Number(baseHole.number))));
  }

  return next;
}

function mergeSharedHoleDefault(baseHole, sharedHole) {
  if (!sharedHole) {
    return baseHole;
  }

  const next = { ...baseHole };

  GPS_FIELDS.forEach((key) => {
    if (validGeoPoint(sharedHole[key])) {
      next[key] = roundGeoPoint(sharedHole[key]);
    } else if (validGeoPoint(baseHole[key])) {
      next[key] = roundGeoPoint(baseHole[key]);
    }
  });

  if (validGeoPoint(next.tee) && validGeoPoint(next.greenCenter)) {
    const edges = greenEdgesAlongHole(next.tee, next.greenCenter);
    if (!validGeoPoint(next.greenFront)) {
      next.greenFront = edges.front;
    }
    if (!validGeoPoint(next.greenBack)) {
      next.greenBack = edges.back;
    }
  }

  next.geometry = mergeGeometry(baseHole.geometry, sharedHole.geometry);
  delete next["snap" + "shot"];

  if (sharedHole.mapping && typeof sharedHole.mapping === "object") {
    next.mapping = {
      ...(baseHole.mapping || {}),
      ...sharedHole.mapping
    };
  }

  if (Array.isArray(sharedHole.tees) && sharedHole.tees.length) {
    next.tees = sharedHole.tees;
  }

  return sanitizePlayableHoleAnchors(next);
}

const baseState = {
  schemaVersion: 1,
  selectedCourseId: "",
  activeRoundId: "",
  courses: builtInCourses,
  rounds: [],
  activeBagId: defaultBags[0]?.id || "",
  bags: defaultBags,
  clubs: defaultClubs,
  settings: {
    units: "yards",
    handicap: {
      manualIndex: null,
      introDismissed: false
    },
    localArea: null
  }
};

export function loadState() {
  const stored = readStoredState();
  const merged = mergeState(baseState, stored || {});
  const duplicateCourseReplacements = duplicateBuiltInCourseReplacements(merged.courses);
  remapDuplicateCourseReferences(merged, duplicateCourseReplacements);
  merged.courses = ensureBuiltInCourses(merged.courses, duplicateCourseReplacements);
  if (merged.selectedCourseId && !merged.courses.some((course) => course.id === merged.selectedCourseId)) {
    merged.selectedCourseId = merged.courses[0]?.id || "";
  }
  return merged;
}

export function saveState(state) {
  localStorage.setItem(activeStorageKey(), JSON.stringify(state));
}

export function useStateAccount(accountId = "") {
  activeAccountId = String(accountId || "").trim();
}

export function rememberStateAccount(accountId = "") {
  const normalized = String(accountId || "").trim();
  useStateAccount(normalized);
  if (normalized) {
    localStorage.setItem(LAST_ACCOUNT_KEY, normalized);
  } else {
    localStorage.removeItem(LAST_ACCOUNT_KEY);
  }
}

export function loadStateForAccount(accountId = "") {
  useStateAccount(accountId);
  return loadState();
}

export function hasStateForAccount(accountId = "") {
  return Boolean(localStorage.getItem(storageKeyForAccount(accountId)));
}

export function clearAnonymousState() {
  localStorage.removeItem(STORAGE_KEY);
}

function readStoredState() {
  try {
    const raw = localStorage.getItem(activeStorageKey());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function activeStorageKey() {
  return storageKeyForAccount(activeAccountId);
}

function storageKeyForAccount(accountId = "") {
  const normalized = String(accountId || "").trim();
  return normalized ? `${STORAGE_KEY}:account:${normalized}` : STORAGE_KEY;
}

function readLastAccountId() {
  try {
    return String(localStorage.getItem(LAST_ACCOUNT_KEY) || "").trim();
  } catch {
    return "";
  }
}

function mergeState(defaults, stored) {
  return {
    ...defaults,
    ...stored,
    settings: {
      ...defaults.settings,
      ...(stored.settings || {}),
      handicap: {
        ...defaults.settings.handicap,
        ...(stored.settings?.handicap || {})
      }
    },
    courses: Array.isArray(stored.courses) ? stored.courses : defaults.courses,
    rounds: Array.isArray(stored.rounds) ? stored.rounds : defaults.rounds,
    ...normalizeBags(stored)
  };
}

function normalizeBags(stored = {}) {
  const fallbackClubs = Array.isArray(stored.clubs) && stored.clubs.length
    ? stored.clubs
    : defaultClubs;
  let bags = Array.isArray(stored.bags) && stored.bags.length
    ? stored.bags
    : [{ ...defaultBags[0], clubs: fallbackClubs }];

  bags = bags
    .filter((bag) => bag && typeof bag === "object")
    .map((bag, index) => ({
      id: String(bag.id || `bag-${index + 1}`),
      name: String(bag.name || `Bag ${index + 1}`).trim() || `Bag ${index + 1}`,
      clubs: normalizeClubs(bag.clubs, fallbackClubs)
    }));

  if (bags.length < 2) {
    const usedIds = new Set(bags.map((bag) => bag.id));
    defaultBags.forEach((bag) => {
      if (bags.length < 2 && !usedIds.has(bag.id)) {
        bags.push({
          ...bag,
          clubs: bag.clubs.map((club) => ({ ...club }))
        });
      }
    });
  }

  const activeBagId = bags.some((bag) => bag.id === stored.activeBagId)
    ? stored.activeBagId
    : bags[0]?.id || "";
  const activeBag = bags.find((bag) => bag.id === activeBagId) || bags[0];
  return {
    bags,
    activeBagId,
    clubs: activeBag?.clubs || normalizeClubs(fallbackClubs)
  };
}

function normalizeClubs(clubs, fallback = defaultClubs) {
  const source = Array.isArray(clubs) && clubs.length ? clubs : fallback;
  return source
    .filter((club) => club && typeof club === "object")
    .map((club, index) => ({
      id: String(club.id || `club-${index + 1}`),
      name: String(club.name || `Club ${index + 1}`).trim() || `Club ${index + 1}`,
      carryYards: clampYards(club.carryYards)
    }));
}

function clampYards(value) {
  const yards = Number(value);
  if (!Number.isFinite(yards)) {
    return 0;
  }
  return Math.min(400, Math.max(0, Math.round(yards)));
}

function ensureBuiltInCourses(courses, duplicateCourseReplacements = new Map()) {
  const builtInIds = new Set(builtInCourses.map((course) => course.id));
  const byId = new Map(courses.map((course) => [course.id, course]));
  const mergedBuiltIns = builtInCourses.map((course) => mergeBuiltInCourse(course, byId.get(course.id)));
  const userCourses = courses.filter((course) =>
    !builtInIds.has(course.id) &&
    !REMOVED_BUILT_IN_COURSE_IDS.has(course.id) &&
    !duplicateCourseReplacements.has(course.id)
  );
  return [...mergedBuiltIns, ...userCourses];
}

function duplicateBuiltInCourseReplacements(courses = []) {
  const builtInIds = new Set(builtInCourses.map((course) => course.id));
  const verifiedBuiltIns = builtInCourses.filter(isVerifiedCourse);
  const replacements = new Map();
  courses.forEach((course) => {
    if (!course?.id || builtInIds.has(course.id) || REMOVED_BUILT_IN_COURSE_IDS.has(course.id)) {
      return;
    }
    if (!isUnbackedCourseDuplicate(course)) {
      return;
    }
    const verifiedCourse = bestVerifiedCourseMatch(course, verifiedBuiltIns);
    if (verifiedCourse?.id) {
      replacements.set(course.id, verifiedCourse.id);
    }
  });
  return replacements;
}

function remapDuplicateCourseReferences(state, replacements) {
  if (!replacements?.size) {
    return;
  }
  if (state.selectedCourseId && replacements.has(state.selectedCourseId)) {
    state.selectedCourseId = replacements.get(state.selectedCourseId);
  }
  if (Array.isArray(state.rounds)) {
    state.rounds = state.rounds.map((round) => (
      round?.courseId && replacements.has(round.courseId)
        ? { ...round, courseId: replacements.get(round.courseId) }
        : round
    ));
  }
}

function isUnbackedCourseDuplicate(course) {
  if (!course || isVerifiedCourse(course) || String(course.source || "").toLowerCase() === "verified") {
    return false;
  }
  if (Array.isArray(course.verification?.sources) && course.verification.sources.length) {
    return false;
  }
  const source = String(course.source || "").toLowerCase();
  return !source ||
    ["manual", "osm", "scraper", "shared", "demo"].includes(source) ||
    String(course.id || "").startsWith("manual-") ||
    String(course.id || "").startsWith("osm-");
}

function bestVerifiedCourseMatch(course, verifiedCourses) {
  let best = null;
  let bestScore = 0;
  verifiedCourses.forEach((candidate) => {
    if (candidate.id === course.id) {
      return;
    }
    const score = duplicateCourseMatchScore(course, candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  });
  return bestScore >= 7 ? best : null;
}

function duplicateCourseMatchScore(course, candidate) {
  const courseNames = normalizedCourseNames(course);
  const candidateNames = normalizedCourseNames(candidate);
  const nameExact = courseNames.some((name) => candidateNames.includes(name));
  const nameLoose = !nameExact && courseNames.some((name) =>
    candidateNames.some((candidateName) => coursesOverlap(name, candidateName))
  );
  const postcodeExact = normalizePostcode(course.postcode) &&
    normalizePostcode(course.postcode) === normalizePostcode(candidate.postcode);
  const townExact = normalizeCourseText(course.town) &&
    normalizeCourseText(course.town) === normalizeCourseText(candidate.town);
  const distance = validGeoPoint(course.location) && validGeoPoint(candidate.location)
    ? yardsBetween(course.location, candidate.location)
    : null;
  const closeLocation = Number.isFinite(distance) && distance <= DUPLICATE_COURSE_MATCH_DISTANCE_YARDS;
  const sameHoles = courseHoleCount(course) && courseHoleCount(course) === courseHoleCount(candidate);

  let score = 0;
  if (postcodeExact) {
    score += 8;
  }
  if (nameExact) {
    score += 6;
  } else if (nameLoose) {
    score += 3;
  }
  if (townExact) {
    score += 2;
  }
  if (closeLocation) {
    score += distance <= DUPLICATE_COURSE_MATCH_DISTANCE_YARDS / 2 ? 3 : 2;
  }
  if (sameHoles) {
    score += 1;
  }
  if (Array.isArray(candidate.loopIds) && candidate.loopIds.length === 2) {
    score += 0.25;
  }
  return score;
}

function normalizedCourseNames(course) {
  return [
    course?.name,
    course?.venueName,
    String(course?.name || "").split(/\s+-\s+/)[0]
  ]
    .map(normalizeCourseName)
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function normalizeCourseName(value) {
  return normalizeCourseText(value)
    .replace(/\b(golf|club|course|links|country|resort|hotel|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCourseText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizePostcode(value) {
  return String(value || "").toUpperCase().replace(/\s+/g, "");
}

function coursesOverlap(a, b) {
  if (!a || !b) {
    return false;
  }
  if (a.length >= 8 && b.length >= 8 && (a.includes(b) || b.includes(a))) {
    return true;
  }
  const aTokens = new Set(a.split(" ").filter((token) => token.length > 2));
  const bTokens = b.split(" ").filter((token) => token.length > 2);
  if (!aTokens.size || !bTokens.length) {
    return false;
  }
  const shared = bTokens.filter((token) => aTokens.has(token)).length;
  return shared >= Math.min(2, aTokens.size, bTokens.length);
}

function courseHoleCount(course) {
  return Number(course?.holesCount) || (Array.isArray(course?.holes) ? course.holes.length : 0);
}

function isVerifiedCourse(course) {
  return Boolean(course?.verification && String(course.verification.status || "").toLowerCase() === "verified");
}

function mergeBuiltInCourse(defaultCourse, storedCourse) {
  if (!storedCourse) {
    return defaultCourse;
  }

  const next = {
    ...storedCourse,
    ...defaultCourse,
    geometrySource: defaultCourse.geometrySource || storedCourse.geometrySource || "",
    attribution: mergeAttribution(defaultCourse.attribution, storedCourse.attribution)
  };

  if (Array.isArray(defaultCourse.holes) && Array.isArray(storedCourse.holes)) {
    const storedByNumber = new Map(storedCourse.holes.map((hole) => [Number(hole.number), hole]));
    next.holes = defaultCourse.holes.map((defaultHole) => mergeBuiltInHole(defaultHole, storedByNumber.get(Number(defaultHole.number))));
  }

  return next;
}

function mergeBuiltInHole(defaultHole, storedHole) {
  if (!storedHole) {
    return defaultHole;
  }

  const storedIsNewer = mappingTimestamp(storedHole.mapping) > mappingTimestamp(defaultHole.mapping);
  const next = { ...defaultHole };

  GPS_FIELDS.forEach((key) => {
    if (storedIsNewer && validGeoPoint(storedHole[key])) {
      next[key] = roundGeoPoint(storedHole[key]);
    } else if (validGeoPoint(defaultHole[key])) {
      next[key] = roundGeoPoint(defaultHole[key]);
    } else if (validGeoPoint(storedHole[key])) {
      next[key] = roundGeoPoint(storedHole[key]);
    }
  });

  next.geometry = storedIsNewer
    ? mergeGeometry(defaultHole.geometry, storedHole.geometry)
    : mergeGeometry(storedHole.geometry, defaultHole.geometry);

  delete next["snap" + "shot"];

  if (storedHole.mapping && typeof storedHole.mapping === "object") {
    next.mapping = storedIsNewer
      ? {
          ...(defaultHole.mapping && typeof defaultHole.mapping === "object" ? defaultHole.mapping : {}),
          ...storedHole.mapping
        }
      : {
          ...storedHole.mapping,
          ...(defaultHole.mapping && typeof defaultHole.mapping === "object" ? defaultHole.mapping : {})
        };
  }

  if (Array.isArray(storedHole.tees) && storedHole.tees.length && !Array.isArray(defaultHole.tees)) {
    next.tees = storedHole.tees;
  }

  return sanitizePlayableHoleAnchors(next);
}

function applyVerifiedGreenDefaults(courses) {
  if (!verifiedGreenDefaults || typeof verifiedGreenDefaults !== "object") {
    return courses;
  }

  return courses.map((course) => {
    const courseDefaults = verifiedGreenDefaults[course.id];
    if (!courseDefaults || typeof courseDefaults !== "object" || !Array.isArray(course.holes)) {
      return course;
    }

    return {
      ...course,
      geometrySource: course.geometrySource || "PinScope verified defaults",
      holes: course.holes.map((hole) => applyHoleGreenDefault(hole, courseDefaults[String(hole.number)] || courseDefaults[Number(hole.number)]))
    };
  });
}

function applyHoleGreenDefault(hole, defaults) {
  if (!defaults || typeof defaults !== "object") {
    return hole;
  }

  const next = { ...hole };
  GPS_FIELDS.forEach((key) => {
    if (validGeoPoint(defaults[key])) {
      next[key] = roundGeoPoint(defaults[key]);
    }
  });

  if (defaults.geometry && typeof defaults.geometry === "object") {
    next.geometry = mergeGeometry(next.geometry, defaults.geometry);
  }

  if (defaults.mapping && typeof defaults.mapping === "object") {
    next.mapping = { ...(next.mapping || {}), ...defaults.mapping };
  }

  return sanitizePlayableHoleAnchors(next);
}

function sanitizePlayableHoleAnchors(hole) {
  if (!implausibleHoleAnchors(hole)) {
    return hole;
  }

  const next = { ...hole };
  GPS_FIELDS.forEach((key) => {
    next[key] = null;
  });

  if (next.geometry && typeof next.geometry === "object") {
    const { greenPolygon, holePath, tees, detection, osmGreen, osmTee, osmHole, ...geometry } = next.geometry;
    next.geometry = Object.keys(geometry).length ? geometry : undefined;
  }

  return next;
}

function implausibleHoleAnchors(hole) {
  const cardYards = maxHoleYardage(hole);
  if (!cardYards || !validGeoPoint(hole?.tee) || !validGeoPoint(hole?.greenCenter)) {
    return false;
  }

  const gpsYards = yardsBetween(hole.tee, hole.greenCenter);
  if (!Number.isFinite(gpsYards) || gpsYards <= 0) {
    return true;
  }

  const ratio = gpsYards / cardYards;
  const diff = Math.abs(gpsYards - cardYards);
  return ratio < MIN_PLAUSIBLE_GPS_YARDAGE_RATIO ||
    ratio > MAX_PLAUSIBLE_GPS_YARDAGE_RATIO ||
    diff > MAX_PLAUSIBLE_GPS_YARDAGE_DIFF;
}

function maxHoleYardage(hole) {
  return Math.max(0, ...Object.values(hole?.yards || {})
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0));
}

function mergeGeometry(localGeometry, defaultGeometry) {
  const local = localGeometry && typeof localGeometry === "object" ? localGeometry : null;
  const defaults = defaultGeometry && typeof defaultGeometry === "object" ? defaultGeometry : null;
  if (!local && !defaults) {
    return undefined;
  }
  return { ...(local || {}), ...(defaults || {}) };
}

function mappingTimestamp(mapping) {
  const time = Date.parse(mapping?.updatedAt || mapping?.publishedAt || "");
  return Number.isFinite(time) ? time : 0;
}

function validGeoPoint(point) {
  return Boolean(
    point &&
      Number.isFinite(Number(point.lat)) &&
      Number.isFinite(Number(point.lng)) &&
      Math.abs(Number(point.lat)) <= 90 &&
      Math.abs(Number(point.lng)) <= 180
  );
}

function roundGeoPoint(point) {
  return { lat: Number(Number(point.lat).toFixed(6)), lng: Number(Number(point.lng).toFixed(6)) };
}

function greenEdgesAlongHole(tee, center, edgeDistanceMeters = 8) {
  const latitudeScale = 111320;
  const longitudeScale = latitudeScale * Math.cos(Number(center.lat) * Math.PI / 180);
  const northMeters = (Number(center.lat) - Number(tee.lat)) * latitudeScale;
  const eastMeters = (Number(center.lng) - Number(tee.lng)) * longitudeScale;
  const lengthMeters = Math.hypot(northMeters, eastMeters) || 1;
  const latOffset = (northMeters / lengthMeters) * edgeDistanceMeters / latitudeScale;
  const lngOffset = (eastMeters / lengthMeters) * edgeDistanceMeters / longitudeScale;
  return {
    front: roundGeoPoint({ lat: Number(center.lat) - latOffset, lng: Number(center.lng) - lngOffset }),
    back: roundGeoPoint({ lat: Number(center.lat) + latOffset, lng: Number(center.lng) + lngOffset })
  };
}

function mergeAttribution(primary = "", extra = "") {
  if (!extra || primary.includes(extra)) {
    return primary;
  }
  return primary ? `${primary} ${extra}` : extra;
}
