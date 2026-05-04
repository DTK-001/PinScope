// Paste this whole file into the browser console on the device/browser where
// your PinScope green/tee GPS edits already exist, while viewing the PinScope
// site. It downloads src/verified-green-defaults.js for you.
(() => {
  const STORAGE_KEY = "local-loop-golf:v1";
  const GPS_FIELDS = ["tee", "greenFront", "greenCenter", "greenBack"];
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    alert("No PinScope saved course data found in this browser.");
    return;
  }

  let state;
  try {
    state = JSON.parse(raw);
  } catch (error) {
    alert("PinScope saved data exists, but it could not be read as JSON.");
    return;
  }

  const output = {};

  for (const course of state.courses || []) {
    if (!course?.id || !Array.isArray(course.holes)) {
      continue;
    }

    const holes = {};

    for (const hole of course.holes) {
      const holeNumber = String(hole?.number || "");
      if (!holeNumber) {
        continue;
      }

      const savedHole = {};
      for (const field of GPS_FIELDS) {
        if (validGeoPoint(hole[field])) {
          savedHole[field] = roundPoint(hole[field]);
        }
      }

      const greenPolygon = normalizePolygon(hole.geometry?.greenPolygon || hole.greenPolygon);
      if (greenPolygon.length) {
        savedHole.geometry = { ...(savedHole.geometry || {}), greenPolygon };
      }

      if (Object.keys(savedHole).length) {
        holes[holeNumber] = savedHole;
      }
    }

    if (Object.keys(holes).length) {
      output[course.id] = holes;
    }
  }

  const moduleText = `// Generated from PinScope localStorage on ${new Date().toISOString()}\nexport const verifiedGreenDefaults = ${JSON.stringify(output, null, 2)};\n`;
  const blob = new Blob([moduleText], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "verified-green-defaults.js";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  alert(`Exported GPS defaults for ${Object.keys(output).length} course(s). Replace src/verified-green-defaults.js with the downloaded file, then commit and push.`);

  function normalizePolygon(value) {
    const list = Array.isArray(value) ? value : [];
    return list.map(roundPoint).filter(validGeoPoint);
  }

  function validGeoPoint(point) {
    return Boolean(
      point &&
        Number.isFinite(Number(point.lat)) &&
        Number.isFinite(Number(point.lng)) &&
        Math.abs(Number(point.lat)) <= 90 &&
        Math.abs(Number(point.lng)) <= 180
    );
  }

  function roundPoint(point) {
    return { lat: Number(Number(point.lat).toFixed(6)), lng: Number(Number(point.lng).toFixed(6)) };
  }
})();
