const ARCGIS_SESSION_URL = "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/sessions/start";

module.exports = async function handler(req, res) {
  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const apiKey = process.env.ARCGIS_API_KEY;
  if (!apiKey) {
    return sendJson(res, 500, {
      error: "ARCGIS_API_KEY is not configured on the server. Add it as a deployment secret/environment variable."
    });
  }

  try {
    const url = new URL(ARCGIS_SESSION_URL);
    url.searchParams.set("f", "json");
    url.searchParams.set("styleFamily", "arcgis");
    url.searchParams.set("token", apiKey);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" }
    });
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
    return sendJson(res, 502, {
      error: error?.message || "ArcGIS basemap session request failed."
    });
  }
};

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
