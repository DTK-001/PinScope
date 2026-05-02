import {
  clamp,
  createPlaceholderCourse,
  createRound,
  formatToPar,
  getActiveRound,
  getCourse,
  getPlayerEntry,
  getRoundEntry,
  getRoundPlayers,
  roundTotals,
  statSummary,
  yardsBetween
} from "./course-data.js";
import { homeArea } from "./local-area.js";
import { findNearbyOsmCourses } from "./osm.js";
import { loadState, saveState } from "./storage.js";

const CRANHAM_COURSE_ID = "osm-way-23454278";
const BELHUS_COURSE_ID = "verified-belhus-park";
const CRANHAM_PHOTO_KEY = "local-loop-golf:cranham-topdown-photo:v1";
const CRANHAM_PHOTO_EDIT_KEY = "local-loop-golf:cranham-photo-edits:v1";
const PHOTO_COURSE_IDS = [CRANHAM_COURSE_ID, BELHUS_COURSE_ID];
const PHOTO_COURSE_CALIBRATION_KEY = "__courseCalibration";
const PHOTO_ZOOM_LEVELS = [1, 1.35, 1.7, 2.1];
const PHOTO_MIN_ZOOM = 1;
const PHOTO_MAX_ZOOM = 2.6;
const SCORE_BUTTON_IMAGE_SRC = "./assets/enter-score.png";
const GPS_PINK_IMAGE_SRC = "./assets/gps-pink.png";
const GPS_GREY_IMAGE_SRC = "./assets/gps-grey.png";
const HOLE_SWIPE_MIN_DISTANCE = 68;
const HOLE_SWIPE_VERTICAL_RATIO = 1.25;
const GPS_TEST_QUERY_KEY = "gpsTest";
const AZURE_MAPS_KEY_STORAGE = "pinscope:azure-maps-key:v1";
const AZURE_MAPS_ENABLED_STORAGE = "pinscope:azure-maps-enabled:v1";
const AZURE_MAPS_QUERY_KEY = "azureMapsKey";
const AZURE_MAPS_QUERY_ENABLED = "azureMaps";
const AZURE_MAPS_TILE_SIZE = 256;
const AZURE_MAPS_ZOOM = 17;
const BELHUS_PHOTO_GEO_BOUNDS = {
  north: 51.515,
  south: 51.5046,
  west: 0.249,
  east: 0.2672
};

const app = document.querySelector("#app");
let state = loadState();
let coursePhotoSources = loadCoursePhotoSources();
let coursePhotoEdits = loadCoursePhotoEdits();
let coursePhotoImages = new Map();
let photoRenderId = 0;
let photoEditMode = false;
let photoDrag = null;
let suppressPhotoPlanningClick = false;
let photoPointers = new Map();
let photoShotPlans = {};
let azureShotPlans = {};
let photoZoomLevels = {};
let photoPanOffsets = {};
let holeSwipe = null;
let wheelHoleNavigationAt = 0;
let courseSearchQuery = "";
let gpsTestMoveMode = false;
let azureMapsKey = initAzureMapsKey();
let azureMapsEnabled = initAzureMapsEnabled();
let view = getViewFromHash();
let gps = {
  status: "off",
  position: null,
  error: "",
  watchId: null
};
let notice = "";
let scoreCardOpen = false;

render();
registerServiceWorker();

window.addEventListener("hashchange", () => {
  view = getViewFromHash();
  render();
});
window.addEventListener("resize", queuePhotoCanvasRender);
app.addEventListener("load", handleAzureTileLoad, true);
app.addEventListener("error", handleAzureTileError, true);
window.addEventListener("pointermove", handlePhotoPointerMove);
window.addEventListener("pointerup", handlePhotoPointerEnd);
window.addEventListener("pointercancel", handlePhotoPointerEnd);
window.addEventListener("pointerdown", handleGpsTestPointerDown, true);
window.addEventListener("mousedown", handleGpsTestMouseDown, true);
window.addEventListener("mousemove", handlePhotoPointerMove);
window.addEventListener("mouseup", handlePhotoPointerEnd);
window.addEventListener("pointermove", handleHoleSwipePointerMove);
window.addEventListener("pointerup", handleHoleSwipePointerEnd);
window.addEventListener("pointercancel", cancelHoleSwipe);

app.addEventListener("click", handleClick);
app.addEventListener("click", handleAzurePlanningClick);
app.addEventListener("click", handlePhotoPlanningClick);
app.addEventListener("pointerdown", handlePhotoPointerDown);
app.addEventListener("pointerdown", handleHoleSwipePointerDown);
app.addEventListener("wheel", handlePhotoWheel, { passive: false });
app.addEventListener("submit", handleSubmit);
app.addEventListener("input", handleInput);
app.addEventListener("change", handleChange);

function getViewFromHash() {
  const allowed = ["courses", "play", "stats", "bag"];
  const value = window.location.hash.replace("#", "");
  return allowed.includes(value) ? value : "courses";
}

