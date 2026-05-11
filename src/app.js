import {
  clamp,
  createPlaceholderCourse,
  createRound,
  defaultClubs,
  formatToPar,
  getActiveRound,
  getCourse,
  getPlayerEntry,
  getRoundEntry,
  getRoundPlayers,
  roundTotals,
  yardsBetween
} from "./course-data.js";
import { homeArea } from "./local-area.js";
import { fetchOsmCourseLayout, findNearbyOsmCourses } from "./osm.js";
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
const HOME_IMAGE_SRC = "./assets/home.png";
const PINSCOPE_COMPLETE_LOGO_SRC = "./assets/pinscope-complete-logo.png";
const PINSCOPE_NAME_LOGO_SRC = "./assets/pinscope-name-logo.png";
const HOLE_SWIPE_MIN_DISTANCE = 68;
const HOLE_SWIPE_VERTICAL_RATIO = 1.25;
const HOLE_SWIPE_PREVIEW_LIMIT = 58;
const GPS_TEST_QUERY_KEY = "gpsTest";
const AZURE_MAPS_KEY_STORAGE = "pinscope:azure-maps-key:v1";
const AZURE_MAPS_ENABLED_STORAGE = "pinscope:azure-maps-enabled:v1";
const SATELLITE_ANCHOR_EDITS_STORAGE = "pinscope:satellite-anchor-edits:v1";
const AZURE_MAPS_QUERY_KEY = "azureMapsKey";
const AZURE_MAPS_QUERY_ENABLED = "azureMaps";
const AZURE_MAPS_TILE_SIZE = 256;
const AZURE_MAPS_REQUEST_TILE_SIZE = 512;
const AZURE_MAPS_STATIC_TILE_SIZE = 512;
const AZURE_MAPS_ZOOM = 17;
const SATELLITE_PRELOAD_CONCURRENCY = 2;
const SATELLITE_PANEL_RATIO = 13 / 9;
const HANDICAP_MIN_HOLES = 54;
const HANDICAP_SCORE_TABLE = [
  { min: 3, max: 3, count: 1, adjustment: -2 },
  { min: 4, max: 4, count: 1, adjustment: -1 },
  { min: 5, max: 5, count: 1, adjustment: 0 },
  { min: 6, max: 6, count: 2, adjustment: -1 },
  { min: 7, max: 8, count: 2, adjustment: 0 },
  { min: 9, max: 11, count: 3, adjustment: 0 },
  { min: 12, max: 14, count: 4, adjustment: 0 },
  { min: 15, max: 16, count: 5, adjustment: 0 },
  { min: 17, max: 18, count: 6, adjustment: 0 },
  { min: 19, max: 19, count: 7, adjustment: 0 },
  { min: 20, max: Infinity, count: 8, adjustment: 0 }
];
const ESRI_WORLD_IMAGERY_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";
const ESRI_WORLD_IMAGERY_EXPORT_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export";
const SATELLITE_ATTRIBUTION = "Imagery: Esri World Imagery";
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
let satelliteAnchorEdits = loadSatelliteAnchorEdits();
let holeSwipe = null;
let wheelHoleNavigationAt = 0;
let courseSearchQuery = "";
let statsFilter = "all";
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
let satellitePreloadQueue = [];
let satellitePreloadActive = 0;
let satellitePreloadCourseId = "";
let satellitePreloadedUrls = new Set();
let satellitePreloadingUrls = new Set();
let notice = "";
let scoreCardOpen = false;
let roundScorecardOpen = false;
let finishRoundPrompt = null;
let roundSetupPlayerCount = 1;

render();
registerServiceWorker();

window.addEventListener("hashchange", () => {
  view = getViewFromHash();
  render();
  scrollToTop();
});

function handleWindowResize() {
  queuePhotoCanvasRender();
  if (view === "play" && getActiveRound(state)) {
    window.clearTimeout(handleWindowResize.pending);
    handleWindowResize.pending = window.setTimeout(render, 90);
  }
}

window.addEventListener("resize", handleWindowResize);
window.addEventListener("orientationchange", () => window.setTimeout(render, 120));
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
  const allowed = ["home", "courses", "play", "stats", "bag"];
  const value = window.location.hash.replace("#", "");
  return allowed.includes(value) ? value : "home";
}

function render() {
  const activeRoundView = isActiveRoundView();
  document.body.classList.toggle("score-card-open", scoreCardOpen);
  document.body.classList.toggle("active-round-view", activeRoundView);
  app.innerHTML = `
    <header class="topbar">
      <div>
        <img class="topbar-logo" src="${PINSCOPE_NAME_LOGO_SRC}" alt="PinScope" />
        <h1>${pageTitle()}</h1>
      </div>
      <button class="gps-pill ${gps.status}" type="button" data-action="gps">
        <span class="gps-dot" aria-hidden="true"></span>
        <span>${gpsLabel()}</span>
      </button>
    </header>
    <main class="screen">${renderView()}</main>
    ${scoreCardOpen ? renderScoreCardOverlay() : ""}
    ${roundScorecardOpen ? renderRoundScorecardOverlay() : ""}
    ${finishRoundPrompt ? renderFinishRoundOverlay(finishRoundPrompt) : ""}
    ${notice ? `<aside class="toast" role="status">${escapeHtml(notice)}</aside>` : ""}
    <nav class="bottom-nav" aria-label="Primary">
      ${navItem("courses", "Courses", "C")}
      ${navItem("play", "Play", "P")}
      ${navItem("home", "Home", "H")}
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
  if (view === "home") {
    return "Home";
  }
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
  const homeIcon = target === "home"
    ? `<img class="nav-home-img" src="${HOME_IMAGE_SRC}" alt="" />`
    : icon;
  return `
    <a class="nav-item ${target === "home" ? "home-nav" : ""} ${active}" href="#${target}" aria-current="${active ? "page" : "false"}">
      <span class="nav-icon" aria-hidden="true">${homeIcon}</span>
      <span>${label}</span>
    </a>
  `;
}

function renderView() {
  if (view === "home") {
    return renderHome();
  }
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

function scrollToTop() {
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.querySelector(".screen")?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  });
}

function renderHome() {
  const activeRound = getActiveRound(state);
  const selectedCourse = getCourse(state, state.selectedCourseId);
  const bag = activeBag();
  const handicap = handicapProfile();
  return `
    <section class="home-screen">
      <div class="home-handicap">
        <span>Handicap</span>
        <strong>${escapeHtml(handicap.display)}</strong>
      </div>
      <img class="home-logo" src="${PINSCOPE_COMPLETE_LOGO_SRC}" alt="PinScope" />
      <div class="home-actions">
        <a class="primary-action" href="#${activeRound ? "play" : "courses"}">${activeRound ? "Continue Round" : "Choose Course"}</a>
        <a class="secondary-action" href="#bag">Tune Bag</a>
      </div>
    </section>

    ${renderHandicapIntro(handicap)}
    ${renderLocalAreaSection()}

    <section class="home-grid">
      <article>
        <span>Course</span>
        <strong>${escapeHtml(selectedCourse?.name || "Select a course")}</strong>
      </article>
      <article>
        <span>Active Bag</span>
        <strong>${escapeHtml(bag?.name || "My Bag")}</strong>
      </article>
      <article>
        <span>Rounds</span>
        <strong>${state.rounds.filter((round) => round.status === "complete").length}</strong>
      </article>
      <article>
        <span>Handicap Status</span>
        <strong>${escapeHtml(handicap.status)}</strong>
      </article>
    </section>
  `;
}

function renderHandicapIntro(profile) {
  if (profile.source !== "none" || state.settings?.handicap?.introDismissed) {
    return "";
  }
  return `
    <section class="handicap-intro">
      <div>
        <p class="eyebrow">Handicap Setup</p>
        <h2>Build a reliable index</h2>
        <p>PinScope needs 54 posted holes to calculate an initial handicap, then gets strongest once it has 20 recent 18-hole scores. If you already know yours, add it now.</p>
      </div>
      <form data-form="handicap-setup" class="handicap-setup">
        <label>
          <span>Current handicap</span>
          <input name="manualIndex" type="number" min="-10" max="54" step="0.1" inputmode="decimal" placeholder="e.g. 18.4" />
        </label>
        <div>
          <button class="primary-action" type="submit">Save Handicap</button>
          <button class="secondary-action" type="button" data-action="dismiss-handicap-intro">Later</button>
        </div>
      </form>
    </section>
  `;
}

function handicapProfile() {
  const manual = manualHandicapIndex();
  const records = handicapRecords();
  const holes = records.reduce((sum, item) => sum + item.holes, 0);
  const calculated = calculateHandicapIndex(records);
  if (calculated) {
    return {
      ...calculated,
      source: "calculated",
      display: formatHandicapIndex(calculated.index),
      status: calculated.scoreCount >= 20 ? "Reliable" : `${calculated.scoreCount}/20 scores`,
      holes,
      manualIndex: manual
    };
  }
  if (manual !== null) {
    return {
      source: "manual",
      display: formatHandicapIndex(manual),
      status: holes >= HANDICAP_MIN_HOLES ? "Manual index" : `${Math.max(0, HANDICAP_MIN_HOLES - holes)} holes to calculate`,
      holes,
      manualIndex: manual
    };
  }
  return {
    source: "none",
    display: "-",
    status: holes ? `${Math.max(0, HANDICAP_MIN_HOLES - holes)} holes to go` : "Not set",
    holes,
    manualIndex: null
  };
}

function manualHandicapIndex() {
  const raw = state.settings?.handicap?.manualIndex;
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? clamp(value, -10, 54) : null;
}

function handicapRecords() {
  return completedRoundSummaries()
    .map(({ round, course, totals, playerId, playedAt }) => {
      const players = getRoundPlayers(round);
      const player = players.find((item) => item.id === playerId) || players[0];
      const tee = (course.tees || []).find((item) => item.id === (player?.teeId || round.teeId));
      const rating = Number(tee?.rating);
      const slope = Number(tee?.slope) || 113;
      const par = course.holes.reduce((sum, hole) => sum + Number(hole.par || 0), 0);
      const holes = Math.max(0, course.holes.length || round.entries?.length || 0);
      const baseline = Number.isFinite(rating) && rating > 0 ? rating : par;
      if (!Number.isFinite(totals.score) || !Number.isFinite(baseline) || !Number.isFinite(slope) || slope <= 0 || holes <= 0) {
        return null;
      }
      return {
        playedAt,
        holes,
        differential: (((totals.score - baseline) * 113) / slope) * (18 / holes)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.playedAt - a.playedAt);
}

function calculateHandicapIndex(records) {
  const eligible = records.slice(0, 20);
  const holes = records.reduce((sum, item) => sum + item.holes, 0);
  if (holes < HANDICAP_MIN_HOLES || eligible.length < 3) {
    return null;
  }
  const rule = HANDICAP_SCORE_TABLE.find((item) => eligible.length >= item.min && eligible.length <= item.max) || HANDICAP_SCORE_TABLE[HANDICAP_SCORE_TABLE.length - 1];
  const selected = eligible
    .map((item) => item.differential)
    .sort((a, b) => a - b)
    .slice(0, rule.count);
  const average = selected.reduce((sum, value) => sum + value, 0) / selected.length;
  return {
    index: clamp(average + rule.adjustment, -10, 54),
    scoreCount: eligible.length,
    usedCount: selected.length,
    adjustment: rule.adjustment,
    holes
  };
}

function formatHandicapIndex(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return value < 0 ? `+${Math.abs(value).toFixed(1)}` : value.toFixed(1);
}

function renderLocalAreaSection() {
  const localArea = activeLocalArea();
  return `
    <section class="home-area">
      <div>
        <p class="eyebrow">Local Area</p>
        <h2>${escapeHtml(localArea?.label || homeArea.label)}</h2>
        <p>${escapeHtml(localArea ? `${localArea.subtitle} - ${savedHomeCourseCount()} saved here` : homeArea.subtitle)}</p>
      </div>
      <div class="local-area-actions">
        <form class="local-area-search" data-form="local-area-search">
          <input name="area" type="search" placeholder="Town, postcode, or area" autocomplete="address-level2" required />
          <button class="primary-action" type="submit">Search</button>
        </form>
        <button class="secondary-action" type="button" data-action="use-current-location-courses">Use GPS</button>
        ${localArea ? `<button class="secondary-action" type="button" data-action="refresh-local-area">Refresh</button>` : ""}
      </div>
    </section>
  `;
}

function renderCourses() {
  const filteredCourses = filteredCourseList();
  const savedCourseCount = groupedVenueCourseList(state.courses).length;
  return `
    ${renderPlayedCoursesSection()}

    <section class="action-band">
      <div>
        <h2>Local Course Library</h2>
        <p>${savedCourseCount} saved ${savedCourseCount === 1 ? "course" : "courses"}</p>
      </div>
      <button class="primary-action" type="button" data-action="find-nearby">Find Near Me</button>
    </section>

    ${renderLocalAreaSection()}

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
    <p class="source-note">OpenStreetMap imports require ODbL attribution. Export the mapped course pack, put it in data/course-pack, then run the build script to bake snapshots into the downloadable app.</p>
  `;
}

function filteredCourseList() {
  const query = courseSearchQuery.trim().toLowerCase();
  const matches = state.courses.filter((course) => !query || [
    course.name,
    course.venueName,
    course.layoutName,
    ...(Array.isArray(course.loopIds) ? course.loopIds : []),
    course.town,
    course.postcode,
    course.country,
    course.source
  ].some((value) => String(value || "").toLowerCase().includes(query)));
  return groupedVenueCourseList(matches);
}

function groupedVenueCourseList(courses) {
  const seenVenueIds = new Set();
  return courses.reduce((list, course) => {
    if (!course.venueId) {
      list.push(course);
      return list;
    }
    if (seenVenueIds.has(course.venueId)) {
      return list;
    }
    seenVenueIds.add(course.venueId);
    list.push(preferredVenueCourse(course.venueId, courses.filter((item) => item.venueId === course.venueId)) || course);
    return list;
  }, []);
}

function preferredVenueCourse(venueId, candidates = null) {
  const venueCourses = candidates?.length ? candidates : state.courses.filter((course) => course.venueId === venueId);
  const selected = venueCourses.find((course) => course.id === state.selectedCourseId);
  if (selected) {
    return selected;
  }
  return venueCourses.find((course) => Array.isArray(course.loopIds) && course.loopIds.length === 2) || venueCourses[0] || null;
}

function venueLoopCount(course) {
  if (!course?.venueId) {
    return 0;
  }
  return new Set(state.courses
    .filter((item) => item.venueId === course.venueId)
    .flatMap((item) => item.loopIds || [])).size;
}

function renderPlayedCoursesSection() {
  const playedCourses = playedCourseSummaries();
  return `
    <section class="played-courses">
      <header class="section-head">
        <div>
          <p class="eyebrow">Recent</p>
          <h2>Courses you have played at</h2>
        </div>
      </header>
      <div class="played-course-list">
        ${playedCourses.length ? playedCourses.map(renderPlayedCourseCard).join("") : `<p class="empty-copy">Courses appear here after you start a round.</p>`}
      </div>
    </section>
  `;
}

function playedCourseSummaries() {
  const roundCounts = new Map();
  state.rounds.forEach((round) => {
    if (round.courseId) {
      const course = getCourse(state, round.courseId);
      const key = course?.venueId || round.courseId;
      roundCounts.set(key, (roundCounts.get(key) || 0) + 1);
    }
  });

  const newestRounds = state.rounds
    .map((round) => ({
      round,
      timestamp: Date.parse(round.completedAt || round.startedAt || "")
    }))
    .filter(({ round, timestamp }) => round.courseId && Number.isFinite(timestamp))
    .sort((a, b) => b.timestamp - a.timestamp);

  const seenCourseKeys = new Set();
  return newestRounds.reduce((summaries, { round, timestamp }) => {
    const course = getCourse(state, round.courseId);
    if (!course) {
      return summaries;
    }
    const key = course.venueId || round.courseId;
    if (seenCourseKeys.has(key)) {
      return summaries;
    }
    seenCourseKeys.add(key);
    const players = getRoundPlayers(round);
    const leadTotals = round.status === "complete" ? roundTotals(round, course, players[0]?.id) : null;
    summaries.push({
      course,
      round,
      timestamp,
      roundCount: roundCounts.get(key) || 1,
      leadTotals
    });
    return summaries;
  }, []);
}

function renderPlayedCourseCard(summary) {
  const { course, round, roundCount, leadTotals } = summary;
  const selected = isCourseSelected(course);
  const activeRound = getActiveRound(state);
  const playedLabel = round.status === "active"
    ? "Round in progress"
    : `Last played ${formatShortDate(round.completedAt || round.startedAt)}`;
  const scoreLabel = leadTotals
    ? `${leadTotals.score} (${formatToPar(leadTotals.toPar)})`
    : "Ready to continue";
  return `
    <article class="played-course-card ${selected ? "selected" : ""}">
      <div>
        <p class="eyebrow">${playedLabel}</p>
        <h3>${escapeHtml(courseDisplayName(course))}</h3>
        <p>${courseLocationLine(course)}</p>
      </div>
      <div class="played-course-meta">
        <span>${roundCount} ${roundCount === 1 ? "round" : "rounds"}</span>
        <span>${scoreLabel}</span>
      </div>
      <div class="played-course-actions">
        <button class="primary-action" type="button" data-action="quick-start" data-course-id="${course.id}">${activeRound ? "Continue" : "Play"}</button>
        <button class="secondary-action" type="button" data-action="select-course" data-course-id="${course.id}">${selected ? "Selected" : "Select"}</button>
      </div>
    </article>
  `;
}

function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function renderFeaturedCourse(course) {
  const selected = isCourseSelected(course);
  const activeRound = getActiveRound(state);
  const title = courseDisplayName(course);
  return `
    <section class="course-hero">
      <div class="hero-orbit" aria-hidden="true">
        ${renderMiniCourseSignal(course)}
      </div>
      <div>
        <p class="eyebrow">Stage 1 Verified Pack</p>
        <h2>${escapeHtml(title)}</h2>
        <p>${courseLocationLine(course)}</p>
      </div>
      <div class="hero-actions">
        ${selected ? `<button class="primary-action" type="button" data-action="quick-start" data-course-id="${course.id}">${activeRound ? "Continue Round" : "Setup Round"}</button>` : ""}
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
  const isSelected = isCourseSelected(course);
  const selected = isSelected ? "selected" : "";
  const source = course.source === "verified" ? "Verified" : course.source === "shared" ? "Shared" : course.source === "osm" ? "OSM" : course.source === "manual" ? "Manual" : "Demo";
  const loopCount = venueLoopCount(course);
  return `
    <article class="course-card ${selected}">
      <div class="course-main">
        <div>
          <p class="eyebrow">${source}</p>
          <h3>${escapeHtml(courseDisplayName(course))}</h3>
          <p>${courseLocationLine(course)}</p>
        </div>
        <button class="chip-button" type="button" data-action="select-course" data-course-id="${course.id}">
          ${selected ? "Selected" : "Select"}
        </button>
      </div>
      <div class="course-meta">
        ${course.verification ? `<span class="verified-chip">Scorecard checked</span>` : ""}
        ${loopCount ? `<span>${loopCount} nine-hole loops</span>` : ""}
        ${course.website ? `<a href="${escapeAttribute(course.website)}" target="_blank" rel="noreferrer">Website</a>` : "<span>Website pending</span>"}
        ${course.phone ? `<a href="tel:${escapeAttribute(course.phone)}">Call</a>` : "<span>Phone pending</span>"}
      </div>
      ${course.verification ? renderTeeSummary(course) : ""}
      ${isSelected ? renderSelectedCourseActions(course) : ""}
    </article>
  `;
}

