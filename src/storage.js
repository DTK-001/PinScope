import { defaultBags, defaultClubs, seedCourses } from "./course-data.js";
import { verifiedCourses } from "./verified-courses.js";
import { verifiedGreenDefaults } from "./verified-green-defaults.js";
import { sharedCourseDefaults } from "./shared-course-defaults.js";

const STORAGE_KEY = "local-loop-golf:v1";
const LAST_ACCOUNT_KEY = "pinscope:last-account-id:v1";
let activeAccountId = readLastAccountId();
const REMOVED_BUILT_IN_COURSE_IDS = new Set(["demo-starter-nine", "osm-way-262444890"]);
const GPS_FIELDS = ["tee", "greenFront", "greenCenter", "greenBack"];

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

  return next;
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
  merged.courses = ensureBuiltInCourses(merged.courses);
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

function ensureBuiltInCourses(courses) {
  const builtInIds = new Set(builtInCourses.map((course) => course.id));
  const byId = new Map(courses.map((course) => [course.id, course]));
  const mergedBuiltIns = builtInCourses.map((course) => mergeBuiltInCourse(course, byId.get(course.id)));
  const userCourses = courses.filter((course) => !builtInIds.has(course.id) && !REMOVED_BUILT_IN_COURSE_IDS.has(course.id));
  return [...mergedBuiltIns, ...userCourses];
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

  return next;
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

  return next;
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

function mergeAttribution(primary = "", extra = "") {
  if (!extra || primary.includes(extra)) {
    return primary;
  }
  return primary ? `${primary} ${extra}` : extra;
}
