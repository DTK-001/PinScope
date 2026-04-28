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
  const mergedBuiltIns = builtInCourses.map((course) => ({ ...(byId.get(course.id) || {}), ...course }));
  const userCourses = courses.filter((course) => !builtInIds.has(course.id));
  return [...mergedBuiltIns, ...userCourses];
}
