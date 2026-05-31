#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const root = path.resolve(__dirname, "..");
const port = Number(process.argv[2] || process.env.PORT || 4176);
const host = process.env.HOST || "127.0.0.1";
const arcgisSessionUrl = "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/sessions/start";
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"]
]);

loadLocalEnv();

http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);
    if (url.pathname === "/api/arcgis/session") {
      await sendArcgisSession(request, response);
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      sendJson(response, 404, { error: "Unsupported API path." });
      return;
    }

    const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(root + path.sep)) {
      sendText(response, 403, "Forbidden");
      return;
    }
    fs.readFile(filePath, (error, data) => {
      if (error) {
        sendText(response, 404, "Not found");
        return;
      }
      response.writeHead(200, { "Content-Type": mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream" });
      response.end(request.method === "HEAD" ? undefined : data);
    });
  } catch {
    sendJson(response, 500, { error: "Local server request failed." });
  }
}).listen(port, host, () => {
  console.log(`PinScope dev server listening at http://${host}:${port}/`);
});

async function sendArcgisSession(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }
  const apiKey = String(process.env.ARCGIS_API_KEY || "").trim();
  if (!apiKey) {
    sendJson(response, 503, { error: "ArcGIS API key is not configured on the local server. Put ARCGIS_API_KEY in .env.local." });
    return;
  }
  try {
    const upstreamUrl = new URL(arcgisSessionUrl);
    upstreamUrl.searchParams.set("styleFamily", "arcgis");
    upstreamUrl.searchParams.set("durationSeconds", "43200");
    upstreamUrl.searchParams.set("f", "json");
    upstreamUrl.searchParams.set("token", apiKey);
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" }
    });
    const body = await upstream.json().catch(() => ({}));
    if (!upstream.ok || body.error) {
      sendJson(response, upstream.status || 502, { error: body?.error?.message || "ArcGIS basemap session could not be started." });
      return;
    }
    sendJson(response, 200, {
      sessionToken: body.sessionToken,
      startTime: body.startTime,
      endTime: body.endTime,
      styleFamily: body.styleFamily || "arcgis"
    });
  } catch {
    sendJson(response, 502, { error: "ArcGIS basemap session request failed." });
  }
}

function loadLocalEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    const name = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (name && process.env[name] === undefined) {
      process.env[name] = value;
    }
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function sendText(response, status, body) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(body);
}
