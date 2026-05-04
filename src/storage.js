import { defaultClubs, seedCourses } from "./course-data.js";
import { verifiedCourses } from "./verified-courses.js";

const STORAGE_KEY = "local-loop-golf:v1";
const builtInCourses = [...verifiedCourses, ...seedCourses];

const baseState = {
  schemaVersion: 1,
  selectedCourseId: verifiedCourses[0]?.id || "demo-starter-nine",
  activeRoundId: "",
  courses: builtInCourses,
  rounds: [],
  clubs: defaultClubs,
  settings: {
    units: "yards"
  }
};

export function loadState() {
  const stored = readStoredState();
  const merged = mergeState(baseState, stored || {});
  merged.courses = ensureBuiltInCourses(merged.courses);
  return merged;
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function mergeState(defaults, stored) {
  return {
    ...defaults,
    ...stored,
    settings: { ...defaults.settings, ...(stored.settings || {}) },
    courses: Array.isArray(stored.courses) ? stored.courses : defaults.courses,
    rounds: Array.isArray(stored.rounds) ? stored.rounds : defaults.rounds,
    clubs: Array.isArray(stored.clubs) ? stored.clubs : defaults.clubs
  };
}

function ensureBuiltInCourses(courses) {
  const builtInIds = new Set(builtInCourses.map((course) => course.id));
  const byId = new Map(courses.map((course) => [course.id, course]));
  const mergedBuiltIns = builtInCourses.map((course) => mergeBuiltInCourse(course, byId.get(course.id)));
  const userCourses = courses.filter((course) => !builtInIds.has(course.id));
  return [...mergedBuiltIns, ...userCourses];
}

function mergeBuiltInCourse(defaultCourse, storedCourse) {
  if (!storedCourse) {
    return defaultCourse;
  }

  const next = {
    ...storedCourse,
    ...defaultCourse,
    geometrySource: storedCourse.geometrySource || defaultCourse.geometrySource || "",
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
  const next = { ...defaultHole };
  const geometryKeys = ["tee", "greenCenter", "greenFront", "greenBack"];
  geometryKeys.forEach((key) => {
    if (validGeoPoint(storedHole[key])) {
      next[key] = storedHole[key];
    }
  });
  if (storedHole.geometry && typeof storedHole.geometry === "object") {
    next.geometry = storedHole.geometry;
  }
  if (storedHole.mapping && typeof storedHole.mapping === "object") {
    next.mapping = storedHole.mapping;
  }
  if (Array.isArray(storedHole.tees) && storedHole.tees.length) {
    next.tees = storedHole.tees;
  }
  return next;
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

function mergeAttribution(primary = "", extra = "") {
  if (!extra || primary.includes(extra)) {
    return primary;
  }
  return primary ? `${primary} ${extra}` : extra;
}