function isCourseSelected(course) {
  if (!course) {
    return false;
  }
  if (!course.venueId) {
    return state.selectedCourseId === course.id;
  }
  const selected = getCourse(state, state.selectedCourseId);
  return selected?.venueId === course.venueId;
}

function renderCourseGeometryStatus(course) {
  const mapped = courseMappedHoleCount(course);
  const total = course.holes?.length || course.holesCount || 18;
  const snapshots = courseSnapshotHoleCount(course);
  const label = mapped
    ? mapped < total
      ? `${mapped}/${total} GPS holes mapped - click OSM holes to refresh`
      : `${mapped}/${total} GPS holes mapped`
    : "GPS holes not mapped yet";
  const snapshotLabel = snapshots
    ? `${snapshots}/${total} saved satellite snapshot${snapshots === 1 ? "" : "s"}`
    : "No saved satellite snapshots yet";
  return `
    <div class="course-geometry-status ${mapped ? "mapped" : "pending"}">
      <span>${label}</span>
      <span>${snapshotLabel}</span>
      ${course.geometrySource ? `<em>${escapeHtml(course.geometrySource)}</em>` : ""}
    </div>
  `;
}

function renderSelectedCourseActions(course) {
  const activeRound = getActiveRound(state);
  return `
    <div class="course-actions">
      <button class="secondary-action" type="button" data-action="quick-start" data-course-id="${course.id}">${activeRound ? "Continue Round" : "Start Round"}</button>
    </div>
  `;
}

function courseMappedHoleCount(course) {
  return (course?.holes || []).filter((hole) => confirmedHoleAnchors(course, hole)).length;
}

function courseSnapshotHoleCount(course) {
  return (course?.holes || []).filter((hole) => validHoleSnapshot(hole?.snapshot, hole, course)).length;
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
  const holes = Array.isArray(course.holes) ? course.holes : [];
  const hole = holes.find((item) => item.number === activeRound.currentHole) || holes[0];
  if (!hole) {
    return `<section class="empty-state"><h2>Hole data missing</h2><p>${escapeHtml(courseDisplayName(course))} needs hole data before a round can be played.</p><button class="primary-action" type="button" data-route="courses">Choose another course</button></section>`;
  }
  queueCourseSatellitePreload(course, hole.number);
  const players = getRoundPlayers(activeRound);
  const leadTotals = roundTotals(activeRound, course, players[0]?.id);
  const teeInfo = photoPlanningTee(hole);
  return `
    <section class="play-round-screen" data-play-round>
      ${renderHoleVisual(hole)}

      <div class="play-hud play-hole-hud">
        <p class="eyebrow">${escapeHtml(courseDisplayName(course))}</p>
        <div class="play-hole-title">
          <h2>Hole ${hole.number}</h2>
          <button type="button" data-action="open-round-scorecard">Scorecard</button>
        </div>
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

      <button class="score-fab" type="button" data-action="open-score-card">Scores</button>
      ${renderShotTracker(activeRound, hole)}
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

function renderShotTracker(round, hole) {
  const shotState = shotTrackingState(round, hole.number);
  const label = `Shot ${shotState.nextNumber}`;
  return `
    <div class="shot-tracker ${shotState.active ? "tracking" : ""}" aria-live="polite">
      ${shotState.status ? `<p>${escapeHtml(shotState.status)}</p>` : ""}
      <button class="shot-track-button" type="button" data-action="track-shot" aria-label="${escapeAttribute(label)}">
        <img src="${SCORE_BUTTON_IMAGE_SRC}" alt="" aria-hidden="true" />
        <span>${escapeHtml(label)}</span>
      </button>
    </div>
  `;
}

function shotTrackingState(round, holeNumber) {
  const entry = trackedRoundEntry(round, holeNumber);
  const shots = trackedShots(entry);
  const active = trackedActiveShot(entry);
  const nextNumber = active?.number || shots.length + 1;
  if (!gps.position || gps.status !== "ready") {
    return {
      active: Boolean(active),
      nextNumber,
      status: active ? "GPS needed to land this shot." : ""
    };
  }
  if (active) {
    const yards = yardsBetween(active.start, gps.position);
    return {
      active: true,
      nextNumber,
      status: yards === null ? "Walk to your ball, tap again to land it." : `${yards} yd so far`
    };
  }
  const lastShot = shots.at(-1);
  return {
    active: false,
    nextNumber,
    status: lastShot?.yards ? `Last shot ${lastShot.yards} yd` : ""
  };
}

function trackedRoundEntry(round, holeNumber) {
  return round?.entries?.find((entry) => Number(entry.holeNumber) === Number(holeNumber)) || null;
}

function trackedShots(entry) {
  return Array.isArray(entry?.shots) ? entry.shots : [];
}

function trackedActiveShot(entry) {
  return entry?.activeShot && entry.activeShot.start ? entry.activeShot : null;
}

function ensureTrackedShotState(entry) {
  if (!entry) {
    return;
  }
  if (!Array.isArray(entry.shots)) {
    entry.shots = [];
  }
  if (entry.activeShot && !entry.activeShot.start) {
    entry.activeShot = null;
  }
}

function currentGpsPoint() {
  if (gps.status !== "ready" || !gps.position) {
    return null;
  }
  return {
    lat: gps.position.lat,
    lng: gps.position.lng,
    accuracy: gps.position.accuracy || 0
  };
}

function trackedShotScore(entry) {
  return trackedShots(entry).length + (trackedActiveShot(entry) ? 1 : 0);
}

function syncTrackedScore(round, holeNumber) {
  const entry = trackedRoundEntry(round, holeNumber);
  const players = getRoundPlayers(round);
  const leadPlayer = players[0]?.id || "player-1";
  const playerEntry = getPlayerEntry(round, holeNumber, leadPlayer) || getRoundEntry(round, holeNumber);
  const score = trackedShotScore(entry);
  if (playerEntry && score > 0) {
    playerEntry.score = clamp(score, 1, 12);
    playerEntry.scoreEntered = true;
  }
}

function trackShot() {
  const round = getActiveRound(state);
  if (!round) {
    return;
  }
  const position = currentGpsPoint();
  if (!position) {
    startGps();
    flash("Start GPS, then tap Shot 1 at your ball.");
    return;
  }
  const entry = trackedRoundEntry(round, round.currentHole);
  ensureTrackedShotState(entry);
  if (!entry) {
    return;
  }
  const activeShot = trackedActiveShot(entry);
  const now = new Date().toISOString();
  if (activeShot) {
    const yards = yardsBetween(activeShot.start, position);
    entry.shots.push({
      ...activeShot,
      end: position,
      endedAt: now,
      yards: yards ?? 0
    });
    entry.activeShot = null;
    syncTrackedScore(round, round.currentHole);
    persist(yards === null ? `Shot ${activeShot.number} landed.` : `Shot ${activeShot.number}: ${yards} yd.`);
    return;
  }
  const number = trackedShots(entry).length + 1;
  entry.activeShot = {
    id: `shot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    number,
    start: position,
    startedAt: now
  };
  syncTrackedScore(round, round.currentHole);
  persist(`Shot ${number} started. Tap again at your ball.`);
}

function savedHomeCourseCount() {
  const localArea = activeLocalArea();
  if (!localArea) {
    return 0;
  }
  return groupedVenueCourseList(state.courses).filter((course) => {
    if (course.homeAreaId === localArea.id) {
      return true;
    }
    return validGeoPoint(course.location)
      ? yardsBetween(localArea.center, course.location) / 1760 <= localArea.radiusMiles
      : false;
  }).length;
}

function activeLocalArea() {
  const localArea = state.settings?.localArea;
  const center = normalizeGeoPoint(localArea?.center);
  if (!center) {
    return null;
  }
  const radiusMiles = Number(localArea.radiusMiles) || homeArea.radiusMiles;
  const radiusMeters = Number(localArea.radiusMeters) || homeArea.radiusMeters;
  return {
    ...homeArea,
    ...localArea,
    id: localArea.id || homeArea.id,
    label: String(localArea.label || homeArea.label).trim() || homeArea.label,
    subtitle: `${radiusMiles} mile course radius`,
    center,
    radiusMiles,
    radiusMeters
  };
}

function setActiveLocalArea(area) {
  const center = normalizeGeoPoint(area?.center);
  if (!center) {
    return null;
  }
  state.settings = state.settings || {};
  state.settings.localArea = {
    id: area.id || homeArea.id,
    label: String(area.label || homeArea.label).trim() || homeArea.label,
    center,
    radiusMiles: Number(area.radiusMiles) || homeArea.radiusMiles,
    radiusMeters: Number(area.radiusMeters) || homeArea.radiusMeters
  };
  return activeLocalArea();
}

function courseLocationLine(course) {
  const bits = [];
  bits.push(escapeHtml(course.town || course.postcode || "Area pending"));
  if (course.layoutName && !course.venueName) {
    bits.push(escapeHtml(course.layoutName));
  }
  bits.push(`${course.holesCount || course.holes.length} holes`);
  if (course.par) {
    bits.push(`Par ${escapeHtml(course.par)}`);
  }
  if (typeof course.distanceMiles === "number") {
    bits.push(`${course.distanceMiles} mi`);
  }
  return bits.join(" - ");
}

function courseDisplayName(course) {
  return course?.venueName || course?.name || "Choose Course";
}

function renderStartRound() {
  const selected = getCourse(state, state.selectedCourseId) || state.courses[0];
  const routingOptions = roundRoutingOptions(selected);
  return `
    <section class="setup-panel round-setup-panel">
      <div class="round-setup-hero">
        <p class="eyebrow">Round Setup</p>
        <h2>${escapeHtml(courseDisplayName(selected))}</h2>
        <p>${selected ? courseLocationLine(selected) : "Pick a course and build your group."}</p>
      </div>
      <form class="stack" data-form="start-round">
        ${routingOptions.length ? renderRoundRoutingChoices(selected, routingOptions) : `<input type="hidden" name="courseId" value="${escapeAttribute(selected?.id || "")}" />`}
        <div class="player-setup-list">
          ${renderPlayerSetupRows(selected)}
        </div>
        ${roundSetupPlayerCount < 4 ? `<button class="add-player-button" type="button" data-action="add-setup-player"><span>+</span><strong>Add Player</strong></button>` : ""}
        <button class="primary-action full" type="submit">Start Round</button>
      </form>
    </section>
  `;
}

function roundRoutingOptions(course) {
  if (!course?.venueId) {
    return [];
  }

  const venueCourses = state.courses.filter((item) => item.venueId === course.venueId && Array.isArray(item.loopIds) && item.loopIds.length);
  const loopCount = new Set(venueCourses.flatMap((item) => item.loopIds)).size;
  const hasLargerVenue = loopCount > 2 || venueCourses.some((item) => Number(item.holesCount || item.holes?.length || 0) > 18);
  if (!hasLargerVenue) {
    return [];
  }

  return venueCourses
    .filter((item) => [1, 2].includes(item.loopIds.length) && Number(item.holesCount || item.holes?.length || 0) <= 18)
    .sort((a, b) => {
      const aHoles = Number(a.holesCount || a.holes?.length || 0);
      const bHoles = Number(b.holesCount || b.holes?.length || 0);
      if (aHoles !== bHoles) {
        return aHoles - bHoles;
      }
      return String(a.layoutName || a.name).localeCompare(String(b.layoutName || b.name));
    });
}

