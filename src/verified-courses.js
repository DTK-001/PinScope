import { placeholderHole } from "./course-data.js";
import { belhusPhotoClips, belhusPhotoCropSource } from "./belhus-photo-crops.js";
import { cranhamMapVisuals } from "./cranham-map-data.js";
import { cranhamPhotoClips, cranhamPhotoCropSource } from "./cranham-photo-crops.js";
import { homeArea } from "./local-area.js";

const CRANHAM_SCORECARD = {
  par: [4, 4, 3, 4, 3, 4, 5, 3, 4, 4, 3, 5, 3, 4, 4, 3, 4, 3],
  strokeIndex: [17, 5, 16, 3, 9, 15, 2, 11, 13, 4, 18, 7, 6, 10, 1, 12, 14, 8],
  white: [304, 324, 169, 328, 160, 349, 502, 166, 337, 358, 136, 479, 170, 362, 398, 152, 274, 151],
  yellow: [293, 316, 124, 317, 149, 340, 493, 151, 326, 349, 129, 467, 157, 319, 386, 143, 263, 139],
  red: [275, 306, 112, 303, 139, 327, 481, 132, 311, 336, 112, 449, 139, 308, 366, 134, 242, 98]
};

const BELHUS_COURSE_ID = "verified-belhus-park";
const BASILDON_COURSE_ID = "verified-basildon";
const CANVEY_COURSE_ID = "verified-castle-point-canvey";

const BELHUS_SCORECARD = {
  par: [4, 4, 4, 4, 4, 3, 4, 3, 4, 4, 3, 4, 4, 3, 4, 5, 3, 5],
  strokeIndex: [17, 13, 9, 1, 5, 7, 11, 15, 3, 16, 12, 6, 14, 10, 2, 4, 8, 18],
  white: [278, 299, 383, 400, 408, 192, 326, 136, 387, 327, 194, 353, 278, 172, 328, 491, 170, 482],
  yellow: [262, 288, 359, 388, 385, 182, 299, 124, 370, 306, 180, 339, 257, 161, 310, 473, 160, 460],
  red: [248, 276, 350, 373, 373, 170, 290, 112, 358, 295, 167, 323, 245, 146, 299, 457, 155, 445]
};

const BASILDON_SCORECARD = {
  par: [4, 3, 5, 3, 4, 4, 4, 4, 4, 5, 4, 3, 4, 3, 4, 5, 5, 4],
  strokeIndex: [1, 6, 11, 7, 18, 3, 13, 9, 15, 8, 5, 4, 2, 16, 17, 10, 14, 12],
  white: [453, 218, 506, 155, 290, 411, 338, 328, 330, 481, 372, 242, 392, 120, 287, 499, 482, 332],
  yellow: [443, 189, 474, 143, 278, 398, 325, 318, 320, 463, 357, 229, 374, 115, 280, 478, 469, 323],
  red: [384, 156, 395, 137, 269, 346, 309, 307, 289, 447, 353, 192, 358, 97, 272, 428, 397, 297]
};

const CANVEY_SCORECARD = {
  par: [4, 5, 4, 3, 5, 3, 4, 3, 4, 4, 3, 5, 4, 4, 4, 5, 3, 4],
  strokeIndex: [6, 12, 8, 2, 16, 14, 10, 18, 4, 15, 7, 17, 1, 13, 3, 11, 9, 5],
  white: [320, 471, 361, 207, 465, 160, 369, 135, 378, 285, 147, 470, 407, 312, 401, 478, 164, 372],
  red: [312, 460, 353, 198, 456, 156, 361, 133, 363, 259, 140, 464, 316, 253, 393, 473, 155, 365]
};

