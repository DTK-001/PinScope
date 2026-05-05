// Paste this whole file into the browser console on the device/browser where
// your PinScope mapped course data already exists, while viewing PinScope.
// It downloads src/shared-course-defaults.js so those courses can ship with
// the app and appear on every device after you deploy.
(() => {
  const STORAGE_KEY = "local-loop-golf:v1";
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    alert("No PinScope saved course data found in this browser.");
    return;
  }

  let state;
  try {
    state = JSON.parse(raw);
  } catch {
    alert("PinScope saved data exists, but it could not be read as JSON.");
    return;
  }

  const output = (state.courses || []).map(courseToSharedDefault).filter(Boolean);
  if (!output.length) {
    alert("No mapped/imported courses were found to export.");
    return;
  }

  const moduleText = `// Generated from PinScope saved courses on ${new Date().toISOString()}\n// Replace src/shared-course-defaults.js with this file, then deploy.\n\nexport const sharedCourseDefaults = ${JSON.stringify(output, null, 2)};\n`;
  downloadTextFile("shared-course-defaults.js", moduleText, "text/javascript");
  alert(`Exported shared defaults for ${output.length} course(s). Replace src/shared-course-defaults.js, then commit and deploy.`);

  function courseToSharedDefault(course) {
    if (!course || !course.id || !Array.isArray(course.holes)) {
      return null;
    }
    const holes = course.holes.map(holeToSharedDefault).filter(Boolean);
    const hasMappedHole = holes.some((hole) => validGeoPoint(hole.tee) || validGeoPoint(hole.greenCenter) || hole.geometry?.greenPolygon?.length);
    const shouldExport = hasMappedHole || ["osm", "manual", "shared"].includes(course.source);
    if (!shouldExport) {
      return null;
    }
    return pruneEmpty({
      id: course.id,
      source: course.source === "verified" ? "shared" : course.source || "shared",
      homeAreaId: course.homeAreaId || "",
      name: course.name || "",
      town: course.town || "",
      postcode: course.postcode || "",
      country: course.country || "",
      holesCount: Number(course.holesCount || holes.length || course.holes.length || 18),
      par: course.par || "",
      distanceMiles: typeof course.distanceMiles === "number" ? course.distanceMiles : null,
      website: course.website || "",
      phone: course.phone || "",
      location: normalizeExportPoint(course.location),
      osm: course.osm || null,
      holesTag: course.holesTag || "",
      attribution: course.attribution || "",
      geometrySource: course.geometrySource || "PinScope shared defaults",
      verification: course.verification || null,
      tees: normalizeExportArray(course.tees),
      holes
    });
  }

  function holeToSharedDefault(hole) {
    if (!hole || !Number.isFinite(Number(hole.number))) {
      return null;
    }
    const geometry = normalizeExportGeometry(hole.geometry, hole.greenPolygon);
    return pruneEmpty({
      number: Number(hole.number),
      name: hole.name || "",
      par: Number.isFinite(Number(hole.par)) ? Number(hole.par) : null,
      strokeIndex: Number.isFinite(Number(hole.strokeIndex)) ? Number(hole.strokeIndex) : null,
      yards: normalizeExportObject(hole.yards),
      tee: normalizeExportPoint(hole.tee),
      greenCenter: normalizeExportPoint(hole.greenCenter),
      greenFront: normalizeExportPoint(hole.greenFront),
      greenBack: normalizeExportPoint(hole.greenBack),
      geometry,
      mapping: normalizeExportObject(hole.mapping),
      osm: hole.osm || null,
      visual: sanitizeVisualCoordinates(hole.visual)
    });
  }

  function normalizeExportGeometry(geometry, fallbackGreenPolygon) {
    const source = geometry && typeof geometry === "object" ? geometry : {};
    return pruneEmpty({
      ...source,
      greenPolygon: normalizeExportPolygon(source.greenPolygon || fallbackGreenPolygon),
      tees: normalizeExportArray(source.tees),
      detection: normalizeExportObject(source.detection)
    });
  }

  function normalizeExportArray(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => {
        if (validGeoPoint(item)) {
          return { ...item, ...roundPoint(item) };
        }
        if (item && typeof item === "object") {
          const point = normalizeExportPoint(item);
          return pruneEmpty({ ...item, ...(point || {}) });
        }
        return item;
      })
      .filter((item) => item !== null && item !== undefined && item !== "");
  }

  function normalizeExportObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return pruneEmpty({ ...value });
  }

  function normalizeExportPolygon(value) {
    const list = Array.isArray(value) ? value : [];
    return list.map(normalizeExportPoint).filter(Boolean);
  }

  function normalizeExportPoint(value) {
    return validGeoPoint(value) ? roundPoint(value) : null;
  }

  function sanitizeVisualCoordinates(visual) {
    if (!visual || typeof visual !== "object") {
      return visual;
    }
    const next = { ...visual };
    if (!isPercentPair(next.tee)) {
      delete next.tee;
    }
    if (!isPercentPair(next.green)) {
      delete next.green;
    }
    return pruneEmpty(next);
  }

  function isPercentPair(value) {
    return Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]));
  }

  function validGeoPoint(point) {
    return Boolean(point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng)) && Math.abs(Number(point.lat)) <= 90 && Math.abs(Number(point.lng)) <= 180);
  }

  function roundPoint(point) {
    return { lat: Number(Number(point.lat).toFixed(6)), lng: Number(Number(point.lng).toFixed(6)) };
  }

  function pruneEmpty(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return value;
    }
    const next = {};
    Object.entries(value).forEach(([key, item]) => {
      if (item === null || item === undefined || item === "") {
        return;
      }
      if (Array.isArray(item) && !item.length) {
        return;
      }
      if (item && typeof item === "object" && !Array.isArray(item) && !Object.keys(item).length) {
        return;
      }
      next[key] = item;
    });
    return next;
  }

  function downloadTextFile(filename, text, type = "text/plain") {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
})();
