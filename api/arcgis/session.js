const ARCGIS_SESSION_URL = "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/sessions/start";

module.exports = async function handler(request, response) {
  if (request.method && request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.ARCGIS_API_KEY;
  if (!apiKey) {
    return response.status(503).json({ error: "ArcGIS API key is not configured on the server." });
  }

  try {
    const upstream = await fetch(`${ARCGIS_SESSION_URL}?styleFamily=arcgis&f=json`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      }
    });
    const body = await upstream.json().catch(() => ({}));

    if (!upstream.ok || body.error) {
      return response.status(upstream.status || 502).json({
        error: body?.error?.message || "ArcGIS basemap session could not be started."
      });
    }

    return response.status(200).json({
      sessionToken: body.sessionToken,
      startTime: body.startTime,
      endTime: body.endTime,
      styleFamily: body.styleFamily
    });
  } catch {
    return response.status(502).json({ error: "ArcGIS basemap session request failed." });
  }
};
