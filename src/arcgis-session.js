const TEMP_FRONTEND_ARCGIS_API_KEY = "AAPTaL65zGJBCcGliaz22f3lI7w..jrLzRb-aFvdTScUEocynWzKQB3p1SDpAle9rRMj8zybXpdvVK-ksU38Wn2nrGsWUyDigJMIdXLnr39P-LM7-Q2Sxj4cc-s-YDFuBCTAJ4shk2DFNO_ygd5HnZmsT2Y1EC3zlnK1pe6ov3p2MEP9Ez2YBErsu3VQL4Jh-mdFFF4xVqhAHJZgf7MFyroH9mXK0tPLJ-bbk_yryg1CUEhqFiE351teaWwRdPp413z2yPwzFo8o.AT1_0aUFy9y6";

const ARCGIS_SESSION_START_URL =
  "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/sessions/start";

const STYLE_ENDPOINTS = [
  "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/imagery/standard",
  "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/imagery"
];
const SESSION_REFRESH_SAFETY_MS = 5 * 60 * 1000;

let currentSession = null;
let basemapStyle = null;
let tileTemplate = "";
let tileSize = 512;
let phase = "idle";
let lastError = "";
let inFlight = null;

export function arcgisBasemapStatus() {
  if (currentSession && sessionExpired(currentSession)) {
    phase = "expired";
  }
  return {
    phase,
    ready: Boolean(currentSession && !sessionExpired(currentSession) && tileTemplate),
    session: currentSession,
    tileTemplate,
    tileSize,
    error: lastError
  };
}

export function arcgisTileSize() {
  return tileSize || 512;
}

export function arcgisTileUrl(x, y, z) {
  const status = arcgisBasemapStatus();
  if (!status.ready) {
    return "";
  }
  const safeX = Number(x);
  const safeY = Number(y);
  const safeZ = Number(z);
  if (!Number.isFinite(safeX) || !Number.isFinite(safeY) || !Number.isFinite(safeZ)) {
    return "";
  }
  const url = tileTemplate
    .replace(/\{z\}/g, String(safeZ))
    .replace(/\{x\}/g, String(safeX))
    .replace(/\{y\}/g, String(safeY))
    .replace(/\{level\}/g, String(safeZ))
    .replace(/\{row\}/g, String(safeY))
    .replace(/\{col\}/g, String(safeX));
  return appendToken(url, currentSession.sessionToken);
}

export async function ensureArcgisBasemap() {
  const status = arcgisBasemapStatus();
  if (status.ready) {
    return status;
  }
  if (inFlight) {
    return inFlight;
  }

  inFlight = startArcgisBasemap()
    .catch((error) => {
      phase = "error";
      lastError = userFriendlyArcgisError(error);
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

async function startArcgisBasemap() {
  phase = "loading-session";
  lastError = "";
  currentSession = await fetchArcgisSession();

  phase = "loading-style";
  basemapStyle = await fetchArcgisStyle(currentSession.sessionToken);
  const parsed = parseRasterTileSource(basemapStyle);
  if (!parsed?.template) {
    throw new Error("ArcGIS imagery style did not include a raster tile source.");
  }

  tileTemplate = parsed.template;
  tileSize = parsed.tileSize || 512;
  phase = "ready";
  return arcgisBasemapStatus();
}

async function fetchArcgisSession() {
  const response = await fetch(SESSION_ENDPOINT, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  const data = await safeJson(response);
  if (!response.ok) {
    const message = data?.error || data?.message || `ArcGIS session request failed (${response.status}).`;
    throw new Error(message);
  }
  if (!data?.sessionToken) {
    throw new Error("ArcGIS session response did not include a sessionToken.");
  }
  return data;
}

async function fetchArcgisStyle(sessionToken) {
  let lastError = null;
  for (const endpoint of STYLE_ENDPOINTS) {
    const url = new URL(endpoint);
    url.searchParams.set("f", "json");
    url.searchParams.set("token", sessionToken);
    url.searchParams.set("echoToken", "false");
    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      const data = await safeJson(response);
      if (response.ok && data && !data.error) {
        return data;
      }
      lastError = new Error(data?.error?.message || data?.message || `ArcGIS style request failed (${response.status}).`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("ArcGIS imagery style could not be loaded.");
}

function parseRasterTileSource(style) {
  const sources = Object.values(style?.sources || {});
  const rasterSources = sources.filter((source) => Array.isArray(source?.tiles) && source.tiles.length);
  const preferred = rasterSources.find((source) => source.type === "raster") || rasterSources[0];
  if (!preferred) {
    return null;
  }
  return {
    template: String(preferred.tiles[0] || ""),
    tileSize: Number(preferred.tileSize) || 512
  };
}

function sessionExpired(session) {
  const end = Date.parse(session?.endTime || "");
  if (!Number.isFinite(end)) {
    return false;
  }
  return Date.now() >= end - SESSION_REFRESH_SAFETY_MS;
}

function appendToken(rawUrl, token) {
  if (!rawUrl || !token || /[?&]token=/.test(rawUrl)) {
    return rawUrl;
  }
  const separator = rawUrl.includes("?") ? "&" : "?";
  return `${rawUrl}${separator}token=${encodeURIComponent(token)}`;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function userFriendlyArcgisError(error) {
  const message = String(error?.message || error || "").trim();
  if (!message) {
    return "ArcGIS imagery unavailable.";
  }
  if (message.includes("ARCGIS_API_KEY")) {
    return "ArcGIS API key is missing on the server.";
  }
  if (message.toLowerCase().includes("forbidden") || message.includes("403")) {
    return "ArcGIS key does not have the Basemap Styles privilege.";
  }
  if (message.toLowerCase().includes("unauthorized") || message.includes("401")) {
    return "ArcGIS session token was rejected. Check the API key.";
  }
  return message;
}