const CRANHAM_COORDS = [
  [51.558475, 0.283172, 51.556302, 0.281989],
  [51.55597, 0.281536, 51.553623, 0.280962],
  [51.553026, 0.281031, 51.553727, 0.279983],
  [51.553756, 0.279284, 51.556041, 0.28072],
  [51.555869, 0.281857, 51.55595, 0.283784],
  [51.556289, 0.284879, 51.558939, 0.28594],
  [51.559291, 0.28692, 51.555738, 0.286854],
  [51.555548, 0.286184, 51.555869, 0.28431],
  [51.556339, 0.284036, 51.558873, 0.285117],
  [51.55907, 0.284316, 51.556351, 0.283126],
  [51.556131, 0.28138, 51.557151, 0.281427],
  [51.557276, 0.280759, 51.554147, 0.278207],
  [51.553503, 0.278453, 51.5528, 0.280088],
  [51.552244, 0.280493, 51.55366, 0.277723],
  [51.554324, 0.277715, 51.557394, 0.277762],
  [51.557922, 0.279172, 51.556831, 0.278656],
  [51.555844, 0.278811, 51.557761, 0.279855],
  [51.558088, 0.280114, 51.557625, 0.281694]
];

const CRANHAM_VISUALS = [
  { path: [[77.3, 22.7], [46.2, 58.5], [22.7, 77.3]], water: [[52.6, 85.4]], bunkers: [[60.8, 61.8], [33.8, 53.4], [35.5, 77.5], [20.6, 80.9]] },
  { path: [[77.3, 22.7], [22.7, 57.3], [45.9, 77.3]], water: [[16.2, 21.2]], bunkers: [[19.3, 69.3], [57.2, 69.4], [46.5, 81.2]] },
  { path: [[77.3, 77], [22.7, 23]], water: [], bunkers: [[72.5, 45.4], [11.7, 11.8]] },
  { path: [[22.7, 77.3], [57.7, 36.1], [77.3, 22.7]], water: [[63.5, 22]], bunkers: [[57.2, 65.5], [65.8, 72.8], [85.8, 85.2], [41.9, 74.8]] },
  { path: [[22.7, 50.1], [59.7, 61], [77.3, 39]], water: [[45.2, 33.3]], bunkers: [[70.5, 70.7], [90.6, 75.6]] },
  { path: [[22.7, 77.3], [74.9, 44.7], [77.3, 22.7]], water: [], bunkers: [[31.6, 43.1], [66.5, 23.1], [85.5, 19], [41.5, 22.5]] },
  { path: [[77.3, 22.7], [64.7, 56], [22.7, 71.7], [75.5, 77.3]], water: [[66.1, 68.7]], bunkers: [[10.5, 28.5], [29.8, 25.5], [46.2, 47.9], [47.4, 52.5]] },
  { path: [[77.3, 68.7], [22.7, 31.3]], water: [], bunkers: [[20.7, 47.9], [76.6, 33.2], [65.4, 24.2], [35.3, 49.1]] },
  { path: [[22.7, 77.3], [52.2, 43.7], [77.3, 22.7]], water: [[21, 52.7]], bunkers: [[34.2, 90.8], [73.6, 42.5], [82.9, 20.8], [51.8, 34]] },
  { path: [[77.3, 22.7], [43.5, 56.8], [22.7, 77.3]], water: [[63, 54.7]], bunkers: [[42.3, 89.3], [74.9, 89.9], [91, 37.4], [35.5, 71]] },
  { path: [[41.5, 77.3], [58.5, 22.7]], water: [], bunkers: [[71.9, 33.8], [25.4, 32.6], [69.8, 14]] },
  { path: [[77.3, 22.7], [52, 51.1], [39.1, 76.2], [22.7, 77.3]], water: [[86.8, 15.1], [69.9, 18.2], [68.6, 44.3]], bunkers: [[65, 75.6], [69.9, 80.8], [85.7, 80.9], [81.2, 89.8]] },
  { path: [[22.7, 23.2], [77.3, 76.8]], water: [[17.6, 47.3]], bunkers: [[68.1, 78.1]] },
  { path: [[77.3, 77.3], [26, 56.5], [22.7, 22.7]], water: [[34.2, 39.9]], bunkers: [[75.8, 10.6], [90.2, 10.8], [86.1, 30.8], [63.4, 13.9]] },
  { path: [[38.4, 77.3], [64.7, 46.4], [35.3, 22.7]], water: [], bunkers: [[65.3, 90], [28.2, 44.3]] },
  { path: [[73.6, 22.7], [26.4, 77.3]], water: [], bunkers: [] },
  { path: [[22.7, 77.3], [63.1, 37.6], [77.3, 22.7]], water: [], bunkers: [[40.8, 82], [44.6, 87], [71.6, 16.6], [85.3, 18.6]] },
  { path: [[22.7, 26.7], [77.3, 73.3]], water: [[60.1, 64.1], [33, 81.7]], bunkers: [[9.8, 43.9], [18.9, 50.5]], signature: "Island green" }
];