function renderRoundRoutingChoices(selected, options) {
  const checkedId = options.some((option) => option.id === selected?.id) ? selected.id : options.find((option) => Number(option.holesCount || option.holes?.length || 0) === 18)?.id || options[0]?.id || "";
  const checked = options.find((option) => option.id === checkedId) || options[0];
  const loops = roundRoutingLoops(options);
  const frontLoop = checked?.loopIds?.[0] || loops[0]?.id || "";
  const backLoop = checked?.loopIds?.[1] || "";
  return `
    <section class="round-routing-choice">
      <div class="routing-head">
        <span>Choose holes</span>
        <strong>${escapeHtml(courseDisplayName(selected))}</strong>
      </div>
      <input type="hidden" name="courseId" value="${escapeAttribute(checkedId)}" />
      <div class="routing-select-grid">
        <label>
          <span>Front nine</span>
          <select name="frontLoopId">
            ${loops.map((loop) => `<option value="${escapeAttribute(loop.id)}" ${loop.id === frontLoop ? "selected" : ""}>${escapeHtml(loop.name)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Back nine</span>
          <select name="backLoopId">
            <option value="" ${backLoop ? "" : "selected"}>None - play 9</option>
            ${loops.map((loop) => `<option value="${escapeAttribute(loop.id)}" ${loop.id === backLoop ? "selected" : ""}>${escapeHtml(loop.name)}</option>`).join("")}
          </select>
        </label>
      </div>
    </section>
  `;
}

function roundRoutingLoops(options) {
  const loopNames = new Map();
  options.forEach((option) => {
    if (Array.isArray(option.loopIds) && option.loopIds.length === 1) {
      loopNames.set(option.loopIds[0], option.layoutName || formatLoopName(option.loopIds[0]));
      return;
    }
    (option.loopIds || []).forEach((loopId) => {
      if (!loopNames.has(loopId)) {
        loopNames.set(loopId, formatLoopName(loopId));
      }
    });
  });
  return [...loopNames].map(([id, name]) => ({ id, name }));
}

function resolveRoundCourseId(formData, fallbackCourseId) {
  const selected = getCourse(state, fallbackCourseId);
  const options = roundRoutingOptions(selected);
  if (!options.length) {
    return fallbackCourseId;
  }
  const frontLoopId = String(formData.get("frontLoopId") || "");
  const backLoopId = String(formData.get("backLoopId") || "");
  const loopIds = [frontLoopId, backLoopId].filter(Boolean);
  const match = options.find((option) => {
    if (!Array.isArray(option.loopIds) || option.loopIds.length !== loopIds.length) {
      return false;
    }
    return option.loopIds.every((loopId, index) => loopId === loopIds[index]);
  });
  if (match) {
    return match.id;
  }
  flash("That front/back route is not available yet.");
  return "";
}

function formatLoopName(value) {
  const text = String(value || "").replace(/[-_]+/g, " ").trim();
  return text ? text.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Loop";
}

function renderPlayerSetupRows(course) {
  const teeOptions = (course?.tees || []).map((tee) => `<option value="${tee.id}">${escapeHtml(tee.name)}</option>`).join("");
  const defaults = ["Me", "", "", ""];
  const myHandicap = manualHandicapIndex();
  return defaults.slice(0, roundSetupPlayerCount).map((name, index) => `
    <div class="player-setup-row">
      <div class="player-setup-badge">${index + 1}</div>
      <div class="player-setup-fields">
        <label>
          <span>${index === 0 ? "You" : `Player ${index + 1}`}</span>
          <input name="playerName${index}" type="text" value="${escapeAttribute(name)}" placeholder="${index === 0 ? "Your name" : "Player name"}" />
        </label>
        <label>
          <span>Tee</span>
          <select name="playerTee${index}">
            ${teeOptions}
          </select>
        </label>
        <label>
          <span>HCP</span>
          <input name="playerHandicap${index}" type="number" min="-10" max="54" step="0.1" inputmode="decimal" value="${index === 0 && myHandicap !== null ? escapeAttribute(myHandicap) : ""}" placeholder="-" />
        </label>
      </div>
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
            <h2>${escapeHtml(courseDisplayName(course))}</h2>
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
          <button class="primary-action" type="button" data-action="score-card-next">${Number(round.currentHole) >= course.holes.length ? "Finish Round" : "Save & Next"}</button>
        </footer>
      </div>
    </section>
  `;
}

function renderRoundScorecardOverlay() {
  const round = getActiveRound(state);
  const course = round ? getCourse(state, round.courseId) : null;
  if (!round || !course) {
    return "";
  }
  const players = getRoundPlayers(round);
  const usedTeeIds = Array.from(new Set(players.map((player) => player.teeId || round.teeId || course.tees?.[0]?.id).filter(Boolean)));
  const usedTees = usedTeeIds
    .map((teeId) => (course.tees || []).find((tee) => tee.id === teeId) || { id: teeId, name: teeId, color: "#f8f7f1" })
    .filter(Boolean);
  const holes = course.holes || [];
  const front = holes.slice(0, 9);
  const back = holes.slice(9, 18);
  const par = holes.reduce((sum, hole) => sum + Number(hole.par || 0), 0);
  return `
    <section class="round-scorecard-backdrop" role="dialog" aria-modal="true" aria-label="Round scorecard">
      <div class="round-scorecard-shell">
        <header class="round-scorecard-head">
          <div>
            <p class="eyebrow">Round Card</p>
            <h2>${escapeHtml(courseDisplayName(course))}</h2>
            <div class="round-scorecard-meta" aria-label="Round summary">
              <span>${holes.length || 18} holes</span>
              <span>Par ${par || "-"}</span>
              <span>${players.length} player${players.length === 1 ? "" : "s"}</span>
            </div>
          </div>
          <button class="secondary-action" type="button" data-action="close-round-scorecard">Back to Play</button>
        </header>
        <div class="round-scorecard-scroll">
          <table class="round-scorecard-table">
            <thead>
              <tr>
                <th>TEES</th>
                ${front.map((hole) => `<th>${hole.number}</th>`).join("")}
                <th>OUT</th>
                <th class="initials-cell">INITIALS</th>
                ${back.map((hole) => `<th>${hole.number}</th>`).join("")}
                <th>IN</th>
                <th>TOTAL</th>
                <th>HCP</th>
                <th>NET</th>
              </tr>
            </thead>
            <tbody>
              ${usedTees.map((tee) => renderRoundScorecardTeeRow(tee, front, back)).join("")}
              ${renderRoundScorecardInfoRow("SI", front, back, (hole) => hole.strokeIndex || "-")}
              ${renderRoundScorecardInfoRow("PAR", front, back, (hole) => hole.par || "-", true)}
              ${players.map((player) => renderRoundScorecardPlayerRow(round, course, player, front, back)).join("")}
            </tbody>
          </table>
        </div>
        <footer class="round-scorecard-sign">
          <label>SCORER:<input data-action="round-signature" data-field="scorer" type="text" value="${escapeAttribute(round.signatures?.scorer || "")}" /></label>
          <label>ATTEST:<input data-action="round-signature" data-field="attest" type="text" value="${escapeAttribute(round.signatures?.attest || "")}" /></label>
          <label>DATE:<input data-action="round-signature" data-field="date" type="date" value="${escapeAttribute(round.signatures?.date || new Date(round.startedAt || Date.now()).toISOString().slice(0, 10))}" /></label>
        </footer>
      </div>
    </section>
  `;
}

function renderRoundScorecardTeeRow(tee, front, back) {
  const frontYards = front.map((hole) => Number(hole.yards?.[tee.id] || 0));
  const backYards = back.map((hole) => Number(hole.yards?.[tee.id] || 0));
  const out = frontYards.reduce((sum, yards) => sum + yards, 0);
  const inn = backYards.reduce((sum, yards) => sum + yards, 0);
  return `
    <tr class="tee-yard-row" style="${teeRowStyle(tee)}">
      <th><strong>${escapeHtml(tee.name)}</strong><small>${tee.rating || "-"} / ${tee.slope || "-"}</small></th>
      ${frontYards.map((yards) => `<td>${yards || "-"}</td>`).join("")}
      <td>${out || "-"}</td>
      <td class="initials-cell"></td>
      ${backYards.map((yards) => `<td>${yards || "-"}</td>`).join("")}
      <td>${inn || "-"}</td>
      <td>${out + inn || "-"}</td>
      <td></td>
      <td></td>
    </tr>
  `;
}

function renderRoundScorecardInfoRow(label, front, back, valueForHole, includeTotals = false) {
  const frontValues = front.map(valueForHole);
  const backValues = back.map(valueForHole);
  const out = includeTotals ? front.reduce((sum, hole) => sum + Number(hole.par || 0), 0) : "";
  const inn = includeTotals ? back.reduce((sum, hole) => sum + Number(hole.par || 0), 0) : "";
  return `
    <tr class="scorecard-info-row ${label.toLowerCase()}-row">
      <th>${escapeHtml(label)}</th>
      ${frontValues.map((value) => `<td>${value}</td>`).join("")}
      <td>${out || ""}</td>
      <td class="initials-cell"></td>
      ${backValues.map((value) => `<td>${value}</td>`).join("")}
      <td>${inn || ""}</td>
      <td>${out || inn ? out + inn : ""}</td>
      <td></td>
      <td></td>
    </tr>
  `;
}

function renderRoundScorecardPlayerRow(round, course, player, front, back) {
  const frontScores = front.map((hole) => playerScorecardValue(round, hole.number, player.id));
  const backScores = back.map((hole) => playerScorecardValue(round, hole.number, player.id));
  const out = scorecardScoreTotal(frontScores);
  const inn = scorecardScoreTotal(backScores);
  const gross = out + inn;
  const handicap = playerHandicap(player);
  const frontShots = front.map((hole) => handicapShotsForHole(handicap, hole.strokeIndex, course.holes.length));
  const backShots = back.map((hole) => handicapShotsForHole(handicap, hole.strokeIndex, course.holes.length));
  const totalShots = [...frontShots, ...backShots].reduce((sum, shots) => sum + Math.max(0, shots), 0);
  const net = gross ? gross - totalShots : "";
  return `
    <tr class="scorecard-player-row">
      <th>${escapeHtml(player.name)}${handicap !== null ? `<small>HCP ${formatHandicapIndex(handicap)}</small>` : ""}</th>
      ${frontScores.map((score, index) => renderPlayerScoreCell(score, frontShots[index])).join("")}
      <td>${out || ""}</td>
      <td class="initials-cell"></td>
      ${backScores.map((score, index) => renderPlayerScoreCell(score, backShots[index])).join("")}
      <td>${inn || ""}</td>
      <td>${gross || ""}</td>
      <td>${handicap !== null ? formatHandicapIndex(handicap) : ""}</td>
      <td>${net || ""}</td>
    </tr>
  `;
}

function renderPlayerScoreCell(score, shots) {
  const dots = shots > 0 ? `<span class="stroke-dots" aria-label="${shots} handicap shot${shots === 1 ? "" : "s"}">${Array.from({ length: shots }, () => "&bull;").join("")}</span>` : "";
  return `<td class="${shots > 0 ? "stroke-hole" : ""}">${score || ""}${dots}</td>`;
}

function playerHandicap(player) {
  if (player.handicap === null || player.handicap === undefined || player.handicap === "") {
    return null;
  }
  const value = Number(player.handicap);
  return Number.isFinite(value) ? clamp(value, -10, 54) : null;
}

function handicapShotsForHole(handicap, strokeIndex, holeCount = 18) {
  if (!Number.isFinite(handicap) || handicap <= 0 || !Number.isFinite(Number(strokeIndex))) {
    return 0;
  }
  const holes = Math.max(1, Number(holeCount) || 18);
  const rounded = Math.round(handicap);
  const base = Math.floor(rounded / holes);
  const remainder = rounded % holes;
  return base + (Number(strokeIndex) <= remainder ? 1 : 0);
}

function playerScorecardValue(round, holeNumber, playerId) {
  const entry = getPlayerEntry(round, holeNumber, playerId);
  return entry?.scoreEntered ? Number(entry.score || 0) : "";
}

function scorecardScoreTotal(scores) {
  return scores.reduce((sum, score) => sum + Number(score || 0), 0);
}

function teeRowStyle(tee) {
  const color = tee.color || "#f8f7f1";
  return `--tee-row-color:${escapeAttribute(color)}; --tee-row-text:${darkTextForColor(color) ? "#071414" : "#f8fffb"};`;
}

function darkTextForColor(color) {
  const hex = String(color || "").trim().replace("#", "");
  if (![3, 6].includes(hex.length)) {
    return false;
  }
  const expanded = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
  const red = parseInt(expanded.slice(0, 2), 16);
  const green = parseInt(expanded.slice(2, 4), 16);
  const blue = parseInt(expanded.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150;
}

function renderFinishRoundOverlay(prompt) {
  const missing = prompt.missing || [];
  const hasMissing = missing.length > 0;
  return `
    <section class="score-card-backdrop finish-round-backdrop" role="dialog" aria-modal="true" aria-label="Finish round">
      <div class="finish-round-sheet">
        <header class="score-card-head">
          <div>
            <p class="eyebrow">${hasMissing ? "Score Check" : "Finish Round"}</p>
            <h2>${hasMissing ? "Some holes need scores" : "Save this round?"}</h2>
            <p>${hasMissing
              ? `Missing score entry for hole${missing.length === 1 ? "" : "s"} ${missing.join(", ")}.`
              : "Your scorecard is complete. Save it to stats or discard it."}</p>
          </div>
          <button class="icon-action" type="button" data-action="close-finish-round" aria-label="Close finish round">X</button>
        </header>
        <div class="finish-round-actions">
          ${hasMissing ? `<button class="secondary-action" type="button" data-action="review-missing-scores">Add Missing Scores</button>` : ""}
          <button class="primary-action" type="button" data-action="confirm-save-round">Save Round</button>
          <button class="finish-action" type="button" data-action="discard-round">Discard Round</button>
        </div>
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
  if (snapshotAvailableForHole(hole, course)) {
    return renderSnapshotHoleVisual(hole, course);
  }
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

function renderSnapshotHoleVisual(hole, course) {
  const courseId = course?.id || photoCourseId(hole);
  const snapshot = normalizeHoleSnapshot(hole?.snapshot);
  const anchors = azureHoleAnchors(hole, course);
  if (!snapshot || !anchors) {
    return renderAzureHoleVisual(hole, course);
  }
  const marker = photoTargetMarkers(hole.par);
  const panelRatio = satellitePanelRatio();
  const transform = snapshotDisplayTransform(snapshot, anchors, marker, panelRatio);
  if (!transform) {
    return renderAzureHoleVisual(hole, course);
  }

  const tee = { x: marker.tee[0], y: marker.tee[1] };
  const green = { x: marker.green[0], y: marker.green[1] };
  const gpsPoint = gps.status === "ready" && gps.position ? snapshotGeoToTargetPoint(snapshot, gps.position, transform) : null;
  const start = gpsPoint || tee;
  const shotPlan = resolveSnapshotShotPlan(courseId, hole, anchors, snapshot, transform);
  const trackedShotOverlay = renderSnapshotTrackedShotOverlay(hole, snapshot, transform);
  const routePoints = shotPlan
    ? [start, ...shotPlan.viewPoints, green].map((point) => `${point.x},${point.y}`).join(" ")
    : "";
  const guide = shotPlan ? "" : `<line class="photo-guide-route" x1="${start.x}" y1="${start.y}" x2="${green.x}" y2="${green.y}"></line>`;
  const zoom = photoEditMode ? 1 : photoZoomLevel(courseId, hole.number);
  const pan = photoPanOffset(courseId, hole.number, zoom);
  const markerScale = Number((1 / Math.max(1, zoom)).toFixed(4));
  const zoomClass = zoom > 1 ? " zoomed" : "";
  const attribution = snapshot.attribution || "Imagery: Azure Maps";
  return `
    <section class="hole-visual photo-hole azure-hole snapshot-hole${shotPlan ? " planning" : ""}${zoomClass}" style="--photo-marker-scale:${markerScale}; --satellite-panel-ratio:${panelRatio};" data-snapshot-hole="${hole.number}" data-azure-hole="${hole.number}" data-azure-course-id="${courseId}" aria-label="${escapeAttribute(course?.name || "Course")} saved satellite snapshot hole ${hole.number}">
      <div class="photo-pan-layer" style="transform:${photoPanTransform(pan)};">
        <div class="photo-zoom-layer" style="transform:scale(${zoom});">
          <div class="azure-tile-layer loaded snapshot-tile-layer" data-azure-tile-layer>
            <svg class="snapshot-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <image class="snapshot-map-image" href="${escapeAttribute(snapshot.imageUrl)}" x="0" y="0" width="100" height="100" preserveAspectRatio="none" transform="${snapshotImageTransform(transform)}" data-azure-tile data-loaded="1"></image>
            </svg>
          </div>
          <svg class="photo-hole-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="snapshot-shot-gradient-${hole.number}" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#ff4fd8"></stop>
                <stop offset="1" stop-color="#8d5cff"></stop>
              </linearGradient>
            </defs>
            ${guide}
            ${trackedShotOverlay}
            ${shotPlan ? `<polyline class="photo-plan-route" points="${routePoints}" stroke="url(#snapshot-shot-gradient-${hole.number})"></polyline>` : ""}
            ${shotPlan?.viewPoints.map((point, index) => `
              <circle class="photo-plan-point" data-photo-plan-point="${index}" cx="${point.x}" cy="${point.y}" r="1.9"></circle>
              <path class="photo-plan-cross" data-photo-plan-cross="${index}" d="M ${point.x - 1.4} ${point.y} L ${point.x + 1.4} ${point.y} M ${point.x} ${point.y - 1.4} L ${point.x} ${point.y + 1.4}"></path>
            `).join("") || ""}
          </svg>
          ${renderPhotoGreenMarkerElement(green, hole.par)}
          ${renderPhotoTeeMarkerElement(tee, Boolean(gpsPoint))}
          ${renderPhotoGpsMarker(gpsPoint)}
        </div>
      </div>
      <div class="photo-info-stack">
        <div class="photo-hole-badge">
          <span>Hole ${hole.number}</span>
          <strong>Par ${hole.par}</strong>
          <span>${firstHoleYardage(hole.yards)} yd</span>
          <span>SI ${hole.strokeIndex}</span>
          <em>Saved snapshot</em>
        </div>
        ${renderAzureShotInfo(courseId, hole, shotPlan)}
      </div>
      ${renderPhotoClubPanel(hole, shotPlan)}
      ${renderGpsTestControls(hole, courseId)}
      ${renderPhotoZoomControls(courseId, hole.number, zoom)}
      <div class="satellite-attribution">${escapeHtml(attribution)}</div>
    </section>
  `;
}

function renderAzureHoleVisual(hole, course) {
  const courseId = course?.id || photoCourseId(hole);
  const anchors = azureHoleAnchors(hole, course);
  const marker = photoTargetMarkers(hole.par);
  const panelRatio = satellitePanelRatio();
  const map = azureMapViewForHole(anchors, marker, panelRatio);
  if (!map) {
    return renderMappedHoleVisual(hole);
  }
  const tee = { x: marker.tee[0], y: marker.tee[1] };
  const green = { x: marker.green[0], y: marker.green[1] };
  const gpsPoint = gps.status === "ready" && gps.position ? azureGeoToTargetPoint(anchors, gps.position, marker, panelRatio) : null;
  const start = gpsPoint || tee;
  const shotPlan = resolveAzureShotPlan(courseId, hole, anchors, marker, panelRatio);
  const trackedShotOverlay = renderTrackedShotOverlay(hole, anchors, marker, panelRatio);
  const routePoints = shotPlan
    ? [start, ...shotPlan.viewPoints, green].map((point) => `${point.x},${point.y}`).join(" ")
    : "";
  const guide = shotPlan ? "" : `<line class="photo-guide-route" x1="${start.x}" y1="${start.y}" x2="${green.x}" y2="${green.y}"></line>`;
  const zoom = photoEditMode ? 1 : photoZoomLevel(courseId, hole.number);
  const pan = photoPanOffset(courseId, hole.number, zoom);
  const markerScale = Number((1 / Math.max(1, zoom)).toFixed(4));
  const zoomClass = zoom > 1 ? " zoomed" : "";
  const editClass = photoEditMode ? " editing" : "";
  return `
    <section class="hole-visual photo-hole azure-hole${shotPlan ? " planning" : ""}${zoomClass}${editClass}" style="--photo-marker-scale:${markerScale}; --satellite-panel-ratio:${panelRatio};" data-azure-hole="${hole.number}" data-azure-course-id="${courseId}" aria-label="${escapeAttribute(course?.name || "Course")} Azure satellite hole ${hole.number}">
      <div class="photo-pan-layer" style="transform:${photoPanTransform(pan)};">
        <div class="photo-zoom-layer" style="transform:scale(${zoom});">
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
            ${trackedShotOverlay}
            ${shotPlan ? `<polyline class="photo-plan-route" points="${routePoints}" stroke="url(#azure-shot-gradient-${hole.number})"></polyline>` : ""}
            ${shotPlan?.viewPoints.map((point, index) => `
              <circle class="photo-plan-point" data-photo-plan-point="${index}" cx="${point.x}" cy="${point.y}" r="1.9"></circle>
              <path class="photo-plan-cross" data-photo-plan-cross="${index}" d="M ${point.x - 1.4} ${point.y} L ${point.x + 1.4} ${point.y} M ${point.x} ${point.y - 1.4} L ${point.x} ${point.y + 1.4}"></path>
            `).join("") || ""}
          </svg>
          ${renderPhotoGreenMarkerElement(green, hole.par)}
          ${renderPhotoTeeMarkerElement(tee, Boolean(gpsPoint))}
          ${renderPhotoGpsMarker(gpsPoint)}
          ${photoEditMode ? `
            <button class="photo-drag-handle tee" type="button" style="left:${tee.x}%; top:${tee.y}%;" data-azure-handle="tee" data-course-id="${courseId}" data-hole="${hole.number}" aria-label="Drag satellite tee anchor">T</button>
            <button class="photo-drag-handle green" type="button" style="left:${green.x}%; top:${green.y}%;" data-azure-handle="green" data-course-id="${courseId}" data-hole="${hole.number}" aria-label="Drag satellite green anchor">G</button>
          ` : ""}
        </div>
      </div>
      ${photoEditMode ? `<p class="photo-edit-help">Drag T or G onto the real satellite tee box or green.</p>` : ""}
      <div class="photo-info-stack">
        <div class="photo-hole-badge">
          <span>Hole ${hole.number}</span>
          <strong>Par ${hole.par}</strong>
          <span>${firstHoleYardage(hole.yards)} yd</span>
          <span>SI ${hole.strokeIndex}</span>
          <em>${anchors.estimated ? "Estimated" : "Satellite"}</em>
        </div>
        ${renderAzureShotInfo(courseId, hole, shotPlan)}
      </div>
      ${photoEditMode ? "" : renderPhotoClubPanel(hole, shotPlan)}
      ${photoEditMode ? "" : renderGpsTestControls(hole, courseId)}
      ${photoEditMode ? "" : renderPhotoZoomControls(courseId, hole.number, zoom)}
      <div class="photo-align-toolbar">
        <button class="photo-tool-button" type="button" data-action="toggle-photo-edit">${photoEditMode ? "Done" : "Adjust"}</button>
        ${photoEditMode && anchors.edited ? `<button class="photo-tool-button" type="button" data-action="reset-satellite-anchor" data-course-id="${courseId}" data-hole="${hole.number}">Reset</button>` : ""}
      </div>
      <div class="satellite-attribution">${escapeHtml(map.attribution || SATELLITE_ATTRIBUTION)}</div>
    </section>
  `;
}

function renderTrackedShotOverlay(hole, anchors, marker, panelRatio) {
  const round = getActiveRound(state);
  const entry = round ? trackedRoundEntry(round, hole.number) : null;
  const shots = trackedShots(entry);
  const activeShot = trackedActiveShot(entry);
  const completed = shots
    .map((shot) => ({
      shot,
      start: azureGeoToTargetPoint(anchors, shot.start, marker, panelRatio),
      end: azureGeoToTargetPoint(anchors, shot.end, marker, panelRatio)
    }))
    .filter((item) => item.start && item.end);
  const activeStart = activeShot ? azureGeoToTargetPoint(anchors, activeShot.start, marker, panelRatio) : null;
  const activeEnd = activeShot && gps.status === "ready" && gps.position
    ? azureGeoToTargetPoint(anchors, gps.position, marker, panelRatio)
    : null;

  return `
    ${completed.map(({ shot, start, end }) => `
      <line class="tracked-shot-route" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"></line>
      <circle class="tracked-shot-landing" cx="${end.x}" cy="${end.y}" r="1.55"></circle>
      <text class="tracked-shot-label" x="${end.x + 1.8}" y="${end.y - 1.8}">${shot.number}</text>
    `).join("")}
    ${activeStart && activeEnd ? `
      <line class="tracked-shot-route active" x1="${activeStart.x}" y1="${activeStart.y}" x2="${activeEnd.x}" y2="${activeEnd.y}"></line>
      <circle class="tracked-shot-landing active" cx="${activeStart.x}" cy="${activeStart.y}" r="1.4"></circle>
    ` : ""}
  `;
}

function renderAzureTiles(map) {
  if (map.image) {
    return `
      <img class="azure-map-image" src="${map.image.src}" alt="" aria-hidden="true" loading="eager" decoding="async" referrerpolicy="no-referrer" data-azure-tile style="left:${map.image.left}%; top:${map.image.top}%; width:${map.image.width}%; height:${map.image.height}%; transform:rotate(${map.image.rotation}deg);" />
    `;
  }
  return map.tiles.map((tile) => `
    <img class="azure-map-tile" src="${satelliteTileUrl(tile.x, tile.y, map.zoom)}" alt="" aria-hidden="true" loading="eager" decoding="async" referrerpolicy="no-referrer" data-azure-tile data-fallback-src="${escapeAttribute(esriTileUrl(tile.x, tile.y, map.zoom))}" style="left:${tile.left}%; top:${tile.top}%; width:${tile.width}%; height:${tile.height}%; transform:rotate(${tile.rotation}deg);" />
  `).join("");
}

function queueCourseSatellitePreload(course, currentHoleNumber = 1) {
  if (!course?.holes?.length || !azureMapsEnabled) {
    return;
  }
  if (satellitePreloadCourseId !== course.id) {
    satellitePreloadCourseId = course.id;
    satellitePreloadQueue = [];
    satellitePreloadedUrls = new Set();
    satellitePreloadingUrls = new Set();
    satellitePreloadActive = 0;
  }
  const ratio = satellitePanelRatio();
  const orderedHoles = course.holes
    .slice()
    .sort((a, b) => {
      const aDistance = Math.abs(Number(a.number) - Number(currentHoleNumber));
      const bDistance = Math.abs(Number(b.number) - Number(currentHoleNumber));
      return aDistance - bDistance || Number(a.number) - Number(b.number);
    });
  const queuedUrls = new Set([...satellitePreloadQueue.map((item) => item.src), ...satellitePreloadingUrls]);
  orderedHoles.forEach((hole) => {
    const snapshot = normalizeHoleSnapshot(hole?.snapshot);
    const items = snapshot
      ? [{ src: snapshot.imageUrl }]
      : satelliteMapPreloadItems(azureMapViewForHole(azureHoleAnchors(hole, course), photoTargetMarkers(hole.par), ratio));
    items.forEach((item) => {
      if (!item.src || satellitePreloadedUrls.has(item.src) || queuedUrls.has(item.src)) {
        return;
      }
      queuedUrls.add(item.src);
      satellitePreloadQueue.push(item);
    });
  });
  scheduleSatellitePreload();
}

function satelliteMapPreloadItems(map) {
  if (!map) {
    return [];
  }
  if (map.image?.src) {
    return [{ src: map.image.src }];
  }
  return (map.tiles || []).map((tile) => ({
    src: satelliteTileUrl(tile.x, tile.y, map.zoom),
    fallbackSrc: azureMapsKey ? esriTileUrl(tile.x, tile.y, map.zoom) : ""
  }));
}

function scheduleSatellitePreload() {
  const scheduler = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 80));
  scheduler(runSatellitePreloadQueue);
}

