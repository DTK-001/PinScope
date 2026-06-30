// TEMPORARY TEST-ONLY ArcGIS frontend session starter.
// This lets the GitHub Pages build test ArcGIS imagery without a backend route.
// WARNING: anything in frontend JavaScript is public. Replace this with
// /api/arcgis/session before production and regenerate this key after testing.
const TEMP_FRONTEND_ARCGIS_API_KEY = "AAPTagtxg_0TLeB5URMbeqx-_Yw..P3Pi9fVkaWA4d6Biz2EvU0Pn0tqx0JroHvuT2ESQpgS9obHcjM-RS4Z7GgAzt62AwI7iEXqTir08SlUzUo7p7N5du7brVpX0syjw1ulrf0__o97a91ZIVoWDkc7uY0b-7Vaz2jmdlLnErzw7M3x5Td8HRn44gvxNk67pTwt1TXnWeqmUuj2YkqIt4Elt5sHCDziqdUz-Ul9wnoYkSk0aXRPRTotl3XjthsO3khdT_KltUMs.AT1_0aUFy9y6";
const ARCGIS_SESSION_START_URL = "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/sessions/start";
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

  pendingSession = startArcgisSessionFromFrontend()
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

async function startArcgisSessionFromFrontend() {
  const apiKey = String(TEMP_FRONTEND_ARCGIS_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("Missing temporary frontend ArcGIS API key.");
  }

  const url = new URL(ARCGIS_SESSION_START_URL);
  url.searchParams.set("styleFamily", "arcgis");
  url.searchParams.set("durationSeconds", "43200");
  url.searchParams.set("f", "json");
  url.searchParams.set("token", apiKey);

  const response = await fetchWithTimeout(url.toString(), {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" }
  }, SESSION_REQUEST_TIMEOUT_MS);

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.error) {
    throw new Error(sessionErrorMessage(response, body));
  }

  const session = normalizeArcgisSession(body);
  if (!validSession(session)) {
    throw new Error("ArcGIS did not return a usable session token. Check that the key has the Basemap Styles privilege and is allowed for this domain.");
  }
  return session;
}

function sessionErrorMessage(response, body) {
  const arcgisMessage = body?.error?.message || body?.message || "";
  if (arcgisMessage) {
    return `ArcGIS session failed: ${arcgisMessage}`;
  }
  if (response.status === 401 || response.status === 403) {
    return "ArcGIS rejected the API key. Check key expiry, referrer settings, and Basemap Styles privilege.";
  }
  return `ArcGIS imagery session could not be started (${response.status}).`;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("ArcGIS session request timed out. Check your connection and ArcGIS key settings.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function normalizeArcgisSession(value) {
  return {
    sessionToken: String(value?.sessionToken || "").trim(),
    startTime: normalizeTime(value?.startTime),
    endTime: normalizeTime(value?.endTime),
    styleFamily: String(value?.styleFamily || "arcgis")
  };
}

function validSession(session) {
  return Boolean(
    session?.sessionToken &&
      Number.isFinite(session.endTime) &&
      session.endTime - SESSION_REFRESH_WINDOW_MS > Date.now()
  );
}

function normalizeTime(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
