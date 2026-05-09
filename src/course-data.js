const METERS_TO_YARDS = 1.0936132983;

export const defaultClubs = [
  { id: "driver", name: "Driver", carryYards: 230 },
  { id: "wood3", name: "3 wood", carryYards: 205 },
  { id: "hybrid", name: "Hybrid", carryYards: 180 },
  { id: "iron5", name: "5 iron", carryYards: 165 },
  { id: "iron7", name: "7 iron", carryYards: 145 },
  { id: "iron9", name: "9 iron", carryYards: 125 },
  { id: "pw", name: "PW", carryYards: 105 },
  { id: "sw", name: "SW", carryYards: 75 },
  { id: "putter", name: "Putter", carryYards: 0 }
];

export const defaultBags = [
  { id: "main-bag", name: "Main Bag", clubs: defaultClubs.map((club) => ({ ...club })) },
  { id: "second-bag", name: "Second Bag", clubs: defaultClubs.map((club) => ({ ...club })) }
];

export const seedCourses = [];

export function createPlaceholderCourse({ name, town, holesCount = 18, source = "manual" }) {
  const count = parseHolesCount(holesCount);
  return {
    id: `${source}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    source,
    name: name.trim(),
    town: town.trim(),
    country: "",
    holesCount: count,
    website: "",
    phone: "",
    attribution: source === "manual" ? "Entered manually." : "",
    tees: [
      { id: "white", name: "White", color: "#f8f7f1" },
      { id: "yellow", name: "Yellow", color: "#d7a44d" },
      { id: "red", name: "Red", color: "#e85d3f" }
    ],
    holes: Array.from({ length: count }, (_, index) => placeholderHole(index + 1))
  };
}

export function parseHolesCount(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clamp(Math.round(value), 1, 45);
  }
  const text = String(value || "").toLowerCase();
  if (text.includes("pitch")) {
    return 9;
  }
  const match = text.match(/\d+/);
  if (match) {
    return clamp(Number(match[0]), 1, 45);
  }
  return 18;
}

export function placeholderHole(number) {
  const parPattern = [4, 4, 3, 5, 4, 3, 5, 4, 4];
  const par = parPattern[(number - 1) % parPattern.length];
  const white = par === 3 ? 155 : par === 5 ? 500 : 370;
  return {
    number,
    name: `Hole ${number}`,
    par,
    strokeIndex: number,
    yards: {
      white,
      yellow: Math.max(90, white - 25),
      red: Math.max(80, white - 55)
    },
    tee: null,
    greenFront: null,
    greenCenter: null,
    greenBack: null,
    hazards: [],
    visual: {
      tee: [16, 76],
      green: [82, 26]
    },
    notes: ""
  };
}

export function createRound(course, teeId) {
  const startedAt = new Date().toISOString();
  const players = normalizeRoundPlayers(course, teeId);
  return {
    id: `round-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    courseId: course.id,
    teeId: players[0]?.teeId || "white",
    players,
    status: "active",
    startedAt,
    completedAt: "",
    currentHole: 1,
    entries: course.holes.map((hole) => ({
      holeNumber: hole.number,
      playerEntries: players.map((player) => makePlayerEntry(hole, player.id))
    }))
  };
}

function normalizeRoundPlayers(course, playerSetup) {
  if (Array.isArray(playerSetup)) {
    return playerSetup
      .filter((player) => String(player.name || "").trim())
      .map((player, index) => ({
        id: player.id || `player-${index + 1}`,
        name: String(player.name).trim(),
        teeId: player.teeId || course.tees?.[0]?.id || "white"
      }));
  }

  return [
    {
      id: "player-1",
      name: "Me",
      teeId: playerSetup || course.tees?.[0]?.id || "white"
    }
  ];
}

function makePlayerEntry(hole, playerId) {
  return {
    playerId,
    score: hole.par,
    scoreEntered: false,
    putts: 2,
    fairway: "unset",
    gir: false,
    penalties: 0,
    teeClubId: "driver",
    note: ""
  };
}

export function getCourse(state, courseId) {
  return state.courses.find((course) => course.id === courseId) || null;
}

export function getActiveRound(state) {
  return state.rounds.find((round) => round.id === state.activeRoundId && round.status === "active") || null;
}

