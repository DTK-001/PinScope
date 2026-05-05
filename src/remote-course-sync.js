import { pinscopeSyncConfig } from "./sync-config.js";

const ENDPOINT_STORAGE_KEY = "pinscope:course-sync-endpoint:v1";
const ADMIN_TOKEN_STORAGE_KEY = "pinscope:course-sync-admin-token:v1";
const SYNC_URL_QUERY_KEYS = ["pinscopeSyncUrl", "syncUrl", "courseSyncUrl"];
const SYNC_TOKEN_QUERY_KEYS = ["pinscopeSyncToken", "syncToken", "courseSyncToken"];

export function captureRemoteCourseSyncSettingsFromUrl() {
  const params = new URLSearchParams(window.location.search || "");
  const endpoint = firstQueryValue(params, SYNC_URL_QUERY_KEYS);
  const adminToken = firstQueryValue(params, SYNC_TOKEN_QUERY_KEYS);
  if (endpoint || adminToken) {
    saveRemoteCourseSyncSettings({ endpoint, adminToken }, { merge: true });
    removeSyncSettingsFromUrl(params);
  }
}

export function getRemoteCourseSyncSettings() {
  return {
    endpoint: readSetting(ENDPOINT_STORAGE_KEY, pinscopeSyncConfig.endpoint),
    adminToken: readSetting(ADMIN_TOKEN_STORAGE_KEY, pinscopeSyncConfig.adminToken)
  };
}

export function saveRemoteCourseSyncSettings(settings = {}, options = {}) {
  const current = options.merge ? getRemoteCourseSyncSettings() : { endpoint: "", adminToken: "" };
  const endpoint = settings.endpoint === undefined ? current.endpoint : String(settings.endpoint || "").trim();
  const adminToken = settings.adminToken === undefined ? current.adminToken : String(settings.adminToken || "").trim();
  writeSetting(ENDPOINT_STORAGE_KEY, endpoint);
  writeSetting(ADMIN_TOKEN_STORAGE_KEY, adminToken);
  return { endpoint, adminToken };
}

export function remoteCourseSyncIsConfigured() {
  return Boolean(getRemoteCourseSyncSettings().endpoint);
}

export function remoteCourseSyncCanPublish() {
  const settings = getRemoteCourseSyncSettings();
  return Boolean(settings.endpoint && settings.adminToken);
}

export async function fetchRemoteCourseDefaults() {
  const { endpoint } = getRemoteCourseSyncSettings();
  if (!endpoint) {
    throw new Error("Cloud course sync endpoint is not configured yet.");
  }

  const response = await fetch(endpoint, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(payload?.error || `Cloud course sync returned ${response.status}.`);
  }
  return normalizeRemoteCourses(payload);
}

export async function publishRemoteCourseDefault(course, options = {}) {
  const { endpoint, adminToken } = getRemoteCourseSyncSettings();
  if (!endpoint) {
    throw new Error("Cloud course sync endpoint is not configured yet.");
  }
  if (!adminToken) {
    throw new Error("Admin token is missing on this device, so this course cannot be published.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      course,
      publishedAt: new Date().toISOString(),
      generateSnapshots: options.generateSnapshots !== false
    })
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(payload?.error || `Cloud publish returned ${response.status}.`);
  }
  return payload;
}

function normalizeRemoteCourses(payload) {
  const courses = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.courses)
      ? payload.courses
      : Array.isArray(payload?.sharedCourseDefaults)
        ? payload.sharedCourseDefaults
        : [];

  return courses
    .filter((course) => course && typeof course === "object" && course.id && Array.isArray(course.holes))
    .map((course) => ({
      ...course,
      source: course.source || "shared",
      geometrySource: course.geometrySource || "PinScope Cloud"
    }));
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    if (!response.ok) {
      return { error: text };
    }
    throw new Error("Cloud course sync returned invalid JSON.");
  }
}

function removeSyncSettingsFromUrl(params) {
  const next = new URL(window.location.href);
  [...SYNC_URL_QUERY_KEYS, ...SYNC_TOKEN_QUERY_KEYS].forEach((key) => next.searchParams.delete(key));
  if (next.href !== window.location.href) {
    window.history.replaceState(window.history.state, document.title, next.pathname + next.search + next.hash);
  }
}

function firstQueryValue(params, keys) {
  for (const key of keys) {
    const value = params.get(key);
    if (value) {
      return value;
    }
  }
  return "";
}

function readSetting(key, fallback = "") {
  try {
    return String(localStorage.getItem(key) || fallback || "").trim();
  } catch {
    return String(fallback || "").trim();
  }
}

function writeSetting(key, value) {
  try {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // The app can still run without saving the setting permanently.
  }
}
