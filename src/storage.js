import { defaultClubs, seedCourses } from "./course-data.js";
import { verifiedCourses } from "./verified-courses.js";
import { verifiedGreenDefaults } from "./verified-green-defaults.js";

const STORAGE_KEY = "local-loop-golf:v1";
const REMOVED_BUILT_IN_COURSE_IDS = new Set(["demo-starter-nine"]);
const GPS_FIELDS = ["tee", "greenFront", "greenCenter", "greenBack"];

const builtInCourses = applyVerifiedGreenDefaults([...verifiedCourses, ...seedCourses]);

const baseState = {
  schemaVersion: 1,
  selectedCourseId: verifiedCourses[0]?.id || "",
  activeRoundId: "",
  courses: builtInCourses,
  rounds: [],
  clubs: defaultClubs,
  settings: { units: "yards" }
};

export function loadState() {
  const stored = readStoredState();
  const merged = mergeState(baseState, stored || {});
  merged.courses = ensureBuiltInCourses(merged.courses);
  if (!merged.courses.some((course) => course.id === merged.selectedCourseId)) {
    merged.selectedCourseId = merged.courses[0]?.id || "";
  }
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

  // Source/default data should win once you publish shared verified GPS data.
  // Local storage only fills holes/fields that are still missing from source.
  const next = { ...defaultHole };

  GPS_FIELDS.forEach((key) => {
    if (validGeoPoint(defaultHole[key])) {
      next[key] = roundGeoPoint(defaultHole[key]);
    } else if (validGeoPoint(storedHole[key])) {
      next[key] = roundGeoPoint(storedHole[key]);
    }
  });

  next.geometry = mergeGeometry(storedHole.geometry, defaultHole.geometry);

  if (storedHole.mapping && typeof storedHole.mapping === "object") {
    next.mapping = {
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
