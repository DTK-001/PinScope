const ARCGIS_SESSION_ENDPOINT = "/api/arcgis/session";
const SESSION_REFRESH_WINDOW_MS = 60 * 1000;

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

  pendingSession = fetch(ARCGIS_SESSION_ENDPOINT, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" }
  })
    .then(async (response) => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "ArcGIS imagery session could not be started.");
      }
      const session = normalizeArcgisSession(body);
      if (!validSession(session)) {
        throw new Error("ArcGIS imagery session response was missing a valid session token.");
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