function runSatellitePreloadQueue() {
  while (satellitePreloadActive < SATELLITE_PRELOAD_CONCURRENCY && satellitePreloadQueue.length) {
    const item = satellitePreloadQueue.shift();
    if (!item?.src || satellitePreloadedUrls.has(item.src)) {
      continue;
    }
    satellitePreloadingUrls.add(item.src);
    satellitePreloadActive += 1;
    preloadSatelliteImage(item.src, item.fallbackSrc).finally(() => {
      satellitePreloadingUrls.delete(item.src);
      satellitePreloadedUrls.add(item.src);
      satellitePreloadActive = Math.max(0, satellitePreloadActive - 1);
      if (satellitePreloadQueue.length) {
        scheduleSatellitePreload();
      }
    });
  }
}

function preloadSatelliteImage(src, fallbackSrc = "") {
  return new Promise((resolve) => {
    const image = new Image();
    let triedFallback = false;
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve();
    image.onerror = () => {
      if (fallbackSrc && !triedFallback) {
        triedFallback = true;
        image.src = fallbackSrc;
        return;
      }
      resolve();
    };
    image.src = src;
  });
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
            ${renderPhotoPlanRoute(marker, shotPlan, hole.number)}
          </svg>
          ${renderPhotoGreenMarkerElement({ x: marker.green[0], y: marker.green[1] }, hole.par)}
          ${renderPhotoTeeMarkerElement({ x: marker.tee[0], y: marker.tee[1] }, Boolean(gpsMarker))}
          ${renderPhotoGpsMarker(gpsMarker)}
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
        ${!photoEditMode && satelliteAvailableForHole(hole, course) ? `<button class="photo-tool-button" type="button" data-action="toggle-azure-maps">Satellite</button>` : ""}
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
    <span class="photo-gps-marker${gpsTestEnabled() ? " draggable" : ""}" style="left:${marker.x}%; top:${marker.y}%;"${dragAttributes}>
      <span class="photo-gps-hit"></span>
      <span class="photo-gps-pulse"></span>
      <span class="photo-gps-dot"></span>
    </span>
  `;
}

function renderSnapshotTrackedShotOverlay(hole, snapshot, transform) {
  const round = getActiveRound(state);
  const entry = round ? trackedRoundEntry(round, hole.number) : null;
  const shots = trackedShots(entry);
  const activeShot = trackedActiveShot(entry);
  const completed = shots
    .map((shot) => ({
      shot,
      start: snapshotGeoToTargetPoint(snapshot, shot.start, transform),
      end: snapshotGeoToTargetPoint(snapshot, shot.end, transform)
    }))
    .filter((item) => item.start && item.end);
  const activeStart = activeShot ? snapshotGeoToTargetPoint(snapshot, activeShot.start, transform) : null;
  const activeEnd = activeShot && gps.status === "ready" && gps.position
    ? snapshotGeoToTargetPoint(snapshot, gps.position, transform)
    : null;

  return `
    ${completed.map(({ shot, start, end }) => `
      <line class="tracked-shot-route" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"></line>
      <circle class="tracked-shot-landing" cx="${end.x}" cy="${end.y}" r="1.55"></circle>
      <text class="tracked-shot-label" x="${end.x + 1.8}" y="${end.y - 1.8}">${shot.number}</text>
    `).join("")}
    ${activeStart && activeEnd ? `
      <line class="tracked-shot-route active" x1="${activeStart.x}" y1="${activeStart.y}" x2="${activeEnd.x}" y2="${activeEnd.y}"></line>
      <circle class="tracked-shot-landing active" cx="${activeStart.x}" cy="${activeStart.y}" r="1.4"></circle>
    ` : ""}
  `;
}

function renderPhotoGreenMarkerElement(marker, par) {
  const size = Number(par) === 3 ? 36 : 32;
  return `
    <span class="photo-green-marker" style="left:${marker.x}%; top:${marker.y}%; --marker-size:${size}px;">
      <span class="photo-green-core"></span>
    </span>
  `;
}

function renderPhotoTeeMarkerElement(marker, reference = false) {
  const size = reference ? 12 : 18;
  return `<span class="photo-tee-marker${reference ? " reference" : ""}" style="left:${marker.x}%; top:${marker.y}%; --marker-size:${size}px;"></span>`;
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
  const clubs = activeBagClubs()
    .filter((club) => Number(club.carryYards) > 0)
    .sort((a, b) => Math.abs(Number(a.carryYards) - target) - Math.abs(Number(b.carryYards) - target));
  return clubs[0] || null;
}

function activeBag() {
  const bags = Array.isArray(state.bags) ? state.bags : [];
  return bags.find((bag) => bag.id === state.activeBagId) || bags[0] || null;
}

function activeBagClubs() {
  return activeBag()?.clubs || state.clubs || [];
}

function syncActiveBagClubs() {
  state.clubs = activeBagClubs().map((club) => ({ ...club }));
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

function snapshotAvailableForHole(hole, course = activeVisualCourse()) {
  return Boolean(validHoleSnapshot(hole?.snapshot, hole, course) && azureHoleAnchors(hole, course));
}

function validHoleSnapshot(snapshot, hole = null, course = null) {
  const normalized = normalizeHoleSnapshot(snapshot);
  if (!normalized) {
    return false;
  }
  if (!hole) {
    return true;
  }
  const signature = snapshotGeometrySignature(course?.id || "", hole);
  return !normalized.geometrySignature || normalized.geometrySignature === signature;
}

function normalizeHoleSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }
  const imageUrl = String(snapshot.imageUrl || snapshot.url || "").trim();
  const center = normalizeGeoPoint(snapshot.center);
  const zoom = Number(snapshot.zoom);
  const width = Number(snapshot.width);
  const height = Number(snapshot.height);
  const tileSize = Number(snapshot.tileSize || AZURE_MAPS_STATIC_TILE_SIZE);
  if (!imageUrl || !center || !Number.isFinite(zoom) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return {
    ...snapshot,
    imageUrl,
    center,
    zoom,
    width,
    height,
    tileSize: Number.isFinite(tileSize) && tileSize > 0 ? tileSize : AZURE_MAPS_STATIC_TILE_SIZE,
    pixelRatio: Number(snapshot.pixelRatio || 1),
    geometrySignature: String(snapshot.geometrySignature || "").trim()
  };
}

function azureMapsActiveForHole(hole, course = activeVisualCourse()) {
  return Boolean(azureMapsEnabled && satelliteAvailableForHole(hole, course));
}

function satelliteAvailableForHole(hole, course = activeVisualCourse()) {
  return Boolean(azureHoleAnchors(hole, course));
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
  return true;
}

function saveAzureMapsEnabled() {
  try {
    localStorage.setItem(AZURE_MAPS_ENABLED_STORAGE, azureMapsEnabled ? "1" : "0");
  } catch {
    // In-memory toggle still works for this session.
  }
}

function satelliteTileUrl(x, y, zoom) {
  return azureMapsKey ? azureTileUrl(x, y, zoom) : esriTileUrl(x, y, zoom);
}

function azureTileUrl(x, y, zoom) {
  const params = new URLSearchParams({
    "api-version": "2024-04-01",
    tilesetId: "microsoft.imagery",
    zoom: String(zoom),
    x: String(x),
    y: String(y),
    tileSize: String(AZURE_MAPS_REQUEST_TILE_SIZE),
    view: "Auto",
    "subscription-key": azureMapsKey
  });
  return `https://atlas.microsoft.com/map/tile?${params.toString()}`;
}

function esriTileUrl(x, y, zoom) {
  return `${ESRI_WORLD_IMAGERY_URL}/${zoom}/${y}/${x}`;
}

function esriExportUrl(bounds) {
  const params = new URLSearchParams({
    bbox: [
      bounds.mercator.left,
      bounds.mercator.bottom,
      bounds.mercator.right,
      bounds.mercator.top
    ].map((value) => value.toFixed(3)).join(","),
    bboxSR: "3857",
    imageSR: "3857",
    size: `${bounds.imageWidth},${bounds.imageHeight}`,
    format: "jpgpng",
    transparent: "false",
    f: "image"
  });
  return `${ESRI_WORLD_IMAGERY_EXPORT_URL}?${params.toString()}`;
}

function azureHoleAnchors(hole, course = activeVisualCourse()) {
  const courseId = course?.id || photoCourseId(hole);
  const edited = satelliteAnchorEdit(courseId, hole?.number);
  if (edited?.tee && edited?.green) {
    return { tee: edited.tee, green: edited.green, estimated: false, edited: true };
  }
  if (hole?.tee && hole?.greenCenter) {
    return { tee: hole.tee, green: hole.greenCenter, estimated: false };
  }
  if (hole?.visual?.photo) {
    const points = photoSourcePoints(hole);
    const tee = photoSourcePointToGeo(courseId, hole, points.tee);
    const green = photoSourcePointToGeo(courseId, hole, points.green);
    if (tee && green) {
      return { tee, green, estimated: false };
    }
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

function confirmedHoleAnchors(course, hole) {
  const courseId = course?.id || photoCourseId(hole);
  const edited = satelliteAnchorEdit(courseId, hole?.number);
  if (validGeoPoint(edited?.tee) && validGeoPoint(edited?.green)) {
    return { tee: edited.tee, green: edited.green, edited: true };
  }
  if (validGeoPoint(hole?.tee) && validGeoPoint(hole?.greenCenter)) {
    return { tee: hole.tee, green: hole.greenCenter, edited: false };
  }
  return null;
}

function azureMapViewForHole(anchors, marker = photoTargetMarkers(4), panelRatio = satellitePanelRatio()) {
  if (!anchors?.tee || !anchors?.green) {
    return null;
  }
  const zoom = AZURE_MAPS_ZOOM;
  const tee = geoToWorldPixel(anchors.tee, zoom);
  const green = geoToWorldPixel(anchors.green, zoom);
  const ratio = normalizedSatelliteRatio(panelRatio);
  const transform = satelliteWorldTransform(tee, green, marker, ratio);
  if (!transform) {
    return null;
  }
  const worldCorners = [
    satelliteTargetToWorld({ x: -12, y: -12 }, transform, marker, ratio),
    satelliteTargetToWorld({ x: 112, y: -12 }, transform, marker, ratio),
    satelliteTargetToWorld({ x: 112, y: 112 }, transform, marker, ratio),
    satelliteTargetToWorld({ x: -12, y: 112 }, transform, marker, ratio)
  ].filter(Boolean);
  if (worldCorners.length !== 4) {
    return null;
  }
  if (!azureMapsKey) {
    const image = satelliteExportImage(worldCorners, transform, marker, ratio);
    return image ? { zoom, image, tiles: [], attribution: SATELLITE_ATTRIBUTION } : null;
  }
  const minTileX = Math.floor(Math.min(...worldCorners.map((point) => point.x)) / AZURE_MAPS_TILE_SIZE);
  const maxTileX = Math.floor(Math.max(...worldCorners.map((point) => point.x)) / AZURE_MAPS_TILE_SIZE);
  const minTileY = Math.floor(Math.min(...worldCorners.map((point) => point.y)) / AZURE_MAPS_TILE_SIZE);
  const maxTileY = Math.floor(Math.max(...worldCorners.map((point) => point.y)) / AZURE_MAPS_TILE_SIZE);
  const tiles = [];
  for (let x = minTileX; x <= maxTileX; x += 1) {
    for (let y = minTileY; y <= maxTileY; y += 1) {
      const origin = satelliteWorldToTarget({
        x: x * AZURE_MAPS_TILE_SIZE,
        y: y * AZURE_MAPS_TILE_SIZE
      }, transform, marker, ratio);
      tiles.push({
        x,
        y,
        left: Number(origin.x.toFixed(4)),
        top: Number(origin.y.toFixed(4)),
        width: Number((AZURE_MAPS_TILE_SIZE * transform.scale + 0.12).toFixed(4)),
        height: Number(((AZURE_MAPS_TILE_SIZE * transform.scale + 0.12) / ratio).toFixed(4)),
        rotation: Number(transform.rotation.toFixed(4))
      });
    }
  }
  return { zoom, tiles, attribution: "Imagery: Azure Maps" };
}

function satelliteExportImage(worldCorners, transform, marker, panelRatio = SATELLITE_PANEL_RATIO) {
  const left = Math.min(...worldCorners.map((point) => point.x));
  const right = Math.max(...worldCorners.map((point) => point.x));
  const top = Math.min(...worldCorners.map((point) => point.y));
  const bottom = Math.max(...worldCorners.map((point) => point.y));
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  const ratio = normalizedSatelliteRatio(panelRatio);
  const topLeft = satelliteWorldToTarget({ x: left, y: top }, transform, marker, ratio);
  const maxImageEdge = 1800;
  const imageScale = Math.min(2.5, maxImageEdge / Math.max(width, height));
  const imageWidth = Math.max(256, Math.round(width * imageScale));
  const imageHeight = Math.max(256, Math.round(height * imageScale));
  const mercatorTopLeft = worldPixelToWebMercator({ x: left, y: top }, AZURE_MAPS_ZOOM);
  const mercatorBottomRight = worldPixelToWebMercator({ x: right, y: bottom }, AZURE_MAPS_ZOOM);
  const bounds = {
    imageWidth,
    imageHeight,
    mercator: {
      left: mercatorTopLeft.x,
      top: mercatorTopLeft.y,
      right: mercatorBottomRight.x,
      bottom: mercatorBottomRight.y
    }
  };
  return {
    src: esriExportUrl(bounds),
    left: Number(topLeft.x.toFixed(4)),
    top: Number(topLeft.y.toFixed(4)),
    width: Number((width * transform.scale).toFixed(4)),
    height: Number(((height * transform.scale) / ratio).toFixed(4)),
    rotation: Number(transform.rotation.toFixed(4))
  };
}

function satelliteWorldTransform(tee, green, marker = photoTargetMarkers(4), panelRatio = SATELLITE_PANEL_RATIO) {
  const dx = green.x - tee.x;
  const dy = green.y - tee.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const ratio = normalizedSatelliteRatio(panelRatio);
  const targetLength = (marker.tee[1] - marker.green[1]) * ratio;
  if (length < 1 || targetLength < 1) {
    return null;
  }
  return {
    tee,
    unit: { x: dx / length, y: dy / length },
    scale: targetLength / length,
    rotation: Math.atan2(-(dx / length), -(dy / length)) * (180 / Math.PI)
  };
}

function satelliteWorldToTarget(world, transform, marker = photoTargetMarkers(4), panelRatio = SATELLITE_PANEL_RATIO) {
  const delta = {
    x: world.x - transform.tee.x,
    y: world.y - transform.tee.y
  };
  const progressPixels = delta.x * transform.unit.x + delta.y * transform.unit.y;
  const crossPixels = delta.x * -transform.unit.y + delta.y * transform.unit.x;
  const ratio = normalizedSatelliteRatio(panelRatio);
  return {
    x: marker.tee[0] + crossPixels * transform.scale,
    y: (marker.tee[1] * ratio - progressPixels * transform.scale) / ratio
  };
}

function satelliteTargetToWorld(point, transform, marker = photoTargetMarkers(4), panelRatio = SATELLITE_PANEL_RATIO) {
  if (!transform) {
    return null;
  }
  const ratio = normalizedSatelliteRatio(panelRatio);
  const progressPixels = ((marker.tee[1] - Number(point.y)) * ratio) / transform.scale;
  const crossPixels = (Number(point.x) - marker.tee[0]) / transform.scale;
  return {
    x: transform.tee.x + transform.unit.x * progressPixels - transform.unit.y * crossPixels,
    y: transform.tee.y + transform.unit.y * progressPixels + transform.unit.x * crossPixels
  };
}

function azureEventToPosition(panel, anchors, marker, event) {
  const rect = panel.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }
  const point = eventToPhotoLayerPercent(
    panel,
    event,
    panel.dataset.azureCourseId || state.selectedCourseId,
    panel.dataset.azureHole || ""
  );
  if (!point) {
    return null;
  }
  return azureTargetPointToGeo(anchors, point, marker, rect.height / rect.width);
}

function eventToPhotoLayerPercent(panel, event, courseId = "", holeNumber = "") {
  const rect = panel.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }
  const panelPoint = {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100
  };
  const zoom = photoZoomLevel(courseId, holeNumber);
  if (zoom <= 1) {
    return panelPoint;
  }
  const pan = photoPanOffset(courseId, holeNumber, zoom);
  return {
    x: 50 + (panelPoint.x - pan.x - 50) / zoom,
    y: 50 + (panelPoint.y - pan.y - 50) / zoom
  };
}

function geoToWorldPixel(position, zoom, tileSize = AZURE_MAPS_TILE_SIZE) {
  const lat = clamp(Number(position.lat), -85.05112878, 85.05112878);
  const lng = Number(position.lng);
  const scale = tileSize * 2 ** zoom;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  };
}

