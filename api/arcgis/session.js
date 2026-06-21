const ARCGIS_SESSION_URL = "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/sessions/start";

module.exports = async function handler(request, response) {
  if (request.method && request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = String(process.env.ARCGIS_API_KEY || "").trim();
  if (!apiKey) {
    return response.status(503).json({ error: "ArcGIS API key is not configured on the server. Set ARCGIS_API_KEY in your environment/deployment secrets." });
  }

  try {
    const url = new URL(ARCGIS_SESSION_URL);
    url.searchParams.set("styleFamily", "arcgis");
    url.searchParams.set("durationSeconds", "43200");
    url.searchParams.set("f", "json");
    url.searchParams.set("token", apiKey);

    const upstream = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    const body = await upstream.json().catch(() => ({}));

    if (!upstream.ok || body.error) {
      return response.status(upstream.status || 502).json({
        error: body?.error?.message || "ArcGIS basemap session could not be started. Check that your key has the Basemap Styles privilege."
      });
    }

    return response.status(200).json({
      sessionToken: body.sessionToken,
      startTime: body.startTime,
      endTime: body.endTime,
      styleFamily: body.styleFamily || "arcgis"
    });
  } catch (error) {
    return response.status(502).json({ error: error?.message || "ArcGIS basemap session request failed." });
  }
};