export const verifiedCourses = [
  {
    id: "osm-way-23454278",
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Cranham Golf Course",
    town: "Upminster",
    postcode: "RM14 3NU",
    country: "England",
    holesCount: 18,
    par: "67",
    distanceMiles: 5.9,
    website: "https://www.cranhamgolfcourse.co.uk/",
    phone: "+44 1708 221177",
    location: { lat: 51.555764, lng: 0.282267 },
    attribution: "Identity from Cranham Golf Course official website. Hole geometry from OpenStreetMap contributors under ODbL.",
    photoSource: cranhamPhotoCropSource,
    verification: {
      status: "verified",
      updated: "2026-04-26",
      confidence: "Scorecard cross-checked against Golfify, GolfPass, LondonGolfCourses, and iGolfCollective. Official site confirms 18 holes, par 67, 5119 yards, address, phone, and island-green 18th.",
      sources: [
        { label: "Official site", url: "https://www.cranhamgolfcourse.co.uk/" },
        { label: "Golfify scorecard", url: "https://www.golfify.io/courses/cranham-golf-course" },
        { label: "GolfPass scorecard", url: "https://www.golfpass.com/travel-advisor/courses/32833-cranham-golf-course" },
        { label: "LondonGolfCourses scorecard", url: "https://londongolfcourses.com/course/cranham" },
        { label: "OpenStreetMap geometry", url: "https://www.openstreetmap.org/way/23454278" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "63.1", slope: "113", totalYards: 5119 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "62.9", slope: "113", totalYards: 4861 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "64.1", slope: "113", totalYards: 4570 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeCranhamHole(index))
  },
  {
    id: BELHUS_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Belhus Park Golf Club",
    town: "South Ockendon",
    postcode: "RM15 4PX",
    country: "England",
    holesCount: 18,
    par: "69",
    distanceMiles: 6.8,
    website: "https://www.belhusparkgc.co.uk/",
    phone: "+44 1708 853545",
    location: { lat: 51.507331, lng: 0.263364 },
    attribution: "Scorecard from Golfify and Belhus Park Golf Club scorecard page. Top-down image supplied by the user for PinScope hole alignment.",
    photoSource: belhusPhotoCropSource,
    verification: {
      status: "verified",
      updated: "2026-04-28",
      confidence: "Scorecard seeded from Golfify, with official Belhus Park Golf Club pages confirming club identity, contact details, and the scorecard page. Impulse Leisure confirms the 18-hole, par-69 parkland course.",
      sources: [
        { label: "Official scorecard page", url: "https://www.belhusparkgc.co.uk/scorecard" },
        { label: "Official contact page", url: "https://www.belhusparkgc.co.uk/contact" },
        { label: "Golfify scorecard", url: "https://www.golfify.io/courses/belhus-park-golf-club" },
        { label: "Impulse Leisure course page", url: "https://impulseleisure.co.uk/golf/" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "68.0", slope: "", totalYards: 5604 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "67.0", slope: "", totalYards: 5303 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "69.8", slope: "115", totalYards: 5082 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeBelhusHole(index))
  },
  {
    id: BASILDON_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Basildon Golf Course",
    town: "Basildon",
    postcode: "SS16 5JP",
    country: "England",
    holesCount: 18,
    par: "72",
    distanceMiles: 12.1,
    website: "https://www.glendalegolf.co.uk/basildon-golf-course/",
    phone: "+44 1268 533532",
    location: { lat: 51.5746, lng: 0.4372 },
    attribution: "Scorecard cross-checked from BlueGolf and GolfSherpa. Image alignment pending user-supplied top-down course image.",
    verification: {
      status: "verified",
      updated: "2026-05-02",
      confidence: "BlueGolf and GolfSherpa agree on the 18-hole, par-72 scorecard with 6236 white yards and 5976 yellow yards. Red yards are included from BlueGolf; tee-specific red par differs on some holes and will need tee-specific par support later.",
      sources: [
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/basildon/detailedscorecard.htm" },
        { label: "GolfSherpa scorecard", url: "https://golfsherpa.co.uk/courses/england/basildon-golf-club" },
        { label: "GolfPass course page", url: "https://www.golfpass.com/travel-advisor/courses/32437-basildon-golf-course" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "70.0", slope: "110", totalYards: 6236 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "", slope: "", totalYards: 5976 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "", slope: "", totalYards: 5433 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, BASILDON_SCORECARD, BASILDON_COURSE_ID))
  },
  {
    id: CANVEY_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Canvey Island Golf Course",
    town: "Canvey Island",
    postcode: "SS8 9FG",
    country: "England",
    holesCount: 18,
    par: "71",
    distanceMiles: 13.8,
    website: "https://www.glendalegolf.co.uk/castle-point-golf-course/",
    phone: "+44 1268 510830",
    location: { lat: 51.5354, lng: 0.5844 },
    attribution: "Castle Point / Canvey scorecard seeded from My Online Golf Club and cross-checked against Golfshake and Grassy. Image alignment pending user-supplied top-down course image.",
    verification: {
      status: "verified",
      updated: "2026-05-02",
      confidence: "Castle Point is the Canvey Island 18-hole course at Somnes Avenue. Public scorecard sources disagree slightly on total par and tee yardages; this seed uses the hole-by-hole My Online Golf Club card for white yards and SI, with the red yardages cross-checked against Grassy.",
      sources: [
        { label: "My Online Golf Club scorecard", url: "https://www.myonlinegolfclub.com/clubpage?clubID=1005" },
        { label: "Golfshake course page", url: "https://www.golfshake.com/course/view/14233/Castle_Point_Golf_Club.html" },
        { label: "Grassy scorecard", url: "https://www.grassy.golf/courses/castle-point-golf-course-gb-ess" },
        { label: "Albrecht Golf Guide", url: "https://www.1golf.eu/en/club/castle-point-golf-club/" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 5902 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "72.3", slope: "121", totalYards: 5610 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, CANVEY_SCORECARD, CANVEY_COURSE_ID))
  }
];

function makeCranhamHole(index) {
  const number = index + 1;
  const hole = placeholderHole(number);
  const [teeLat, teeLng, greenLat, greenLng] = CRANHAM_COORDS[index];
  const visual = cranhamMapVisuals.find((item) => item.ref === number) || CRANHAM_VISUALS[index];
  const photoClip = cranhamPhotoClips.find((item) => item.hole === number);
  const par = CRANHAM_SCORECARD.par[index];
  return {
    ...hole,
    name: number === 18 ? "Island Green" : `Hole ${number}`,
    par,
    strokeIndex: CRANHAM_SCORECARD.strokeIndex[index],
    yards: {
      white: CRANHAM_SCORECARD.white[index],
      yellow: CRANHAM_SCORECARD.yellow[index],
      red: CRANHAM_SCORECARD.red[index]
    },
    tee: { lat: teeLat, lng: teeLng },
    greenFront: offsetPoint(greenLat, greenLng, -0.00008, -0.00004),
    greenCenter: { lat: greenLat, lng: greenLng },
    greenBack: offsetPoint(greenLat, greenLng, 0.00008, 0.00004),
    hazards: [],
    visual: {
      ...visual,
      tee: visualPoint(visual.path, 0),
      green: visualPoint(visual.path, -1),
      photo: photoClip
        ? {
            courseId: "osm-way-23454278",
            sourceId: cranhamPhotoCropSource.id,
            sourceLabel: cranhamPhotoCropSource.label,
            crop: photoClip.crop,
            tee: photoClip.tee,
            green: photoClip.green
          }
        : null,
      render: visual.features ? "mapped-osm" : "schematic"
    },
    notes: visual.signature || ""
  };
}

function makeBelhusHole(index) {
  const number = index + 1;
  const hole = placeholderHole(number);
  const photoClip = belhusPhotoClips.find((item) => item.hole === number);
  const par = BELHUS_SCORECARD.par[index];
  const teePoint = photoClip?.tee || [50, 82];
  const greenPoint = photoClip?.green || [50, 18];
  return {
    ...hole,
    name: `Hole ${number}`,
    par,
    strokeIndex: BELHUS_SCORECARD.strokeIndex[index],
    yards: {
      white: BELHUS_SCORECARD.white[index],
      yellow: BELHUS_SCORECARD.yellow[index],
      red: BELHUS_SCORECARD.red[index]
    },
    tee: null,
    greenFront: null,
    greenCenter: null,
    greenBack: null,
    hazards: [],
    visual: {
      tee: teePoint,
      green: greenPoint,
      photo: photoClip
        ? {
            courseId: BELHUS_COURSE_ID,
            sourceId: belhusPhotoCropSource.id,
            sourceLabel: belhusPhotoCropSource.label,
            sourceUrl: belhusPhotoCropSource.url,
            crop: photoClip.crop,
            tee: photoClip.tee,
            green: photoClip.green
          }
        : null,
      render: "user-photo"
    },
    notes: "Initial Belhus alignment is seeded from the supplied course image; use Adjust to fine-tune."
  };
}

function makeScorecardOnlyHole(index, scorecard, courseId) {
  const number = index + 1;
  const hole = placeholderHole(number);
  const par = scorecard.par[index];
  const yards = Object.fromEntries(
    Object.entries(scorecard)
      .filter(([key, value]) => Array.isArray(value) && !["par", "strokeIndex"].includes(key))
      .map(([teeId, values]) => [teeId, values[index]])
  );
  const teePoint = schematicTeePoint(number, par);
  const greenPoint = schematicGreenPoint(number, par);
  return {
    ...hole,
    name: `Hole ${number}`,
    par,
    strokeIndex: scorecard.strokeIndex[index],
    yards,
    tee: null,
    greenFront: null,
    greenCenter: null,
    greenBack: null,
    hazards: [],
    visual: {
      path: schematicPath(teePoint, greenPoint, number),
      tee: teePoint,
      green: greenPoint,
      photo: null,
      render: "scorecard-schematic"
    },
    notes: `Scorecard verified; ${courseId === BASILDON_COURSE_ID ? "Basildon" : "Canvey"} image alignment pending.`
  };
}

function schematicTeePoint(number, par) {
  const x = Number((50 + (((number * 19) % 17) - 8) * (Number(par) === 3 ? 0.8 : 1.15)).toFixed(1));
  return [clampVisualPoint(x), 82];
}

function schematicGreenPoint(number, par) {
  const x = Number((50 + (((number * 23) % 19) - 9) * (Number(par) === 3 ? 0.7 : 1.05)).toFixed(1));
  const y = Number(par) === 3 ? 26 : Number(par) === 5 ? 14 : 18;
  return [clampVisualPoint(x), y];
}

function schematicPath(tee, green, number) {
  const bend = Number((((number * 11) % 21) - 10).toFixed(1));
  return [
    tee,
    [clampVisualPoint((tee[0] + green[0]) / 2 + bend), Number(((tee[1] + green[1]) / 2).toFixed(1))],
    green
  ];
}

function clampVisualPoint(value) {
  return Math.min(84, Math.max(16, Number(value.toFixed(1))));
}

function visualPoint(points, index) {
  if (!Array.isArray(points) || !points.length) {
    return [50, 50];
  }
  if (Array.isArray(points[0])) {
    return index < 0 ? points[points.length - 1] : points[index];
  }
  const pairIndex = index < 0 ? points.length - 2 : index * 2;
  return [points[pairIndex], points[pairIndex + 1]];
}

function offsetPoint(lat, lng, dLat, dLng) {
  return { lat: Number((lat + dLat).toFixed(6)), lng: Number((lng + dLng).toFixed(6)) };
}
