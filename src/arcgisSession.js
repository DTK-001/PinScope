const SESSION_ENDPOINT = "./api/arcgis/session";
const SESSION_REFRESH_WINDOW_MS = 60 * 1000;
const SESSION_REQUEST_TIMEOUT_MS = 10000;
const SESSION_FAILURE_COOLDOWN_MS = 30000;

let currentSession = null;
let pendingSession = null;
let sessionFailureUntil = 0;
let lastSessionError = "";

export function getArcgisSession() {
  return validSession(currentSession) ? currentSession : null;
}

export function getArcgisSessionError() {
  return lastSessionError;
}

export async function ensureArcgisSession() {
  if (validSession(currentSession)) {
    return currentSession;
  }
  if (pendingSession) {
    return pendingSession;
  }
  if (Date.now() < sessionFailureUntil) {
    throw new Error(lastSessionError || "ArcGIS session request is cooling down after a recent failure.");
  }

  pendingSession = requestServerSession()
    .then((session) => {
      currentSession = session;
      lastSessionError = "";
      return currentSession;
    })
    .catch((error) => {
      lastSessionError = error?.message || "ArcGIS session could not be started.";
      sessionFailureUntil = Date.now() + SESSION_FAILURE_COOLDOWN_MS;
      currentSession = null;
      throw error;
    })
    .finally(() => {
      pendingSession = null;
    });

  return pendingSession;
}

export function clearArcgisSession() {
  currentSession = null;
  pendingSession = null;
  sessionFailureUntil = 0;
  lastSessionError = "";
}

async function requestServerSession() {
  const response = await fetchWithTimeout(SESSION_ENDPOINT, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" }
  }, SESSION_REQUEST_TIMEOUT_MS);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.sessionToken) {
    throw new Error(data?.error || `ArcGIS session request failed (${response.status}).`);
  }
  return data;
}

function validSession(session) {
  if (!session?.sessionToken) {
    return false;
  }
  const end = Date.parse(session.endTime || "");
  return !Number.isFinite(end) || Date.now() < end - SESSION_REFRESH_WINDOW_MS;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}