export function getRoundEntry(round, holeNumber) {
  const entry = round.entries.find((candidate) => candidate.holeNumber === holeNumber);
  if (!entry) {
    return null;
  }
  return entry.playerEntries?.[0] || entry;
}

export function getRoundPlayers(round) {
  if (Array.isArray(round.players) && round.players.length) {
    return round.players;
  }
  return [{ id: "player-1", name: "Me", teeId: round.teeId || "white" }];
}

export function getPlayerEntry(round, holeNumber, playerId) {
  const entry = round.entries.find((candidate) => candidate.holeNumber === holeNumber);
  if (!entry) {
    return null;
  }
  if (Array.isArray(entry.playerEntries)) {
    return entry.playerEntries.find((candidate) => candidate.playerId === playerId) || null;
  }
  return playerId === "player-1" ? entry : null;
}

export function roundTotals(round, course, playerId = "") {
  const players = getRoundPlayers(round);
  const targetPlayerId = playerId || players[0]?.id || "player-1";
  const par = course.holes.reduce((sum, hole) => sum + Number(hole.par || 0), 0);
  const playerEntries = round.entries
    .map((entry) => {
      if (Array.isArray(entry.playerEntries)) {
        return entry.playerEntries.find((candidate) => candidate.playerId === targetPlayerId);
      }
      return targetPlayerId === "player-1" ? entry : null;
    })
    .filter(Boolean);
  const score = playerEntries.reduce((sum, entry) => sum + Number(entry.score || 0), 0);
  const putts = playerEntries.reduce((sum, entry) => sum + Number(entry.putts || 0), 0);
  const penalties = playerEntries.reduce((sum, entry) => sum + Number(entry.penalties || 0), 0);
  const completedHoles = playerEntries.filter((entry) => Number(entry.score) > 0).length;
  return { par, score, putts, penalties, completedHoles, toPar: score - par };
}

export function statSummary(rounds, courses) {
  const completed = rounds.filter((round) => round.status === "complete");
  const holes = completed.flatMap((round) => {
    const playerId = getRoundPlayers(round)[0]?.id || "player-1";
    return round.entries
      .map((entry) => ({
        round,
        entry: Array.isArray(entry.playerEntries)
          ? entry.playerEntries.find((candidate) => candidate.playerId === playerId)
          : entry
      }))
      .filter(({ entry }) => Boolean(entry));
  });
  const fairways = holes.filter(({ round, entry }) => {
    const course = courses.find((item) => item.id === round.courseId);
    const hole = course?.holes.find((candidate) => candidate.number === entry.holeNumber);
    return hole && Number(hole.par) > 3 && entry.fairway !== "unset";
  });
  const greens = holes.filter(({ entry }) => typeof entry.gir === "boolean");
  const putts = holes.reduce((sum, { entry }) => sum + Number(entry.putts || 0), 0);
  const totalScore = completed.reduce((sum, round) => {
    const course = courses.find((item) => item.id === round.courseId);
    return course ? sum + roundTotals(round, course).score : sum;
  }, 0);

  return {
    rounds: completed.length,
    holes: holes.length,
    averageScore: completed.length ? totalScore / completed.length : 0,
    fairwayPct: fairways.length
      ? (fairways.filter(({ entry }) => entry.fairway === "hit").length / fairways.length) * 100
      : 0,
    girPct: greens.length ? (greens.filter(({ entry }) => entry.gir).length / greens.length) * 100 : 0,
    puttsPerHole: holes.length ? putts / holes.length : 0
  };
}

export function yardsBetween(a, b) {
  if (!a || !b || typeof a.lat !== "number" || typeof b.lat !== "number") {
    return null;
  }

  const radiusMeters = 6371000;
  const phi1 = toRadians(a.lat);
  const phi2 = toRadians(b.lat);
  const dPhi = toRadians(b.lat - a.lat);
  const dLambda = toRadians(b.lng - a.lng);
  const sinDphi = Math.sin(dPhi / 2);
  const sinDlambda = Math.sin(dLambda / 2);
  const haversine =
    sinDphi * sinDphi + Math.cos(phi1) * Math.cos(phi2) * sinDlambda * sinDlambda;
  const distanceMeters = 2 * radiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return Math.round(distanceMeters * METERS_TO_YARDS);
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function formatToPar(value) {
  if (value === 0) {
    return "E";
  }
  return value > 0 ? `+${value}` : String(value);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