function worldPixelToGeo(pixel, zoom, tileSize = AZURE_MAPS_TILE_SIZE) {
  const scale = tileSize * 2 ** zoom;
  const lng = (pixel.x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * pixel.y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

function worldPixelToWebMercator(pixel, zoom) {
  const scale = AZURE_MAPS_TILE_SIZE * 2 ** zoom;
  const originShift = Math.PI * 6378137;
  return {
    x: (pixel.x / scale) * (originShift * 2) - originShift,
    y: originShift - (pixel.y / scale) * (originShift * 2)
  };
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

function resolveAzureShotPlan(courseId, hole, anchors, marker, panelRatio = satellitePanelRatio()) {
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
    viewPoints: points.map((point) => azureGeoToTargetPoint(anchors, point, marker, panelRatio)),
    segments
  };
}

function resolveSnapshotShotPlan(courseId, hole, anchors, snapshot, transform) {
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
    viewPoints: points.map((point) => snapshotGeoToTargetPoint(snapshot, point, transform)).filter(Boolean),
    segments
  };
}

function snapshotGeoToTargetPoint(snapshot, position, transform = null) {
  const imagePoint = snapshotGeoToImagePoint(snapshot, position);
  if (!imagePoint) {
    return null;
  }
  if (transform) {
    return snapshotImagePointToTarget(imagePoint, transform);
  }
  return imagePoint;
}

function snapshotGeoToImagePoint(snapshot, position) {
  const normalized = normalizeHoleSnapshot(snapshot);
  if (!normalized || !validGeoPoint(position)) {
    return null;
  }
  const centerWorld = geoToWorldPixel(normalized.center, normalized.zoom, normalized.tileSize);
  const pointWorld = geoToWorldPixel(position, normalized.zoom, normalized.tileSize);
  let dx = pointWorld.x - centerWorld.x;
  const worldSize = normalized.tileSize * 2 ** normalized.zoom;
  if (Math.abs(dx) > worldSize / 2) {
    dx += dx > 0 ? -worldSize : worldSize;
  }
  return {
    x: Number(clamp(50 + (dx / normalized.width) * 100, -8, 108).toFixed(2)),
    y: Number(clamp(50 + ((pointWorld.y - centerWorld.y) / normalized.height) * 100, -8, 108).toFixed(2))
  };
}

function snapshotTargetPointToGeo(snapshot, point, transform = null) {
  const normalized = normalizeHoleSnapshot(snapshot);
  if (!normalized || !point) {
    return null;
  }
  const imagePoint = transform ? snapshotTargetPointToImage(point, transform) : point;
  if (!imagePoint) {
    return null;
  }
  const centerWorld = geoToWorldPixel(normalized.center, normalized.zoom, normalized.tileSize);
  const world = {
    x: centerWorld.x + ((Number(imagePoint.x) - 50) / 100) * normalized.width,
    y: centerWorld.y + ((Number(imagePoint.y) - 50) / 100) * normalized.height
  };
  return worldPixelToGeo(world, normalized.zoom, normalized.tileSize);
}

function snapshotGeometrySignature(courseId, hole) {
  if (!hole) {
    return "";
  }
  return fnv1a(JSON.stringify({
    course: courseId || "",
    hole: Number(hole.number),
    tee: normalizeSignaturePoint(hole.tee),
    green: normalizeSignaturePoint(hole.greenCenter),
    front: normalizeSignaturePoint(hole.greenFront),
    back: normalizeSignaturePoint(hole.greenBack),
    polygon: holeGreenPolygon(hole).map(normalizeSignaturePoint).filter(Boolean)
  })).toString(16).padStart(8, "0");
}

function holeGreenPolygon(hole) {
  const polygon = hole?.geometry?.greenPolygon || hole?.greenPolygon || hole?.green?.polygon || [];
  return Array.isArray(polygon) ? polygon.filter(validGeoPoint) : [];
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function normalizeSignaturePoint(point) {
  const normalized = normalizeGeoPoint(point);
  return normalized ? { lat: normalized.lat, lng: normalized.lng } : null;
}

function snapshotDisplayTransform(snapshot, anchors, marker = photoTargetMarkers(4), panelRatio = SATELLITE_PANEL_RATIO) {
  const normalized = normalizeHoleSnapshot(snapshot);
  const tee = snapshotGeoToImagePoint(normalized, anchors?.tee);
  const green = snapshotGeoToImagePoint(normalized, anchors?.green);
  if (!normalized || !tee || !green || !marker?.tee || !marker?.green) {
    return null;
  }

  const sourceRatio = normalizedSatelliteRatio(normalized.height / normalized.width);
  const targetRatio = normalizedSatelliteRatio(panelRatio);
  const sourceTee = { x: tee.x, y: tee.y * sourceRatio };
  const sourceGreen = { x: green.x, y: green.y * sourceRatio };
  const targetTee = { x: Number(marker.tee[0]), y: Number(marker.tee[1]) * targetRatio };
  const targetGreen = { x: Number(marker.green[0]), y: Number(marker.green[1]) * targetRatio };
  const sourceVector = {
    x: sourceGreen.x - sourceTee.x,
    y: sourceGreen.y - sourceTee.y
  };
  const targetVector = {
    x: targetGreen.x - targetTee.x,
    y: targetGreen.y - targetTee.y
  };
  const lengthSquared = sourceVector.x * sourceVector.x + sourceVector.y * sourceVector.y;
  if (lengthSquared < 0.01) {
    return null;
  }

  const a = (targetVector.x * sourceVector.x + targetVector.y * sourceVector.y) / lengthSquared;
  const b = (targetVector.y * sourceVector.x - targetVector.x * sourceVector.y) / lengthSquared;
  const matrix = {
    a,
    b,
    c: -b,
    d: a,
    tx: targetTee.x - (a * sourceTee.x - b * sourceTee.y),
    ty: targetTee.y - (b * sourceTee.x + a * sourceTee.y)
  };
  return {
    ratio: targetRatio,
    sourceRatio,
    targetRatio,
    matrix,
    inverse: invertSnapshotMatrix(matrix)
  };
}

function snapshotImagePointToTarget(point, transform) {
  if (!point || !transform?.matrix) {
    return null;
  }
  const source = {
    x: Number(point.x),
    y: Number(point.y) * (transform.sourceRatio || transform.ratio || 1)
  };
  const target = applySnapshotMatrix(source, transform.matrix);
  return {
    x: Number(clamp(target.x, -32, 132).toFixed(2)),
    y: Number(clamp(target.y / (transform.targetRatio || transform.ratio || 1), -32, 132).toFixed(2))
  };
}

function snapshotTargetPointToImage(point, transform) {
  if (!point || !transform?.inverse) {
    return null;
  }
  const target = {
    x: Number(point.x),
    y: Number(point.y) * (transform.targetRatio || transform.ratio || 1)
  };
  const source = applySnapshotMatrix(target, transform.inverse);
  return {
    x: Number(source.x.toFixed(2)),
    y: Number((source.y / (transform.sourceRatio || transform.ratio || 1)).toFixed(2))
  };
}

function snapshotImageTransform(transform) {
  if (!transform?.matrix) {
    return "";
  }
  const { a, b, c, d, tx, ty } = transform.matrix;
  const sourceRatio = transform.sourceRatio || transform.ratio || 1;
  const targetRatio = transform.targetRatio || transform.ratio || 1;
  const svgA = a;
  const svgB = b / targetRatio;
  const svgC = c * sourceRatio;
  const svgD = (d * sourceRatio) / targetRatio;
  const svgTx = tx;
  const svgTy = ty / targetRatio;
  return `matrix(${formatTransformNumber(svgA)} ${formatTransformNumber(svgB)} ${formatTransformNumber(svgC)} ${formatTransformNumber(svgD)} ${formatTransformNumber(svgTx)} ${formatTransformNumber(svgTy)})`;
}

function applySnapshotMatrix(point, matrix) {
  return {
    x: matrix.a * point.x + matrix.c * point.y + matrix.tx,
    y: matrix.b * point.x + matrix.d * point.y + matrix.ty
  };
}

function invertSnapshotMatrix(matrix) {
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 0.000001) {
    return null;
  }
  const a = matrix.d / determinant;
  const b = -matrix.b / determinant;
  const c = -matrix.c / determinant;
  const d = matrix.a / determinant;
  return {
    a,
    b,
    c,
    d,
    tx: -(a * matrix.tx + c * matrix.ty),
    ty: -(b * matrix.tx + d * matrix.ty)
  };
}

function formatTransformNumber(value) {
  return Number(Number(value).toFixed(6));
}

function snapshotEventToPosition(panel, hole, event) {
  const snapshot = normalizeHoleSnapshot(hole?.snapshot);
  if (!snapshot) {
    return null;
  }
  const rect = panel.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }
  const courseId = panel.dataset.azureCourseId || state.selectedCourseId;
  const course = getCourse(state, courseId);
  const anchors = azureHoleAnchors(hole, course);
  const marker = photoTargetMarkers(hole.par);
  const transform = snapshotDisplayTransform(snapshot, anchors, marker, rect.height / rect.width);
  const point = eventToPhotoLayerPercent(panel, event, courseId, String(hole.number || ""));
  return snapshotTargetPointToGeo(snapshot, point, transform);
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

function azureGeoToTargetPoint(anchors, position, marker = photoTargetMarkers(4), panelRatio = SATELLITE_PANEL_RATIO) {
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
  const crossScale = (targetLength * normalizedSatelliteRatio(panelRatio)) / length;
  return {
    x: Number(clamp(marker.tee[0] + crossMeters * crossScale, -8, 108).toFixed(2)),
    y: Number(clamp(marker.tee[1] - progress * targetLength, -8, 108).toFixed(2))
  };
}

function azureTargetPointToGeo(anchors, point, marker = photoTargetMarkers(4), panelRatio = SATELLITE_PANEL_RATIO) {
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
  const crossMeters = (Number(point.x) - marker.tee[0]) * (length / (targetLength * normalizedSatelliteRatio(panelRatio)));
  const geoPerp = {
    x: fairway.y / length,
    y: -fairway.x / length
  };
  return localMetersToGeo(anchors.tee, {
    x: fairway.x * progress + geoPerp.x * crossMeters,
    y: fairway.y * progress + geoPerp.y * crossMeters
  });
}

function satellitePanelRatio() {
  const activeRound = getActiveRound(state);
  if (activeRound && view === "play" && typeof window !== "undefined" && window.innerWidth && window.innerHeight) {
    return normalizedSatelliteRatio(window.innerHeight / window.innerWidth);
  }
  return SATELLITE_PANEL_RATIO;
}

function normalizedSatelliteRatio(value) {
  const ratio = Number(value);
  return Number.isFinite(ratio) && ratio > 0 ? clamp(ratio, 0.45, 3.1) : SATELLITE_PANEL_RATIO;
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

function setSatelliteAnchorEdit(courseId, holeNumber, field, position, anchors) {
  if (!courseId || !holeNumber || !["tee", "green"].includes(field) || !position) {
    return;
  }
  const key = satelliteAnchorEditKey(courseId, holeNumber);
  const current = satelliteAnchorEdit(courseId, holeNumber) || {
    tee: anchors?.tee || null,
    green: anchors?.green || null
  };
  satelliteAnchorEdits = {
    ...satelliteAnchorEdits,
    [key]: {
      ...current,
      [field]: {
        lat: Number(Number(position.lat).toFixed(6)),
        lng: Number(Number(position.lng).toFixed(6))
      },
      updatedAt: new Date().toISOString()
    }
  };
  saveSatelliteAnchorEdits();
  applySatelliteAnchorEditToHole(courseId, holeNumber);
}

function applySatelliteAnchorEditToHole(courseId, holeNumber) {
  const course = getCourse(state, courseId);
  const hole = course?.holes?.find((item) => Number(item.number) === Number(holeNumber));
  const edited = satelliteAnchorEdit(courseId, holeNumber);
  if (!course || !hole || !validGeoPoint(edited?.tee) || !validGeoPoint(edited?.green)) {
    return false;
  }
  const currentSignature = snapshotGeometrySignature(course.id, hole);
  hole.tee = edited.tee;
  hole.greenCenter = edited.green;
  const estimated = estimateGreenFrontBackFromPolygon(
    edited.tee,
    edited.green,
    Array.isArray(hole.geometry?.greenPolygon) ? hole.geometry.greenPolygon : [],
    null,
    null
  );
  hole.greenFront = estimated.front || hole.greenFront || edited.green;
  hole.greenBack = estimated.back || hole.greenBack || edited.green;
  hole.mapping = pruneEmpty({
    ...(hole.mapping || {}),
    source: "PinScope satellite alignment",
    updatedAt: new Date().toISOString()
  });
  if (hole.snapshot && currentSignature !== snapshotGeometrySignature(course.id, hole)) {
    hole.snapshot = null;
  }
  saveState(state);
  return true;
}

function resetSatelliteAnchorEdit(courseId, holeNumber) {
  const key = satelliteAnchorEditKey(courseId, holeNumber);
  if (!satelliteAnchorEdits[key]) {
    return;
  }
  const next = { ...satelliteAnchorEdits };
  delete next[key];
  satelliteAnchorEdits = next;
  saveSatelliteAnchorEdits();
  render();
}

function clearSatelliteAnchorEditsForHoles(courseId, holeNumbers = []) {
  if (!courseId || !Array.isArray(holeNumbers) || !holeNumbers.length) {
    return;
  }
  const next = { ...satelliteAnchorEdits };
  let changed = false;
  holeNumbers.forEach((holeNumber) => {
    const key = satelliteAnchorEditKey(courseId, holeNumber);
    if (next[key]) {
      delete next[key];
      changed = true;
    }
  });
  if (changed) {
    satelliteAnchorEdits = next;
    saveSatelliteAnchorEdits();
  }
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
        <h3>${escapeHtml(courseDisplayName(course))}</h3>
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
  const completed = completedRoundSummaries();
  const filteredRounds = filteredStatRounds(completed);
  const summary = buildGameStats(filteredRounds);
  return `
    <section class="stats-hero">
      <div>
        <p class="eyebrow">Form Check</p>
        <h2>${statsFilterLabel()}</h2>
        <p>${summary.rounds ? `${summary.rounds} scored ${summary.rounds === 1 ? "round" : "rounds"} feeding this view` : "Finish a round to unlock your game picture."}</p>
      </div>
      ${renderStatsFilter()}
    </section>

    <section class="stats-grid">
      ${statTile("Avg score", summary.averageScore ? summary.averageScore.toFixed(1) : "-")}
      ${statTile("Avg to par", summary.averageToPar !== null ? formatSignedDecimal(summary.averageToPar) : "-")}
      ${statTile("Best round", summary.bestRound ? `${summary.bestRound.totals.score} (${formatToPar(summary.bestRound.totals.toPar)})` : "-")}
      ${statTile("Fairways", summary.fairwayPct !== null ? `${Math.round(summary.fairwayPct)}%` : "-")}
      ${statTile("GIR", summary.girPct !== null ? `${Math.round(summary.girPct)}%` : "-")}
      ${statTile("Putts / hole", summary.puttsPerHole ? summary.puttsPerHole.toFixed(1) : "-")}
    </section>

    ${renderRecentForm(summary)}
    ${renderGameInsights(summary)}
    ${renderScoringBreakdown(summary)}
    ${renderParSplit(summary)}
    ${renderCoursePerformance(summary)}
    ${renderHardestHoles(summary)}

    <section class="round-list">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">History</p>
          <h2>Rounds played</h2>
        </div>
      </div>
      ${filteredRounds.length ? filteredRounds.map(({ round, course }) => renderRoundRow(round, course)).join("") : `<p class="empty-copy">Finished rounds will appear here.</p>`}
    </section>
  `;
}

function renderStatsFilter() {
  const options = [
    ["all", "All"],
    ["last5", "Last 5"],
    ["last10", "Last 10"]
  ];
  return `
    <div class="stats-filter" role="group" aria-label="Stats range">
      ${options.map(([value, label]) => `
        <button class="${statsFilter === value ? "active" : ""}" type="button" data-action="stats-filter" data-filter="${value}">${label}</button>
      `).join("")}
    </div>
  `;
}

function statsFilterLabel() {
  if (statsFilter === "last5") {
    return "Last 5 rounds";
  }
  if (statsFilter === "last10") {
    return "Last 10 rounds";
  }
  return "All-time game stats";
}

function completedRoundSummaries() {
  return state.rounds
    .filter((round) => round.status === "complete")
    .map((round) => {
      const course = getCourse(state, round.courseId);
      if (!course) {
        return null;
      }
      const players = getRoundPlayers(round);
      const playerId = players[0]?.id || "player-1";
      return {
        round,
        course,
        playerId,
        totals: roundTotals(round, course, playerId),
        playedAt: Date.parse(round.completedAt || round.startedAt || "") || 0
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.playedAt - a.playedAt);
}

function filteredStatRounds(rounds) {
  if (statsFilter === "last5") {
    return rounds.slice(0, 5);
  }
  if (statsFilter === "last10") {
    return rounds.slice(0, 10);
  }
  return rounds;
}

function buildGameStats(rounds) {
  const holes = rounds.flatMap((summary) => statHoleRows(summary));
  const totalScore = rounds.reduce((sum, item) => sum + item.totals.score, 0);
  const totalToPar = rounds.reduce((sum, item) => sum + item.totals.toPar, 0);
  const putts = holes.reduce((sum, item) => sum + item.putts, 0);
  const penalties = holes.reduce((sum, item) => sum + item.penalties, 0);
  const fairways = holes.filter((item) => item.par > 3 && item.fairway !== "unset");
  const greens = holes.filter((item) => typeof item.gir === "boolean");
  const bestRound = rounds.length ? rounds.reduce((best, item) => item.totals.toPar < best.totals.toPar ? item : best, rounds[0]) : null;
  const scoringCounts = scoringDistribution(holes);
  return {
    rounds: rounds.length,
    holes,
    averageScore: rounds.length ? totalScore / rounds.length : 0,
    averageToPar: rounds.length ? totalToPar / rounds.length : null,
    bestRound,
    fairwayPct: fairways.length ? (fairways.filter((item) => item.fairway === "hit").length / fairways.length) * 100 : null,
    girPct: greens.length ? (greens.filter((item) => item.gir).length / greens.length) * 100 : null,
    puttsPerHole: holes.length ? putts / holes.length : 0,
    penaltiesPerRound: rounds.length ? penalties / rounds.length : 0,
    scoringCounts,
    parSplits: parSplits(holes),
    recentRounds: rounds.slice(0, 6).slice().reverse(),
    coursePerformance: coursePerformance(rounds),
    hardestHoles: hardestHoles(holes),
    insights: gameInsights(rounds, holes)
  };
}

function statHoleRows(summary) {
  return summary.course.holes.map((hole) => {
    const entry = getPlayerEntry(summary.round, hole.number, summary.playerId);
    if (!entry) {
      return null;
    }
    const score = Number(entry.score || 0);
    const par = Number(hole.par || 0);
    return {
      courseId: summary.course.id,
      courseName: courseDisplayName(summary.course),
      holeNumber: hole.number,
      par,
      score,
      toPar: score - par,
      putts: Number(entry.putts || 0),
      penalties: Number(entry.penalties || 0),
      fairway: entry.fairway || "unset",
      gir: Boolean(entry.gir)
    };
  }).filter(Boolean);
}

function scoringDistribution(holes) {
  return holes.reduce((counts, hole) => {
    if (hole.toPar <= -1) {
      counts.birdie += 1;
    } else if (hole.toPar === 0) {
      counts.par += 1;
    } else if (hole.toPar === 1) {
      counts.bogey += 1;
    } else {
      counts.double += 1;
    }
    return counts;
  }, { birdie: 0, par: 0, bogey: 0, double: 0 });
}

function parSplits(holes) {
  return [3, 4, 5].map((par) => {
    const rows = holes.filter((hole) => hole.par === par);
    const totalScore = rows.reduce((sum, hole) => sum + hole.score, 0);
    const totalToPar = rows.reduce((sum, hole) => sum + hole.toPar, 0);
    return {
      par,
      holes: rows.length,
      averageScore: rows.length ? totalScore / rows.length : 0,
      averageToPar: rows.length ? totalToPar / rows.length : 0
    };
  });
}

function coursePerformance(rounds) {
  const groups = new Map();
  rounds.forEach((item) => {
    const key = item.course.venueId || item.course.id;
    const current = groups.get(key) || {
      course: item.course,
      rounds: 0,
      score: 0,
      toPar: 0,
      best: item.totals
    };
    current.rounds += 1;
    current.score += item.totals.score;
    current.toPar += item.totals.toPar;
    if (item.totals.toPar < current.best.toPar) {
      current.best = item.totals;
    }
    groups.set(key, current);
  });
  return Array.from(groups.values())
    .map((item) => ({
      ...item,
      averageScore: item.score / item.rounds,
      averageToPar: item.toPar / item.rounds
    }))
    .sort((a, b) => b.rounds - a.rounds || a.averageToPar - b.averageToPar);
}

function hardestHoles(holes) {
  const groups = new Map();
  holes.forEach((hole) => {
    const key = `${hole.courseId}-${hole.holeNumber}`;
    const current = groups.get(key) || {
      courseName: hole.courseName,
      holeNumber: hole.holeNumber,
      par: hole.par,
      played: 0,
      toPar: 0,
      putts: 0,
      penalties: 0
    };
    current.played += 1;
    current.toPar += hole.toPar;
    current.putts += hole.putts;
    current.penalties += hole.penalties;
    groups.set(key, current);
  });
  return Array.from(groups.values())
    .filter((item) => item.played > 0)
    .map((item) => ({
      ...item,
      averageToPar: item.toPar / item.played,
      averagePutts: item.putts / item.played
    }))
    .sort((a, b) => b.averageToPar - a.averageToPar)
    .slice(0, 3);
}

function gameInsights(rounds, holes) {
  if (!rounds.length) {
    return [];
  }
  const insights = [];
  const fairways = holes.filter((item) => item.par > 3 && item.fairway !== "unset");
  const fairwayPct = fairways.length ? (fairways.filter((item) => item.fairway === "hit").length / fairways.length) * 100 : null;
  const girPct = holes.length ? (holes.filter((item) => item.gir).length / holes.length) * 100 : null;
  const puttsPerHole = holes.length ? holes.reduce((sum, item) => sum + item.putts, 0) / holes.length : null;
  const penaltiesPerRound = rounds.length ? holes.reduce((sum, item) => sum + item.penalties, 0) / rounds.length : null;

  if (penaltiesPerRound !== null && penaltiesPerRound >= 1) {
    insights.push({
      label: "Leak",
      title: "Penalties are costing shots",
      value: `${penaltiesPerRound.toFixed(1)} / round`,
      copy: "Clean up the big misses first. This is usually the fastest score drop."
    });
  }
  if (puttsPerHole !== null && puttsPerHole >= 2) {
    insights.push({
      label: "Putting",
      title: "Putts are heavy",
      value: `${puttsPerHole.toFixed(1)} / hole`,
      copy: "Track first-putt distance next if you want to separate lag putting from approach quality."
    });
  }
  if (girPct !== null && girPct < 35) {
    insights.push({
      label: "Approach",
      title: "Greens in regulation need work",
      value: `${Math.round(girPct)}% GIR`,
      copy: "The approach game is where the round is asking for attention."
    });
  }
  if (fairwayPct !== null && fairwayPct < 45) {
    insights.push({
      label: "Tee",
      title: "Fairways are under pressure",
      value: `${Math.round(fairwayPct)}% hit`,
      copy: "A safer tee club may be worth testing on tighter holes."
    });
  }
  const trend = roundTrend(rounds);
  if (trend) {
    insights.unshift(trend);
  }
  return insights.slice(0, 3);
}

function roundTrend(rounds) {
  if (rounds.length < 4) {
    return null;
  }
  const recent = rounds.slice(0, 3);
  const previous = rounds.slice(3, 6);
  if (!previous.length) {
    return null;
  }
  const recentAverage = recent.reduce((sum, item) => sum + item.totals.toPar, 0) / recent.length;
  const previousAverage = previous.reduce((sum, item) => sum + item.totals.toPar, 0) / previous.length;
  const change = recentAverage - previousAverage;
  return {
    label: change <= 0 ? "Trend" : "Watch",
    title: change <= 0 ? "Recent form is improving" : "Recent form has drifted",
    value: `${formatSignedDecimal(change)} vs prior`,
    copy: change <= 0 ? "Your last three are beating the previous sample." : "Worth checking whether penalties or putting caused it."
  };
}

function renderRecentForm(summary) {
  if (!summary.recentRounds.length) {
    return "";
  }
  const values = summary.recentRounds.map((item) => item.totals.toPar);
  const max = Math.max(4, ...values.map((value) => Math.abs(value)));
  return `
    <section class="stats-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Trend</p>
          <h2>Recent form</h2>
        </div>
      </div>
      <div class="form-chart">
        ${summary.recentRounds.map((item) => {
          const height = 26 + (Math.abs(item.totals.toPar) / max) * 74;
          return `
            <div class="form-bar ${item.totals.toPar <= 0 ? "good" : ""}">
              <span style="height:${height.toFixed(1)}%"></span>
              <strong>${formatToPar(item.totals.toPar)}</strong>
              <em>${formatShortDate(item.round.completedAt || item.round.startedAt)}</em>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderGameInsights(summary) {
  return `
    <section class="stats-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Read</p>
          <h2>Game insights</h2>
        </div>
      </div>
      <div class="insight-grid">
        ${summary.insights.length ? summary.insights.map((item) => `
          <article class="insight-card">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.copy)}</p>
          </article>
        `).join("") : `<p class="empty-copy">Add a few scored rounds and PinScope will start calling out patterns.</p>`}
      </div>
    </section>
  `;
}

function renderScoringBreakdown(summary) {
  const total = Object.values(summary.scoringCounts).reduce((sum, value) => sum + value, 0);
  if (!total) {
    return "";
  }
  const items = [
    ["Birdie+", summary.scoringCounts.birdie],
    ["Par", summary.scoringCounts.par],
    ["Bogey", summary.scoringCounts.bogey],
    ["Double+", summary.scoringCounts.double]
  ];
  return `
    <section class="stats-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Scoring</p>
          <h2>Hole outcomes</h2>
        </div>
      </div>
      <div class="outcome-list">
        ${items.map(([label, value]) => `
          <div>
            <span>${label}</span>
            <strong>${value}</strong>
            <em style="width:${((value / total) * 100).toFixed(1)}%"></em>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderParSplit(summary) {
  if (!summary.holes.length) {
    return "";
  }
  return `
    <section class="stats-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Shape</p>
          <h2>Par 3 / 4 / 5 scoring</h2>
        </div>
      </div>
      <div class="par-split-grid">
        ${summary.parSplits.map((item) => `
          <article>
            <span>Par ${item.par}</span>
            <strong>${item.holes ? item.averageScore.toFixed(2) : "-"}</strong>
            <em>${item.holes ? `${formatSignedDecimal(item.averageToPar)} avg` : "No holes"}</em>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCoursePerformance(summary) {
  if (!summary.coursePerformance.length) {
    return "";
  }
  return `
    <section class="stats-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Courses</p>
          <h2>Course form</h2>
        </div>
      </div>
      <div class="course-stat-list">
        ${summary.coursePerformance.map((item) => `
          <article>
            <div>
              <h3>${escapeHtml(courseDisplayName(item.course))}</h3>
              <p>${item.rounds} ${item.rounds === 1 ? "round" : "rounds"} - best ${item.best.score} (${formatToPar(item.best.toPar)})</p>
            </div>
            <strong>${item.averageScore.toFixed(1)}</strong>
            <span>${formatSignedDecimal(item.averageToPar)}</span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderHardestHoles(summary) {
  if (!summary.hardestHoles.length) {
    return "";
  }
  return `
    <section class="stats-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Leaks</p>
          <h2>Hardest holes</h2>
        </div>
      </div>
      <div class="hard-hole-list">
        ${summary.hardestHoles.map((item) => `
          <article>
            <div>
              <h3>${escapeHtml(item.courseName)} - ${item.holeNumber}</h3>
              <p>Par ${item.par} - ${item.played} played - ${item.averagePutts.toFixed(1)} putts</p>
            </div>
            <strong>${formatSignedDecimal(item.averageToPar)}</strong>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function formatSignedDecimal(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  if (Math.abs(value) < 0.05) {
    return "E";
  }
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

function statTile(label, value) {
  return `
    <article class="stat-tile">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function renderRoundRow(round, providedCourse = null) {
  const course = providedCourse || getCourse(state, round.courseId);
  if (!course) {
    return "";
  }
  const players = getRoundPlayers(round);
  const date = new Date(round.completedAt || round.startedAt).toLocaleDateString();
  const leadTotals = roundTotals(round, course, players[0]?.id);
  const shotHoleCount = roundTrackedShotHoles(round, course).length;
  return `
    <article class="round-row previous-round-card">
      <details>
        <summary>
          <span>
            <strong>${escapeHtml(courseDisplayName(course))}</strong>
            <small>${date} - ${players.length} player${players.length === 1 ? "" : "s"}${shotHoleCount ? ` - tracked shots on ${shotHoleCount} hole${shotHoleCount === 1 ? "" : "s"}` : ""}</small>
          </span>
          <em>${leadTotals.score} (${formatToPar(leadTotals.toPar)})</em>
        </summary>
        <div class="previous-round-detail">
          <div class="previous-round-scoreline">
            ${players.map((player) => {
              const totals = roundTotals(round, course, player.id);
              return `<span>${escapeHtml(player.name)} <strong>${totals.score}</strong> <em>${formatToPar(totals.toPar)}</em></span>`;
            }).join("")}
          </div>
          ${renderPreviousRoundScorecard(round, course)}
          ${renderRoundShotMaps(round, course)}
        </div>
      </details>
    </article>
  `;
}

function renderPreviousRoundScorecard(round, course) {
  const holes = course.holes || [];
  const front = holes.slice(0, 9);
  const back = holes.slice(9, 18);
  const players = getRoundPlayers(round);
  const usedTeeIds = Array.from(new Set(players.map((player) => player.teeId || round.teeId || course.tees?.[0]?.id).filter(Boolean)));
  const usedTees = usedTeeIds
    .map((teeId) => (course.tees || []).find((tee) => tee.id === teeId) || { id: teeId, name: teeId, color: "#f8f7f1" })
    .filter(Boolean);
  return `
    <div class="previous-scorecard-scroll" aria-label="Previous round scorecard">
      <table class="round-scorecard-table previous-scorecard-table">
        <thead>
          <tr>
            <th>TEES</th>
            ${front.map((hole) => `<th>${hole.number}</th>`).join("")}
            <th>OUT</th>
            <th class="initials-cell">INITIALS</th>
            ${back.map((hole) => `<th>${hole.number}</th>`).join("")}
            <th>IN</th>
            <th>TOTAL</th>
            <th>HCP</th>
            <th>NET</th>
          </tr>
        </thead>
        <tbody>
          ${usedTees.map((tee) => renderRoundScorecardTeeRow(tee, front, back)).join("")}
          ${renderRoundScorecardInfoRow("SI", front, back, (hole) => hole.strokeIndex || "-")}
          ${renderRoundScorecardInfoRow("PAR", front, back, (hole) => hole.par || "-", true)}
          ${players.map((player) => renderRoundScorecardPlayerRow(round, course, player, front, back)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function roundTrackedShotHoles(round, course) {
  const holes = (round.entries || [])
    .map((entry) => ({
      holeNumber: entry.holeNumber,
      hole: (course?.holes || []).find((hole) => Number(hole.number) === Number(entry.holeNumber)),
      shots: trackedShots(entry).filter((shot) => validGeoPointLike(shot.start) && validGeoPointLike(shot.end))
    }))
    .filter((entry) => entry.hole && entry.shots.length);
  return holes;
}

function renderRoundShotMaps(round, course) {
  const holes = roundTrackedShotHoles(round, course);
  if (!holes.length) {
    return `<p class="empty-copy">No tracked shots saved for this round.</p>`;
  }
  return `
    <div class="round-shot-gallery">
      ${holes.map((entry) => `
        <details>
          <summary>Hole ${entry.holeNumber} - ${entry.shots.length} tracked shot${entry.shots.length === 1 ? "" : "s"}</summary>
          ${renderRoundShotMap(course, entry.hole, entry.shots)}
          ${renderRoundShotList(entry.shots)}
        </details>
      `).join("")}
    </div>
  `;
}

function renderRoundShotList(shots) {
  return `
    <div class="round-shot-list">
      ${shots.map((shot) => `
        <div>
          <strong>Shot ${shot.number}</strong>
          <span>${Number.isFinite(Number(shot.yards)) ? Number(shot.yards) : "-"} yd</span>
          ${shot.end ? `<small>${formatShotLanding(shot.end)}</small>` : ""}
        </div>
      `).join("")}
    </div>
  `;
}

function renderRoundShotMap(course, hole, shots) {
  const snapshot = normalizeHoleSnapshot(hole?.snapshot);
  const anchors = azureHoleAnchors(hole, course);
  const marker = photoTargetMarkers(hole.par);
  const panelRatio = satellitePanelRatio();
  const transform = snapshot && anchors
    ? snapshotDisplayTransform(snapshot, anchors, marker, panelRatio)
    : null;
  const mapped = shots
    .map((shot) => {
      const start = transform
        ? snapshotGeoToTargetPoint(snapshot, shot.start, transform)
        : anchors
          ? azureGeoToTargetPoint(anchors, shot.start, marker, panelRatio)
          : null;
      const end = transform
        ? snapshotGeoToTargetPoint(snapshot, shot.end, transform)
        : anchors
          ? azureGeoToTargetPoint(anchors, shot.end, marker, panelRatio)
          : null;
      return start && end ? { shot, start, end } : null;
    })
    .filter(Boolean);

  if (!mapped.length) {
    return `<p class="empty-copy">Tracked shots were saved, but this hole does not have enough map data to draw them.</p>`;
  }

  const tee = transform && anchors ? snapshotGeoToTargetPoint(snapshot, anchors.tee, transform) : anchors ? azureGeoToTargetPoint(anchors, anchors.tee, marker, panelRatio) : null;
  const green = transform && anchors ? snapshotGeoToTargetPoint(snapshot, anchors.green, transform) : anchors ? azureGeoToTargetPoint(anchors, anchors.green, marker, panelRatio) : null;
  const image = transform && snapshot
    ? `<image class="snapshot-map-image" href="${escapeAttribute(snapshot.imageUrl)}" x="0" y="0" width="100" height="100" preserveAspectRatio="none" transform="${snapshotImageTransform(transform)}"></image>`
    : "";
  const gradientId = `previous-shot-gradient-${course.id}-${hole.number}`.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `
    <div class="previous-shot-map ${image ? "has-image" : ""}" style="--satellite-panel-ratio:${panelRatio};">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Tracked shot map for hole ${hole.number}">
        <defs>
          <linearGradient id="${gradientId}" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#35f0c1"></stop>
            <stop offset="100%" stop-color="#ff4fd8"></stop>
          </linearGradient>
        </defs>
        ${image}
        ${tee ? `<circle class="previous-shot-tee" cx="${tee.x}" cy="${tee.y}" r="1.7"></circle>` : ""}
        ${green ? `<circle class="previous-shot-green" cx="${green.x}" cy="${green.y}" r="2.2"></circle>` : ""}
        ${mapped.map(({ shot, start, end }) => `
          <line class="tracked-shot-route" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="url(#${gradientId})"></line>
          <circle class="tracked-shot-landing" cx="${end.x}" cy="${end.y}" r="1.7"></circle>
          <text class="tracked-shot-label" x="${clamp(end.x + 2, 4, 94)}" y="${clamp(end.y - 2, 6, 96)}">${shot.number}</text>
        `).join("")}
      </svg>
    </div>
  `;
}

function validGeoPointLike(point) {
  return Boolean(
    point &&
      Number.isFinite(Number(point.lat)) &&
      Number.isFinite(Number(point.lng)) &&
      Math.abs(Number(point.lat)) <= 90 &&
      Math.abs(Number(point.lng)) <= 180
  );
}

function formatShotLanding(point) {
  if (!validGeoPointLike(point)) {
    return "";
  }
  return `${Number(point.lat).toFixed(6)}, ${Number(point.lng).toFixed(6)}`;
}

function renderBag() {
  const bag = activeBag();
  const bags = Array.isArray(state.bags) && state.bags.length ? state.bags : [];
  const clubs = bag?.clubs || [];
  const longest = clubs.reduce((best, club) => Number(club.carryYards || 0) > Number(best?.carryYards || 0) ? club : best, null);
  return `
    <section class="bag-hero">
      <div>
        <p class="eyebrow">Active Loadout</p>
        <h2>${escapeHtml(bag?.name || "My Bag")}</h2>
        <p>${clubs.length} clubs tuned for recommendations${longest ? ` - longest ${escapeHtml(longest.name)} at ${Number(longest.carryYards)} yd` : ""}</p>
      </div>
      <div class="bag-hero-spots" aria-hidden="true"></div>
    </section>

    <section class="bag-switcher" aria-label="Golf bags">
      ${bags.map((item) => {
        const active = item.id === bag?.id;
        const clubCount = Array.isArray(item.clubs) ? item.clubs.length : 0;
        return `
          <button class="bag-switch ${active ? "active" : ""}" type="button" data-action="set-active-bag" data-bag-id="${escapeAttribute(item.id)}" aria-pressed="${active ? "true" : "false"}">
            <span>${active ? "Active" : "Bag"}</span>
            <strong>${escapeHtml(item.name)}</strong>
            <small>${clubCount} club${clubCount === 1 ? "" : "s"}</small>
          </button>
        `;
      }).join("")}
      <button class="bag-switch add" type="button" data-action="add-bag">
        <span>New</span>
        <strong>Add Bag</strong>
        <small>Copy current setup</small>
      </button>
    </section>

    <section class="tool-panel open-panel bag-editor">
      <div class="bag-editor-head">
        <div>
          <p class="eyebrow">Club Matrix</p>
          <h2>Name and Yardage</h2>
        </div>
      </div>
      <form data-form="bag" class="bag-list">
        <label class="bag-name-field">
          <span>Bag name</span>
          <input name="bagName" type="text" maxlength="32" value="${escapeAttribute(bag?.name || "")}" placeholder="Bag name" required />
        </label>
        <div class="club-table" role="list">
          ${clubs.map((club) => `
            <div class="club-row" role="listitem">
              <label>
                <span>Club</span>
                <input name="clubName-${escapeAttribute(club.id)}" type="text" maxlength="28" value="${escapeAttribute(club.name)}" placeholder="Club name" required />
              </label>
              <label>
                <span>Carry</span>
                <input name="clubYards-${escapeAttribute(club.id)}" type="number" min="0" max="400" step="1" value="${Number(club.carryYards || 0)}" inputmode="numeric" />
              </label>
              <button class="club-remove" type="button" data-action="remove-club" data-club-id="${escapeAttribute(club.id)}" aria-label="Remove ${escapeAttribute(club.name)}">x</button>
            </div>
          `).join("")}
        </div>
        <button class="add-club-row" type="button" data-action="add-club">
          <span>+</span>
          <strong>Add Club</strong>
        </button>
        <button class="primary-action full" type="submit">Save Active Bag</button>
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

  if (action === "track-shot") {
    trackShot();
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

  if (action === "reset-satellite-anchor") {
    resetSatelliteAnchorEdit(button.dataset.courseId, button.dataset.hole);
  }

  if (action === "toggle-gps-test-move") {
    gpsTestMoveMode = !gpsTestMoveMode;
    render();
  }

  if (action === "find-nearby") {
    importNearbyCourses();
  }

  if (action === "use-current-location-courses") {
    importCoursesForCurrentLocation();
  }

  if (action === "refresh-local-area" || action === "import-home-area") {
    importSelectedLocalAreaCourses();
  }

  if (action === "refresh-course-layout") {
    refreshCourseLayout(button.dataset.courseId || state.selectedCourseId);
  }

  if (action === "export-course-pack-json" || action === "export-shared-course-defaults") {
    exportCoursePackJson();
  }

  if (action === "select-course") {
    state.selectedCourseId = button.dataset.courseId;
    persist("Course selected.");
  }

  if (action === "quick-start") {
    openRoundSetup(button.dataset.courseId);
  }

  if (action === "add-setup-player") {
    roundSetupPlayerCount = clamp(roundSetupPlayerCount + 1, 1, 4);
    render();
  }

  if (action === "stats-filter") {
    statsFilter = button.dataset.filter || "all";
    render();
  }

  if (action === "dismiss-handicap-intro") {
    handicapSettings().introDismissed = true;
    persist("Handicap setup hidden.");
  }

  if (action === "set-active-bag") {
    setActiveBag(button.dataset.bagId);
  }

  if (action === "add-bag") {
    addBag();
  }

  if (action === "add-club") {
    addClubToActiveBag();
  }

  if (action === "remove-club") {
    removeClubFromActiveBag(button.dataset.clubId);
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
    handleScoreCardNext();
  }

  if (action === "finish-round") {
    requestFinishRound();
  }

  if (action === "close-finish-round") {
    finishRoundPrompt = null;
    render();
  }

  if (action === "review-missing-scores") {
    reviewMissingScores();
  }

  if (action === "confirm-save-round") {
    saveFinishedRound();
  }

  if (action === "discard-round") {
    discardActiveRound();
  }

  if (action === "open-score-card") {
    scoreCardOpen = true;
    render();
  }

  if (action === "open-round-scorecard") {
    roundScorecardOpen = true;
    render();
  }

  if (action === "close-round-scorecard") {
    roundScorecardOpen = false;
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

  if (form.dataset.form === "local-area-search") {
    const query = String(data.get("area") || "").trim();
    if (!query) {
      flash("Add an area first.");
      return;
    }
    form.reset();
    importCoursesForAreaQuery(query);
  }

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
    const courseId = resolveRoundCourseId(data, String(data.get("courseId") || state.selectedCourseId));
    if (!courseId) {
      return;
    }
    const players = [0, 1, 2, 3]
      .map((index) => ({
        id: `player-${index + 1}`,
        name: String(data.get(`playerName${index}`) || "").trim(),
        teeId: String(data.get(`playerTee${index}`) || "white"),
        handicap: parseHandicapInput(data.get(`playerHandicap${index}`))
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
    const bag = activeBag();
    if (!bag) {
      return;
    }
    bag.name = String(data.get("bagName") || bag.name || "My Bag").trim() || "My Bag";
    bag.clubs = bag.clubs.map((club) => ({
      ...club,
      name: String(data.get(`clubName-${club.id}`) || club.name || "Club").trim() || "Club",
      carryYards: clamp(Math.round(Number(data.get(`clubYards-${club.id}`) || 0)), 0, 400)
    }));
    syncActiveBagClubs();
    persist("Bag saved.");
  }

  if (form.dataset.form === "handicap-setup") {
    const value = Number(data.get("manualIndex"));
    if (!Number.isFinite(value)) {
      flash("Add a handicap number first.");
      return;
    }
    const settings = handicapSettings();
    settings.manualIndex = clamp(value, -10, 54);
    settings.introDismissed = true;
    form.reset();
    persist("Handicap saved.");
  }

}

function parseHandicapInput(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const handicap = Number(value);
  return Number.isFinite(handicap) ? clamp(handicap, -10, 54) : null;
}

function handicapSettings() {
  state.settings = state.settings || {};
  state.settings.handicap = {
    manualIndex: null,
    introDismissed: false,
    ...(state.settings.handicap || {})
  };
  return state.settings.handicap;
}

function setActiveBag(bagId) {
  if (!Array.isArray(state.bags) || !state.bags.some((bag) => bag.id === bagId)) {
    return;
  }
  state.activeBagId = bagId;
  syncActiveBagClubs();
  persist("Active bag changed.");
}

function addBag() {
  const source = activeBag();
  const id = `bag-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const bags = Array.isArray(state.bags) ? state.bags : [];
  const nextNumber = bags.length + 1;
  const clubs = (source?.clubs?.length ? source.clubs : defaultClubs).map((club) => ({
    ...club,
    id: `club-${Date.now()}-${Math.random().toString(16).slice(2)}-${club.id}`
  }));
  state.bags = [...bags, {
    id,
    name: `Bag ${nextNumber}`,
    clubs
  }];
  state.activeBagId = id;
  syncActiveBagClubs();
  persist("New bag created.");
}

function addClubToActiveBag() {
  const bag = activeBag();
  if (!bag) {
    return;
  }
  const nextClub = {
    id: `club-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "New club",
    carryYards: 100
  };
  bag.clubs = [...(bag.clubs || []), nextClub];
  syncActiveBagClubs();
  persist("Club added.");
}

function removeClubFromActiveBag(clubId) {
  const bag = activeBag();
  if (!bag || !Array.isArray(bag.clubs) || bag.clubs.length <= 1) {
    flash("Keep at least one club in the active bag.");
    return;
  }
  bag.clubs = bag.clubs.filter((club) => club.id !== clubId);
  syncActiveBagClubs();
  persist("Club removed.");
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
  if (event.target.matches("[data-action='round-signature']")) {
    updateRoundSignature(event.target);
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
  if (event.target.matches("[data-action='course-geometry-file']")) {
    const file = event.target.files?.[0];
    if (file) {
      importCourseGeometryFile(file, event.target.dataset.courseId || state.selectedCourseId);
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
  const fallbackSrc = tile.dataset.fallbackSrc || "";
  if (fallbackSrc && tile.dataset.fallbackTried !== "1" && tile.getAttribute("src") !== fallbackSrc) {
    tile.dataset.fallbackTried = "1";
    tile.removeAttribute("data-error");
    tile.setAttribute("src", fallbackSrc);
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
  const complete = tiles.length > 0 && loaded === tiles.length;
  const allFinished = tiles.length > 0 && loaded + failed === tiles.length;
  const status = layer.querySelector("[data-azure-map-status]");
  layer.classList.toggle("loaded", complete);
  layer.classList.toggle("failed", allFinished && failed > 0);
  if (status) {
    status.textContent = complete ? "Satellite ready" : allFinished && failed > 0 ? "Satellite incomplete" : "Loading satellite";
  }
}

function handleAzurePlanningClick(event) {
  if (suppressPhotoPlanningClick) {
    suppressPhotoPlanningClick = false;
    event.preventDefault();
    return;
  }
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
  const point = panel.dataset.snapshotHole
    ? snapshotEventToPosition(panel, hole, event)
    : azureEventToPosition(panel, anchors, photoTargetMarkers(hole.par), event);
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
  const panel = photoPanelFromEvent(event);
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
  const azureHandle = event.target.closest("[data-azure-handle]");
  if (azureHandle && photoEditMode) {
    beginSatelliteAnchorDrag(event, azureHandle);
    return;
  }
  if (!photoEditMode && beginSatellitePlanOrPanDrag(event)) {
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
  const teeInfo = photoPlanningTee(hole);
  const shotPlan = resolvePhotoShotPlan(hole, teeInfo);
  const hit = hitTestPhotoPlanPoint(canvas, shotPlan, event);
  if (hit) {
    beginPhotoShotDrag(event, panel, canvas, courseId, holeNumber, hole, shotPlan, hit);
    return;
  }
  if (event.target.closest("[data-action], [data-gps-test-marker], button, input, label, .photo-hole-badge, .photo-align-toolbar, .photo-yardage-card, .photo-tap-hint, .photo-club-panel, .photo-zoom-toolbar")) {
    return;
  }
  if (gpsTestEnabled() && gpsTestMoveMode) {
    beginGpsTestDragOnHole(event, panel, canvas, courseId, holeNumber, hole);
    return;
  }

  beginPhotoPanDrag(event, panel, canvas, courseId, holeNumber);
}

function beginSatellitePlanOrPanDrag(event) {
  if (event.defaultPrevented) {
    return false;
  }
  if (event.target.closest("[data-action], [data-gps-test-marker], button, input, label, .photo-hole-badge, .photo-align-toolbar, .photo-yardage-card, .photo-tap-hint, .photo-club-panel, .photo-zoom-toolbar")) {
    return false;
  }
  const panel = azurePanelFromEvent(event);
  if (!panel) {
    return false;
  }
  const courseId = panel.dataset.azureCourseId || "";
  const holeNumber = String(panel.dataset.azureHole || "");
  if (!courseId || !holeNumber) {
    return false;
  }
  trackPhotoPointer(event, panel, null, courseId, holeNumber);
  if (beginPhotoPinchIfReady(event, panel, null, courseId, holeNumber)) {
    return true;
  }
  const course = getCourse(state, courseId);
  const hole = course?.holes?.find((item) => item.number === Number(holeNumber));
  const anchors = hole ? azureHoleAnchors(hole, course) : null;
  const marker = hole ? photoTargetMarkers(hole.par) : photoTargetMarkers(4);
  const snapshot = hole ? normalizeHoleSnapshot(hole.snapshot) : null;
  const transform = panel.dataset.snapshotHole && snapshot && anchors
    ? snapshotDisplayTransform(snapshot, anchors, marker, panel.getBoundingClientRect().height / Math.max(1, panel.getBoundingClientRect().width))
    : null;
  const shotPlan = hole && anchors
    ? panel.dataset.snapshotHole && snapshot
      ? resolveSnapshotShotPlan(courseId, hole, anchors, snapshot, transform)
      : resolveAzureShotPlan(courseId, hole, anchors, marker, satellitePanelRatio())
    : null;
  const hit = hitTestPanelPlanPoint(panel, shotPlan, event, courseId, holeNumber);
  if (hit && hole && anchors) {
    beginAzureShotDrag(event, panel, courseId, holeNumber, hole, anchors, marker, snapshot, transform, shotPlan, hit);
    return true;
  }
  if (event.target.closest("[data-action], [data-gps-test-marker], button, input, label, .photo-hole-badge, .photo-align-toolbar, .photo-yardage-card, .photo-tap-hint, .photo-club-panel, .photo-zoom-toolbar")) {
    return false;
  }
  if (photoZoomLevel(courseId, holeNumber) > 1) {
    beginPhotoPanDrag(event, panel, null, courseId, holeNumber);
    return true;
  }
  return false;
}

function photoPanelFromEvent(event) {
  return event.target.closest(".photo-hole") || panelFromPoint(event, ".photo-hole");
}

function azurePanelFromEvent(event) {
  return event.target.closest(".azure-hole") || panelFromPoint(event, ".azure-hole");
}

function panelFromPoint(event, selector) {
  if (typeof document.elementsFromPoint !== "function") {
    return null;
  }
  return document.elementsFromPoint(event.clientX, event.clientY)
    .map((element) => element.closest?.(selector))
    .find(Boolean) || null;
}

function beginSatelliteAnchorDrag(event, handle) {
  const panel = handle.closest(".azure-hole");
  if (!panel || Number(event.button || 0) !== 0) {
    return;
  }
  const course = getCourse(state, panel.dataset.azureCourseId);
  const hole = course?.holes?.find((item) => item.number === Number(panel.dataset.azureHole));
  const anchors = hole ? azureHoleAnchors(hole, course) : null;
  if (!hole || !anchors) {
    return;
  }
  event.preventDefault();
  capturePhotoPointer(handle, event.pointerId);
  photoDrag = {
    type: "satellite-anchor",
    field: handle.dataset.azureHandle,
    courseId: panel.dataset.azureCourseId || "",
    holeNumber: String(panel.dataset.azureHole || ""),
    hole,
    anchors,
    marker: photoTargetMarkers(hole.par),
    panel,
    handle
  };
  handle.classList.add("dragging");
  moveSatelliteAnchorHandle(event);
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

function beginAzureShotDrag(event, panel, courseId, holeNumber, hole, anchors, marker, snapshot, transform, shotPlan, hit) {
  event.preventDefault();
  capturePhotoPointer(panel, event.pointerId);
  suppressPhotoPlanningClick = true;
  photoDrag = {
    type: "azure-shot",
    index: hit.index,
    hole,
    holeNumber,
    courseId,
    panel,
    anchors,
    marker,
    snapshot,
    transform,
    points: [...shotPlan.points],
    route: panel.querySelector(".photo-plan-route")
  };
  panel.classList.add("dragging-shot");
  moveAzurePlanPoint(event);
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
  if (photoDrag.type === "satellite-anchor") {
    moveSatelliteAnchorHandle(event);
    return;
  }
  if (photoDrag.type === "azure-shot") {
    moveAzurePlanPoint(event);
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
  if (photoDrag.type === "satellite-anchor") {
    finishSatelliteAnchorDrag(event);
    return;
  }
  if (photoDrag.type === "azure-shot") {
    finishAzurePlanDrag(event);
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
  const azurePanel = panel?.matches(".azure-hole") ? panel : null;
  if (!panel || (!canvas && !azurePanel)) {
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
  if (canvas) {
    updatePhotoZoomValue(canvas.dataset.photoCourseId, canvas.dataset.photoHole, direction);
  } else {
    updatePhotoZoomValue(azurePanel.dataset.azureCourseId, azurePanel.dataset.azureHole, direction);
  }
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
  const azurePanel = event.target.closest(".azure-hole");
  if (azurePanel && photoZoomLevel(azurePanel.dataset.azureCourseId, azurePanel.dataset.azureHole) > 1) {
    return;
  }

  holeSwipe = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    latestX: event.clientX,
    latestY: event.clientY
  };
  resetHoleSwipePreview();
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
    updateHoleSwipePreview(dx);
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
    resetHoleSwipePreview();
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
    resetHoleSwipePreview();
  }
}

function updateHoleSwipePreview(dx) {
  const screen = document.querySelector("[data-play-round]");
  if (!screen) {
    return;
  }
  const limited = clamp(dx * 0.22, -HOLE_SWIPE_PREVIEW_LIMIT, HOLE_SWIPE_PREVIEW_LIMIT);
  const intent = clamp(Math.abs(dx) / HOLE_SWIPE_MIN_DISTANCE, 0, 1);
  screen.classList.add("is-swiping-hole");
  screen.style.setProperty("--hole-swipe-drag", `${limited.toFixed(1)}px`);
  screen.style.setProperty("--hole-swipe-intent", intent.toFixed(2));
}

function resetHoleSwipePreview() {
  const screen = document.querySelector("[data-play-round]");
  if (!screen) {
    return;
  }
  screen.classList.remove("is-swiping-hole");
  screen.style.removeProperty("--hole-swipe-drag");
  screen.style.removeProperty("--hole-swipe-intent");
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

function finishAzurePlanDrag(event) {
  const geoPoint = azureDragEventToPosition(photoDrag, event) || photoDrag.latestGeoPoint;
  const courseId = photoDrag.courseId;
  const holeNumber = photoDrag.holeNumber;
  const index = photoDrag.index;
  const points = [...photoDrag.points];
  const anchors = photoDrag.anchors;
  photoDrag.panel.classList.remove("dragging-shot");
  photoDrag = null;
  window.setTimeout(() => {
    suppressPhotoPlanningClick = false;
  }, 250);

  if (!geoPoint || !courseId || !holeNumber || index < 0 || !anchors) {
    render();
    return;
  }

  points[index] = geoPoint;
  azureShotPlans = {
    ...azureShotPlans,
    [azureShotPlanKey(courseId, holeNumber)]: {
      points: sortAzurePlanPoints(anchors, points).slice(0, 4)
    }
  };
  render();
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

function moveAzurePlanPoint(event) {
  const viewPoint = eventToPhotoLayerPercent(photoDrag.panel, event, photoDrag.courseId, photoDrag.holeNumber);
  const geoPoint = azureDragEventToPosition(photoDrag, event, viewPoint);
  if (!viewPoint || !geoPoint) {
    return;
  }
  photoDrag.latestGeoPoint = geoPoint;
  updatePhotoPlanRouteDom(photoDrag.panel, photoDrag.index, viewPoint);
}

function azureDragEventToPosition(drag, event, viewPoint = null) {
  const point = viewPoint || eventToPhotoLayerPercent(drag.panel, event, drag.courseId, drag.holeNumber);
  if (!point) {
    return null;
  }
  if (drag.snapshot) {
    return snapshotTargetPointToGeo(drag.snapshot, point, drag.transform);
  }
  const rect = drag.panel.getBoundingClientRect();
  return azureTargetPointToGeo(drag.anchors, point, drag.marker, rect.height / Math.max(1, rect.width));
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

function moveSatelliteAnchorHandle(event) {
  event.preventDefault();
  const point = eventToPanelPercent(photoDrag.panel, event);
  if (!point) {
    return;
  }
  photoDrag.latestPoint = point;
  photoDrag.handle.style.left = `${point.x}%`;
  photoDrag.handle.style.top = `${point.y}%`;
}

function finishSatelliteAnchorDrag(event) {
  event.preventDefault();
  const drag = photoDrag;
  photoDrag = null;
  drag.handle.classList.remove("dragging");
  const point = drag.latestPoint || eventToPanelPercent(drag.panel, event);
  const rect = drag.panel?.getBoundingClientRect?.();
  const position = point ? azureTargetPointToGeo(drag.anchors, point, drag.marker, rect?.width && rect?.height ? rect.height / rect.width : satellitePanelRatio()) : null;
  if (!position) {
    render();
    return;
  }
  setSatelliteAnchorEdit(drag.courseId, drag.holeNumber, drag.field, position, drag.anchors);
  flash(`${drag.field === "green" ? "Green" : "Tee"} satellite anchor saved.`);
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
  return hitTestPlanViewPoint(pointer, shotPlan);
}

function hitTestPanelPlanPoint(panel, shotPlan, event, courseId = "", holeNumber = "") {
  const pointer = eventToPhotoLayerPercent(panel, event, courseId, holeNumber);
  return hitTestPlanViewPoint(pointer, shotPlan);
}

function hitTestPlanViewPoint(pointer, shotPlan) {
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
  const activeRound = getActiveRound(state);
  if (activeRound) {
    resumeActiveRound(activeRound, "Round already in progress.");
    return;
  }
  const course = getCourse(state, courseId);
  if (!course) {
    flash("Select a course first.");
    return;
  }
  if (!Array.isArray(course.holes) || course.holes.length === 0) {
    flash("That course needs hole data before starting a round.");
    return;
  }
  const tee = teeId || course.tees?.[0]?.id || "white";
  const round = createRound(course, tee);
  state.rounds = [round, ...state.rounds];
  state.activeRoundId = round.id;
  state.selectedCourseId = course.id;
  roundSetupPlayerCount = 1;
  view = "play";
  window.location.hash = "play";
  queueCourseSatellitePreload(course, round.currentHole);
  scrollToTop();
  persist("Round started.");
}

function resumeActiveRound(round = getActiveRound(state), message = "Continuing round.") {
  if (!round) {
    return false;
  }
  const course = getCourse(state, round.courseId);
  state.activeRoundId = round.id;
  if (course) {
    state.selectedCourseId = course.id;
    queueCourseSatellitePreload(course, round.currentHole || 1);
  }
  roundSetupPlayerCount = 1;
  view = "play";
  window.location.hash = "play";
  scrollToTop();
  persist(message);
  return true;
}

function openRoundSetup(courseId) {
  if (resumeActiveRound(getActiveRound(state))) {
    return;
  }
  const course = getCourse(state, courseId);
  if (!course) {
    flash("Course not found.");
    return;
  }
  state.selectedCourseId = courseId;
  state.activeRoundId = "";
  roundSetupPlayerCount = 1;
  view = "play";
  window.location.hash = "play";
  queueCourseSatellitePreload(course, 1);
  scrollToTop();
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
  if (field === "score") {
    playerEntry.scoreEntered = true;
  }
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
  if (button.dataset.field === "score") {
    playerEntry.scoreEntered = true;
  }
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

function updateRoundSignature(input) {
  const round = getActiveRound(state);
  if (!round) {
    return;
  }
  const field = input.dataset.field;
  if (!["scorer", "attest", "date"].includes(field)) {
    return;
  }
  round.signatures = {
    ...(round.signatures || {}),
    [field]: String(input.value || "").trim()
  };
  saveState(state);
}

function moveHole(delta) {
  const round = getActiveRound(state);
  const course = round ? getCourse(state, round.courseId) : null;
  if (!round || !course) {
    return;
  }
  const previousHole = round.currentHole;
  round.currentHole = clamp(round.currentHole + delta, 1, course.holes.length);
  if (round.currentHole === previousHole) {
    resetHoleSwipePreview();
    return;
  }
  if (delta > 0 && previousHole === course.holes.length) {
    scoreCardOpen = false;
  }
  persist();
}

function exportCoursePackJson() {
  const defaults = state.courses
    .map(courseToSharedDefault)
    .filter(Boolean);

  if (!defaults.length) {
    flash("No mapped courses are ready to export yet.");
    return;
  }

  const payload = {
    schema: "pinscope-course-pack-v1",
    exportedAt: new Date().toISOString(),
    courses: defaults
  };
  downloadTextFile("pinscope-course-pack.json", JSON.stringify(payload, null, 2), "application/json");
  flash(`Exported course pack JSON for ${defaults.length} course${defaults.length === 1 ? "" : "s"}. Put it in data/course-pack, then run the snapshot builder.`);
}

function courseToSharedDefault(course) {
  if (!course || !course.id || !Array.isArray(course.holes)) {
    return null;
  }

  const holes = course.holes.map((hole) => holeToSharedDefault(hole, course)).filter(Boolean);
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

function holeToSharedDefault(hole, course = null) {
  if (!hole || !Number.isFinite(Number(hole.number))) {
    return null;
  }

  const anchors = confirmedHoleAnchors(course, hole);
  const tee = anchors?.tee || hole.tee;
  const greenCenter = anchors?.green || hole.greenCenter;
  const geometry = normalizeExportGeometry(hole.geometry, hole.greenPolygon);
  const estimated = estimateGreenFrontBackFromPolygon(
    tee,
    greenCenter,
    geometry.greenPolygon || [],
    anchors?.edited ? null : hole.greenFront,
    anchors?.edited ? null : hole.greenBack
  );
  return pruneEmpty({
    number: Number(hole.number),
    name: hole.name || "",
    par: Number.isFinite(Number(hole.par)) ? Number(hole.par) : null,
    strokeIndex: Number.isFinite(Number(hole.strokeIndex)) ? Number(hole.strokeIndex) : null,
    yards: normalizeExportObject(hole.yards),
    tee: normalizeExportPoint(tee),
    greenCenter: normalizeExportPoint(greenCenter),
    greenFront: normalizeExportPoint(estimated.front),
    greenBack: normalizeExportPoint(estimated.back),
    geometry,
    mapping: pruneEmpty({
      ...normalizeExportObject(hole.mapping),
      satelliteAligned: Boolean(anchors?.edited)
    }),
    osm: hole.osm || null,
    snapshot: normalizeExportSnapshot(hole.snapshot),
    visual: sanitizeVisualCoordinates(hole.visual)
  });
}

function normalizeExportSnapshot(snapshot) {
  const normalized = normalizeHoleSnapshot(snapshot);
  if (!normalized) {
    return null;
  }
  return pruneEmpty({
    imageUrl: normalized.imageUrl,
    storageKey: normalized.storageKey || "",
    width: normalized.width,
    height: normalized.height,
    center: normalized.center,
    zoom: normalized.zoom,
    tileSize: normalized.tileSize || AZURE_MAPS_STATIC_TILE_SIZE,
    pixelRatio: normalized.pixelRatio || 1,
    provider: normalized.provider || "azure-maps",
    tileset: normalized.tileset || "microsoft.imagery",
    attribution: normalized.attribution || "Imagery: Azure Maps",
    generatedAt: normalized.generatedAt || "",
    fingerprint: normalized.fingerprint || "",
    geometrySignature: normalized.geometrySignature || ""
  });
}

function normalizeExportGeometry(geometry, fallbackGreenPolygon) {
  const source = geometry && typeof geometry === "object" ? geometry : {};
  const greenPolygon = normalizeExportPolygon(source.greenPolygon || fallbackGreenPolygon);
  const tees = normalizeExportArray(source.tees);
  const detection = normalizeExportObject(source.detection);
  return pruneEmpty({
    ...normalizeExportObject(source),
    greenPolygon,
    tees,
    detection
  });
}

function normalizeExportArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (validGeoPoint(item)) {
        return { ...item, ...roundGeoPoint(item) };
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
  if (!validGeoPoint(value)) {
    return null;
  }
  return roundGeoPoint(value);
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

function handleScoreCardNext() {
  const round = getActiveRound(state);
  const course = round ? getCourse(state, round.courseId) : null;
  if (!round || !course) {
    return;
  }
  if (Number(round.currentHole) >= course.holes.length) {
    requestFinishRound();
    return;
  }
  scoreCardOpen = false;
  moveHole(1);
}

function requestFinishRound() {
  const round = getActiveRound(state);
  const course = round ? getCourse(state, round.courseId) : null;
  if (!round || !course) {
    return;
  }
  const missing = missingScoreHoles(round, course);
  finishRoundPrompt = {
    missing,
    requestedAt: Date.now()
  };
  if (missing.length) {
    flash(`Missing scores on hole${missing.length === 1 ? "" : "s"} ${missing.join(", ")}.`);
  }
  render();
}

function missingScoreHoles(round, course) {
  return (course.holes || [])
    .filter((hole) => {
      const players = getRoundPlayers(round);
      return players.some((player) => {
        const entry = getPlayerEntry(round, hole.number, player.id) || getRoundEntry(round, hole.number);
        return !entry || entry.scoreEntered !== true;
      });
    })
    .map((hole) => hole.number);
}

function reviewMissingScores() {
  const round = getActiveRound(state);
  const missing = finishRoundPrompt?.missing || [];
  if (!round || !missing.length) {
    finishRoundPrompt = null;
    render();
    return;
  }
  round.currentHole = missing[0];
  finishRoundPrompt = null;
  scoreCardOpen = true;
  persist("Add the missing score, then finish again.");
}

function saveFinishedRound() {
  const round = getActiveRound(state);
  if (!round) {
    return;
  }
  round.status = "complete";
  round.completedAt = new Date().toISOString();
  state.activeRoundId = "";
  scoreCardOpen = false;
  roundScorecardOpen = false;
  finishRoundPrompt = null;
  view = "stats";
  window.location.hash = "stats";
  persist("Round saved.");
}

function discardActiveRound() {
  const round = getActiveRound(state);
  if (!round) {
    return;
  }
  state.rounds = state.rounds.filter((item) => item.id !== round.id);
  state.activeRoundId = "";
  scoreCardOpen = false;
  roundScorecardOpen = false;
  finishRoundPrompt = null;
  view = "courses";
  window.location.hash = "courses";
  persist("Round discarded.");
}

async function importNearbyCourses() {
  return importCoursesForCurrentLocation();
}

async function importCoursesForCurrentLocation() {
  if (!navigator.geolocation) {
    flash("GPS is not available in this browser.");
    return;
  }
  flash("Finding courses near you...");
  try {
    const position = await getCurrentPosition();
    const localArea = setActiveLocalArea({
      id: "gps-local-area",
      label: "Current Location",
      center: {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
    });
    await importCoursesForLocalArea(localArea, "Current Location");
  } catch (error) {
    flash(error.message || "Could not import nearby courses.");
  }
}

async function importCoursesForAreaQuery(query) {
  flash(`Finding courses near ${query}...`);
  try {
    const result = await geocodeLocalArea(query);
    const localArea = setActiveLocalArea({
      id: `area-${slugifyLocalArea(result.label)}`,
      label: result.label,
      center: result.center
    });
    await importCoursesForLocalArea(localArea, result.label);
  } catch (error) {
    flash(error.message || `Could not find courses near ${query}.`);
  }
}

async function importSelectedLocalAreaCourses() {
  const localArea = activeLocalArea();
  if (!localArea) {
    flash("Choose an area first.");
    return;
  }
  flash(`Refreshing ${localArea.label} courses...`);
  try {
    await importCoursesForLocalArea(localArea, localArea.label);
  } catch (error) {
    flash(error.message || `Could not refresh ${localArea.label} courses.`);
  }
}

async function importCoursesForLocalArea(localArea, label) {
  if (!localArea?.center) {
    throw new Error("Choose an area first.");
  }
  const courses = await findNearbyOsmCourses(localArea.center, localArea.radiusMeters);
  mergeImportedCourses(
    courses.map((course) => ({ ...course, homeAreaId: localArea.id })),
    label
  );
}

async function geocodeLocalArea(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "gb");
  url.searchParams.set("q", query);
  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`Area search failed (${response.status}).`);
  }
  const results = await response.json();
  const match = Array.isArray(results) ? results[0] : null;
  const center = normalizeGeoPoint({ lat: match?.lat, lng: match?.lon });
  if (!center) {
    throw new Error("No matching area found.");
  }
  return {
    label: localAreaLabel(match, query),
    center
  };
}

function localAreaLabel(match, fallback) {
  const address = match?.address || {};
  return String(
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.suburb ||
    match?.name ||
    fallback
  ).trim();
}

function slugifyLocalArea(value) {
  return String(value || "local")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "local";
}

function mergeImportedCourses(courses, label) {
  const namedCourses = courses.filter((course) => course.name !== "Unnamed golf course");
  const knownIds = new Set(state.courses.map((course) => course.id));
  const fresh = namedCourses.filter((course) => !knownIds.has(course.id));
  const updates = new Map(namedCourses.map((course) => [course.id, course]));
  state.courses = [
    ...fresh,
    ...state.courses.map((course) => (updates.has(course.id) ? mergeCourseShell(course, updates.get(course.id)) : course))
  ].sort(compareCourses);
  if (fresh[0]) {
    state.selectedCourseId = fresh[0].id;
  }
  const area = label ? `${label}: ` : "";
  persist(fresh.length ? `${area}imported ${fresh.length} courses.` : `${area}no new courses found.`);
}

function mergeCourseShell(existing, incoming) {
  const existingMapped = courseMappedHoleCount(existing);
  return {
    ...existing,
    ...incoming,
    holes: existingMapped ? existing.holes : incoming.holes,
    geometrySource: existing.geometrySource || incoming.geometrySource || ""
  };
}

async function refreshCourseLayout(courseId) {
  const course = getCourse(state, courseId);
  if (!course) {
    flash("Select a course first.");
    return;
  }
  flash(`Mapping ${course.name} from OSM...`);
  try {
    const layout = await fetchOsmCourseLayout(course);
    applyCourseGeometry(course.id, layout, {
      source: "OpenStreetMap",
      message: layout.mappedCount || layout.greenShapeCount
        ? `Mapped ${layout.mappedCount || 0} tee/green hole${(layout.mappedCount || 0) === 1 ? "" : "s"} and ${layout.greenShapeCount || 0} green shape${(layout.greenShapeCount || 0) === 1 ? "" : "s"} from course-locked OSM${layout.courseArea ? " boundary" : " area"}${layout.counts ? ` (${layout.counts.holeLines} hole lines, ${layout.counts.greens} greens, ${layout.counts.tees} tees found inside the course)` : ""}. Export the course pack, then run the snapshot builder.`
        : "No OSM hole geometry found for this course."
    });
  } catch (error) {
    flash(error.message || "Could not map holes from OSM.");
  }
}

async function importCourseGeometryFile(file, courseId) {
  try {
    const payload = JSON.parse(await file.text());
    applyCourseGeometry(courseId, payload, {
      source: payload.source || payload.schema || "PinScope Green Mapper",
      message: "Imported mapper geometry. Export the course pack, then run the snapshot builder."
    });
  } catch (error) {
    flash(error.message || "Could not import that geometry JSON.");
  }
}

function applyCourseGeometry(courseId, payload, options = {}) {
  const course = getCourse(state, courseId);
  if (!course) {
    flash("Select a course before importing geometry.");
    return;
  }
  const updates = normalizeCourseGeometryPayload(payload);
  if (!updates.length) {
    flash("No usable tee/green coordinates found in that geometry data.");
    return;
  }
  const byNumber = new Map(updates.map((hole) => [hole.number, hole]));
  let changed = 0;
  const changedHoleNumbers = [];
  course.holes = course.holes.map((hole) => {
    const update = byNumber.get(Number(hole.number));
    const cleaned = { ...hole, visual: sanitizeVisualCoordinates(hole.visual) };
    if (!update) {
      return cleaned;
    }
    changed += 1;
    changedHoleNumbers.push(Number(hole.number));
    const nextGeometry = {
      ...(cleaned.geometry || {}),
      ...(update.geometry || {})
    };
    return {
      ...cleaned,
      name: update.name || cleaned.name,
      snapshot: null,
      tee: update.tee || cleaned.tee || null,
      greenCenter: update.greenCenter || cleaned.greenCenter || null,
      greenFront: update.greenFront || cleaned.greenFront || null,
      greenBack: update.greenBack || cleaned.greenBack || null,
      yards: mergeHoleYards(cleaned.yards, update.yards),
      geometry: Object.keys(nextGeometry).length ? nextGeometry : cleaned.geometry,
      mapping: {
        ...(cleaned.mapping || {}),
        source: options.source || payload.source || payload.schema || "Imported geometry",
        updatedAt: new Date().toISOString(),
        osm: update.osm || cleaned.mapping?.osm || null
      }
    };
  });
  course.geometrySource = options.source || payload.source || payload.schema || "Imported geometry";
  course.attribution = mergeAttribution(course.attribution, payload.attribution);
  clearSatelliteAnchorEditsForHoles(course.id, changedHoleNumbers);
  persist(options.message || `Updated ${changed} mapped hole${changed === 1 ? "" : "s"}.`);
}

function normalizeCourseGeometryPayload(payload) {
  const holes = Array.isArray(payload?.holes)
    ? payload.holes
    : Array.isArray(payload?.course?.holes)
      ? payload.course.holes
      : [];
  return holes.map(normalizeGeometryHole).filter(Boolean);
}

function normalizeGeometryHole(raw) {
  if (!raw) {
    return null;
  }
  const number = Number(raw.number ?? raw.holeNumber ?? raw.ref ?? raw.hole);
  if (!Number.isFinite(number) || number < 1) {
    return null;
  }
  const greenCenter = normalizeGeoPoint(
    raw.greenCenter || raw.green?.center || raw.green || raw.pin || raw.centre || raw.center
  );
  const teeList = normalizeTeeList(raw.tees || raw.teeBoxes || raw.tee_box || raw.teeBox);
  const tee = normalizeGeoPoint(raw.tee || teeList[0]);
  if (!greenCenter && !tee) {
    return null;
  }
  const greenPolygon = normalizePolygon(raw.greenPolygon || raw.geometry?.greenPolygon || raw.geometry?.green || raw.green?.polygon);
  const estimated = estimateGreenFrontBackFromPolygon(
    tee,
    greenCenter,
    greenPolygon,
    normalizeGeoPoint(raw.greenFront || raw.green?.front),
    normalizeGeoPoint(raw.greenBack || raw.green?.back)
  );
  return {
    number,
    name: raw.name || raw.label || "",
    tee,
    greenCenter,
    greenFront: estimated.front,
    greenBack: estimated.back,
    yards: raw.yards,
    geometry: {
      greenPolygon,
      tees: teeList,
      detection: raw.detection || null
    },
    osm: raw.osm || null
  };
}

function normalizeTeeList(value) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item, index) => {
      const point = normalizeGeoPoint(item);
      if (!point) {
        return null;
      }
      return {
        name: item?.name || item?.colour || item?.color || `Tee ${index + 1}`,
        ...point,
        yards: Number.isFinite(Number(item?.yards)) ? Number(item.yards) : null,
        osm: item?.osm || null
      };
    })
    .filter(Boolean);
}

function normalizeGeoPoint(value) {
  if (!value) {
    return null;
  }
  if (Array.isArray(value) && value.length >= 2) {
    const a = Number(value[0]);
    const b = Number(value[1]);
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
      return roundGeoPoint({ lat: a, lng: b });
    }
    if (Math.abs(b) <= 90 && Math.abs(a) <= 180) {
      return roundGeoPoint({ lat: b, lng: a });
    }
    return null;
  }
  const lat = Number(value.lat ?? value.latitude);
  const lng = Number(value.lng ?? value.lon ?? value.longitude);
  return validGeoPoint({ lat, lng }) ? roundGeoPoint({ lat, lng }) : null;
}

function normalizePolygon(value) {
  const points = Array.isArray(value) ? value : [];
  const normalized = points.map(normalizeGeoPoint).filter(Boolean);
  return normalized.length >= 3 ? normalized : [];
}

function estimateGreenFrontBackFromPolygon(tee, greenCenter, polygon, suppliedFront, suppliedBack) {
  if (suppliedFront || suppliedBack) {
    return {
      front: suppliedFront || greenCenter || null,
      back: suppliedBack || greenCenter || null
    };
  }
  if (!validGeoPoint(tee) || !validGeoPoint(greenCenter)) {
    return { front: greenCenter || null, back: greenCenter || null };
  }
  const fairway = geoToLocalMeters(tee, greenCenter);
  const length = Math.hypot(fairway.x, fairway.y);
  if (length < 1) {
    return { front: greenCenter, back: greenCenter };
  }
  if (Array.isArray(polygon) && polygon.length >= 3) {
    let front = null;
    let back = null;
    let minProjection = Infinity;
    let maxProjection = -Infinity;
    for (const point of polygon) {
      const local = geoToLocalMeters(tee, point);
      const projection = (local.x * fairway.x + local.y * fairway.y) / length;
      if (projection < minProjection) {
        minProjection = projection;
        front = point;
      }
      if (projection > maxProjection) {
        maxProjection = projection;
        back = point;
      }
    }
    return { front: front || greenCenter, back: back || greenCenter };
  }
  const unit = { x: fairway.x / length, y: fairway.y / length };
  return {
    front: localMetersToGeo(greenCenter, { x: -unit.x * 10, y: -unit.y * 10 }),
    back: localMetersToGeo(greenCenter, { x: unit.x * 10, y: unit.y * 10 })
  };
}

function mergeHoleYards(existing = {}, incoming) {
  const next = { ...(existing || {}) };
  if (Number.isFinite(Number(incoming))) {
    next.mapped = Number(incoming);
  } else if (incoming && typeof incoming === "object" && !Array.isArray(incoming)) {
    Object.entries(incoming).forEach(([key, value]) => {
      if (Number.isFinite(Number(value))) {
        next[key] = Number(value);
      }
    });
  }
  return next;
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
  return next;
}

function isPercentPair(value) {
  return Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]));
}

function mergeAttribution(existing = "", incoming = "") {
  if (!incoming || String(existing).includes(incoming)) {
    return existing;
  }
  return existing ? `${existing} ${incoming}` : incoming;
}

function validGeoPoint(point) {
  return Boolean(point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng)) && Math.abs(Number(point.lat)) <= 90 && Math.abs(Number(point.lng)) <= 180);
}

function roundGeoPoint(point) {
  return {
    lat: Number(Number(point.lat).toFixed(6)),
    lng: Number(Number(point.lng).toFixed(6))
  };
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

function satelliteAnchorEdit(courseId, holeNumber) {
  return satelliteAnchorEdits[satelliteAnchorEditKey(courseId, holeNumber)] || null;
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

function loadSatelliteAnchorEdits() {
  const value = readLocalStorage(SATELLITE_ANCHOR_EDITS_STORAGE, {}, true);
  return value && typeof value === "object" ? value : {};
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

function satelliteAnchorEditKey(courseId, holeNumber) {
  return `${courseId || "course"}:${String(holeNumber || "")}`;
}

function saveSatelliteAnchorEdits() {
  try {
    localStorage.setItem(SATELLITE_ANCHOR_EDITS_STORAGE, JSON.stringify(satelliteAnchorEdits));
  } catch {
    // Edits still work in memory for this session.
  }
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
