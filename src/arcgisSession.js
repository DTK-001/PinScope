const ARCGIS_SESSION_ENDPOINT = "/api/arcgis/session";
const SESSION_REFRESH_WINDOW_MS = 60 * 1000;
const SESSION_REQUEST_TIMEOUT_MS = 10000;

let currentSession = null;
let pendingSession = null;

export function getArcgisSession() {
  return validSession(currentSession) ? currentSession : null;
}

export async function ensureArcgisSession() {
  if (validSession(currentSession)) {
    return currentSession;
  }

  if (pendingSession) {
    return pendingSession;
  }

  pendingSession = fetchWithTimeout(ARCGIS_SESSION_ENDPOINT, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" }
  }, SESSION_REQUEST_TIMEOUT_MS)
    .then(async (response) => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(sessionErrorMessage(response, body));
      }
      const session = normalizeArcgisSession(body);
      if (!validSession(session)) {
        throw new Error("ArcGIS session endpoint returned no usable session token. Check the server route and ARCGIS_API_KEY secret.");
      }
      currentSession = session;
      return currentSession;
    })
    .finally(() => {
      pendingSession = null;
    });

  return pendingSession;
}

export function clearArcgisSession() {
  currentSession = null;
  pendingSession = null;
}

function sessionErrorMessage(response, body) {
  if (body?.error) {
    return String(body.error);
  }
  if (response.status === 404) {
    return "ArcGIS session route was not found. Deploy the /api/arcgis/session backend route, or run the included dev server instead of opening the static files directly.";
  }
  if (response.status === 503) {
    return "ArcGIS API key is missing on the server. Set ARCGIS_API_KEY in your local .env.local or deployment secrets.";
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
      throw new Error("ArcGIS session request timed out. Check that the backend route is running and can reach ArcGIS.");
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
