import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4174);
loadEnvFile(path.join(__dirname, ".env.local"));
loadEnvFile(path.join(__dirname, ".env"));

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname === "/api/arcgis/session") {
      return handleArcgisSession(req, res);
    }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";
    const filePath = path.normalize(path.join(__dirname, pathname));
    if (!filePath.startsWith(__dirname)) {
      return send(res, 403, "Forbidden", "text/plain");
    }
    const body = await fsp.readFile(filePath);
    return send(res, 200, body, contentType(filePath));
  } catch {
    return send(res, 404, "Not found", "text/plain");
  }
});

server.listen(port, () => {
  console.log(`PinScope dev server running at http://localhost:${port}`);
});

async function handleArcgisSession(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  const apiKey = process.env.ARCGIS_API_KEY;
  if (!apiKey) {
    return sendJson(res, 500, { error: "ARCGIS_API_KEY is not configured. Add it to .env.local." });
  }
  const url = new URL("https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/sessions/start");
  url.searchParams.set("f", "json");
  url.searchParams.set("styleFamily", "arcgis");
  url.searchParams.set("token", apiKey);
  try {
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.error) {
      return sendJson(res, response.status || 502, {
        error: data?.error?.message || data?.message || "ArcGIS basemap session could not be created."
      });
    }
    return sendJson(res, 200, {
      sessionToken: data.sessionToken,
      startTime: data.startTime,
      endTime: data.endTime,
      styleFamily: data.styleFamily
    });
  } catch (error) {
    return sendJson(res, 502, { error: error?.message || "ArcGIS request failed." });
  }
}

function loadEnvFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    text.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
      const [key, ...rest] = trimmed.split("=");
      if (!process.env[key]) {
        process.env[key] = rest.join("=").trim().replace(/^["']|["']$/g, "");
      }
    });
  } catch {
    // env file is optional
  }
}


function sendJson(res, status, body) {
  send(res, status, JSON.stringify(body), "application/json; charset=utf-8", { "Cache-Control": "no-store" });
}

function send(res, status, body, type, extraHeaders = {}) {
  res.writeHead(status, { "Content-Type": type, ...extraHeaders });
  res.end(body);
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg"
  }[ext] || "application/octet-stream";
}
