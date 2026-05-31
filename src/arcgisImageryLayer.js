import { ensureArcgisSession } from "./arcgisSession.js";

const ARCGIS_IMAGERY_STYLE = "arcgis/imagery/standard";
const ARCGIS_STYLE_URL = `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/${ARCGIS_IMAGERY_STYLE}`;
const ARCGIS_ATTRIBUTION = "Imagery: Esri, Vantor, Earthstar Geographics, and the GIS User Community";
const ARCGIS_REQUEST_TIMEOUT_MS = 10000;

let currentLayer = null;
let pendingLayer = null;
let layerError = "";

export function getArcgisImageryLayer() {
  return currentLayer;
}

export function getArcgisImageryError() {
  return layerError;
}

export function arcgisImageryAttribution() {
  return currentLayer?.attribution || ARCGIS_ATTRIBUTION;
}

export function arcgisTileUrl(x, y, zoom) {
  if (!currentLayer?.tileTemplate) {
    return "";
  }
  return currentLayer.tileTemplate
    .replaceAll("{x}", encodeURIComponent(String(x)))
    .replaceAll("{y}", encodeURIComponent(String(y)))
    .replaceAll("{z}", encodeURIComponent(String(zoom)))
    .replaceAll("{col}", encodeURIComponent(String(x)))
    .replaceAll("{row}", encodeURIComponent(String(y)))
    .replaceAll("{level}", encodeURIComponent(String(zoom)))
    .replaceAll("{token}", encodeURIComponent(currentLayer.sessionToken));
}

export async function ensureArcgisImageryLayer() {
  const session = await ensureArcgisSession();
  if (currentLayer?.sessionToken === session.sessionToken) {
    return currentLayer;
  }

  if (pendingLayer?.sessionToken === session.sessionToken) {
    return pendingLayer.promise;
  }

  const promise = loadArcgisImageryLayer(session)
    .then((layer) => {
      currentLayer = layer;
      layerError = "";
      return currentLayer;
    })
    .catch((error) => {
      layerError = error.message || "ArcGIS imagery style could not be loaded.";
      currentLayer = null;
      throw error;
    })
    .finally(() => {
      pendingLayer = null;
    });

  pendingLayer = { sessionToken: session.sessionToken, promise };
  return promise;
}

async function loadArcgisImageryLayer(session) {
  const style = await fetchJson(`${ARCGIS_STYLE_URL}?token=${encodeURIComponent(session.sessionToken)}&echoToken=true&f=json`);
  const source = await resolveRasterSource(style, session.sessionToken);
  const tileTemplate = normalizeTileTemplate(source?.tiles?.[0] || source?.tileUrl || source?.url);
  if (!tileTemplate) {
    throw new Error("ArcGIS imagery style did not include a usable raster tile source.");
  }

  return {
    style: ARCGIS_IMAGERY_STYLE,
    styleFamily: session.styleFamily,
    sessionToken: session.sessionToken,
    startTime: session.startTime,
    endTime: session.endTime,
    tileTemplate: ensureTokenPlaceholder(tileTemplate),
    minZoom: normalizeZoom(source.minzoom ?? source.minZoom ?? style?.metadata?.["arcgis:minZoom"]),
    maxZoom: normalizeZoom(source.maxzoom ?? source.maxZoom ?? style?.metadata?.["arcgis:maxZoom"]),
    attribution: source.attribution || style?.metadata?.["arcgis:attribution"] || ARCGIS_ATTRIBUTION
  };
}

async function resolveRasterSource(style, sessionToken) {
  const sources = Object.values(style?.sources || {});
  const inline = sources.find((source) => source?.type === "raster" && Array.isArray(source.tiles) && source.tiles.length);
  if (inline) {
    return inline;
  }

  const linked = sources.find((source) => source?.type === "raster" && source.url);
  if (linked) {
    const tileJsonUrl = appendToken(linked.url, sessionToken);
    return fetchJson(tileJsonUrl);
  }

  const layerSourceId = Array.isArray(style?.layers)
    ? style.layers.find((layer) => layer?.type === "raster" && layer.source)?.source
    : "";
  const layerSource = layerSourceId ? style?.sources?.[layerSourceId] : null;
  if (layerSource?.type === "raster" && Array.isArray(layerSource.tiles) && layerSource.tiles.length) {
    return layerSource;
  }

  return null;
}

function appendToken(url, token) {
  const separator = String(url).includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

async function fetchJson(url) {
  const response = await fetchWithTimeout(url, { cache: "no-store" }, ARCGIS_REQUEST_TIMEOUT_MS);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.error) {
    throw new Error(body?.error?.message || body?.error || `ArcGIS imagery request failed (${response.status}).`);
  }
  return body;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("ArcGIS imagery request timed out.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function normalizeTileTemplate(value) {
  const template = String(value || "").trim();
  const hasXyz = template.includes("{x}") && template.includes("{y}") && template.includes("{z}");
  const hasArcgisKeys = template.includes("{col}") && template.includes("{row}") && template.includes("{level}");
  if (!template || (!hasXyz && !hasArcgisKeys)) {
    return "";
  }
  return template;
}

function normalizeZoom(value) {
  const zoom = Number(value);
  return Number.isFinite(zoom) ? Math.floor(zoom) : null;
}

function ensureTokenPlaceholder(template) {
  if (template.includes("{token}")) {
    return template;
  }
  return `${template}${template.includes("?") ? "&" : "?"}token={token}`;
}