function render() {
  const activeRoundView = isActiveRoundView();
  document.body.classList.toggle("score-card-open", scoreCardOpen);
  document.body.classList.toggle("active-round-view", activeRoundView);
  app.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">PinScope</p>
        <h1>${pageTitle()}</h1>
      </div>
      <button class="gps-pill ${gps.status}" type="button" data-action="gps">
        <span class="gps-dot" aria-hidden="true"></span>
        <span>${gpsLabel()}</span>
      </button>
    </header>
    <main class="screen">${renderView()}</main>
    ${scoreCardOpen ? renderScoreCardOverlay() : ""}
    ${notice ? `<aside class="toast" role="status">${escapeHtml(notice)}</aside>` : ""}
    <nav class="bottom-nav" aria-label="Primary">
      ${navItem("courses", "Courses", "C")}
      ${navItem("play", "Play", "P")}
      ${navItem("stats", "Stats", "S")}
      ${navItem("bag", "Bag", "B")}
    </nav>
  `;
  queuePhotoCanvasRender();
}

function isActiveRoundView() {
  return view === "play" && Boolean(getActiveRound(state));
}

function pageTitle() {
  if (view === "play") {
    const round = getActiveRound(state);
    return round ? "Active Round" : "Start Round";
  }
  if (view === "stats") {
    return "Round Stats";
  }
  if (view === "bag") {
    return "My Bag";
  }
  return "Courses";
}

function navItem(target, label, icon) {
  const active = view === target ? "active" : "";
  return `
    <a class="nav-item ${active}" href="#${target}" aria-current="${active ? "page" : "false"}">
      <span class="nav-icon" aria-hidden="true">${icon}</span>
      <span>${label}</span>
    </a>
  `;
}

function renderView() {
  if (view === "play") {
    return renderPlay();
  }
  if (view === "stats") {
    return renderStats();
  }
  if (view === "bag") {
    return renderBag();
  }
  return renderCourses();
}

function renderCourses() {
  const featuredCourse = getCourse(state, CRANHAM_COURSE_ID);
  const filteredCourses = filteredCourseList();
  return `
    ${featuredCourse ? renderFeaturedCourse(featuredCourse) : ""}

    <section class="action-band">
      <div>
        <h2>Local Course Library</h2>
        <p>${state.courses.length} saved ${state.courses.length === 1 ? "course" : "courses"}</p>
      </div>
      <button class="primary-action" type="button" data-action="find-nearby">Find Near Me</button>
    </section>

    <section class="home-area">
      <div>
        <p class="eyebrow">Home Area</p>
        <h2>${homeArea.label}</h2>
        <p>${homeArea.subtitle} - ${savedHomeCourseCount()} saved here</p>
      </div>
      <button class="secondary-action" type="button" data-action="import-home-area">Refresh Local</button>
    </section>

    <label class="course-search">
      <span>Search courses</span>
      <input type="search" value="${escapeAttribute(courseSearchQuery)}" placeholder="Search by course or area" data-action="course-search" autocomplete="off" />
    </label>

    <details class="tool-panel">
      <summary>Add Course</summary>
      <form class="stack" data-form="add-course">
        <label>
          <span>Course name</span>
          <input name="name" type="text" autocomplete="organization" required />
        </label>
        <label>
          <span>Town or area</span>
          <input name="town" type="text" autocomplete="address-level2" />
        </label>
        <label>
          <span>Holes</span>
          <select name="holesCount">
            <option value="18">18 holes</option>
            <option value="9">9 holes</option>
          </select>
        </label>
        <button class="primary-action full" type="submit">Save Course</button>
      </form>
    </details>

    <section class="course-list">
      ${filteredCourses.length ? filteredCourses.map(renderCourseCard).join("") : `<p class="empty-copy">No courses match that search.</p>`}
    </section>
    <p class="source-note">OpenStreetMap imports require ODbL attribution. Imported shells are saved locally on this device.</p>
  `;
}

function filteredCourseList() {
  const query = courseSearchQuery.trim().toLowerCase();
  if (!query) {
    return state.courses;
  }
  return state.courses.filter((course) => [
    course.name,
    course.town,
    course.postcode,
    course.country,
    course.source
  ].some((value) => String(value || "").toLowerCase().includes(query)));
}

function renderFeaturedCourse(course) {
  const selected = state.selectedCourseId === course.id;
  return `
    <section class="course-hero">
      <div class="hero-orbit" aria-hidden="true">
        ${renderMiniCourseSignal(course)}
      </div>
      <div>
        <p class="eyebrow">Stage 1 Verified Pack</p>
        <h2>${escapeHtml(course.name)}</h2>
        <p>${courseLocationLine(course)}</p>
      </div>
      <div class="hero-actions">
        ${selected ? `<button class="primary-action" type="button" data-action="quick-start" data-course-id="${course.id}">Setup Round</button>` : ""}
        <button class="secondary-action" type="button" data-action="select-course" data-course-id="${course.id}">Select</button>
      </div>
      ${courseHasPhotoVisual(course) ? renderPhotoSourceControl(course, "hero") : ""}
    </section>
  `;
}

function renderPhotoSourceControl(courseOrId, context = "") {
  const courseId = typeof courseOrId === "string" ? courseOrId : courseOrId?.id;
  const course = typeof courseOrId === "string" ? getCourse(state, courseOrId) : courseOrId;
  const loaded = Boolean(coursePhotoSource(courseId));
  const customLoaded = Boolean(coursePhotoSources[courseId]);
  const courseName = course?.name || "Course";
  return `
    <div class="photo-source-control ${context} ${loaded ? "loaded" : ""}">
      <div>
        <span>${loaded ? "Top-down image loaded" : "Top-down image"}</span>
        <strong>${loaded ? `${escapeHtml(courseName)} image ready` : "Load course photo"}</strong>
      </div>
      <label class="file-action ${loaded ? "secondary-action" : "primary-action"}">
        ${loaded ? "Replace" : "Add Image"}
        <input type="file" accept="image/*" data-action="course-photo-file" data-course-id="${courseId}" />
      </label>
      ${customLoaded ? `<button class="secondary-action compact-action" type="button" data-action="clear-course-photo" data-course-id="${courseId}">Clear</button>` : ""}
    </div>
  `;
}

function courseHasPhotoVisual(course) {
  return Boolean(course?.holes?.some((hole) => hole.visual?.photo));
}

function renderMiniCourseSignal(course) {
  const holes = course.holes.slice(0, 18);
  return `
    <svg viewBox="0 0 100 100" role="img" aria-label="Cranham course signal">
      <circle cx="50" cy="50" r="43" class="signal-ring"></circle>
      ${holes.map((hole, index) => {
        const angle = (index / holes.length) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(angle) * (hole.par === 3 ? 25 : hole.par === 5 ? 39 : 32);
        const y = 50 + Math.sin(angle) * (hole.par === 3 ? 25 : hole.par === 5 ? 39 : 32);
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${hole.number === 18 ? 4.4 : 2.4}" class="signal-dot par-${hole.par}"></circle>`;
      }).join("")}
    </svg>
  `;
}

function renderCourseCard(course) {
  const isSelected = state.selectedCourseId === course.id;
  const selected = isSelected ? "selected" : "";
  const source = course.source === "verified" ? "Verified" : course.source === "osm" ? "OSM" : course.source === "manual" ? "Manual" : "Demo";
  return `
    <article class="course-card ${selected}">
      <div class="course-main">
        <div>
          <p class="eyebrow">${source}</p>
          <h3>${escapeHtml(course.name)}</h3>
          <p>${courseLocationLine(course)}</p>
        </div>
        <button class="chip-button" type="button" data-action="select-course" data-course-id="${course.id}">
          ${selected ? "Selected" : "Select"}
        </button>
      </div>
      <div class="course-meta">
        ${course.verification ? `<span class="verified-chip">Scorecard checked</span>` : ""}
        ${course.website ? `<a href="${escapeAttribute(course.website)}" target="_blank" rel="noreferrer">Website</a>` : "<span>Website pending</span>"}
        ${course.phone ? `<a href="tel:${escapeAttribute(course.phone)}">Call</a>` : "<span>Phone pending</span>"}
      </div>
      ${course.verification ? renderTeeSummary(course) : ""}
      ${isSelected ? `<button class="secondary-action full" type="button" data-action="quick-start" data-course-id="${course.id}">Start Round</button>` : ""}
    </article>
  `;
}

function renderTeeSummary(course) {
  return `
    <div class="tee-summary">
      ${course.tees.map((tee) => `
        <div>
          <span class="tee-swatch" style="background:${escapeAttribute(tee.color)}"></span>
          <strong>${escapeHtml(tee.name)}</strong>
          <span>${tee.totalYards} yd</span>
          <span>${tee.rating || "-"} / ${tee.slope || "-"}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderPlay() {
  const activeRound = getActiveRound(state);
  if (!activeRound) {
    return renderStartRound();
  }
  const course = getCourse(state, activeRound.courseId);
  if (!course) {
    return `<section class="empty-state"><h2>Course missing</h2><p>Select a saved course to continue.</p></section>`;
  }
  const hole = course.holes.find((item) => item.number === activeRound.currentHole) || course.holes[0];
  const players = getRoundPlayers(activeRound);
  const leadTotals = roundTotals(activeRound, course, players[0]?.id);
  const teeInfo = photoPlanningTee(hole);
  return `
    <section class="play-round-screen" data-play-round>
      ${renderHoleVisual(hole)}

      <div class="play-hud play-hole-hud">
        <p class="eyebrow">${escapeHtml(course.name)}</p>
        <h2>Hole ${hole.number}</h2>
        <div class="play-meta-line">
          <span>Par ${hole.par}</span>
          <span>SI ${hole.strokeIndex}</span>
          ${teeInfo.totalYards ? `<span>${teeInfo.totalYards} yd</span>` : ""}
          <span>${hole.number} / ${course.holes.length}</span>
        </div>
      </div>

      <div class="play-hud play-score-hud">
        ${renderPlayGpsButton()}
        <div class="score-pill">${formatToPar(leadTotals.toPar)}</div>
      </div>

      <div class="play-hud play-bottom-hud">
        ${renderPlayDistanceHud(hole)}
        <button class="play-finish-button" type="button" data-action="finish-round">Finish Round</button>
      </div>

      <button class="score-fab" type="button" data-action="open-score-card" aria-label="Enter scores">
        <img src="${SCORE_BUTTON_IMAGE_SRC}" alt="" aria-hidden="true" />
      </button>
    </section>
  `;
}

function renderPlayGpsButton() {
  const connected = gps.status === "ready";
  return `
    <button class="play-gps-button ${connected ? "connected" : ""}" type="button" data-action="gps" aria-label="${connected ? "GPS connected" : "Start GPS"}">
      <img src="${connected ? GPS_PINK_IMAGE_SRC : GPS_GREY_IMAGE_SRC}" alt="" aria-hidden="true" />
    </button>
  `;
}

function renderPlayDistanceHud(hole) {
  const values = gps.status === "ready"
    ? [
        yardsBetween(gps.position, hole.greenFront),
        yardsBetween(gps.position, hole.greenCenter),
        yardsBetween(gps.position, hole.greenBack)
      ]
    : ["-", "-", "-"];
  const labels = ["Front", "Mid", "Back"];
  return `
    <div class="play-distance-hud" aria-label="Green distances">
      ${labels.map((label, index) => `
        <div>
          <span>${label}</span>
          <strong>${values[index] ?? "-"}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function savedHomeCourseCount() {
  return state.courses.filter((course) => {
    if (course.homeAreaId === homeArea.id) {
      return true;
    }
    return typeof course.distanceMiles === "number" && course.distanceMiles <= homeArea.radiusMiles;
  }).length;
}

function courseLocationLine(course) {
  const bits = [];
  bits.push(escapeHtml(course.town || course.postcode || "Area pending"));
  bits.push(`${course.holesCount || course.holes.length} holes`);
  if (course.par) {
    bits.push(`Par ${escapeHtml(course.par)}`);
  }
  if (typeof course.distanceMiles === "number") {
    bits.push(`${course.distanceMiles} mi`);
  }
  return bits.join(" - ");
}

function renderStartRound() {
  const selected = getCourse(state, state.selectedCourseId) || state.courses[0];
  return `
    <section class="setup-panel">
      <div>
        <p class="eyebrow">Group Round</p>
        <h2>Round Setup</h2>
      </div>
      <form class="stack" data-form="start-round">
        <label>
          <span>Course</span>
          <select name="courseId" data-action="setup-course">
            ${state.courses.map((course) => `<option value="${course.id}" ${selected?.id === course.id ? "selected" : ""}>${escapeHtml(course.name)}</option>`).join("")}
          </select>
        </label>
        <div class="player-setup-list">
          ${renderPlayerSetupRows(selected)}
        </div>
        <button class="primary-action full" type="submit">Start Group Round</button>
      </form>
    </section>
    <section class="recent-strip">
      ${renderCourseCard(selected)}
    </section>
  `;
}

function renderPlayerSetupRows(course) {
  const teeOptions = (course?.tees || []).map((tee) => `<option value="${tee.id}">${escapeHtml(tee.name)}</option>`).join("");
  const defaults = ["Me", "", "", ""];
  return defaults.map((name, index) => `
    <div class="player-setup-row">
      <label>
        <span>Player ${index + 1}</span>
        <input name="playerName${index}" type="text" value="${escapeAttribute(name)}" placeholder="${index === 0 ? "Your name" : "Add player"}" />
      </label>
      <label>
        <span>Tee</span>
        <select name="playerTee${index}">
          ${teeOptions}
        </select>
      </label>
    </div>
  `).join("");
}

function renderRoundScoreboard(round, course) {
  const players = getRoundPlayers(round);
  return `
    <section class="scoreboard-strip">
      ${players.map((player) => {
        const totals = roundTotals(round, course, player.id);
        return `
          <div>
            <span>${escapeHtml(player.name)}</span>
            <strong>${totals.score}</strong>
            <em>${formatToPar(totals.toPar)}</em>
          </div>
        `;
      }).join("")}
    </section>
  `;
}

function renderScoreCardOverlay() {
  const round = getActiveRound(state);
  if (!round) {
    return "";
  }
  const course = getCourse(state, round.courseId);
  if (!course) {
    return "";
  }
  const hole = course.holes.find((item) => item.number === round.currentHole) || course.holes[0];
  const players = getRoundPlayers(round);
  return `
    <section class="score-card-backdrop" role="dialog" aria-modal="true" aria-label="Group score card">
      <div class="score-card-sheet">
        <header class="score-card-head">
          <div>
            <p class="eyebrow">Score Entry</p>
            <h2>${escapeHtml(course.name)}</h2>
            <p>Hole ${hole.number} - Par ${hole.par} - SI ${hole.strokeIndex}</p>
          </div>
          <button class="icon-action" type="button" data-action="close-score-card" aria-label="Close score card">X</button>
        </header>
        <div class="score-card-summary">
          ${players.map((player) => {
            const totals = roundTotals(round, course, player.id);
            const entry = getPlayerEntry(round, hole.number, player.id) || getRoundEntry(round, hole.number);
            return `
              <div>
                <span>${escapeHtml(player.name)}</span>
                <strong>${entry.score}</strong>
                <em>${totals.score} ${formatToPar(totals.toPar)}</em>
              </div>
            `;
          }).join("")}
        </div>
        <div class="player-score-list score-card-players">
          ${players.map((player) => renderPlayerScoreCard(round, course, hole, player)).join("")}
        </div>
        <footer class="score-card-footer">
          <button class="secondary-action" type="button" data-action="hole-prev">Prev</button>
          <button class="primary-action" type="button" data-action="score-card-next">Save & Next</button>
        </footer>
      </div>
    </section>
  `;
}

function renderPlayerScoreCard(round, course, hole, player) {
  const entry = getPlayerEntry(round, hole.number, player.id) || getRoundEntry(round, hole.number);
  const yardage = hole.yards?.[player.teeId] || "-";
  return `
    <article class="player-score-card">
      <header>
        <div>
          <h3>${escapeHtml(player.name)}</h3>
          <p>${escapeHtml(player.teeId)} tee - ${yardage} yd</p>
        </div>
        <strong>${entry.score}</strong>
      </header>
      <div class="score-grid">
        ${stepper("Score", "score", entry.score, hole.number, 1, 12, player.id)}
        ${stepper("Putts", "putts", entry.putts, hole.number, 0, 6, player.id)}
        ${stepper("Penalty", "penalties", entry.penalties, hole.number, 0, 8, player.id)}
      </div>
      <div class="field-group compact-field">
        <span>Fairway</span>
        <div class="segmented">
          ${toggleButton("fairway", "unset", "N/A", entry.fairway, hole.number, player.id)}
          ${toggleButton("fairway", "hit", "Hit", entry.fairway, hole.number, player.id)}
          ${toggleButton("fairway", "left", "Left", entry.fairway, hole.number, player.id)}
          ${toggleButton("fairway", "right", "Right", entry.fairway, hole.number, player.id)}
        </div>
      </div>
      <label class="check-row">
        <input type="checkbox" data-action="entry-check" data-player-id="${player.id}" data-hole="${hole.number}" data-field="gir" ${entry.gir ? "checked" : ""} />
        <span>Green in regulation</span>
      </label>
    </article>
  `;
}

function renderHoleVisual(hole) {
  const course = activeVisualCourse();
  if (azureMapsActiveForHole(hole, course)) {
    return renderAzureHoleVisual(hole, course);
  }
  if (hole.visual?.photo && coursePhotoSource(photoCourseId(hole))) {
    return renderPhotoHoleVisual(hole);
  }
  if (hole.visual?.path) {
    return renderMappedHoleVisual(hole);
  }
  const tee = hole.visual?.tee || [16, 76];
  const green = hole.visual?.green || [82, 26];
  return `
    <section class="hole-visual" aria-label="Hole shape">
      <div class="fairway-path"></div>
      <span class="tee-marker" style="left:${tee[0]}%; top:${tee[1]}%;"></span>
      <span class="green-marker" style="left:${green[0]}%; top:${green[1]}%;"></span>
      ${(hole.hazards || []).map((item) => {
        const visual = item.visual || [50, 50];
        return `<span class="hazard ${item.type}" style="left:${visual[0]}%; top:${visual[1]}%;" title="${escapeAttribute(item.label)}"></span>`;
      }).join("")}
    </section>
  `;
}

function renderAzureHoleVisual(hole, course) {
  const courseId = course?.id || photoCourseId(hole);
  const anchors = azureHoleAnchors(hole, course);
  const map = azureMapViewForHole(anchors);
  if (!map) {
    return renderMappedHoleVisual(hole);
  }
  const marker = photoTargetMarkers(hole.par);
  const tee = { x: marker.tee[0], y: marker.tee[1] };
  const green = { x: marker.green[0], y: marker.green[1] };
  const gpsPoint = gps.status === "ready" && gps.position ? azureGeoToTargetPoint(anchors, gps.position, marker) : null;
  const start = gpsPoint || tee;
  const shotPlan = resolveAzureShotPlan(courseId, hole, anchors, marker);
  const routePoints = shotPlan
    ? [start, ...shotPlan.viewPoints, green].map((point) => `${point.x},${point.y}`).join(" ")
    : "";
  const guide = shotPlan ? "" : `<line class="photo-guide-route" x1="${start.x}" y1="${start.y}" x2="${green.x}" y2="${green.y}"></line>`;
  return `
    <section class="hole-visual photo-hole azure-hole${shotPlan ? " planning" : ""}" data-azure-hole="${hole.number}" data-azure-course-id="${courseId}" aria-label="${escapeAttribute(course?.name || "Course")} Azure satellite hole ${hole.number}">
      <div class="azure-tile-layer" data-azure-tile-layer>
        ${renderAzureTiles(map)}
        <div class="azure-map-status" data-azure-map-status>Loading satellite</div>
      </div>
      <svg class="photo-hole-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="azure-shot-gradient-${hole.number}" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stop-color="#ff4fd8"></stop>
            <stop offset="1" stop-color="#8d5cff"></stop>
          </linearGradient>
        </defs>
        ${guide}
        ${shotPlan ? `<polyline class="photo-plan-route" points="${routePoints}" stroke="url(#azure-shot-gradient-${hole.number})"></polyline>` : ""}
        ${shotPlan?.viewPoints.map((point, index) => `
          <circle class="photo-plan-point" cx="${point.x}" cy="${point.y}" r="1.9"></circle>
          <path class="photo-plan-cross" d="M ${point.x - 1.4} ${point.y} L ${point.x + 1.4} ${point.y} M ${point.x} ${point.y - 1.4} L ${point.x} ${point.y + 1.4}"></path>
        `).join("") || ""}
        <circle class="photo-green-marker" cx="${green.x}" cy="${green.y}" r="4.1"></circle>
        <circle class="photo-green-core" cx="${green.x}" cy="${green.y}" r="1.15"></circle>
        <circle class="${gpsPoint ? "photo-tee-marker reference" : "photo-tee-marker"}" cx="${tee.x}" cy="${tee.y}" r="${gpsPoint ? "1.45" : "2.3"}"></circle>
        ${gpsPoint ? renderPhotoGpsMarker(gpsPoint) : ""}
      </svg>
      <div class="photo-info-stack">
        <div class="photo-hole-badge">
          <span>Hole ${hole.number}</span>
          <strong>Par ${hole.par}</strong>
          <span>${firstHoleYardage(hole.yards)} yd</span>
          <span>SI ${hole.strokeIndex}</span>
          <em>${anchors.estimated ? "Estimated" : "Azure"}</em>
        </div>
        ${renderAzureShotInfo(courseId, hole, shotPlan)}
      </div>
      ${renderPhotoClubPanel(hole, shotPlan)}
      ${renderGpsTestControls(hole, courseId)}
      <div class="photo-align-toolbar">
        <button class="photo-tool-button" type="button" data-action="toggle-azure-maps">Satellite</button>
        ${shotPlan ? `<button class="photo-tool-button" type="button" data-action="clear-azure-shot-plan" data-course-id="${courseId}" data-hole="${hole.number}">Clear</button>` : ""}
      </div>
    </section>
  `;
}

function renderAzureTiles(map) {
  return map.tiles.map((tile) => `
    <img class="azure-map-tile" src="${azureTileUrl(tile.x, tile.y, map.zoom)}" alt="" aria-hidden="true" referrerpolicy="no-referrer" data-azure-tile style="left:${tile.left}%; top:${tile.top}%; width:${tile.width}%; height:${tile.height}%;" />
  `).join("");
}

function renderAzureShotInfo(courseId, hole, shotPlan) {
  if (!shotPlan) {
    return `<div class="photo-tap-hint">Tap the satellite image to plan a shot</div>`;
  }
  return `
    <div class="photo-yardage-card" aria-live="polite">
      ${shotPlan.segments.map((segment) => `
        <div>
          <span>${escapeHtml(segment.label)}</span>
          <strong>${segment.yards}<small>yd</small></strong>
        </div>
      `).join("")}
      <button class="photo-clear-shot" type="button" data-action="clear-azure-shot-plan" data-course-id="${courseId}" data-hole="${hole.number}" aria-label="Clear shot path">Clear</button>
    </div>
  `;
}

function renderPhotoHoleVisual(hole) {
  const photo = hole.visual.photo;
  const courseId = photoCourseId(hole);
  const photoSource = coursePhotoSource(courseId);
  const course = getCourse(state, courseId);
  if (!photoSource) {
    return `
      <section class="hole-visual photo-hole photo-hole-empty" aria-label="${escapeAttribute(course?.name || "Course")} hole image setup">
        <div class="photo-empty-inner">
          <p class="eyebrow">${escapeHtml(course?.name || "Course")} Hole ${hole.number}</p>
          <h3>Load the course top-down image</h3>
          ${renderPhotoSourceControl(courseId, "visual")}
        </div>
      </section>
    `;
  }

  const sourcePoints = photoSourcePoints(hole);
  const teeSource = sourcePoints.tee;
  const greenSource = sourcePoints.green;
  const marker = photoTargetMarkers(hole.par);
  const edited = hasManualHolePhotoEdit(courseId, hole.number);
  const generated = hasGeneratedHolePhotoEdit(courseId, hole.number);
  const courseAligned = Boolean(photoCourseCalibration(courseId));
  const alignmentBadge = edited
    ? "<em>Aligned</em>"
    : generated || courseAligned
      ? "<em>Course aligned</em>"
      : "";
  const editClass = photoEditMode ? " editing" : "";
  const teeInfo = photoPlanningTee(hole);
  const shotPlan = photoEditMode ? null : resolvePhotoShotPlan(hole, teeInfo);
  const planningClass = shotPlan ? " planning" : "";
  const zoom = photoEditMode ? 1 : photoZoomLevel(courseId, hole.number);
  const pan = photoPanOffset(courseId, hole.number, zoom);
  const zoomClass = zoom > 1 ? " zoomed" : "";
  const gpsMarker = photoEditMode ? null : photoGpsMarker(hole, courseId);
  const shotStartMarker = gpsMarker || { x: marker.tee[0], y: marker.tee[1] };
  const teeMarkerClass = gpsMarker ? "photo-tee-marker reference" : "photo-tee-marker";

  return `
    <section class="hole-visual photo-hole${editClass}${planningClass}${zoomClass}" aria-label="${escapeAttribute(course?.name || "Course")} focused top-down cut-out for hole ${hole.number}">
      <div class="photo-pan-layer" style="transform:translate3d(${pan.x}%, ${pan.y}%, 0);">
        <div class="photo-zoom-layer" style="transform:scale(${zoom});">
          <canvas class="photo-hole-canvas"
            data-photo-hole="${hole.number}"
            data-photo-course-id="${courseId}"
            data-photo-zoom="${zoom}"
            data-par="${hole.par}"
            data-tee-x="${teeSource[0]}"
            data-tee-y="${teeSource[1]}"
            data-green-x="${greenSource[0]}"
            data-green-y="${greenSource[1]}"></canvas>
          <svg class="photo-hole-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="photo-shot-gradient-${hole.number}" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#ff4fd8"></stop>
                <stop offset="1" stop-color="#8d5cff"></stop>
              </linearGradient>
            </defs>
            ${shotPlan ? "" : renderPhotoGuideRoute(marker, shotStartMarker)}
            ${renderPhotoGreenLayer(marker, hole.par)}
            ${renderPhotoPlanRoute(marker, shotPlan, hole.number)}
            <circle class="${teeMarkerClass}" cx="${marker.tee[0]}" cy="${marker.tee[1]}" r="${gpsMarker ? "1.45" : "2.3"}"></circle>
            ${renderPhotoGpsMarker(gpsMarker)}
          </svg>
        </div>
      </div>
      ${photoEditMode ? `
        <button class="photo-drag-handle tee" type="button" style="left:${marker.tee[0]}%; top:${marker.tee[1]}%;" data-photo-handle="tee" data-hole="${hole.number}" aria-label="Drag tee marker">T</button>
        <button class="photo-drag-handle green" type="button" style="left:${marker.green[0]}%; top:${marker.green[1]}%;" data-photo-handle="green" data-hole="${hole.number}" aria-label="Drag green marker">G</button>
        <p class="photo-edit-help">Drag T or G onto the real tee box or green.</p>
      ` : ""}
      <div class="photo-info-stack">
        <div class="photo-hole-badge">
          <span>Hole ${hole.number}</span>
          <strong>Par ${hole.par}</strong>
          ${teeInfo.totalYards ? `<span>${teeInfo.totalYards} yd</span>` : ""}
          <span>SI ${hole.strokeIndex}</span>
          ${alignmentBadge}
        </div>
        ${photoEditMode ? "" : renderPhotoShotInfo(shotPlan, teeInfo, courseId, hole.number)}
      </div>
      ${photoEditMode ? "" : renderPhotoClubPanel(hole, shotPlan)}
      ${photoEditMode ? "" : renderGpsTestControls(hole, courseId)}
      ${photoEditMode ? "" : renderPhotoZoomControls(courseId, hole.number, zoom)}
      <div class="photo-align-toolbar">
        <button class="photo-tool-button" type="button" data-action="toggle-photo-edit">${photoEditMode ? "Done" : "Adjust"}</button>
        ${photoEditMode && (edited || generated) ? `<button class="photo-tool-button" type="button" data-action="reset-hole-photo-alignment" data-course-id="${courseId}" data-hole="${hole.number}">Reset Hole</button>` : ""}
        ${photoEditMode && courseAligned ? `<button class="photo-tool-button" type="button" data-action="reset-course-photo-calibration" data-course-id="${courseId}">Reset Course</button>` : ""}
        <label class="photo-tool-button" aria-label="Replace course top-down image">
          Replace
          <input type="file" accept="image/*" data-action="course-photo-file" data-course-id="${courseId}" />
        </label>
      </div>
    </section>
  `;
}

function renderPhotoGuideRoute(marker, start = null) {
  const from = start || { x: marker.tee[0], y: marker.tee[1] };
  return `
    <line class="photo-guide-route" x1="${from.x}" y1="${from.y}" x2="${marker.green[0]}" y2="${marker.green[1]}"></line>
  `;
}

function renderPhotoGreenLayer(marker, par) {
  const radius = Number(par) === 3 ? 4.6 : 4.1;
  return `
    <circle class="photo-green-marker" cx="${marker.green[0]}" cy="${marker.green[1]}" r="${radius}"></circle>
    <circle class="photo-green-core" cx="${marker.green[0]}" cy="${marker.green[1]}" r="1.15"></circle>
  `;
}

function renderPhotoPlanRoute(marker, shotPlan, holeNumber) {
  if (!shotPlan) {
    return "";
  }
  const viewPoints = shotPlan.viewPoints || [];
  const start = shotPlan.startViewPoint || { x: marker.tee[0], y: marker.tee[1] };
  const points = [
    `${start.x},${start.y}`,
    ...viewPoints.map((point) => `${point.x},${point.y}`),
    `${marker.green[0]},${marker.green[1]}`
  ].join(" ");
  return `
    <polyline class="photo-plan-route" points="${points}" stroke="url(#photo-shot-gradient-${holeNumber})"></polyline>
    ${viewPoints.map((point, index) => `
      <circle class="photo-plan-point" data-photo-plan-point="${index}" cx="${point.x}" cy="${point.y}" r="1.9"></circle>
      <path class="photo-plan-cross" data-photo-plan-cross="${index}" d="M ${point.x - 1.4} ${point.y} L ${point.x + 1.4} ${point.y} M ${point.x} ${point.y - 1.4} L ${point.x} ${point.y + 1.4}"></path>
    `).join("")}
  `;
}

function renderPhotoGpsMarker(marker) {
  if (!marker) {
    return "";
  }
  const dragAttributes = gpsTestEnabled()
    ? ` data-gps-test-marker="true" role="button" tabindex="0" aria-label="Drag GPS test marker"`
    : "";
  return `
    <g class="photo-gps-marker${gpsTestEnabled() ? " draggable" : ""}" transform="translate(${marker.x} ${marker.y})"${dragAttributes}>
      <circle class="photo-gps-hit" r="7.4"></circle>
      <circle class="photo-gps-pulse" r="4.8"></circle>
      <circle class="photo-gps-dot" r="1.65"></circle>
    </g>
  `;
}

function renderGpsTestControls(hole, courseId) {
  if (!gpsTestEnabled() || !hole) {
    return "";
  }
  return `
    <div class="gps-test-toolbar" aria-label="GPS test positions">
      <span>GPS Test</span>
      <button class="${gpsTestMoveMode ? "active" : ""}" type="button" data-action="toggle-gps-test-move">${gpsTestMoveMode ? "Moving" : "Move"}</button>
      <button type="button" data-action="gps-test-position" data-course-id="${courseId}" data-hole="${hole.number}" data-point="tee">Tee</button>
      <button type="button" data-action="gps-test-position" data-course-id="${courseId}" data-hole="${hole.number}" data-point="middle">Fairway</button>
      <button type="button" data-action="gps-test-position" data-course-id="${courseId}" data-hole="${hole.number}" data-point="green">Green</button>
    </div>
  `;
}

function renderPhotoShotInfo(shotPlan, teeInfo, courseId, holeNumber) {
  if (!shotPlan) {
    return `<div class="photo-tap-hint">Tap the hole to plan a tee shot</div>`;
  }
  const segments = shotPlan.segments || [];
  return `
    <div class="photo-yardage-card" aria-live="polite">
      ${segments.map((segment) => `
        <div>
          <span>${escapeHtml(segment.label)}</span>
          <strong>${segment.yards}<small>yd</small></strong>
        </div>
      `).join("")}
      <button class="photo-clear-shot" type="button" data-action="clear-shot-plan" data-course-id="${courseId}" data-hole="${holeNumber}" aria-label="Clear shot path">Clear</button>
    </div>
  `;
}

function renderPhotoClubPanel(hole, shotPlan) {
  const rows = clubPanelRows(hole, shotPlan);
  return `
    <div class="photo-club-panel" aria-live="polite">
      <span>Club</span>
      ${rows.map((row) => `
        <div>
          <em>${escapeHtml(row.label)}</em>
          <strong>${escapeHtml(row.club || "-")}</strong>
          <small>${row.yards ? `${row.yards} yd` : escapeHtml(row.note || "")}</small>
        </div>
      `).join("")}
    </div>
  `;
}

function clubPanelRows(hole, shotPlan) {
  const plannedSegments = shotPlan?.segments || [];
  if (plannedSegments.length) {
    return plannedSegments.map((segment) => ({
      label: segment.label,
      yards: segment.yards,
      club: recommendClub(segment.yards)?.name || "-"
    }));
  }

  const gpsDistance = gpsDistanceToGreen(hole);
  if (gpsDistance !== null) {
    return [{
      label: "Now",
      yards: gpsDistance,
      club: recommendClub(gpsDistance)?.name || "-"
    }];
  }

  return [{
    label: "Now",
    yards: 0,
    club: "",
    note: gps.status === "ready" ? "No green GPS" : "Start GPS"
  }];
}

function recommendClub(distance) {
  const target = Number(distance);
  if (!Number.isFinite(target) || target <= 0) {
    return null;
  }
  const clubs = (state.clubs || [])
    .filter((club) => Number(club.carryYards) > 0)
    .sort((a, b) => Math.abs(Number(a.carryYards) - target) - Math.abs(Number(b.carryYards) - target));
  return clubs[0] || null;
}

function gpsDistanceToGreen(hole) {
  if (gps.status !== "ready") {
    return null;
  }
  const target = gpsTargetForHole(hole);
  return target ? yardsBetween(gps.position, target) : null;
}

function activeVisualCourse() {
  const round = getActiveRound(state);
  return round ? getCourse(state, round.courseId) : getCourse(state, state.selectedCourseId);
}

function azureMapsActiveForHole(hole, course = activeVisualCourse()) {
  return Boolean(azureMapsEnabled && azureMapsKey && azureHoleAnchors(hole, course));
}

function initAzureMapsKey() {
  const params = new URLSearchParams(window.location.search);
  const queryKey = String(params.get(AZURE_MAPS_QUERY_KEY) || "").trim();
  if (queryKey) {
    try {
      localStorage.setItem(AZURE_MAPS_KEY_STORAGE, queryKey);
      localStorage.setItem(AZURE_MAPS_ENABLED_STORAGE, "1");
    } catch {
      // The key still works for the current page load if storage is blocked.
    }
    return queryKey;
  }
  return readLocalStorage(AZURE_MAPS_KEY_STORAGE, "");
}

function initAzureMapsEnabled() {
  const params = new URLSearchParams(window.location.search);
  const queryValue = params.get(AZURE_MAPS_QUERY_ENABLED);
  if (queryValue !== null) {
    const enabled = queryValue !== "0" && queryValue.toLowerCase() !== "false";
    try {
      localStorage.setItem(AZURE_MAPS_ENABLED_STORAGE, enabled ? "1" : "0");
    } catch {
      // Keep the setting in memory if storage is blocked.
    }
    return enabled;
  }
  return readLocalStorage(AZURE_MAPS_ENABLED_STORAGE, "0") === "1";
}

function saveAzureMapsEnabled() {
  try {
    localStorage.setItem(AZURE_MAPS_ENABLED_STORAGE, azureMapsEnabled ? "1" : "0");
  } catch {
    // In-memory toggle still works for this session.
  }
}

function azureTileUrl(x, y, zoom) {
  const params = new URLSearchParams({
    "api-version": "2024-04-01",
    tilesetId: "microsoft.imagery",
    zoom: String(zoom),
    x: String(x),
    y: String(y),
    tileSize: String(AZURE_MAPS_TILE_SIZE),
    view: "Auto",
    "subscription-key": azureMapsKey
  });
  return `https://atlas.microsoft.com/map/tile?${params.toString()}`;
}

function azureHoleAnchors(hole, course = activeVisualCourse()) {
  if (hole?.tee && hole?.greenCenter) {
    return { tee: hole.tee, green: hole.greenCenter, estimated: false };
  }
  if (!course?.location) {
    return null;
  }
  const yardage = Math.max(120, firstHoleYardage(hole.yards) || (Number(hole.par) === 3 ? 155 : Number(hole.par) === 5 ? 500 : 370));
  const holeSpread = 95 + (Number(hole.number || 1) % 6) * 34;
  const baseBearing = ((Number(hole.number || 1) - 1) * 137.5 + 18) % 360;
  const playBearing = (baseBearing + 36 + (Number(hole.par) === 5 ? 10 : 0)) % 360;
  const tee = destinationPoint(course.location, baseBearing, holeSpread);
  const green = destinationPoint(tee, playBearing, yardage / 1.0936132983);
  return { tee, green, estimated: true };
}

function azureMapViewForHole(anchors) {
  if (!anchors?.tee || !anchors?.green) {
    return null;
  }
  const zoom = AZURE_MAPS_ZOOM;
  const tee = geoToWorldPixel(anchors.tee, zoom);
  const green = geoToWorldPixel(anchors.green, zoom);
  const minX = Math.min(tee.x, green.x);
  const maxX = Math.max(tee.x, green.x);
  const minY = Math.min(tee.y, green.y);
  const maxY = Math.max(tee.y, green.y);
  const routeWidth = Math.max(1, maxX - minX);
  const routeHeight = Math.max(1, maxY - minY);
  const width = Math.max(routeWidth * 2.1, 260);
  const height = Math.max(routeHeight * 1.55, width * (13 / 9));
  const center = {
    x: (tee.x + green.x) / 2,
    y: (tee.y + green.y) / 2
  };
  const left = center.x - width / 2;
  const top = center.y - height / 2;
  const right = left + width;
  const bottom = top + height;
  const minTileX = Math.floor(left / AZURE_MAPS_TILE_SIZE);
  const maxTileX = Math.floor(right / AZURE_MAPS_TILE_SIZE);
  const minTileY = Math.floor(top / AZURE_MAPS_TILE_SIZE);
  const maxTileY = Math.floor(bottom / AZURE_MAPS_TILE_SIZE);
  const tiles = [];
  for (let x = minTileX; x <= maxTileX; x += 1) {
    for (let y = minTileY; y <= maxTileY; y += 1) {
      tiles.push({
        x,
        y,
        left: Number((((x * AZURE_MAPS_TILE_SIZE - left) / width) * 100).toFixed(4)),
        top: Number((((y * AZURE_MAPS_TILE_SIZE - top) / height) * 100).toFixed(4)),
        width: Number(((AZURE_MAPS_TILE_SIZE / width) * 100).toFixed(4)),
        height: Number(((AZURE_MAPS_TILE_SIZE / height) * 100).toFixed(4))
      });
    }
  }
  return { zoom, left, top, width, height, tiles };
}

function azureEventToPosition(panel, anchors, marker, event) {
  const rect = panel.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }
  const point = {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100
  };
  return azureTargetPointToGeo(anchors, point, marker);
}

function geoToWorldPixel(position, zoom) {
  const lat = clamp(Number(position.lat), -85.05112878, 85.05112878);
  const lng = Number(position.lng);
  const scale = AZURE_MAPS_TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  };
}

function worldPixelToGeo(pixel, zoom) {
  const scale = AZURE_MAPS_TILE_SIZE * 2 ** zoom;
  const lng = (pixel.x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * pixel.y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

function destinationPoint(origin, bearingDegrees, distanceMeters) {
  const radius = 6371000;
  const angular = Number(distanceMeters || 0) / radius;
  const bearing = (Number(bearingDegrees || 0) * Math.PI) / 180;
  const lat1 = (Number(origin.lat) * Math.PI) / 180;
  const lng1 = (Number(origin.lng) * Math.PI) / 180;
  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const sinAngular = Math.sin(angular);
  const cosAngular = Math.cos(angular);
  const lat2 = Math.asin(sinLat1 * cosAngular + cosLat1 * sinAngular * Math.cos(bearing));
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * sinAngular * cosLat1,
    cosAngular - sinLat1 * Math.sin(lat2)
  );
  return {
    lat: Number(((lat2 * 180) / Math.PI).toFixed(6)),
    lng: Number((((lng2 * 180) / Math.PI + 540) % 360 - 180).toFixed(6))
  };
}

function azureShotPlanKey(courseId, holeNumber) {
  return `${courseId || "course"}:${String(holeNumber || "")}`;
}

function resolveAzureShotPlan(courseId, hole, anchors, marker) {
  const saved = azureShotPlans[azureShotPlanKey(courseId, hole.number)];
  const points = sortAzurePlanPoints(anchors, saved?.points || []);
  if (!points.length) {
    return null;
  }
  const start = gps.status === "ready" && gps.position ? gps.position : anchors.tee;
  const route = [start, ...points, anchors.green];
  const segments = route.slice(0, -1).map((point, index) => {
    const last = index === route.length - 2;
    return {
      label: last ? "Into green" : `Shot ${index + 1}`,
      yards: yardsBetween(point, route[index + 1]) || 0
    };
  });
  return {
    points,
    viewPoints: points.map((point) => azureGeoToTargetPoint(anchors, point, marker)),
    segments
  };
}

function sortAzurePlanPoints(anchors, points) {
  const tee = geoToLocalMeters(anchors.tee, gps.status === "ready" && gps.position ? gps.position : anchors.tee);
  const green = geoToLocalMeters(anchors.tee, anchors.green);
  const vector = { x: green.x - tee.x, y: green.y - tee.y };
  const lengthSquared = Math.max(1, vector.x * vector.x + vector.y * vector.y);
  return points
    .filter((point) => point && typeof point.lat === "number" && typeof point.lng === "number")
    .map((point) => {
      const candidate = geoToLocalMeters(anchors.tee, point);
      const progress = ((candidate.x - tee.x) * vector.x + (candidate.y - tee.y) * vector.y) / lengthSquared;
      return { point, progress };
    })
    .filter((item) => item.progress > -0.08 && item.progress < 1.08)
    .sort((a, b) => a.progress - b.progress)
    .map((item) => item.point)
    .slice(0, 4);
}

function azureGeoToTargetPoint(anchors, position, marker = photoTargetMarkers(4)) {
  if (!anchors?.tee || !anchors?.green || !position) {
    return null;
  }
  const tee = geoToLocalMeters(anchors.tee, anchors.tee);
  const green = geoToLocalMeters(anchors.tee, anchors.green);
  const current = geoToLocalMeters(anchors.tee, position);
  const fairway = { x: green.x - tee.x, y: green.y - tee.y };
  const currentVector = { x: current.x - tee.x, y: current.y - tee.y };
  const lengthSquared = fairway.x * fairway.x + fairway.y * fairway.y;
  const length = Math.sqrt(lengthSquared);
  if (length < 1) {
    return null;
  }
  const progress = (currentVector.x * fairway.x + currentVector.y * fairway.y) / lengthSquared;
  const crossMeters = ((currentVector.x * fairway.y) - (currentVector.y * fairway.x)) / length;
  const targetLength = marker.tee[1] - marker.green[1];
  const crossScale = targetLength / length;
  return {
    x: Number(clamp(marker.tee[0] + crossMeters * crossScale, -8, 108).toFixed(2)),
    y: Number(clamp(marker.tee[1] - progress * targetLength, -8, 108).toFixed(2))
  };
}

function azureTargetPointToGeo(anchors, point, marker = photoTargetMarkers(4)) {
  if (!anchors?.tee || !anchors?.green || !point) {
    return null;
  }
  const green = geoToLocalMeters(anchors.tee, anchors.green);
  const fairway = { x: green.x, y: green.y };
  const length = Math.hypot(fairway.x, fairway.y);
  const targetLength = marker.tee[1] - marker.green[1];
  if (length < 1 || !targetLength) {
    return null;
  }
  const progress = (marker.tee[1] - Number(point.y)) / targetLength;
  const crossMeters = (Number(point.x) - marker.tee[0]) * (length / targetLength);
  const geoPerp = {
    x: fairway.y / length,
    y: -fairway.x / length
  };
  return localMetersToGeo(anchors.tee, {
    x: fairway.x * progress + geoPerp.x * crossMeters,
    y: fairway.y * progress + geoPerp.y * crossMeters
  });
}

function clearAzureShotPlan(courseId, holeNumber) {
  const key = azureShotPlanKey(courseId, holeNumber);
  if (!key || !azureShotPlans[key]) {
    return;
  }
  const next = { ...azureShotPlans };
  delete next[key];
  azureShotPlans = next;
  render();
}

function gpsTargetForHole(hole) {
  if (hole.greenCenter) {
    return hole.greenCenter;
  }
  const courseId = photoCourseId(hole);
  if (courseId === BELHUS_COURSE_ID && hole.visual?.photo) {
    return photoPointToGeo(courseId, photoSourcePoints(hole).green);
  }
  return null;
}

function photoGpsMarker(hole, courseId) {
  if (gps.status !== "ready" || !gps.position) {
    return null;
  }
  const sourcePoint = gpsTestSourcePoint(hole, courseId) ||
    photoGeoToSourcePoint(courseId, gps.position) ||
    photoHoleGeoToSourcePoint(hole, gps.position);
  const marker = sourcePoint ? photoSourceToTargetPoint(hole, sourcePoint) : null;
  if (!marker || marker.x < -8 || marker.x > 108 || marker.y < -8 || marker.y > 108) {
    return null;
  }
  return marker;
}

function photoHoleGeoToSourcePoint(hole, position) {
  if (!hole?.tee || !hole?.greenCenter || !position) {
    return null;
  }
  const tee = geoToLocalMeters(positionReferencePoint(hole.tee), hole.tee);
  const green = geoToLocalMeters(positionReferencePoint(hole.tee), hole.greenCenter);
  const current = geoToLocalMeters(positionReferencePoint(hole.tee), position);
  const fairway = { x: green.x - tee.x, y: green.y - tee.y };
  const currentVector = { x: current.x - tee.x, y: current.y - tee.y };
  const lengthSquared = fairway.x * fairway.x + fairway.y * fairway.y;
  if (lengthSquared < 1) {
    return null;
  }
  const progress = (currentVector.x * fairway.x + currentVector.y * fairway.y) / lengthSquared;
  const crossMeters = ((currentVector.x * fairway.y) - (currentVector.y * fairway.x)) / Math.sqrt(lengthSquared);
  if (progress < -0.25 || progress > 1.25 || Math.abs(crossMeters) > 90) {
    return null;
  }
  const sourcePoints = photoSourcePoints(hole);
  const sourceVector = {
    x: sourcePoints.green[0] - sourcePoints.tee[0],
    y: sourcePoints.green[1] - sourcePoints.tee[1]
  };
  const geoLength = Math.sqrt(lengthSquared);
  const sourceLength = Math.hypot(sourceVector.x, sourceVector.y);
  const crossScale = geoLength ? sourceLength / geoLength : 0;
  const sourcePerp = sourceLength
    ? { x: -sourceVector.y / sourceLength, y: sourceVector.x / sourceLength }
    : { x: 0, y: 0 };
  return normalizedPhotoPoint([
    sourcePoints.tee[0] + sourceVector.x * progress + sourcePerp.x * crossMeters * crossScale,
    sourcePoints.tee[1] + sourceVector.y * progress + sourcePerp.y * crossMeters * crossScale
  ]);
}

function positionReferencePoint(position) {
  return {
    lat: Number(position.lat),
    lng: Number(position.lng)
  };
}

function geoToLocalMeters(origin, position) {
  const lat = Number(position.lat);
  const lng = Number(position.lng);
  const originLat = Number(origin.lat);
  const originLng = Number(origin.lng);
  if (![lat, lng, originLat, originLng].every(Number.isFinite)) {
    return { x: 0, y: 0 };
  }
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos((originLat * Math.PI) / 180);
  return {
    x: (lng - originLng) * metersPerDegreeLng,
    y: (lat - originLat) * metersPerDegreeLat
  };
}

function localMetersToGeo(origin, point) {
  const originLat = Number(origin.lat);
  const originLng = Number(origin.lng);
  const x = Number(point.x);
  const y = Number(point.y);
  if (![originLat, originLng, x, y].every(Number.isFinite)) {
    return null;
  }
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos((originLat * Math.PI) / 180);
  if (!metersPerDegreeLng) {
    return null;
  }
  return {
    lat: Number((originLat + y / metersPerDegreeLat).toFixed(6)),
    lng: Number((originLng + x / metersPerDegreeLng).toFixed(6))
  };
}

function photoPointToGeo(courseId, point) {
  if (courseId !== BELHUS_COURSE_ID || !Array.isArray(point)) {
    return null;
  }
  const sourcePoint = uncalibrateCoursePhotoPoint(courseId, point);
  const lat = BELHUS_PHOTO_GEO_BOUNDS.north -
    ((BELHUS_PHOTO_GEO_BOUNDS.north - BELHUS_PHOTO_GEO_BOUNDS.south) * sourcePoint[1]) / 100;
  const lng = BELHUS_PHOTO_GEO_BOUNDS.west +
    ((BELHUS_PHOTO_GEO_BOUNDS.east - BELHUS_PHOTO_GEO_BOUNDS.west) * sourcePoint[0]) / 100;
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

function photoSourcePointToGeo(courseId, hole, point) {
  return photoPointToGeo(courseId, point) || photoHoleSourcePointToGeo(hole, point);
}

function photoHoleSourcePointToGeo(hole, point) {
  const sourcePoint = normalizedPhotoPoint(point);
  if (!hole?.tee || !hole?.greenCenter || !sourcePoint) {
    return null;
  }
  const sourcePoints = photoSourcePoints(hole);
  const sourceVector = {
    x: sourcePoints.green[0] - sourcePoints.tee[0],
    y: sourcePoints.green[1] - sourcePoints.tee[1]
  };
  const sourceLengthSquared = sourceVector.x * sourceVector.x + sourceVector.y * sourceVector.y;
  const sourceLength = Math.sqrt(sourceLengthSquared);
  if (sourceLength < 0.01) {
    return null;
  }
  const sourceDelta = {
    x: sourcePoint[0] - sourcePoints.tee[0],
    y: sourcePoint[1] - sourcePoints.tee[1]
  };
  const progress = (sourceDelta.x * sourceVector.x + sourceDelta.y * sourceVector.y) / sourceLengthSquared;
  const sourcePerp = {
    x: -sourceVector.y / sourceLength,
    y: sourceVector.x / sourceLength
  };
  const sourceCross = sourceDelta.x * sourcePerp.x + sourceDelta.y * sourcePerp.y;
  const green = geoToLocalMeters(hole.tee, hole.greenCenter);
  const fairway = { x: green.x, y: green.y };
  const geoLength = Math.hypot(fairway.x, fairway.y);
  if (geoLength < 1) {
    return null;
  }
  const crossMeters = sourceCross * (geoLength / sourceLength);
  const geoPerp = {
    x: fairway.y / geoLength,
    y: -fairway.x / geoLength
  };
  return localMetersToGeo(hole.tee, {
    x: fairway.x * progress + geoPerp.x * crossMeters,
    y: fairway.y * progress + geoPerp.y * crossMeters
  });
}

function photoGeoToSourcePoint(courseId, position) {
  if (courseId !== BELHUS_COURSE_ID || !position) {
    return null;
  }
  const lat = Number(position.lat);
  const lng = Number(position.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  const x = ((lng - BELHUS_PHOTO_GEO_BOUNDS.west) / (BELHUS_PHOTO_GEO_BOUNDS.east - BELHUS_PHOTO_GEO_BOUNDS.west)) * 100;
  const y = ((BELHUS_PHOTO_GEO_BOUNDS.north - lat) / (BELHUS_PHOTO_GEO_BOUNDS.north - BELHUS_PHOTO_GEO_BOUNDS.south)) * 100;
  if (x < -4 || x > 104 || y < -4 || y > 104) {
    return null;
  }
  return calibrateCoursePhotoPoint(courseId, [Number(x.toFixed(3)), Number(y.toFixed(3))]);
}

function renderPhotoZoomControls(courseId, holeNumber, zoom) {
  return `
    <div class="photo-zoom-toolbar" aria-label="Hole image zoom">
      <button class="photo-tool-button" type="button" data-action="photo-zoom" data-course-id="${courseId}" data-hole="${holeNumber}" data-direction="-1" aria-label="Zoom out">-</button>
      <span>${zoom.toFixed(1)}x</span>
      <button class="photo-tool-button" type="button" data-action="photo-zoom" data-course-id="${courseId}" data-hole="${holeNumber}" data-direction="1" aria-label="Zoom in">+</button>
    </div>
  `;
}

function photoPlanningTee(hole) {
  const round = getActiveRound(state);
  const course = round ? getCourse(state, round.courseId) : getCourse(state, state.selectedCourseId);
  const player = round ? getRoundPlayers(round)[0] : null;
  const teeId = player?.teeId || round?.teeId || course?.tees?.[0]?.id || "white";
  const tee = course?.tees?.find((item) => item.id === teeId);
  const exactYardage = Number(hole.yards?.[teeId]);
  return {
    teeId,
    teeName: tee?.name || teeIdLabel(teeId),
    playerName: player?.name || "Me",
    totalYards: Number.isFinite(exactYardage) ? exactYardage : firstHoleYardage(hole.yards)
  };
}

function resolvePhotoShotPlan(hole, teeInfo) {
  const saved = photoShotPlans[photoShotPlanKey(photoCourseId(hole), hole.number)];
  const sourcePoints = normalizedPlanSourcePoints(saved);
  if (!sourcePoints.length || !teeInfo.totalYards) {
    return null;
  }
  const startPoint = photoCurrentShotStartPoint(hole);
  const orderedPoints = sortPhotoPlanPoints(hole, sourcePoints, startPoint);
  const metrics = photoShotMetrics(hole, orderedPoints, teeInfo.totalYards, startPoint);
  const viewPoints = orderedPoints
    .map((point, index) => photoSourceToTargetPoint(hole, point) || saved?.viewPoints?.[index] || saved?.view)
    .filter(Boolean)
    .map((point) => ({
      x: Number(clamp(point.x, 3, 97).toFixed(2)),
      y: Number(clamp(point.y, 3, 97).toFixed(2))
    }));
  if (!metrics || !viewPoints.length) {
    return null;
  }
  return {
    ...metrics,
    points: orderedPoints,
    viewPoints,
    startPoint,
    startViewPoint: photoSourceToTargetPoint(hole, startPoint)
  };
}

function photoShotPlanKey(courseId, holeNumber) {
  return `${courseId || "course"}:${String(holeNumber || "")}`;
}

function normalizedPlanSourcePoints(saved) {
  if (!saved) {
    return [];
  }
  if (Array.isArray(saved.points)) {
    return saved.points.filter((point) => Array.isArray(point));
  }
  return Array.isArray(saved.source) ? [saved.source] : [];
}

function sortPhotoPlanPoints(hole, points, startPoint = null) {
  const sourcePoints = photoSourcePoints(hole);
  const start = normalizedPhotoPoint(startPoint) || sourcePoints.tee;
  const image = loadedPhotoImageForCourse(photoCourseId(hole));
  const width = image?.naturalWidth || 100;
  const height = image?.naturalHeight || 100;
  const tee = { x: (start[0] / 100) * width, y: (start[1] / 100) * height };
  const green = { x: (sourcePoints.green[0] / 100) * width, y: (sourcePoints.green[1] / 100) * height };
  const vector = { x: green.x - tee.x, y: green.y - tee.y };
  const lengthSquared = Math.max(1, vector.x * vector.x + vector.y * vector.y);
  return points
    .map((point) => {
      const candidate = { x: (point[0] / 100) * width, y: (point[1] / 100) * height };
      const progress = ((candidate.x - tee.x) * vector.x + (candidate.y - tee.y) * vector.y) / lengthSquared;
      return { point, progress };
    })
    .filter((item) => item.progress > -0.08 && item.progress < 1.08)
    .sort((a, b) => a.progress - b.progress)
    .map((item) => item.point)
    .slice(0, 4);
}

function photoShotMetrics(hole, planPoints, totalYards, startPoint = null) {
  const sourcePoints = photoSourcePoints(hole);
  const fullDistance = photoSourceDistance(hole, sourcePoints.tee, sourcePoints.green);
  if (!fullDistance) {
    return null;
  }
  const yardsPerUnit = totalYards / fullDistance;
  const route = [normalizedPhotoPoint(startPoint) || sourcePoints.tee, ...planPoints, sourcePoints.green];
  const segments = route.slice(0, -1).map((point, index) => {
    const yards = Math.round(photoSourceDistance(hole, point, route[index + 1]) * yardsPerUnit);
    const last = index === route.length - 2;
    return {
      label: last ? "Into green" : `Shot ${index + 1}`,
      yards
    };
  });
  return {
    segments,
    teeToPoint: segments[0]?.yards || 0,
    pointToGreen: segments[segments.length - 1]?.yards || 0
  };
}

function photoCurrentShotStartPoint(hole) {
  if (gps.status !== "ready" || !gps.position) {
    return photoSourcePoints(hole).tee;
  }
  const courseId = photoCourseId(hole);
  return gpsTestSourcePoint(hole, courseId) ||
    photoGeoToSourcePoint(courseId, gps.position) ||
    photoHoleGeoToSourcePoint(hole, gps.position) ||
    photoSourcePoints(hole).tee;
}

function gpsTestSourcePoint(hole, courseId) {
  if (!gps.position?.spoofed || gps.position.sourceCourseId !== courseId || Number(gps.position.sourceHoleNumber) !== Number(hole?.number)) {
    return null;
  }
  return normalizedPhotoPoint(gps.position.sourcePoint);
}

function photoSourceDistance(hole, a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return 0;
  }
  const image = loadedPhotoImageForCourse(photoCourseId(hole));
  const width = image?.naturalWidth || 100;
  const height = image?.naturalHeight || 100;
  return Math.hypot(((b[0] - a[0]) / 100) * width, ((b[1] - a[1]) / 100) * height);
}

function photoSourceToTargetPoint(hole, sourcePoint) {
  const image = loadedPhotoImageForCourse(photoCourseId(hole));
  if (!image || !Array.isArray(sourcePoint)) {
    return null;
  }

  const sourcePoints = photoSourcePoints(hole);
  const tee = [
    (sourcePoints.tee[0] / 100) * image.naturalWidth,
    (sourcePoints.tee[1] / 100) * image.naturalHeight
  ];
  const green = [
    (sourcePoints.green[0] / 100) * image.naturalWidth,
    (sourcePoints.green[1] / 100) * image.naturalHeight
  ];
  const point = [
    (sourcePoint[0] / 100) * image.naturalWidth,
    (sourcePoint[1] / 100) * image.naturalHeight
  ];
  const vector = {
    x: green[0] - tee[0],
    y: green[1] - tee[1]
  };
  const sourceDistance = Math.max(1, Math.hypot(vector.x, vector.y));
  const marker = photoTargetMarkers(hole.par);
  const aspect = { width: 9, height: 13 };
  const target = {
    teeX: aspect.width * (marker.tee[0] / 100),
    teeY: aspect.height * (marker.tee[1] / 100),
    greenY: aspect.height * (marker.green[1] / 100)
  };
  const scale = (target.teeY - target.greenY) / sourceDistance;
  const rotation = -Math.PI / 2 - Math.atan2(vector.y, vector.x);
  const dx = point[0] - tee[0];
  const dy = point[1] - tee[1];
  const x = target.teeX + (Math.cos(rotation) * dx - Math.sin(rotation) * dy) * scale;
  const y = target.teeY + (Math.sin(rotation) * dx + Math.cos(rotation) * dy) * scale;

  return {
    x: Number(((x / aspect.width) * 100).toFixed(2)),
    y: Number(((y / aspect.height) * 100).toFixed(2))
  };
}

function firstHoleYardage(yards = {}) {
  for (const value of Object.values(yards)) {
    const yardage = Number(value);
    if (Number.isFinite(yardage) && yardage > 0) {
      return yardage;
    }
  }
  return 0;
}

function teeIdLabel(teeId) {
  const value = String(teeId || "").trim();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Course";
}

function photoSourcePoints(hole) {
  const base = basePhotoSourcePoints(hole);
  const courseId = photoCourseId(hole);
  const calibrated = {
    tee: calibrateCoursePhotoPoint(courseId, base.tee),
    green: calibrateCoursePhotoPoint(courseId, base.green)
  };
  const edit = courseHolePhotoEdits(courseId)[String(hole.number)] || {};
  return {
    tee: normalizedPhotoPoint(edit.tee) || calibrated.tee,
    green: normalizedPhotoPoint(edit.green) || calibrated.green
  };
}

function basePhotoSourcePoints(hole) {
  const photo = hole.visual.photo;
  return {
    tee: sourcePhotoPoint(photo.crop, photo.tee),
    green: sourcePhotoPoint(photo.crop, photo.green)
  };
}

function photoCourseId(hole) {
  return hole.visual?.photo?.courseId || CRANHAM_COURSE_ID;
}

function sourcePhotoPoint(crop, point) {
  return [
    Number((crop.x + (crop.w * point[0]) / 100).toFixed(3)),
    Number((crop.y + (crop.h * point[1]) / 100).toFixed(3))
  ];
}

function normalizedPhotoPoint(point) {
  if (!Array.isArray(point) || point.length < 2) {
    return null;
  }
  const x = Number(point[0]);
  const y = Number(point[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return [Number(clamp(x, 0, 100).toFixed(3)), Number(clamp(y, 0, 100).toFixed(3))];
}

function hasManualHolePhotoEdit(courseId, holeNumber) {
  const edit = courseHolePhotoEdits(courseId)[String(holeNumber || "")] || {};
  return !edit.courseCalibrationGenerated && Boolean(normalizedPhotoPoint(edit.tee) || normalizedPhotoPoint(edit.green));
}

function hasGeneratedHolePhotoEdit(courseId, holeNumber) {
  const edit = courseHolePhotoEdits(courseId)[String(holeNumber || "")] || {};
  return Boolean(edit.courseCalibrationGenerated && normalizedPhotoPoint(edit.tee) && normalizedPhotoPoint(edit.green));
}

function photoCourseCalibration(courseId) {
  const calibration = courseHolePhotoEdits(courseId)[PHOTO_COURSE_CALIBRATION_KEY];
  const transform = calibration?.transform;
  if (!transform) {
    return null;
  }
  const values = [transform.a, transform.b, transform.tx, transform.ty].map(Number);
  if (!values.every(Number.isFinite)) {
    return null;
  }
  return {
    ...calibration,
    sourceHole: Number(calibration.sourceHole || 0),
    transform: {
      a: values[0],
      b: values[1],
      tx: values[2],
      ty: values[3]
    }
  };
}

function calibrateCoursePhotoPoint(courseId, point) {
  const sourcePoint = normalizedPhotoPoint(point);
  if (!sourcePoint) {
    return [50, 50];
  }
  const calibration = photoCourseCalibration(courseId);
  if (!calibration) {
    return sourcePoint;
  }
  return transformPhotoPoint(calibration.transform, sourcePoint);
}

function uncalibrateCoursePhotoPoint(courseId, point) {
  const sourcePoint = normalizedPhotoPoint(point);
  if (!sourcePoint) {
    return [50, 50];
  }
  const calibration = photoCourseCalibration(courseId);
  if (!calibration) {
    return sourcePoint;
  }
  return inverseTransformPhotoPoint(calibration.transform, sourcePoint);
}

function transformPhotoPoint(transform, point) {
  const x = transform.a * point[0] - transform.b * point[1] + transform.tx;
  const y = transform.b * point[0] + transform.a * point[1] + transform.ty;
  return normalizedPhotoPoint([x, y]);
}

function inverseTransformPhotoPoint(transform, point) {
  const det = transform.a * transform.a + transform.b * transform.b;
  if (!det) {
    return normalizedPhotoPoint(point);
  }
  const dx = point[0] - transform.tx;
  const dy = point[1] - transform.ty;
  const x = (transform.a * dx + transform.b * dy) / det;
  const y = (-transform.b * dx + transform.a * dy) / det;
  return normalizedPhotoPoint([x, y]);
}

function photoTargetMarkers(par) {
  const teeY = 82;
  const distance = photoTargetDistancePct(par);
  return {
    tee: [50, teeY],
    green: [50, Number((teeY - distance).toFixed(1))]
  };
}

function photoTargetDistancePct(par) {
  if (Number(par) === 3) {
    return 56;
  }
  if (Number(par) === 5) {
    return 68;
  }
  return 64;
}

function renderMappedHoleVisual(hole) {
  if (hole.visual?.features) {
    return renderRealisticHoleVisual(hole);
  }
  const path = pointsToSvg(hole.visual.path);
  const tee = hole.visual.tee || hole.visual.path[0];
  const green = hole.visual.green || hole.visual.path[hole.visual.path.length - 1];
  return `
    <section class="hole-visual mapped-hole" aria-label="Mapped hole shape">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="0" y="0" width="100" height="100" class="map-base"></rect>
        ${(hole.visual.water || []).map((point, index) => `<ellipse class="map-water" cx="${point[0]}" cy="${point[1]}" rx="${index === 0 && hole.number === 18 ? 18 : 10}" ry="${index === 0 && hole.number === 18 ? 9 : 6}"></ellipse>`).join("")}
        <polyline class="map-rough" points="${path}"></polyline>
        <polyline class="map-fairway" points="${path}"></polyline>
        ${(hole.visual.bunkers || []).map((point) => `<ellipse class="map-bunker" cx="${point[0]}" cy="${point[1]}" rx="4.6" ry="2.8"></ellipse>`).join("")}
        <circle class="map-tee" cx="${tee[0]}" cy="${tee[1]}" r="3.2"></circle>
        <ellipse class="map-green" cx="${green[0]}" cy="${green[1]}" rx="6.2" ry="4.4"></ellipse>
        <text class="map-hole-number" x="8" y="15">H${hole.number}</text>
        ${hole.notes ? `<text class="map-note" x="8" y="91">${escapeHtml(hole.notes)}</text>` : ""}
      </svg>
    </section>
  `;
}

function renderRealisticHoleVisual(hole) {
  const features = hole.visual.features;
  const path = pointsToSvg(hole.visual.path);
  const tee = hole.visual.tee || hole.visual.path[0];
  const green = hole.visual.green || hole.visual.path[hole.visual.path.length - 1];
  const viewClass = hole.visual.view || (hole.par === 3 ? "close" : hole.par === 5 ? "long" : "standard");
  return `
    <section class="hole-visual realistic-hole ${viewClass}" aria-label="Realistic mapped hole shape">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="grass-${hole.number}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#214b36"></stop>
            <stop offset="1" stop-color="#102f2d"></stop>
          </linearGradient>
          <filter id="grain-${hole.number}">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"></feTurbulence>
            <feColorMatrix type="saturate" values="0.22"></feColorMatrix>
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.18"></feFuncA>
            </feComponentTransfer>
          </filter>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#grass-${hole.number})"></rect>
        <rect x="0" y="0" width="100" height="100" filter="url(#grain-${hole.number})"></rect>
        ${renderPolygons(features.rough, "real-rough")}
        ${renderPolygons(features.water, "real-water")}
        ${renderPolygons(features.scrub, "real-scrub")}
        ${renderPolygons(features.woods, "real-woods")}
        ${renderTreeCanopies(features.woods, hole.number)}
        ${renderPolygons(features.fairways, "real-fairway")}
        ${renderFairwayStripes(features.fairways)}
        <polyline class="real-route" points="${path}"></polyline>
        ${renderPolylines(features.paths, "real-path")}
        ${renderPolygons(features.tees, "real-tee-box")}
        ${renderPolygons(features.bunkers, "real-bunker")}
        ${renderPolygons(features.greens, "real-green")}
        ${renderGreenStripes(features.greens)}
        <circle class="real-tee-pin" cx="${tee[0]}" cy="${tee[1]}" r="2.2"></circle>
        <circle class="real-flag" cx="${green[0]}" cy="${green[1]}" r="2.4"></circle>
        <text class="map-hole-number" x="7" y="14">H${hole.number}</text>
        ${hole.notes ? `<text class="map-note" x="7" y="91">${escapeHtml(hole.notes)}</text>` : ""}
      </svg>
    </section>
  `;
}

function renderPolygons(polygons = [], className) {
  return polygons
    .map((polygon) => `<polygon class="${className}" points="${pointsToSvg(polygon)}"></polygon>`)
    .join("");
}

function renderPolylines(lines = [], className) {
  return lines
    .map((line) => `<polyline class="${className}" points="${pointsToSvg(line)}"></polyline>`)
    .join("");
}

function renderFairwayStripes(polygons = []) {
  return polygons
    .map((polygon) => {
      const box = boundsOf(polygon);
      if (!box) {
        return "";
      }
      const stripes = [];
      for (let x = box.minX; x <= box.maxX; x += 7) {
        stripes.push(`<line class="fairway-stripe" x1="${x.toFixed(1)}" y1="${box.minY.toFixed(1)}" x2="${(x + 13).toFixed(1)}" y2="${box.maxY.toFixed(1)}"></line>`);
      }
      return stripes.join("");
    })
    .join("");
}

function renderGreenStripes(polygons = []) {
  return polygons
    .map((polygon) => {
      const box = boundsOf(polygon);
      if (!box) {
        return "";
      }
      const stripes = [];
      for (let x = box.minX; x <= box.maxX; x += 4) {
        stripes.push(`<line class="green-stripe" x1="${x.toFixed(1)}" y1="${box.minY.toFixed(1)}" x2="${(x + 8).toFixed(1)}" y2="${box.maxY.toFixed(1)}"></line>`);
      }
      return stripes.join("");
    })
    .join("");
}

function renderTreeCanopies(polygons = [], holeNumber) {
  const trees = [];
  polygons.forEach((polygon, polygonIndex) => {
    const box = boundsOf(polygon);
    if (!box) {
      return;
    }
    const count = Math.min(14, Math.max(4, Math.round(((box.maxX - box.minX) * (box.maxY - box.minY)) / 150)));
    for (let index = 0; index < count; index += 1) {
      const seed = (holeNumber * 97 + polygonIndex * 31 + index * 17) % 100;
      const x = box.minX + ((seed * 37) % 100) / 100 * (box.maxX - box.minX);
      const y = box.minY + ((seed * 53) % 100) / 100 * (box.maxY - box.minY);
      const r = 2.4 + (seed % 5) * 0.45;
      trees.push(`<circle class="tree-shadow" cx="${(x + 1.1).toFixed(1)}" cy="${(y + 1.4).toFixed(1)}" r="${(r * 1.08).toFixed(1)}"></circle>`);
      trees.push(`<circle class="tree-canopy tone-${seed % 4}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"></circle>`);
    }
  });
  return trees.join("");
}

function boundsOf(points) {
  const flat = typeof points[0] === "number" ? points : points.flat();
  if (!flat.length) {
    return null;
  }
  const xs = [];
  const ys = [];
  for (let index = 0; index < flat.length - 1; index += 2) {
    xs.push(Number(flat[index]));
    ys.push(Number(flat[index + 1]));
  }
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

function pointsToSvg(points) {
  if (!Array.isArray(points)) {
    return "";
  }
  if (typeof points[0] === "number") {
    const pairs = [];
    for (let index = 0; index < points.length - 1; index += 2) {
      pairs.push(`${points[index]},${points[index + 1]}`);
    }
    return pairs.join(" ");
  }
  return points.map((point) => `${point[0]},${point[1]}`).join(" ");
}

function renderVerificationPanel(course) {
  if (!course.verification) {
    return "";
  }
  return `
    <section class="verification-panel">
      <div>
        <p class="eyebrow">Verified Pack</p>
        <h3>${escapeHtml(course.name)}</h3>
        <p>${escapeHtml(course.verification.confidence)}</p>
      </div>
    </section>
  `;
}

function renderDistances(hole) {
  if (gps.status !== "ready") {
    return `
      <section class="distance-panel">
        <div><span>Front</span><strong>-</strong></div>
        <div><span>Middle</span><strong>-</strong></div>
        <div><span>Back</span><strong>-</strong></div>
      </section>
    `;
  }
  const from = gps.position;
  const front = yardsBetween(from, hole.greenFront);
  const middle = yardsBetween(from, hole.greenCenter);
  const back = yardsBetween(from, hole.greenBack);
  return `
    <section class="distance-panel">
      <div><span>Front</span><strong>${front ?? "-"}</strong></div>
      <div><span>Middle</span><strong>${middle ?? "-"}</strong></div>
      <div><span>Back</span><strong>${back ?? "-"}</strong></div>
    </section>
    ${renderHazardDistances(hole)}
  `;
}

function renderHazardDistances(hole) {
  const hazards = (hole.hazards || [])
    .map((item) => ({ ...item, yards: yardsBetween(gps.position, item.location) }))
    .filter((item) => item.yards !== null)
    .slice(0, 3);
  if (!hazards.length) {
    return "";
  }
  return `
    <section class="hazard-list">
      ${hazards.map((item) => `<div><span>${escapeHtml(item.label)}</span><strong>${item.yards} yd</strong></div>`).join("")}
    </section>
  `;
}

function stepper(label, field, value, holeNumber, min, max, playerId = "") {
  return `
    <div class="stepper">
      <span>${label}</span>
      <div>
        <button type="button" data-action="entry-step" data-field="${field}" data-player-id="${playerId}" data-hole="${holeNumber}" data-delta="-1" data-min="${min}" data-max="${max}">-</button>
        <strong>${value}</strong>
        <button type="button" data-action="entry-step" data-field="${field}" data-player-id="${playerId}" data-hole="${holeNumber}" data-delta="1" data-min="${min}" data-max="${max}">+</button>
      </div>
    </div>
  `;
}

function toggleButton(field, value, label, activeValue, holeNumber, playerId = "") {
  const active = value === activeValue ? "active" : "";
  return `
    <button class="${active}" type="button" data-action="entry-value" data-field="${field}" data-value="${value}" data-player-id="${playerId}" data-hole="${holeNumber}">
      ${label}
    </button>
  `;
}

function renderStats() {
  const summary = statSummary(state.rounds, state.courses);
  const completed = state.rounds.filter((round) => round.status === "complete").slice().reverse();
  return `
    <section class="stats-grid">
      ${statTile("Rounds", summary.rounds)}
      ${statTile("Avg score", summary.averageScore ? summary.averageScore.toFixed(1) : "-")}
      ${statTile("Fairways", summary.fairwayPct ? `${Math.round(summary.fairwayPct)}%` : "-")}
      ${statTile("GIR", summary.girPct ? `${Math.round(summary.girPct)}%` : "-")}
      ${statTile("Putts / hole", summary.puttsPerHole ? summary.puttsPerHole.toFixed(1) : "-")}
    </section>
    <section class="round-list">
      <h2>Rounds</h2>
      ${completed.length ? completed.map(renderRoundRow).join("") : `<p class="empty-copy">Finished rounds will appear here.</p>`}
    </section>
  `;
}

function statTile(label, value) {
  return `
    <article class="stat-tile">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function renderRoundRow(round) {
  const course = getCourse(state, round.courseId);
  if (!course) {
    return "";
  }
  const players = getRoundPlayers(round);
  const date = new Date(round.completedAt || round.startedAt).toLocaleDateString();
  return `
    <article class="round-row">
      <div>
        <h3>${escapeHtml(course.name)}</h3>
        <p>${date} - ${players.map((player) => {
          const totals = roundTotals(round, course, player.id);
          return `${escapeHtml(player.name)} ${totals.score} (${formatToPar(totals.toPar)})`;
        }).join(" - ")}</p>
      </div>
    </article>
  `;
}

function renderBag() {
  return `
    <section class="tool-panel open-panel">
      <h2>Club Yardages</h2>
      <form data-form="bag" class="bag-list">
        ${state.clubs.map((club) => `
          <label class="club-row">
            <span>${escapeHtml(club.name)}</span>
            <input name="${club.id}" type="number" min="0" max="400" step="1" value="${club.carryYards}" />
          </label>
        `).join("")}
        <button class="primary-action full" type="submit">Save Bag</button>
      </form>
    </section>
  `;
}

function handleClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }
  const action = button.dataset.action;

  if (action === "gps") {
    startGps();
  }

  if (action === "gps-test-position") {
    setGpsTestPosition(button);
  }

  if (action === "toggle-azure-maps") {
    azureMapsEnabled = !azureMapsEnabled;
    saveAzureMapsEnabled();
    render();
  }

  if (action === "clear-azure-shot-plan") {
    clearAzureShotPlan(button.dataset.courseId, button.dataset.hole);
  }

  if (action === "toggle-gps-test-move") {
    gpsTestMoveMode = !gpsTestMoveMode;
    render();
  }

  if (action === "find-nearby") {
    importNearbyCourses();
  }

  if (action === "import-home-area") {
    importHomeAreaCourses();
  }

  if (action === "select-course") {
    state.selectedCourseId = button.dataset.courseId;
    persist("Course selected.");
  }

  if (action === "quick-start") {
    openRoundSetup(button.dataset.courseId);
  }

  if (action === "entry-step") {
    updateEntryStep(button);
  }

  if (action === "entry-value") {
    updateEntryValue(button);
  }

  if (action === "hole-prev") {
    moveHole(-1);
  }

  if (action === "hole-next") {
    moveHole(1);
  }

  if (action === "score-card-next") {
    scoreCardOpen = false;
    moveHole(1);
  }

  if (action === "finish-round") {
    finishRound();
  }

  if (action === "open-score-card") {
    scoreCardOpen = true;
    render();
  }

  if (action === "close-score-card") {
    scoreCardOpen = false;
    render();
  }

  if (action === "clear-course-photo") {
    clearCoursePhotoSource(button.dataset.courseId);
  }

  if (action === "toggle-photo-edit") {
    photoEditMode = !photoEditMode;
    render();
  }

  if (action === "reset-hole-photo-alignment") {
    resetCourseHoleAlignment(button.dataset.courseId, button.dataset.hole);
  }

  if (action === "reset-course-photo-calibration") {
    resetCoursePhotoCalibration(button.dataset.courseId);
  }

  if (action === "clear-shot-plan") {
    clearPhotoShotPlan(button.dataset.courseId, button.dataset.hole);
  }

  if (action === "photo-zoom") {
    updatePhotoZoom(button);
  }
}

function handleSubmit(event) {
  const form = event.target.closest("form");
  if (!form) {
    return;
  }
  event.preventDefault();
  const data = new FormData(form);

  if (form.dataset.form === "add-course") {
    const name = String(data.get("name") || "").trim();
    if (!name) {
      return;
    }
    const course = createPlaceholderCourse({
      name,
      town: String(data.get("town") || ""),
      holesCount: Number(data.get("holesCount") || 18)
    });
    state.courses = [course, ...state.courses];
    state.selectedCourseId = course.id;
    form.reset();
    persist("Course saved.");
  }

  if (form.dataset.form === "start-round") {
    const courseId = String(data.get("courseId") || state.selectedCourseId);
    const players = [0, 1, 2, 3]
      .map((index) => ({
        id: `player-${index + 1}`,
        name: String(data.get(`playerName${index}`) || "").trim(),
        teeId: String(data.get(`playerTee${index}`) || "white")
      }))
      .filter((player, index) => player.name || index === 0)
      .map((player, index) => ({
        ...player,
        name: player.name || "Me",
        id: `player-${index + 1}`
      }));
    startRound(courseId, players);
  }

  if (form.dataset.form === "bag") {
    state.clubs = state.clubs.map((club) => ({
      ...club,
      carryYards: clamp(Number(data.get(club.id) || club.carryYards), 0, 400)
    }));
    persist("Bag saved.");
  }
}

function handleInput(event) {
  if (event.target.matches("[data-action='course-search']")) {
    const cursor = event.target.selectionStart;
    courseSearchQuery = event.target.value;
    render();
    window.requestAnimationFrame(() => {
      const input = document.querySelector("[data-action='course-search']");
      input?.focus();
      if (typeof cursor === "number") {
        input?.setSelectionRange(cursor, cursor);
      }
    });
    return;
  }
  if (event.target.matches("[data-action='club-select']")) {
    updateClub(event.target);
  }
}

function handleChange(event) {
  if (event.target.matches("[data-action='setup-course']")) {
    state.selectedCourseId = event.target.value;
    saveState(state);
    render();
  }
  if (event.target.matches("[data-action='entry-check']")) {
    updateEntryCheck(event.target);
  }
  if (event.target.matches("[data-action='club-select']")) {
    updateClub(event.target);
  }
  if (event.target.matches("[data-action='course-photo-file']")) {
    const file = event.target.files?.[0];
    if (file) {
      storeCoursePhotoSource(file, event.target.dataset.courseId);
      event.target.value = "";
    }
  }
}

function handleAzureTileLoad(event) {
  const tile = event.target.closest?.("[data-azure-tile]");
  if (!tile) {
    return;
  }
  tile.dataset.loaded = "1";
  updateAzureTileStatus(tile.closest("[data-azure-tile-layer]"));
}

function handleAzureTileError(event) {
  const tile = event.target.closest?.("[data-azure-tile]");
  if (!tile) {
    return;
  }
  tile.dataset.error = "1";
  updateAzureTileStatus(tile.closest("[data-azure-tile-layer]"));
}

function updateAzureTileStatus(layer) {
  if (!layer) {
    return;
  }
  const tiles = Array.from(layer.querySelectorAll("[data-azure-tile]"));
  const loaded = tiles.filter((tile) => tile.dataset.loaded === "1").length;
  const failed = tiles.filter((tile) => tile.dataset.error === "1").length;
  const status = layer.querySelector("[data-azure-map-status]");
  layer.classList.toggle("loaded", loaded > 0);
  layer.classList.toggle("failed", !loaded && failed > 0 && failed === tiles.length);
  if (status) {
    status.textContent = !loaded && failed > 0 ? "Satellite unavailable" : "Loading satellite";
  }
}

function handleAzurePlanningClick(event) {
  if (photoEditMode || gpsTestMoveMode || event.defaultPrevented) {
    return;
  }
  if (event.target.closest("[data-action], [data-gps-test-marker], button, input, label, .photo-hole-badge, .photo-align-toolbar, .photo-yardage-card, .photo-tap-hint, .photo-club-panel, .photo-zoom-toolbar")) {
    return;
  }
  const panel = event.target.closest(".azure-hole");
  if (!panel) {
    return;
  }
  const course = getCourse(state, panel.dataset.azureCourseId);
  const hole = course?.holes?.find((item) => item.number === Number(panel.dataset.azureHole));
  const anchors = hole ? azureHoleAnchors(hole, course) : null;
  if (!hole || !anchors) {
    return;
  }
  const point = azureEventToPosition(panel, anchors, photoTargetMarkers(hole.par), event);
  if (!point) {
    return;
  }
  const key = azureShotPlanKey(panel.dataset.azureCourseId, hole.number);
  const existing = azureShotPlans[key]?.points || [];
  azureShotPlans = {
    ...azureShotPlans,
    [key]: {
      points: sortAzurePlanPoints(anchors, [...existing, point]).slice(0, 4)
    }
  };
  render();
}

function handlePhotoPlanningClick(event) {
  if (suppressPhotoPlanningClick) {
    suppressPhotoPlanningClick = false;
    event.preventDefault();
    return;
  }
  if (photoEditMode || gpsTestMoveMode || event.defaultPrevented) {
    return;
  }
  if (event.target.closest("[data-action], [data-photo-handle], [data-gps-test-marker], button, input, label, .photo-hole-badge, .photo-align-toolbar, .photo-yardage-card, .photo-tap-hint, .photo-club-panel, .photo-zoom-toolbar")) {
    return;
  }
  const panel = event.target.closest(".photo-hole");
  const canvas = panel?.querySelector(".photo-hole-canvas");
  if (!panel || !canvas || !coursePhotoSource(canvas.dataset.photoCourseId)) {
    return;
  }
  const sourcePoint = photoEventToSourcePoint(canvas, event);
  if (!sourcePoint) {
    flash("Image is still loading.");
    return;
  }
  const viewPoint = eventToPanelPercent(panel, event);
  const courseId = canvas.dataset.photoCourseId || "";
  const holeNumber = String(canvas.dataset.photoHole || "");
  if (!holeNumber) {
    return;
  }
  const key = photoShotPlanKey(courseId, holeNumber);
  const existing = normalizedPlanSourcePoints(photoShotPlans[key]);
  const course = getCourse(state, courseId);
  const hole = course?.holes?.find((item) => item.number === Number(holeNumber));
  const points = hole
    ? sortPhotoPlanPoints(hole, [...existing, sourcePoint], photoCurrentShotStartPoint(hole))
    : [...existing, sourcePoint].slice(0, 4);
  setPhotoShotPoints(courseId, holeNumber, hole, points, viewPoint);
}

function handlePhotoPointerDown(event) {
  const gpsMarker = event.target.closest("[data-gps-test-marker]");
  if (gpsMarker && gpsTestEnabled() && !photoEditMode) {
    beginGpsTestDrag(event, gpsMarker);
    return;
  }
  const handle = event.target.closest("[data-photo-handle]");
  if (!handle || !photoEditMode) {
    if (!photoEditMode) {
      beginPhotoPlanOrPanDrag(event);
    }
    return;
  }
  const panel = handle.closest(".photo-hole");
  const canvas = panel?.querySelector(".photo-hole-canvas");
  if (!panel || !canvas) {
    return;
  }
  event.preventDefault();
  capturePhotoPointer(handle, event.pointerId);
  photoDrag = {
    field: handle.dataset.photoHandle,
    hole: String(handle.dataset.hole || ""),
    courseId: canvas.dataset.photoCourseId || CRANHAM_COURSE_ID,
    handle,
    panel,
    canvas
  };
  handle.classList.add("dragging");
  movePhotoHandle(event);
}

function handleGpsTestPointerDown(event) {
  if (photoDrag || event.isPrimary === false || Number(event.button || 0) !== 0) {
    return;
  }
  const gpsMarker = event.target.closest("[data-gps-test-marker]");
  if (gpsMarker && gpsTestEnabled() && !photoEditMode) {
    beginGpsTestDrag(event, gpsMarker);
    return;
  }
  if (gpsTestEnabled() && gpsTestMoveMode && !photoEditMode && !event.target.closest("[data-action], button, input, label, .photo-hole-badge, .photo-align-toolbar, .photo-yardage-card, .photo-tap-hint, .photo-club-panel, .photo-zoom-toolbar")) {
    beginGpsTestDragFromTarget(event);
  }
}

function handleGpsTestMouseDown(event) {
  if (photoDrag || event.button !== 0) {
    return;
  }
  const gpsMarker = event.target.closest("[data-gps-test-marker]");
  if (gpsMarker && gpsTestEnabled() && !photoEditMode) {
    beginGpsTestDrag(event, gpsMarker);
    return;
  }
  if (gpsTestEnabled() && gpsTestMoveMode && !photoEditMode && !event.target.closest("[data-action], button, input, label, .photo-hole-badge, .photo-align-toolbar, .photo-yardage-card, .photo-tap-hint, .photo-club-panel, .photo-zoom-toolbar")) {
    beginGpsTestDragFromTarget(event);
  }
}

function beginGpsTestDragFromTarget(event) {
  const panel = event.target.closest(".photo-hole");
  const canvas = panel?.querySelector(".photo-hole-canvas");
  if (!panel || !canvas) {
    return;
  }
  const courseId = canvas.dataset.photoCourseId || "";
  const holeNumber = String(canvas.dataset.photoHole || "");
  const course = getCourse(state, courseId);
  const hole = course?.holes?.find((item) => item.number === Number(holeNumber));
  if (hole) {
    beginGpsTestDragOnHole(event, panel, canvas, courseId, holeNumber, hole);
  }
}

function beginPhotoPlanOrPanDrag(event) {
  if (event.defaultPrevented) {
    return;
  }
  if (event.target.closest("[data-action], [data-gps-test-marker], button, input, label, .photo-hole-badge, .photo-align-toolbar, .photo-yardage-card, .photo-tap-hint, .photo-club-panel, .photo-zoom-toolbar")) {
    return;
  }
  const panel = event.target.closest(".photo-hole");
  const canvas = panel?.querySelector(".photo-hole-canvas");
  if (!panel || !canvas || !coursePhotoSource(canvas.dataset.photoCourseId)) {
    return;
  }
  const courseId = canvas.dataset.photoCourseId || "";
  const holeNumber = String(canvas.dataset.photoHole || "");
  trackPhotoPointer(event, panel, canvas, courseId, holeNumber);
  if (beginPhotoPinchIfReady(event, panel, canvas, courseId, holeNumber)) {
    return;
  }
  const course = getCourse(state, courseId);
  const hole = course?.holes?.find((item) => item.number === Number(holeNumber));
  if (!hole) {
    return;
  }
  if (gpsTestEnabled() && gpsTestMoveMode) {
    beginGpsTestDragOnHole(event, panel, canvas, courseId, holeNumber, hole);
    return;
  }
  const teeInfo = photoPlanningTee(hole);
  const shotPlan = resolvePhotoShotPlan(hole, teeInfo);
  const hit = hitTestPhotoPlanPoint(canvas, shotPlan, event);
  if (hit) {
    beginPhotoShotDrag(event, panel, canvas, courseId, holeNumber, hole, shotPlan, hit);
    return;
  }

  beginPhotoPanDrag(event, panel, canvas, courseId, holeNumber);
}

function beginGpsTestDrag(event, marker) {
  const panel = marker.closest(".photo-hole");
  const canvas = panel?.querySelector(".photo-hole-canvas");
  if (!panel || !canvas) {
    return;
  }
  const course = getCourse(state, canvas.dataset.photoCourseId);
  const hole = course?.holes?.find((item) => item.number === Number(canvas.dataset.photoHole));
  if (!hole) {
    return;
  }
  beginGpsTestDragOnHole(event, panel, canvas, canvas.dataset.photoCourseId || "", String(canvas.dataset.photoHole || ""), hole);
}

function beginGpsTestDragOnHole(event, panel, canvas, courseId, holeNumber, hole) {
  event.preventDefault();
  capturePhotoPointer(panel, event.pointerId);
  suppressPhotoPlanningClick = true;
  photoDrag = {
    type: "gps-test",
    courseId,
    holeNumber,
    hole,
    panel,
    canvas,
    moved: false
  };
  panel.classList.add("dragging-gps-test");
}

function beginPhotoShotDrag(event, panel, canvas, courseId, holeNumber, hole, shotPlan, hit) {
  event.preventDefault();
  capturePhotoPointer(panel, event.pointerId);
  suppressPhotoPlanningClick = true;
  photoDrag = {
    type: "shot",
    index: hit.index,
    hole,
    holeNumber,
    courseId,
    panel,
    canvas,
    points: [...shotPlan.points],
    route: panel.querySelector(".photo-plan-route")
  };
  panel.classList.add("dragging-shot");
  movePhotoPlanPoint(event);
}

function beginPhotoPanDrag(event, panel, canvas, courseId, holeNumber) {
  if (Number(event.button || 0) !== 0 || photoZoomLevel(courseId, holeNumber) <= 1) {
    return;
  }
  capturePhotoPointer(panel, event.pointerId);
  photoDrag = {
    type: "pan",
    courseId,
    holeNumber,
    panel,
    canvas,
    zoom: photoZoomLevel(courseId, holeNumber),
    startX: event.clientX,
    startY: event.clientY,
    startPan: photoPanOffset(courseId, holeNumber),
    latestPan: photoPanOffset(courseId, holeNumber),
    moved: false
  };
}

function handlePhotoPointerMove(event) {
  updateTrackedPhotoPointer(event);
  if (!photoDrag) {
    return;
  }
  if (photoDrag.type === "pinch") {
    movePhotoPinch(event);
    return;
  }
  if (photoDrag.type === "pan") {
    movePhotoPan(event);
    return;
  }
  if (photoDrag.type === "gps-test") {
    moveGpsTestMarker(event);
    return;
  }
  event.preventDefault();
  if (photoDrag.type === "shot") {
    movePhotoPlanPoint(event);
  } else {
    movePhotoHandle(event);
  }
}

function handlePhotoPointerEnd(event) {
  const endedPointer = photoPointers.get(event.pointerId);
  photoPointers.delete(event.pointerId);
  if (!photoDrag) {
    return;
  }
  if (photoDrag.type === "pinch") {
    finishPhotoPinchDrag(event, endedPointer);
    return;
  }
  if (photoDrag.type === "pan") {
    finishPhotoPanDrag(event);
    return;
  }
  if (photoDrag.type === "gps-test") {
    finishGpsTestDrag(event);
    return;
  }
  event.preventDefault();
  if (photoDrag.type === "shot") {
    finishPhotoPlanDrag(event);
    return;
  }
  const sourcePoint = photoEventToSourcePoint(photoDrag.canvas, event);
  const field = photoDrag.field;
  const hole = photoDrag.hole;
  const courseId = photoDrag.courseId;
  photoDrag.handle.classList.remove("dragging");
  photoDrag = null;

  if (!sourcePoint || !hole || !field) {
    render();
    return;
  }

  const courseCalibrated = setHolePhotoAlignment(courseId, hole, field, sourcePoint);
  flash(courseCalibrated
    ? `Course aligned from Hole ${hole}.`
    : `${field === "green" ? "Green" : "Tee"} aligned.`);
}

function handlePhotoWheel(event) {
  if (handlePlayHorizontalWheel(event)) {
    return;
  }
  if (photoEditMode) {
    return;
  }
  const panel = event.target.closest(".photo-hole");
  const canvas = panel?.querySelector(".photo-hole-canvas");
  if (!panel || !canvas) {
    return;
  }
  if (Math.abs(event.deltaY) < 1) {
    return;
  }
  const direction = event.deltaY < 0 ? 1 : -1;
  if (!direction) {
    return;
  }
  event.preventDefault();
  updatePhotoZoomValue(canvas.dataset.photoCourseId, canvas.dataset.photoHole, direction);
}

function handleHoleSwipePointerDown(event) {
  if (!isActiveRoundView() || scoreCardOpen || photoEditMode || event.isPrimary === false) {
    return;
  }
  if (Number(event.button || 0) !== 0) {
    return;
  }
  if (!event.target.closest("[data-play-round]")) {
    return;
  }
  if (event.target.closest("[data-action], [data-gps-test-marker], button, input, select, label, a, summary, .score-card-backdrop, .photo-align-toolbar, .photo-zoom-toolbar, .photo-yardage-card, .photo-clear-shot, .photo-club-panel")) {
    return;
  }

  const photoPanel = event.target.closest(".photo-hole");
  const canvas = photoPanel?.querySelector(".photo-hole-canvas");
  if (canvas && photoZoomLevel(canvas.dataset.photoCourseId, canvas.dataset.photoHole) > 1) {
    return;
  }

  holeSwipe = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    latestX: event.clientX,
    latestY: event.clientY
  };
}

function handleHoleSwipePointerMove(event) {
  if (!holeSwipe || event.pointerId !== holeSwipe.pointerId) {
    return;
  }
  holeSwipe.latestX = event.clientX;
  holeSwipe.latestY = event.clientY;
  const dx = event.clientX - holeSwipe.startX;
  const dy = event.clientY - holeSwipe.startY;
  if (Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 1.1) {
    event.preventDefault();
  }
}

function handleHoleSwipePointerEnd(event) {
  if (!holeSwipe || event.pointerId !== holeSwipe.pointerId) {
    return;
  }
  const swipe = holeSwipe;
  holeSwipe = null;

  if (event.defaultPrevented || photoDrag) {
    return;
  }

  const endX = event.clientX || swipe.latestX;
  const endY = event.clientY || swipe.latestY;
  const dx = endX - swipe.startX;
  const dy = endY - swipe.startY;
  if (Math.abs(dx) < HOLE_SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * HOLE_SWIPE_VERTICAL_RATIO) {
    return;
  }

  event.preventDefault();
  suppressPhotoPlanningClick = true;
  moveHole(dx < 0 ? 1 : -1);
  window.setTimeout(() => {
    suppressPhotoPlanningClick = false;
  }, 250);
}

function cancelHoleSwipe(event) {
  if (!holeSwipe || !event || event.pointerId === holeSwipe.pointerId) {
    holeSwipe = null;
  }
}

function handlePlayHorizontalWheel(event) {
  if (!isActiveRoundView() || scoreCardOpen || photoEditMode) {
    return false;
  }
  const absX = Math.abs(event.deltaX);
  const absY = Math.abs(event.deltaY);
  if (absX < 24 || absX < absY * 1.2) {
    return false;
  }

  event.preventDefault();
  const now = Date.now();
  if (now - wheelHoleNavigationAt < 520) {
    return true;
  }
  wheelHoleNavigationAt = now;
  moveHole(event.deltaX > 0 ? 1 : -1);
  return true;
}

function finishPhotoPlanDrag(event) {
  const sourcePoint = photoEventToSourcePoint(photoDrag.canvas, event) || photoDrag.latestSourcePoint;
  const courseId = photoDrag.courseId;
  const holeNumber = photoDrag.holeNumber;
  const hole = photoDrag.hole;
  const index = photoDrag.index;
  const points = [...photoDrag.points];
  photoDrag.panel.classList.remove("dragging-shot");
  photoDrag = null;
  window.setTimeout(() => {
    suppressPhotoPlanningClick = false;
  }, 250);

  if (!sourcePoint || !hole || !holeNumber || index < 0) {
    render();
    return;
  }

  points[index] = sourcePoint;
  setPhotoShotPoints(courseId, holeNumber, hole, points);
}

function moveGpsTestMarker(event) {
  event.preventDefault();
  const sourcePoint = photoEventToSourcePoint(photoDrag.canvas, event);
  if (!sourcePoint) {
    return;
  }
  const position = photoSourcePointToGeo(photoDrag.courseId, photoDrag.hole, sourcePoint);
  if (!position) {
    return;
  }
  photoDrag.moved = true;
  applyGpsPosition(position, 3, true, sourcePoint, photoDrag.courseId, photoDrag.holeNumber);
}

function finishGpsTestDrag(event) {
  event.preventDefault();
  const drag = photoDrag;
  if (!drag.moved) {
    moveGpsTestMarker(event);
  }
  photoDrag = null;
  drag.panel.classList.remove("dragging-gps-test");
  window.setTimeout(() => {
    suppressPhotoPlanningClick = false;
  }, 250);
}

function movePhotoHandle(event) {
  const point = eventToPanelPercent(photoDrag.panel, event);
  photoDrag.handle.style.left = `${point.x}%`;
  photoDrag.handle.style.top = `${point.y}%`;
}

function movePhotoPlanPoint(event) {
  const sourcePoint = photoEventToSourcePoint(photoDrag.canvas, event);
  const viewPoint = photoEventToViewPoint(photoDrag.canvas, event);
  if (!sourcePoint || !viewPoint) {
    return;
  }
  photoDrag.latestSourcePoint = sourcePoint;
  updatePhotoPlanRouteDom(photoDrag.panel, photoDrag.index, viewPoint);
}

function movePhotoPan(event) {
  const distance = Math.hypot(event.clientX - photoDrag.startX, event.clientY - photoDrag.startY);
  if (distance < 5 && !photoDrag.moved) {
    return;
  }
  event.preventDefault();
  photoDrag.moved = true;
  const rect = photoDrag.panel.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return;
  }
  const nextPan = clampPhotoPan({
    x: photoDrag.startPan.x + ((event.clientX - photoDrag.startX) / rect.width) * 100,
    y: photoDrag.startPan.y + ((event.clientY - photoDrag.startY) / rect.height) * 100
  }, photoDrag.zoom);
  photoDrag.latestPan = nextPan;
  const layer = photoDrag.panel.querySelector(".photo-pan-layer");
  if (layer) {
    layer.style.transform = photoPanTransform(nextPan);
  }
  photoDrag.panel.classList.add("panning-photo");
}

function finishPhotoPanDrag(event) {
  const drag = photoDrag;
  photoDrag = null;
  drag.panel.classList.remove("panning-photo");
  if (!drag.moved) {
    return;
  }
  event.preventDefault();
  setPhotoPanOffset(drag.courseId, drag.holeNumber, drag.latestPan, drag.zoom);
  suppressPhotoPlanningClick = true;
  window.setTimeout(() => {
    suppressPhotoPlanningClick = false;
  }, 250);
}

function capturePhotoPointer(element, pointerId) {
  try {
    element.setPointerCapture?.(pointerId);
  } catch {
    // Some browsers release touch pointers before synthetic or interrupted events finish.
  }
}

function trackPhotoPointer(event, panel, canvas, courseId, holeNumber) {
  if (event.pointerType !== "touch") {
    return;
  }
  photoPointers.set(event.pointerId, {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    panel,
    canvas,
    courseId,
    holeNumber
  });
}

function updateTrackedPhotoPointer(event) {
  const pointer = photoPointers.get(event.pointerId);
  if (!pointer) {
    return;
  }
  photoPointers.set(event.pointerId, {
    ...pointer,
    x: event.clientX,
    y: event.clientY
  });
}

function beginPhotoPinchIfReady(event, panel, canvas, courseId, holeNumber) {
  const pointers = activePhotoPointers(panel);
  if (pointers.length < 2) {
    return false;
  }
  event.preventDefault();
  suppressPhotoPlanningClick = true;
  const pair = pointers.slice(0, 2);
  const metrics = photoPointerPairMetrics(pair);
  const zoom = photoZoomLevel(courseId, holeNumber);
  capturePhotoPointer(panel, pair[0].pointerId);
  capturePhotoPointer(panel, pair[1].pointerId);
  panel.classList.remove("panning-photo");
  photoDrag = {
    type: "pinch",
    courseId,
    holeNumber,
    panel,
    canvas,
    startDistance: metrics.distance,
    startCenter: metrics.center,
    startZoom: zoom,
    latestZoom: zoom,
    startPan: photoPanOffset(courseId, holeNumber, zoom),
    latestPan: photoPanOffset(courseId, holeNumber, zoom),
    moved: false
  };
  panel.classList.add("pinching-photo");
  return true;
}

function movePhotoPinch(event) {
  const pointers = activePhotoPointers(photoDrag.panel);
  if (pointers.length < 2) {
    return;
  }
  event.preventDefault();
  const metrics = photoPointerPairMetrics(pointers.slice(0, 2));
  const rect = photoDrag.panel.getBoundingClientRect();
  if (!rect.width || !rect.height || !photoDrag.startDistance) {
    return;
  }
  const zoom = Number(clamp(photoDrag.startZoom * (metrics.distance / photoDrag.startDistance), PHOTO_MIN_ZOOM, PHOTO_MAX_ZOOM).toFixed(2));
  const nextPan = clampPhotoPan({
    x: photoDrag.startPan.x + ((metrics.center.x - photoDrag.startCenter.x) / rect.width) * 100,
    y: photoDrag.startPan.y + ((metrics.center.y - photoDrag.startCenter.y) / rect.height) * 100
  }, zoom);
  photoDrag.latestZoom = zoom;
  photoDrag.latestPan = nextPan;
  photoDrag.moved = true;
  setPhotoLayerTransforms(photoDrag.panel, zoom, nextPan);
}

function finishPhotoPinchDrag(event) {
  if (activePhotoPointers(photoDrag.panel).length >= 2) {
    return;
  }
  event.preventDefault();
  const drag = photoDrag;
  photoDrag = null;
  drag.panel.classList.remove("pinching-photo");
  const key = photoZoomKey(drag.courseId, drag.holeNumber);
  photoZoomLevels = {
    ...photoZoomLevels,
    [key]: drag.latestZoom
  };
  photoPanOffsets = {
    ...photoPanOffsets,
    [key]: drag.latestZoom > 1 ? clampPhotoPan(drag.latestPan, drag.latestZoom) : { x: 0, y: 0 }
  };
  window.setTimeout(() => {
    suppressPhotoPlanningClick = false;
  }, 250);
  render();
}

function activePhotoPointers(panel) {
  return Array.from(photoPointers.values()).filter((pointer) => pointer.panel === panel);
}

function photoPointerPairMetrics(pair) {
  const [a, b] = pair;
  return {
    distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
    center: {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2
    }
  };
}

function setPhotoLayerTransforms(panel, zoom, pan) {
  const panLayer = panel.querySelector(".photo-pan-layer");
  const zoomLayer = panel.querySelector(".photo-zoom-layer");
  if (panLayer) {
    panLayer.style.transform = photoPanTransform(pan);
  }
  if (zoomLayer) {
    zoomLayer.style.transform = `scale(${zoom})`;
  }
}

function hitTestPhotoPlanPoint(canvas, shotPlan, event) {
  const pointer = photoEventToViewPoint(canvas, event);
  const viewPoints = shotPlan?.viewPoints || [];
  if (!pointer || !viewPoints.length) {
    return null;
  }

  const best = viewPoints.reduce((closest, point, index) => {
    const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
    return distance < closest.distance ? { index, distance } : closest;
  }, { index: -1, distance: Infinity });

  return best.distance <= 5.6 ? best : null;
}

function updatePhotoPlanRouteDom(panel, index, point) {
  const route = panel.querySelector(".photo-plan-route");
  const marker = panel.querySelector(`[data-photo-plan-point="${index}"]`);
  const cross = panel.querySelector(`[data-photo-plan-cross="${index}"]`);
  if (route?.points?.[index + 1]) {
    route.points[index + 1].x = point.x;
    route.points[index + 1].y = point.y;
  }
  if (marker) {
    marker.setAttribute("cx", point.x);
    marker.setAttribute("cy", point.y);
  }
  if (cross) {
    cross.setAttribute("d", `M ${point.x - 1.4} ${point.y} L ${point.x + 1.4} ${point.y} M ${point.x} ${point.y - 1.4} L ${point.x} ${point.y + 1.4}`);
  }
}

function photoEventToViewPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }
  return {
    x: Number(clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100).toFixed(2)),
    y: Number(clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100).toFixed(2))
  };
}

function eventToPanelPercent(panel, event) {
  const rect = panel.getBoundingClientRect();
  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100, 4, 96),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100, 4, 96)
  };
}

function startRound(courseId, teeId = "") {
  const course = getCourse(state, courseId);
  if (!course) {
    return;
  }
  const tee = teeId || course.tees?.[0]?.id || "white";
  const round = createRound(course, tee);
  state.rounds = [round, ...state.rounds];
  state.activeRoundId = round.id;
  state.selectedCourseId = course.id;
  view = "play";
  window.location.hash = "play";
  persist("Round started.");
}

function openRoundSetup(courseId) {
  state.selectedCourseId = courseId;
  state.activeRoundId = "";
  view = "play";
  window.location.hash = "play";
  persist("Course ready.");
}

function updateEntryStep(button) {
  const round = getActiveRound(state);
  if (!round) {
    return;
  }
  const entry = getRoundEntry(round, Number(button.dataset.hole));
  const playerEntry = button.dataset.playerId
    ? getPlayerEntry(round, Number(button.dataset.hole), button.dataset.playerId)
    : entry;
  const field = button.dataset.field;
  const delta = Number(button.dataset.delta);
  const min = Number(button.dataset.min);
  const max = Number(button.dataset.max);
  playerEntry[field] = clamp(Number(playerEntry[field] || 0) + delta, min, max);
  persistScoreEntry();
}

function updateEntryValue(button) {
  const round = getActiveRound(state);
  if (!round) {
    return;
  }
  const entry = getRoundEntry(round, Number(button.dataset.hole));
  const playerEntry = button.dataset.playerId
    ? getPlayerEntry(round, Number(button.dataset.hole), button.dataset.playerId)
    : entry;
  playerEntry[button.dataset.field] = button.dataset.value;
  persistScoreEntry();
}

function updateEntryCheck(input) {
  const round = getActiveRound(state);
  if (!round) {
    return;
  }
  const entry = getRoundEntry(round, Number(input.dataset.hole));
  const playerEntry = input.dataset.playerId
    ? getPlayerEntry(round, Number(input.dataset.hole), input.dataset.playerId)
    : entry;
  playerEntry[input.dataset.field] = input.checked;
  persistScoreEntry();
}

function updateClub(select) {
  const round = getActiveRound(state);
  if (!round) {
    return;
  }
  const entry = getRoundEntry(round, Number(select.dataset.hole));
  const playerEntry = select.dataset.playerId
    ? getPlayerEntry(round, Number(select.dataset.hole), select.dataset.playerId)
    : entry;
  playerEntry.teeClubId = select.value;
  persistScoreEntry();
}

function moveHole(delta) {
  const round = getActiveRound(state);
  const course = round ? getCourse(state, round.courseId) : null;
  if (!round || !course) {
    return;
  }
  const previousHole = round.currentHole;
  round.currentHole = clamp(round.currentHole + delta, 1, course.holes.length);
  if (delta > 0 && previousHole === course.holes.length) {
    scoreCardOpen = false;
  }
  persist();
}

function finishRound() {
  const round = getActiveRound(state);
  if (!round) {
    return;
  }
  round.status = "complete";
  round.completedAt = new Date().toISOString();
  state.activeRoundId = "";
  view = "stats";
  window.location.hash = "stats";
  persist("Round saved.");
}

async function importNearbyCourses() {
  if (!navigator.geolocation) {
    flash("GPS is not available in this browser.");
    return;
  }
  flash("Finding courses near you...");
  try {
    const position = await getCurrentPosition();
    const courses = await findNearbyOsmCourses(
      { lat: position.coords.latitude, lng: position.coords.longitude },
      25000
    );
    mergeImportedCourses(courses, "");
  } catch (error) {
    flash(error.message || "Could not import nearby courses.");
  }
}

async function importHomeAreaCourses() {
  flash(`Refreshing ${homeArea.label} courses...`);
  try {
    const courses = await findNearbyOsmCourses(homeArea.center, homeArea.radiusMeters);
    mergeImportedCourses(
      courses.map((course) => ({ ...course, homeAreaId: homeArea.id })),
      homeArea.label
    );
  } catch (error) {
    flash(error.message || `Could not refresh ${homeArea.label} courses.`);
  }
}

function mergeImportedCourses(courses, label) {
  const namedCourses = courses.filter((course) => course.name !== "Unnamed golf course");
  const knownIds = new Set(state.courses.map((course) => course.id));
  const fresh = namedCourses.filter((course) => !knownIds.has(course.id));
  const updates = new Map(namedCourses.map((course) => [course.id, course]));
  state.courses = [
    ...fresh,
    ...state.courses.map((course) => (updates.has(course.id) ? { ...course, ...updates.get(course.id) } : course))
  ].sort(compareCourses);
  if (fresh[0]) {
    state.selectedCourseId = fresh[0].id;
  }
  const area = label ? `${label}: ` : "";
  persist(fresh.length ? `${area}imported ${fresh.length} courses.` : `${area}no new courses found.`);
}

function compareCourses(a, b) {
  const aDistance = typeof a.distanceMiles === "number" ? a.distanceMiles : 999;
  const bDistance = typeof b.distanceMiles === "number" ? b.distanceMiles : 999;
  if (aDistance !== bDistance) {
    return aDistance - bDistance;
  }
  return a.name.localeCompare(b.name);
}

function startGps() {
  if (gpsTestEnabled()) {
    const round = getActiveRound(state);
    const course = round ? getCourse(state, round.courseId) : getCourse(state, state.selectedCourseId);
    const hole = course?.holes?.find((item) => item.number === round?.currentHole) || course?.holes?.[0];
    const sourcePoint = hole?.visual?.photo ? gpsTestPhotoSourcePoint(hole, "tee") : null;
    const position = gpsTestPositionForHole(hole, course?.id, "tee", sourcePoint);
    if (position) {
      applyGpsPosition(position, 3, true, sourcePoint, course?.id, hole?.number);
      flash("GPS test mode: spoofed to tee.");
      return;
    }
  }
  if (!navigator.geolocation) {
    gps = { ...gps, status: "error", error: "GPS unavailable" };
    render();
    return;
  }
  if (gps.watchId !== null) {
    navigator.geolocation.clearWatch(gps.watchId);
  }
  gps.status = "watching";
  gps.error = "";
  render();
  gps.watchId = navigator.geolocation.watchPosition(
    (position) => {
      applyGpsPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }, position.coords.accuracy);
    },
    (error) => {
      gps.status = "error";
      gps.error = error.message;
      render();
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    }
  );
}

function applyGpsPosition(position, accuracy = 0, spoofed = false, sourcePoint = null, sourceCourseId = "", sourceHoleNumber = "") {
  gps.status = "ready";
  gps.position = {
    lat: position.lat,
    lng: position.lng,
    accuracy,
    spoofed,
    sourcePoint: normalizedPhotoPoint(sourcePoint),
    sourceCourseId,
    sourceHoleNumber
  };
  render();
}

function gpsTestEnabled() {
  return new URLSearchParams(window.location.search).get(GPS_TEST_QUERY_KEY) === "1";
}

function setGpsTestPosition(button) {
  if (!gpsTestEnabled()) {
    return;
  }
  const course = getCourse(state, button.dataset.courseId);
  const hole = course?.holes?.find((item) => item.number === Number(button.dataset.hole));
  const sourcePoint = hole?.visual?.photo ? gpsTestPhotoSourcePoint(hole, button.dataset.point) : null;
  const position = gpsTestPositionForHole(hole, course?.id, button.dataset.point, sourcePoint);
  if (!position) {
    flash("No GPS test point for this hole.");
    return;
  }
  applyGpsPosition(position, 3, true, sourcePoint, course?.id, hole?.number);
}

function gpsTestPositionForHole(hole, courseId, point, sourcePoint = null) {
  if (!hole) {
    return null;
  }
  if (hole.visual?.photo && courseId && sourcePoint) {
    const photoPosition = photoSourcePointToGeo(courseId, hole, sourcePoint);
    if (photoPosition) {
      return photoPosition;
    }
  }
  if (point === "tee" && hole.tee) {
    return hole.tee;
  }
  if (point === "green" && hole.greenCenter) {
    return hole.greenCenter;
  }
  if (hole.tee && hole.greenCenter) {
    return {
      lat: Number(((hole.tee.lat + hole.greenCenter.lat) / 2).toFixed(6)),
      lng: Number(((hole.tee.lng + hole.greenCenter.lng) / 2).toFixed(6))
    };
  }
  return hole.greenCenter || hole.tee || null;
}

function gpsTestPhotoSourcePoint(hole, point) {
  const sourcePoints = photoSourcePoints(hole);
  if (point === "tee") {
    return sourcePoints.tee;
  }
  if (point === "green") {
    return sourcePoints.green;
  }
  return [
    Number(((sourcePoints.tee[0] + sourcePoints.green[0]) / 2).toFixed(3)),
    Number(((sourcePoints.tee[1] + sourcePoints.green[1]) / 2).toFixed(3))
  ];
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 15000
    });
  });
}

function gpsLabel() {
  if (gps.status === "ready") {
    if (gps.position?.spoofed) {
      return "GPS test";
    }
    return gps.position?.accuracy ? `GPS ${Math.round(gps.position.accuracy)}m` : "GPS ready";
  }
  if (gps.status === "watching") {
    return "GPS...";
  }
  if (gps.status === "error") {
    return "GPS error";
  }
  return "GPS";
}

function queuePhotoCanvasRender() {
  const token = photoRenderId + 1;
  photoRenderId = token;
  window.requestAnimationFrame(() => {
    renderPhotoCanvases(token);
  });
}

async function renderPhotoCanvases(token) {
  const canvases = Array.from(document.querySelectorAll("[data-photo-hole]"));
  if (!canvases.length) {
    return;
  }

  await Promise.all(canvases.map(async (canvas) => {
    const source = coursePhotoSource(canvas.dataset.photoCourseId);
    if (!source) {
      return;
    }
    try {
      const image = await getCoursePhotoImage(source);
      if (token === photoRenderId) {
        drawPhotoCanvas(canvas, image);
      }
    } catch {
      coursePhotoImages.delete(source);
    }
  }));
}

function getCoursePhotoImage(source) {
  if (!source) {
    return Promise.reject(new Error("No course image source."));
  }
  const cached = coursePhotoImages.get(source);
  if (cached) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      coursePhotoImages.set(source, image);
      resolve(image);
    };
    image.onerror = reject;
    image.src = source;
  });
}

function photoCanvasMetrics(canvas) {
  const screenRect = canvas.getBoundingClientRect();
  const zoom = Number(canvas.dataset.photoZoom || 1) || 1;
  return {
    screenRect,
    width: canvas.offsetWidth || (zoom ? screenRect.width / zoom : screenRect.width),
    height: canvas.offsetHeight || (zoom ? screenRect.height / zoom : screenRect.height)
  };
}

function drawPhotoCanvas(canvas, image) {
  const metrics = photoCanvasMetrics(canvas);
  if (!metrics.width || !metrics.height) {
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(metrics.width * dpr);
  const height = Math.round(metrics.height * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const cssWidth = metrics.width;
  const cssHeight = metrics.height;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);

  const tee = [
    (Number(canvas.dataset.teeX) / 100) * image.naturalWidth,
    (Number(canvas.dataset.teeY) / 100) * image.naturalHeight
  ];
  const green = [
    (Number(canvas.dataset.greenX) / 100) * image.naturalWidth,
    (Number(canvas.dataset.greenY) / 100) * image.naturalHeight
  ];
  const vector = {
    x: green[0] - tee[0],
    y: green[1] - tee[1]
  };
  const sourceDistance = Math.max(1, Math.hypot(vector.x, vector.y));
  const par = Number(canvas.dataset.par || 4);
  const target = {
    teeX: cssWidth * 0.5,
    teeY: cssHeight * 0.82,
    greenX: cssWidth * 0.5,
    greenY: cssHeight * ((82 - photoTargetDistancePct(par)) / 100)
  };
  const targetDistance = target.teeY - target.greenY;
  const scale = targetDistance / sourceDistance;
  const rotation = -Math.PI / 2 - Math.atan2(vector.y, vector.x);
  const focusWidth = cssWidth * (par === 3 ? 0.62 : par === 5 ? 0.76 : 0.68);

  drawTransformedPhoto(context, image, tee, target, rotation, scale, "brightness(66%) saturate(88%)");
  context.save();
  createHoleFocusPath(context, cssWidth, cssHeight, target, focusWidth);
  context.clip();
  drawTransformedPhoto(context, image, tee, target, rotation, scale, "none");
  context.restore();

  const fade = context.createLinearGradient(0, 0, 0, cssHeight);
  fade.addColorStop(0, "rgba(6, 18, 15, 0.32)");
  fade.addColorStop(0.25, "rgba(6, 18, 15, 0)");
  fade.addColorStop(0.72, "rgba(6, 18, 15, 0)");
  fade.addColorStop(1, "rgba(6, 18, 15, 0.42)");
  context.fillStyle = fade;
  context.fillRect(0, 0, cssWidth, cssHeight);
}

function photoEventToSourcePoint(canvas, event) {
  const image = loadedPhotoImageForCourse(canvas.dataset.photoCourseId);
  if (!image) {
    return null;
  }
  const metrics = photoCanvasMetrics(canvas);
  if (!metrics.width || !metrics.height || !metrics.screenRect.width || !metrics.screenRect.height) {
    return null;
  }

  const point = {
    x: clamp(((event.clientX - metrics.screenRect.left) / metrics.screenRect.width) * metrics.width, 0, metrics.width),
    y: clamp(((event.clientY - metrics.screenRect.top) / metrics.screenRect.height) * metrics.height, 0, metrics.height)
  };
  const tee = [
    (Number(canvas.dataset.teeX) / 100) * image.naturalWidth,
    (Number(canvas.dataset.teeY) / 100) * image.naturalHeight
  ];
  const green = [
    (Number(canvas.dataset.greenX) / 100) * image.naturalWidth,
    (Number(canvas.dataset.greenY) / 100) * image.naturalHeight
  ];
  const vector = {
    x: green[0] - tee[0],
    y: green[1] - tee[1]
  };
  const sourceDistance = Math.max(1, Math.hypot(vector.x, vector.y));
  const par = Number(canvas.dataset.par || 4);
  const target = {
    teeX: metrics.width * 0.5,
    teeY: metrics.height * 0.82,
    greenY: metrics.height * ((82 - photoTargetDistancePct(par)) / 100)
  };
  const scale = (target.teeY - target.greenY) / sourceDistance;
  const rotation = -Math.PI / 2 - Math.atan2(vector.y, vector.x);
  const dx = point.x - target.teeX;
  const dy = point.y - target.teeY;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const sourceX = tee[0] + (cos * dx + sin * dy) / scale;
  const sourceY = tee[1] + (-sin * dx + cos * dy) / scale;

  return [
    Number(clamp((sourceX / image.naturalWidth) * 100, 0, 100).toFixed(3)),
    Number(clamp((sourceY / image.naturalHeight) * 100, 0, 100).toFixed(3))
  ];
}

function drawTransformedPhoto(context, image, tee, target, rotation, scale, filter) {
  context.save();
  context.translate(target.teeX, target.teeY);
  context.rotate(rotation);
  context.scale(scale, scale);
  context.translate(-tee[0], -tee[1]);
  context.filter = filter;
  context.drawImage(image, 0, 0);
  context.restore();
}

function createHoleFocusPath(context, width, height, target, focusWidth) {
  const x = width * 0.5 - focusWidth / 2;
  const y = Math.max(0, target.greenY - height * 0.08);
  const h = Math.min(height, target.teeY - target.greenY + height * 0.18);
  roundedRectPath(context, x, y, focusWidth, h, focusWidth / 2);
  context.moveTo(width * 0.5 + focusWidth * 0.25, target.greenY);
  context.arc(width * 0.5, target.greenY, focusWidth * 0.34, 0, Math.PI * 2);
  context.moveTo(width * 0.5 + focusWidth * 0.2, target.teeY);
  context.arc(width * 0.5, target.teeY, focusWidth * 0.26, 0, Math.PI * 2);
}

function roundedRectPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function coursePhotoSource(courseId) {
  const custom = coursePhotoSources[courseId] || "";
  if (custom) {
    return custom;
  }
  const course = getCourse(state, courseId);
  return course?.photoSource?.url || "";
}

function loadedPhotoImageForCourse(courseId) {
  const source = coursePhotoSource(courseId);
  return source ? coursePhotoImages.get(source) || null : null;
}

function courseHolePhotoEdits(courseId) {
  return coursePhotoEdits[courseId] || {};
}

function loadCoursePhotoSources() {
  const sources = {};
  PHOTO_COURSE_IDS.forEach((courseId) => {
    const source = readLocalStorage(coursePhotoSourceKey(courseId), "");
    if (source) {
      sources[courseId] = source;
    }
  });
  return sources;
}

function loadCoursePhotoEdits() {
  const edits = {};
  PHOTO_COURSE_IDS.forEach((courseId) => {
    const value = readLocalStorage(coursePhotoEditKey(courseId), null, true);
    if (value && typeof value === "object") {
      edits[courseId] = value;
    }
  });
  return edits;
}

function readLocalStorage(key, fallback, parseJson = false) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return parseJson ? JSON.parse(raw) : raw;
  } catch {
    return fallback;
  }
}

function coursePhotoSourceKey(courseId) {
  return courseId === CRANHAM_COURSE_ID ? CRANHAM_PHOTO_KEY : `pinscope:course-photo:${courseId}:v1`;
}

function coursePhotoEditKey(courseId) {
  return courseId === CRANHAM_COURSE_ID ? CRANHAM_PHOTO_EDIT_KEY : `pinscope:course-photo-edits:${courseId}:v2`;
}

function saveCoursePhotoEdits(courseId) {
  try {
    localStorage.setItem(coursePhotoEditKey(courseId), JSON.stringify(courseHolePhotoEdits(courseId)));
  } catch {
    // Alignment still works for the current session if storage is full.
  }
}

function setHolePhotoAlignment(courseId, holeNumber, field, sourcePoint) {
  const key = String(holeNumber || "");
  const point = normalizedPhotoPoint(sourcePoint);
  if (!courseId || !key || !point || !["tee", "green"].includes(field)) {
    return false;
  }
  const edits = courseHolePhotoEdits(courseId);
  const course = getCourse(state, courseId);
  const hole = course?.holes?.find((item) => item.number === Number(key));
  const currentPoints = hole?.visual?.photo ? photoSourcePoints(hole) : null;
  const nextHoleEdit = {
    ...(edits[key] || {}),
    tee: currentPoints?.tee,
    green: currentPoints?.green,
    courseCalibrationGenerated: false,
    [field]: point
  };
  const nextEdits = { [key]: nextHoleEdit };
  const calibration = createCoursePhotoCalibration(courseId, key, nextHoleEdit);
  if (calibration) {
    Object.assign(nextEdits, coursePhotoAlignmentEdits(course, key, calibration, nextHoleEdit));
  } else {
    Object.keys(edits).forEach((editKey) => {
      if (editKey !== key && editKey !== PHOTO_COURSE_CALIBRATION_KEY) {
        nextEdits[editKey] = edits[editKey];
      }
    });
  }
  coursePhotoEdits = {
    ...coursePhotoEdits,
    [courseId]: nextEdits
  };
  saveCoursePhotoEdits(courseId);
  return Boolean(calibration);
}

function coursePhotoAlignmentEdits(course, sourceHoleKey, calibration, sourceHoleEdit) {
  const nextEdits = {
    [PHOTO_COURSE_CALIBRATION_KEY]: calibration,
    [sourceHoleKey]: {
      ...sourceHoleEdit,
      courseCalibrationGenerated: false
    }
  };
  (course?.holes || []).forEach((hole) => {
    const key = String(hole.number || "");
    if (!key || key === sourceHoleKey || !hole.visual?.photo) {
      return;
    }
    const base = basePhotoSourcePoints(hole);
    nextEdits[key] = {
      tee: transformPhotoPoint(calibration.transform, base.tee),
      green: transformPhotoPoint(calibration.transform, base.green),
      courseCalibrationGenerated: true,
      courseCalibrationSourceHole: Number(sourceHoleKey)
    };
  });
  return nextEdits;
}

function createCoursePhotoCalibration(courseId, holeNumber, holeEdit) {
  const tee = normalizedPhotoPoint(holeEdit?.tee);
  const green = normalizedPhotoPoint(holeEdit?.green);
  if (!tee || !green) {
    return null;
  }
  const course = getCourse(state, courseId);
  const hole = course?.holes?.find((item) => item.number === Number(holeNumber));
  if (!hole?.visual?.photo) {
    return null;
  }
  const base = basePhotoSourcePoints(hole);
  const transform = photoSimilarityTransform(base, { tee, green });
  if (!transform) {
    return null;
  }
  return {
    version: 1,
    sourceHole: Number(holeNumber),
    transform,
    base,
    target: { tee, green },
    updatedAt: new Date().toISOString()
  };
}

function photoSimilarityTransform(source, target) {
  const sourceTee = normalizedPhotoPoint(source?.tee);
  const sourceGreen = normalizedPhotoPoint(source?.green);
  const targetTee = normalizedPhotoPoint(target?.tee);
  const targetGreen = normalizedPhotoPoint(target?.green);
  if (!sourceTee || !sourceGreen || !targetTee || !targetGreen) {
    return null;
  }
  const sx = sourceGreen[0] - sourceTee[0];
  const sy = sourceGreen[1] - sourceTee[1];
  const tx = targetGreen[0] - targetTee[0];
  const ty = targetGreen[1] - targetTee[1];
  const sourceLengthSquared = sx * sx + sy * sy;
  const targetLength = Math.hypot(tx, ty);
  if (sourceLengthSquared < 0.01 || targetLength < 0.1) {
    return null;
  }
  const a = (tx * sx + ty * sy) / sourceLengthSquared;
  const b = (ty * sx - tx * sy) / sourceLengthSquared;
  const originX = targetTee[0] - (a * sourceTee[0] - b * sourceTee[1]);
  const originY = targetTee[1] - (b * sourceTee[0] + a * sourceTee[1]);
  return {
    a: Number(a.toFixed(8)),
    b: Number(b.toFixed(8)),
    tx: Number(originX.toFixed(8)),
    ty: Number(originY.toFixed(8))
  };
}

function resetCourseHoleAlignment(courseId, holeNumber) {
  const key = String(holeNumber || "");
  const edits = courseHolePhotoEdits(courseId);
  const calibration = photoCourseCalibration(courseId);
  const removesCourseCalibration = calibration?.sourceHole === Number(key);
  if (!courseId || !key || (!edits[key] && !removesCourseCalibration)) {
    return;
  }
  const next = { ...edits };
  delete next[key];
  if (removesCourseCalibration) {
    delete next[PHOTO_COURSE_CALIBRATION_KEY];
  }
  coursePhotoEdits = {
    ...coursePhotoEdits,
    [courseId]: next
  };
  saveCoursePhotoEdits(courseId);
  flash(removesCourseCalibration ? "Hole and course alignment reset." : "Alignment reset.");
}

function resetCoursePhotoCalibration(courseId) {
  const edits = courseHolePhotoEdits(courseId);
  if (!courseId || !edits[PHOTO_COURSE_CALIBRATION_KEY]) {
    return;
  }
  const next = { ...edits };
  delete next[PHOTO_COURSE_CALIBRATION_KEY];
  Object.keys(next).forEach((key) => {
    if (next[key]?.courseCalibrationGenerated) {
      delete next[key];
    }
  });
  coursePhotoEdits = {
    ...coursePhotoEdits,
    [courseId]: next
  };
  saveCoursePhotoEdits(courseId);
  flash("Course alignment reset.");
}

function clearPhotoShotPlan(courseId, holeNumber) {
  const key = photoShotPlanKey(courseId, holeNumber);
  if (!key || !photoShotPlans[key]) {
    return;
  }
  const next = { ...photoShotPlans };
  delete next[key];
  photoShotPlans = next;
  render();
}

function photoPanTransform(pan) {
  return `translate3d(${pan.x}%, ${pan.y}%, 0)`;
}

function photoPanOffset(courseId, holeNumber, zoom = photoZoomLevel(courseId, holeNumber)) {
  const value = photoPanOffsets[photoZoomKey(courseId, holeNumber)] || { x: 0, y: 0 };
  return clampPhotoPan(value, zoom);
}

function setPhotoPanOffset(courseId, holeNumber, pan, zoom = photoZoomLevel(courseId, holeNumber)) {
  const key = photoZoomKey(courseId, holeNumber);
  const nextPan = clampPhotoPan(pan, zoom);
  photoPanOffsets = {
    ...photoPanOffsets,
    [key]: nextPan
  };
  render();
}

function clampPhotoPan(pan, zoom) {
  const max = Math.max(0, (Number(zoom || 1) - 1) * 50);
  return {
    x: Number(clamp(Number(pan?.x || 0), -max, max).toFixed(2)),
    y: Number(clamp(Number(pan?.y || 0), -max, max).toFixed(2))
  };
}

function setPhotoShotPoints(courseId, holeNumber, hole, sourcePoints, fallbackViewPoint = null) {
  const key = photoShotPlanKey(courseId, holeNumber);
  const points = hole
    ? sortPhotoPlanPoints(hole, sourcePoints, photoCurrentShotStartPoint(hole))
    : sourcePoints.filter((point) => Array.isArray(point)).slice(0, 4);
  if (!key || !points.length) {
    return;
  }
  photoShotPlans = {
    ...photoShotPlans,
    [key]: {
      source: points[0],
      points,
      view: fallbackViewPoint
    }
  };
  render();
}

function photoZoomKey(courseId, holeNumber) {
  return `${courseId || "course"}:${String(holeNumber || "")}`;
}

function photoZoomLevel(courseId, holeNumber) {
  const value = Number(photoZoomLevels[photoZoomKey(courseId, holeNumber)] || 1);
  return Number(clamp(Number.isFinite(value) ? value : 1, PHOTO_MIN_ZOOM, PHOTO_MAX_ZOOM).toFixed(2));
}

function updatePhotoZoom(button) {
  updatePhotoZoomValue(button.dataset.courseId, button.dataset.hole, Number(button.dataset.direction || 0));
}

function updatePhotoZoomValue(courseId, holeNumber, direction) {
  const key = photoZoomKey(courseId, holeNumber);
  const current = photoZoomLevel(courseId, holeNumber);
  const nextZoom = direction > 0
    ? PHOTO_ZOOM_LEVELS.find((value) => value > current + 0.01) || PHOTO_ZOOM_LEVELS[PHOTO_ZOOM_LEVELS.length - 1]
    : [...PHOTO_ZOOM_LEVELS].reverse().find((value) => value < current - 0.01) || PHOTO_ZOOM_LEVELS[0];
  if (nextZoom === current) {
    return;
  }
  const nextPan = clampPhotoPan(photoPanOffset(courseId, holeNumber, current), nextZoom);
  photoZoomLevels = {
    ...photoZoomLevels,
    [key]: nextZoom
  };
  photoPanOffsets = {
    ...photoPanOffsets,
    [key]: nextZoom > 1 ? nextPan : { x: 0, y: 0 }
  };
  render();
}

async function storeCoursePhotoSource(file, courseId) {
  if (!courseId) {
    return;
  }
  flash("Preparing course image...");
  const attempts = [
    { maxEdge: 1600, quality: 0.9 },
    { maxEdge: 1300, quality: 0.84 },
    { maxEdge: 1050, quality: 0.78 }
  ];

  for (const attempt of attempts) {
    try {
      const dataUrl = await imageFileToDataUrl(file, attempt.maxEdge, attempt.quality);
      localStorage.setItem(coursePhotoSourceKey(courseId), dataUrl);
      coursePhotoSources = {
        ...coursePhotoSources,
        [courseId]: dataUrl
      };
      coursePhotoImages = new Map();
      flash("Course image loaded.");
      return;
    } catch (error) {
      if (attempt === attempts[attempts.length - 1]) {
        flash(error?.message || "Could not store that image.");
      }
    }
  }
}

function clearCoursePhotoSource(courseId) {
  if (!courseId) {
    return;
  }
  try {
    localStorage.removeItem(coursePhotoSourceKey(courseId));
  } catch {
    // Storage can fail in private browsing; the in-memory source still clears.
  }
  const next = { ...coursePhotoSources };
  delete next[courseId];
  coursePhotoSources = next;
  coursePhotoImages = new Map();
  flash("Course image cleared.");
}

function imageFileToDataUrl(file, maxEdge, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const image = new Image();
    reader.onerror = () => reject(new Error("Could not read that image."));
    image.onerror = () => reject(new Error("Could not load that image."));
    reader.onload = () => {
      image.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Image tools are not available in this browser."));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function persist(message = "") {
  saveState(state);
  if (message) {
    flash(message);
  } else {
    render();
  }
}

function persistScoreEntry() {
  const scrollTop = document.querySelector(".score-card-players")?.scrollTop ?? null;
  saveState(state);
  render();
  if (scrollTop === null) {
    return;
  }
  window.requestAnimationFrame(() => {
    const players = document.querySelector(".score-card-players");
    if (players) {
      players.scrollTop = scrollTop;
    }
  });
}

function flash(message) {
  notice = message;
  render();
  window.clearTimeout(flash.timeoutId);
  flash.timeoutId = window.setTimeout(() => {
    notice = "";
    render();
  }, 2200);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
