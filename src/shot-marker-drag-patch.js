// PinScope satellite shot-planner marker drag support.
//
// The main app can already add satellite plan points by tapping the hole. This
// helper lets you press an existing satellite shot marker, drag it, and release
// it to rebuild the same plan with that marker moved.

const MARKER_SELECTOR = [
  ".arcgis-hole [data-photo-plan-point]",
  ".arcgis-hole [data-arcgis-plan-point]",
  ".arcgis-hole .photo-plan-point",
  ".arcgis-hole .shot-plan-point",
  ".arcgis-hole .shot-plan-marker"
].join(", ");

let drag = null;
let suppressClickUntil = 0;

document.addEventListener("pointerdown", handlePointerDown, true);
document.addEventListener("pointermove", handlePointerMove, true);
document.addEventListener("pointerup", handlePointerEnd, true);
document.addEventListener("pointercancel", handlePointerEnd, true);
document.addEventListener("click", handleClickCapture, true);

function handlePointerDown(event) {
  if (event.button !== 0 || event.isPrimary === false) {
    return;
  }

  const marker = event.target.closest(MARKER_SELECTOR);
  const panel = marker?.closest(".arcgis-hole");
  if (!marker || !panel) {
    return;
  }

  const markers = collectMarkers(panel);
  const markerIndex = markers.findIndex((item) => item.element === marker);
  if (markerIndex < 0) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  try {
    panel.setPointerCapture?.(event.pointerId);
  } catch {
    // Older mobile browsers may not keep capture through SVG descendants.
  }

  const currentPoint = panelPointFromEvent(panel, event);
  drag = {
    pointerId: event.pointerId,
    panel,
    marker,
    markerIndex,
    courseId: panel.dataset.arcgisCourseId || "",
    holeNumber: String(panel.dataset.arcgisHole || ""),
    points: markers.map((item) => item.point),
    latestPoint: currentPoint,
    moved: false
  };

  panel.classList.add("dragging-shot");
  marker.classList.add("dragging");
  moveDomMarker(marker, currentPoint);
}

function handlePointerMove(event) {
  if (!drag || event.pointerId !== drag.pointerId) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  const point = panelPointFromEvent(drag.panel, event);
  drag.latestPoint = point;
  drag.moved = true;
  moveDomMarker(drag.marker, point);
  moveRoutePoint(drag.panel, drag.markerIndex, point);
}

function handlePointerEnd(event) {
  if (!drag || event.pointerId !== drag.pointerId) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  const finished = drag;
  drag = null;
  suppressClickUntil = Date.now() + 500;

  finished.panel.classList.remove("dragging-shot");
  finished.marker.classList.remove("dragging");

  if (!finished.moved) {
    return;
  }

  const nextPoints = finished.points.slice();
  nextPoints[finished.markerIndex] = finished.latestPoint;
  rebuildArcGISPlan(finished.courseId, finished.holeNumber, nextPoints);
}

function handleClickCapture(event) {
  if (Date.now() > suppressClickUntil) {
    return;
  }

  if (event.target.closest(MARKER_SELECTOR)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}

function collectMarkers(panel) {
  const markers = Array.from(panel.querySelectorAll(MARKER_SELECTOR));
  return markers
    .map((element, fallbackIndex) => ({
      element,
      index: markerIndex(element, fallbackIndex),
      point: markerPoint(element)
    }))
    .filter((item) => item.point)
    .sort((a, b) => a.index - b.index);
}

function markerIndex(element, fallbackIndex) {
  const value =
    element.dataset.photoPlanPoint ??
    element.dataset.arcgisPlanPoint ??
    element.dataset.planPoint ??
    element.getAttribute("data-index");
  const index = Number(value);
  return Number.isFinite(index) ? index : fallbackIndex;
}

function markerPoint(element) {
  const cx = Number(element.getAttribute("cx"));
  const cy = Number(element.getAttribute("cy"));
  if (Number.isFinite(cx) && Number.isFinite(cy)) {
    return clampPoint({ x: cx, y: cy });
  }

  const left = Number.parseFloat(element.style.left || element.getAttribute("data-x") || "");
  const top = Number.parseFloat(element.style.top || element.getAttribute("data-y") || "");
  if (Number.isFinite(left) && Number.isFinite(top)) {
    return clampPoint({ x: left, y: top });
  }

  return null;
}

function panelPointFromEvent(panel, event) {
  const rect = panel.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return { x: 50, y: 50 };
  }

  return clampPoint({
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100
  });
}

function clampPoint(point) {
  return {
    x: Number(Math.min(97, Math.max(3, Number(point.x))).toFixed(2)),
    y: Number(Math.min(97, Math.max(3, Number(point.y))).toFixed(2))
  };
}

function moveDomMarker(marker, point) {
  if (marker.hasAttribute("cx") || marker.hasAttribute("cy")) {
    marker.setAttribute("cx", point.x);
    marker.setAttribute("cy", point.y);
    return;
  }

  marker.style.left = `${point.x}%`;
  marker.style.top = `${point.y}%`;
}

function moveRoutePoint(panel, index, point) {
  const route = panel.querySelector(".photo-plan-route, .shot-plan-route, polyline");
  if (route?.points?.[index + 1]) {
    route.points[index + 1].x = point.x;
    route.points[index + 1].y = point.y;
  }

  const cross = panel.querySelector(`[data-photo-plan-cross="${index}"], [data-arcgis-plan-cross="${index}"]`);
  if (cross) {
    cross.setAttribute(
      "d",
      `M ${point.x - 1.4} ${point.y} L ${point.x + 1.4} ${point.y} M ${point.x} ${point.y - 1.4} L ${point.x} ${point.y + 1.4}`
    );
  }
}

async function rebuildArcGISPlan(courseId, holeNumber, points) {
  let panel = findArcGISPanel(courseId, holeNumber);
  if (!panel) {
    return;
  }

  const clearButton = panel.querySelector('[data-action="clear-arcgis-shot-plan"]');
  if (!clearButton) {
    // Fallback: add a new point where the marker was dropped. This is less
    // perfect, but keeps the UI usable if the markup changes.
    clickPanelAtPoint(panel, points[points.length - 1]);
    return;
  }

  clearButton.click();
  await nextFrame();

  for (const point of points) {
    panel = findArcGISPanel(courseId, holeNumber);
    if (!panel) {
      return;
    }
    clickPanelAtPoint(panel, point);
    await nextFrame();
  }
}

function findArcGISPanel(courseId, holeNumber) {
  const escapedCourseId = cssEscape(courseId);
  const escapedHoleNumber = cssEscape(String(holeNumber));
  return document.querySelector(`.arcgis-hole[data-arcgis-course-id="${escapedCourseId}"][data-arcgis-hole="${escapedHoleNumber}"]`);
}

function clickPanelAtPoint(panel, point) {
  const rect = panel.getBoundingClientRect();
  const clientX = rect.left + (point.x / 100) * rect.width;
  const clientY = rect.top + (point.y / 100) * rect.height;
  panel.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX,
      clientY
    })
  );
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function cssEscape(value) {
  if (window.CSS?.escape) {
    return window.CSS.escape(value);
  }
  return String(value).replaceAll('"', '\\"');
}
