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
const MARDYKE_COURSE_ID = "verified-mardyke-valley";
const ORSETT_COURSE_ID = "verified-orsett";
const WARLEY_COURSE_ID = "verified-warley-park";
const CANVEY_COURSE_ID = "verified-castle-point-canvey";
const MID_KENT_COURSE_ID = "verified-mid-kent";
const ST_CLERES_COURSE_ID = "verified-st-cleres-hall";
const TOP_MEADOW_COURSE_ID = "verified-top-meadow";
const INGREBOURNE_COURSE_ID = "verified-ingrebourne-links";
const PRINCES_PARK_COURSE_ID = "verified-princes-park";
const GRAVESEND_COURSE_ID = "verified-gravesend-golf-centre";
const LANGDON_HILLS_COURSE_ID = "verified-langdon-hills";
const DARTFORD_COURSE_ID = "verified-dartford";
const FAWKHAM_COURSE_ID = "verified-corinthian-fawkham-valley";
const BARNEHURST_COURSE_ID = "verified-barnehurst";

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
  white: [442, 210, 491, 154, 272, 401, 332, 322, 325, 476, 372, 242, 392, 120, 287, 499, 482, 332],
  yellow: [432, 178, 453, 147, 261, 390, 319, 309, 312, 457, 357, 229, 374, 115, 280, 478, 469, 323],
  red: [375, 147, 388, 138, 252, 337, 307, 302, 283, 441, 353, 192, 358, 97, 272, 428, 397, 297]
};

const CANVEY_SCORECARD = {
  par: [4, 5, 4, 3, 5, 3, 4, 3, 4, 4, 3, 5, 4, 4, 4, 5, 3, 4],
  strokeIndex: [6, 12, 8, 2, 16, 14, 10, 18, 4, 15, 7, 17, 1, 13, 3, 11, 9, 5],
  white: [320, 471, 361, 207, 465, 160, 369, 135, 378, 285, 147, 470, 407, 312, 401, 478, 164, 372],
  red: [312, 460, 353, 198, 456, 156, 361, 133, 363, 259, 140, 464, 316, 253, 393, 473, 155, 365]
};

const MARDYKE_SCORECARD = {
  par: [4, 4, 4, 4, 3, 5, 4, 4, 3, 4, 4, 3, 4, 5, 4, 4, 3, 4],
  strokeIndex: [18, 6, 10, 12, 16, 4, 8, 2, 14, 3, 15, 17, 1, 11, 5, 13, 7, 9],
  white: [283, 418, 416, 357, 170, 567, 336, 328, 163, 418, 352, 176, 384, 485, 291, 403, 218, 436],
  yellow: [276, 343, 357, 347, 111, 552, 308, 313, 155, 411, 297, 171, 373, 473, 280, 339, 168, 427],
  red: [270, 337, 350, 337, 99, 510, 256, 250, 150, 406, 287, 148, 311, 376, 217, 271, 145, 416]
};

const ORSETT_SCORECARD = {
  par: [5, 4, 3, 4, 5, 4, 5, 3, 4, 4, 5, 3, 4, 4, 3, 4, 4, 4],
  strokeIndex: [10, 4, 18, 6, 14, 8, 16, 12, 2, 7, 17, 15, 11, 3, 13, 1, 5, 9],
  white: [531, 443, 154, 374, 496, 318, 513, 180, 458, 388, 485, 145, 385, 358, 199, 425, 438, 404],
  blue: [506, 443, 154, 374, 496, 318, 513, 180, 424, 388, 485, 145, 385, 358, 199, 401, 438, 404],
  yellow: [469, 399, 138, 338, 468, 304, 493, 143, 390, 354, 474, 125, 358, 328, 172, 362, 404, 386],
  red: [451, 376, 123, 326, 429, 298, 451, 120, 369, 320, 433, 123, 345, 307, 161, 401, 394, 367]
};

const WARLEY_SCORECARD = {
  par: [4, 5, 3, 4, 5, 4, 4, 3, 4, 4, 4, 4, 5, 3, 4, 4, 4, 3],
  strokeIndex: [11, 17, 15, 3, 9, 1, 13, 5, 7, 10, 18, 8, 2, 14, 4, 16, 6, 12],
  black: [322, 458, 167, 428, 549, 434, 315, 151, 411, 375, 267, 362, 475, 194, 347, 276, 336, 188],
  white: [314, 444, 144, 402, 534, 415, 291, 146, 400, 356, 248, 353, 463, 185, 342, 264, 295, 168],
  yellow: [286, 435, 117, 385, 524, 406, 263, 138, 376, 335, 220, 338, 451, 147, 315, 246, 286, 157]
};

const MID_KENT_SCORECARD = {
  par: [3, 4, 5, 3, 5, 4, 3, 5, 3, 4, 4, 4, 3, 4, 4, 3, 5, 4],
  strokeIndex: [14, 4, 10, 12, 16, 2, 18, 6, 8, 3, 17, 1, 13, 7, 15, 9, 11, 5],
  white: [157, 375, 473, 165, 476, 432, 146, 560, 188, 421, 245, 448, 179, 346, 324, 202, 518, 445],
  yellow: [145, 365, 463, 158, 462, 422, 141, 553, 174, 394, 240, 438, 174, 337, 315, 194, 512, 436]
};

const ST_CLERES_SCORECARD = {
  par: [3, 3, 3, 3, 3, 3, 3, 3, 3],
  strokeIndex: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  yellow: [114, 91, 130, 85, 78, 182, 50, 96, 82]
};

const TOP_MEADOW_SCORECARD = {
  par: [3, 4, 5, 4, 3, 4, 4, 4, 4, 5, 3, 4, 4, 5, 4, 4, 5, 3],
  strokeIndex: [13, 9, 11, 3, 16, 18, 7, 5, 15, 2, 10, 14, 12, 6, 1, 4, 8, 17],
  white: [177, 332, 528, 366, 132, 292, 366, 359, 246, 579, 184, 316, 368, 510, 445, 403, 486, 139],
  yellow: [151, 325, 512, 343, 127, 273, 353, 348, 239, 561, 177, 306, 358, 495, 433, 386, 475, 130]
};

const INGREBOURNE_SCORECARD = {
  par: [4, 4, 5, 4, 4, 4, 4, 3, 5, 4, 3, 4, 4, 3, 5, 4, 3, 5],
  strokeIndex: [5, 9, 13, 3, 1, 11, 7, 17, 15, 16, 10, 4, 6, 12, 2, 8, 18, 14],
  black: [413, 408, 503, 428, 459, 411, 409, 168, 502, 378, 186, 454, 413, 192, 634, 443, 140, 581],
  white: [402, 390, 480, 404, 431, 381, 382, 154, 477, 347, 168, 434, 385, 166, 599, 386, 120, 527],
  yellow: [391, 371, 442, 384, 392, 358, 365, 141, 472, 321, 147, 423, 367, 130, 563, 329, 120, 471]
};

const PRINCES_PARK_SCORECARD = {
  par: [3, 3, 3, 3, 3, 3, 3, 3, 3],
  strokeIndex: [3, 5, 7, 2, 6, 4, 1, 9, 8],
  white: [119, 121, 88, 136, 118, 130, 140, 81, 87]
};

const GRAVESEND_SCORECARD = {
  par: [3, 3, 3, 3, 3, 3, 3, 3, 3],
  strokeIndex: [8, 5, 1, 4, 2, 7, 9, 3, 6],
  yellow: [101, 118, 149, 168, 154, 118, 100, 155, 127],
  red: [300, 300, 300, 300, 300, 300, 300, 300, 300]
};

const LANGDON_HILLS_SCORECARD = {
  par: [4, 4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 5, 4, 3, 4, 5, 3, 4],
  strokeIndex: [16, 4, 14, 8, 18, 12, 2, 10, 6, 13, 3, 9, 17, 7, 1, 11, 15, 5],
  blue: [369, 417, 340, 407, 194, 562, 380, 182, 361, 511, 472, 553, 317, 162, 445, 504, 194, 454],
  white: [369, 417, 340, 407, 173, 482, 380, 182, 350, 511, 404, 553, 317, 162, 412, 504, 165, 454],
  yellow: [349, 393, 333, 375, 173, 469, 359, 174, 325, 491, 400, 495, 310, 144, 394, 495, 141, 396]
};

const DARTFORD_SCORECARD = {
  par: [3, 4, 4, 4, 4, 3, 4, 5, 3, 4, 3, 5, 4, 4, 4, 3, 4, 4],
  strokeIndex: [11, 5, 13, 1, 7, 17, 3, 15, 9, 8, 18, 10, 2, 14, 4, 6, 12, 16],
  white: [202, 365, 374, 422, 394, 117, 431, 487, 212, 282, 141, 487, 427, 362, 370, 245, 321, 270],
  yellow: [185, 353, 362, 410, 382, 117, 419, 468, 200, 270, 141, 475, 412, 348, 354, 245, 307, 270],
  red: [172, 340, 331, 354, 362, 106, 381, 425, 190, 248, 126, 441, 425, 320, 266, 233, 281, 258]
};

const FAWKHAM_SCORECARD = {
  par: [5, 3, 4, 4, 4, 4, 5, 3, 4],
  strokeIndex: [5, 13, 11, 9, 1, 7, 15, 17, 3],
  white: [552, 148, 326, 361, 423, 410, 504, 248, 368],
  yellow: [539, 137, 322, 360, 418, 402, 491, 230, 356]
};

const BARNEHURST_SCORECARD = {
  par: [3, 5, 3, 3, 4, 4, 4, 4, 4],
  strokeIndex: [7, 3, 15, 13, 11, 9, 5, 1, 17],
  white: [233, 505, 145, 150, 243, 263, 344, 416, 236],
  yellow: [223, 453, 135, 126, 232, 240, 333, 405, 225]
};

const SCORECARD_COURSE_LABELS = {
  [BASILDON_COURSE_ID]: "Basildon",
  [CANVEY_COURSE_ID]: "Canvey",
  [MARDYKE_COURSE_ID]: "Mardyke Valley",
  [ORSETT_COURSE_ID]: "Orsett",
  [WARLEY_COURSE_ID]: "Warley Park",
  [MID_KENT_COURSE_ID]: "Mid Kent",
  [ST_CLERES_COURSE_ID]: "St Cleres Hall",
  [TOP_MEADOW_COURSE_ID]: "Top Meadow",
  [INGREBOURNE_COURSE_ID]: "Ingrebourne Links",
  [PRINCES_PARK_COURSE_ID]: "Princes Park",
  [GRAVESEND_COURSE_ID]: "Gravesend Golf Centre",
  [LANGDON_HILLS_COURSE_ID]: "Langdon Hills",
  [DARTFORD_COURSE_ID]: "Dartford",
  [FAWKHAM_COURSE_ID]: "Corinthian Fawkham Valley",
  [BARNEHURST_COURSE_ID]: "Barnehurst"
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

const BELHUS_COORDS = [
  [51.507091, 0.263577, 51.507466, 0.261565],
  [51.508769, 0.259517, 51.507183, 0.259425],
  [51.506355, 0.258703, 51.508191, 0.258968],
  [51.509577, 0.258612, 51.506754, 0.258027],
  [51.506344, 0.257267, 51.508187, 0.2577],
  null,
  [51.50718, 0.255448, 51.508973, 0.256224],
  null,
  [51.509314, 0.259365, 51.50784, 0.261944],
  [51.507803, 0.263759, 51.508162, 0.262242],
  [51.509007, 0.261351, 51.510028, 0.261009],
  [51.510221, 0.26144, 51.508933, 0.262103],
  [51.508498, 0.264601, 51.509342, 0.263021],
  null,
  [51.509278, 0.264974, 51.510415, 0.262568],
  [51.51106, 0.260071, 51.510649, 0.26449],
  null,
  [51.510737, 0.266706, 51.50798, 0.264697]
];

const CANVEY_COORDS = [
  [51.533759, 0.575203, 51.535364, 0.574148],
  [51.536888, 0.573907, 51.537888, 0.570233],
  [51.538091, 0.567871, 51.537018, 0.570643],
  [51.536155, 0.571904, 51.535268, 0.571346],
  [51.534072, 0.571493, 51.535625, 0.567399],
  [51.535975, 0.565365, 51.536699, 0.566496],
  [51.537208, 0.566934, 51.536217, 0.570479],
  [51.535674, 0.57304, 51.536401, 0.573461],
  [51.536734, 0.574205, 51.534599, 0.575717],
  [51.533536, 0.575752, 51.533824, 0.577833],
  null,
  null,
  [51.533761, 0.588949, 51.532109, 0.590796],
  [51.530844, 0.592894, 51.532271, 0.593593],
  [51.533368, 0.593914, 51.533278, 0.591657],
  [51.533688, 0.589108, 51.534801, 0.584078],
  null,
  null
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
    attribution: "Scorecard from Golfify and Belhus Park Golf Club scorecard page. Available tee and green geometry from OpenStreetMap contributors under ODbL.",
    photoSource: belhusPhotoCropSource,
    verification: {
      status: "verified",
      updated: "2026-04-28",
      confidence: "Scorecard seeded from Golfify, with official Belhus Park Golf Club pages confirming club identity, contact details, and the scorecard page. Impulse Leisure confirms the 18-hole, par-69 parkland course.",
      sources: [
        { label: "Official scorecard page", url: "https://www.belhusparkgc.co.uk/scorecard" },
        { label: "Official contact page", url: "https://www.belhusparkgc.co.uk/contact" },
        { label: "Golfify scorecard", url: "https://www.golfify.io/courses/belhus-park-golf-club" },
        { label: "Impulse Leisure course page", url: "https://impulseleisure.co.uk/golf/" },
        { label: "OpenStreetMap map extract", url: "https://api.openstreetmap.org/api/0.6/map?bbox=0.245539,51.495831,0.281189,51.518831" }
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
    attribution: "Scorecard cross-checked from BlueGolf and GolfSherpa. Holes 1-10 yardages verified against the official Basildon Golf Course planner. Green GPS alignment pending user-supplied map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-06",
      confidence: "Basildon identity and 18-hole, par-72 scorecard are verified from BlueGolf and GolfSherpa. Holes 1-10 tee yardages were corrected against Basildon Golf Course's official course planner images; green GPS geometry remains intentionally unset until map alignment/OSM sync is added.",
      sources: [
        { label: "Official course planner", url: "https://basildongolfcourse.com/course" },
        { label: "Official yardage book", url: "https://basildongolfcourse.com/sites/default/files/course-plan/Basildon%20Golf%20Course_mobile2.pdf" },
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
    id: MARDYKE_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Mardyke Valley Golf Club",
    town: "South Ockendon",
    postcode: "RM15 6RR",
    country: "England",
    holesCount: 18,
    par: "70",
    distanceMiles: 2.1,
    website: "https://www.mardykevalley.co.uk/",
    phone: "+44 1708 855011",
    location: { lat: 51.503425, lng: 0.303971 },
    attribution: "Course identity from Mardyke Valley Golf Club official site. Hole yardages, par, and stroke index cross-checked against BlueGolf and GolfPass. Green GPS alignment pending user-supplied map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-06",
      confidence: "Official Mardyke Valley site confirms the 18-hole, 6201-yard parkland course in South Ockendon. BlueGolf and GolfPass agree on the main men’s par-70 routing and stroke index; red/women’s par differs on some holes and will need tee-specific par support later.",
      sources: [
        { label: "Official site", url: "https://www.mardykevalley.co.uk/" },
        { label: "Official scorecard and rules page", url: "https://www.mardykevalley.co.uk/golf-course-in-south-ockendon-essex/score-card-and-rules/" },
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/mardykevalleygcentr/detailedscorecard.htm" },
        { label: "GolfPass scorecard", url: "https://www.golfpass.com/travel-advisor/courses/33567-mardyke-valley-golf-club" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "70.4", slope: "118", totalYards: 6201 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "68.1", slope: "115", totalYards: 5701 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "69.9", slope: "118", totalYards: 5136 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, MARDYKE_SCORECARD, MARDYKE_COURSE_ID))
  },
  {
    id: ORSETT_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Orsett Golf Club",
    town: "Orsett",
    postcode: "RM16 3DR",
    country: "England",
    holesCount: 18,
    par: "72",
    distanceMiles: 3.2,
    website: "https://www.orsettgolfclub.co.uk/",
    phone: "+44 1375 891352",
    location: { lat: 51.498807, lng: 0.390301 },
    attribution: "Course identity, address, and scorecard from Orsett Golf Club official course overview. BlueGolf used as a secondary scorecard cross-check. Green GPS alignment pending user-supplied map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-06",
      confidence: "Official Orsett Golf Club course overview confirms address, phone, tee ratings, and full 18-hole scorecard. BlueGolf agrees on the white, blue, yellow, and red yardages; red par and stroke index differ on several holes and will need tee-specific par/SI support later.",
      sources: [
        { label: "Official course overview", url: "https://www.orsettgolfclub.co.uk/the-course/course-overview/" },
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/orsettgc/detailedscorecard.htm" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "73.3", slope: "135", totalYards: 6694 },
      { id: "blue", name: "Blue", color: "#4f8fd9", rating: "72.3", slope: "132", totalYards: 6611 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "70.4", slope: "127", totalYards: 6105 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "74.5", slope: "126", totalYards: 5794 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, ORSETT_SCORECARD, ORSETT_COURSE_ID))
  },
  {
    id: WARLEY_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Warley Park Golf Club",
    town: "Little Warley",
    postcode: "CM13 3DX",
    country: "England",
    holesCount: 18,
    par: "71",
    distanceMiles: 7.9,
    website: "https://www.warleyparkgc.co.uk/",
    phone: "+44 1277 224891",
    location: { lat: 51.589142, lng: 0.306313 },
    attribution: "Course identity, address, and scorecard from Warley Park Golf Club official course page. Green GPS alignment pending user-supplied map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-06",
      confidence: "Official Warley Park course page confirms the 27-hole facility, address, phone, and Warley 18 scorecard. This seed uses the official Warley card for black, white, and yellow yardages; yellow par/SI differs on some holes and will need tee-specific par/SI support later.",
      sources: [
        { label: "Official course page", url: "https://www.warleyparkgc.co.uk/golf/the-course/" },
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/warleypark/detailedscorecard.htm" },
        { label: "Golfify scorecard", url: "https://www.golfify.io/courses/warley-park-golf-club-warley" }
      ]
    },
    tees: [
      { id: "black", name: "Black", color: "#27272a", rating: "", slope: "", totalYards: 6055 },
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 5764 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "", slope: "", totalYards: 5425 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, WARLEY_SCORECARD, WARLEY_COURSE_ID))
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
    attribution: "Castle Point / Canvey scorecard seeded from My Online Golf Club and cross-checked against Golfshake and Grassy. Available tee and green geometry from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-02",
      confidence: "Castle Point is the Canvey Island 18-hole course at Somnes Avenue. Public scorecard sources disagree slightly on total par and tee yardages; this seed uses the hole-by-hole My Online Golf Club card for white yards and SI, with the red yardages cross-checked against Grassy.",
      sources: [
        { label: "My Online Golf Club scorecard", url: "https://www.myonlinegolfclub.com/clubpage?clubID=1005" },
        { label: "Golfshake course page", url: "https://www.golfshake.com/course/view/14233/Castle_Point_Golf_Club.html" },
        { label: "Grassy scorecard", url: "https://www.grassy.golf/courses/castle-point-golf-course-gb-ess" },
        { label: "Albrecht Golf Guide", url: "https://www.1golf.eu/en/club/castle-point-golf-club/" },
        { label: "OpenStreetMap map extract", url: "https://api.openstreetmap.org/api/0.6/map?bbox=0.562700,51.521400,0.606100,51.549400" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 5902 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "72.3", slope: "121", totalYards: 5610 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, CANVEY_SCORECARD, CANVEY_COURSE_ID))
  },
  {
    id: MID_KENT_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Mid Kent Golf Club",
    town: "Gravesend",
    postcode: "DA11 7RB",
    country: "England",
    holesCount: 18,
    par: "70",
    distanceMiles: 4.1,
    website: "https://www.mkgc.co.uk/",
    phone: "+44 1474 568035",
    location: { lat: 51.422099, lng: 0.365254 },
    attribution: "Course identity, address, ratings, and scorecard from Mid Kent Golf Club official scorecard. BlueGolf and Albrecht used as secondary cross-checks. Green GPS alignment pending map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-10",
      confidence: "Official Mid Kent scorecard confirms the current WHS white/yellow hole yardages, par, stroke index, ratings, and slopes. BlueGolf and Albrecht broadly agree, but the official club card has newer totals, so it is authoritative here.",
      sources: [
        { label: "Official scorecard", url: "https://www.mkgc.co.uk/scorecard" },
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/midkent/detailedscorecard.htm" },
        { label: "Albrecht Golf Guide", url: "https://www.1golf.eu/en/club/mid-kent-golf-club" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "70.30", slope: "126", totalYards: 6100 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "69.40", slope: "123", totalYards: 5923 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, MID_KENT_SCORECARD, MID_KENT_COURSE_ID))
  },
  {
    id: ST_CLERES_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "St Cleres Hall Golf Club",
    town: "Stanford-le-Hope",
    postcode: "SS17 0LX",
    country: "England",
    holesCount: 9,
    par: "27",
    distanceMiles: 4.3,
    website: "https://www.stcleresgolf.com/",
    phone: "+44 1375 361565",
    location: { lat: 51.50759, lng: 0.410656 },
    attribution: "Current playable layout verified as the 9-hole par-3 course from GolfPass and 18Birdies; historic 18-hole data is intentionally not used. Green GPS alignment pending map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-10",
      confidence: "GolfPass marks the old 18-hole course as closed and lists the active 9-hole par-3 card. 18Birdies agrees on the same 908-yard, par-27 hole yardages.",
      sources: [
        { label: "GolfPass 9-hole scorecard", url: "https://www.golfpass.com/travel-advisor/courses/34115-st-cleres-hall-golf-club-9-hole-course" },
        { label: "18Birdies scorecard", url: "https://18birdies.com/golf-courses/club/bf637260-86ac-11e4-8c28-020000005b00/st-cleres-hall" },
        { label: "Albrecht Golf Guide", url: "https://www.1golf.eu/en/club/st-clere-s-hall-golf-club/" }
      ]
    },
    tees: [
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "27.3", slope: "87", totalYards: 908 }
    ],
    holes: Array.from({ length: 9 }, (_, index) => makeScorecardOnlyHole(index, ST_CLERES_SCORECARD, ST_CLERES_COURSE_ID))
  },
  {
    id: TOP_MEADOW_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Top Meadow Golf Club",
    town: "Upminster",
    postcode: "RM14 3PR",
    country: "England",
    holesCount: 18,
    par: "72",
    distanceMiles: 4.6,
    website: "https://www.topmeadow.co.uk/",
    phone: "+44 1708 852239",
    location: { lat: 51.541154, lng: 0.312411 },
    attribution: "Scorecard seeded from GolfSherpa and cross-checked against Offcourse and Golfshake. Green GPS alignment pending map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-10",
      confidence: "GolfSherpa and Offcourse agree on white/yellow hole yardages, par, and the 6228/5992-yard totals. Golfshake agrees on the white 6228-yard par-72 total, with a small yellow total discrepancy noted.",
      sources: [
        { label: "GolfSherpa scorecard", url: "https://golfsherpa.co.uk/courses/england/top-meadow-golf-club-and-hotel" },
        { label: "Offcourse scorecard", url: "https://www.offcourse.co/courses/scorecard/top-meadow-golf-club" },
        { label: "Golfshake course page", url: "https://www.golfshake.com/course/view/16445/Top_Meadow_Golf_Club.html" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 6228 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "", slope: "", totalYards: 5992 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, TOP_MEADOW_SCORECARD, TOP_MEADOW_COURSE_ID))
  },
  {
    id: INGREBOURNE_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Ingrebourne Links Golf & Country Club",
    town: "Rainham",
    postcode: "RM13 9FL",
    country: "England",
    holesCount: 18,
    par: "72",
    distanceMiles: 4.8,
    website: "https://www.ingrebournelinks.com/",
    phone: "+44 1708 201301",
    location: { lat: 51.513613, lng: 0.230958 },
    attribution: "North/East Championship scorecard from BlueGolf, cross-checked against GolfNow/GolfPass tee ratings and The Social Golfer hole yardages. Green GPS alignment pending map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-10",
      confidence: "BlueGolf provides the full North/East 18-hole scorecard for black, white, and yellow tees. GolfNow/GolfPass agree on the black/white/yellow totals, ratings, and slopes; The Social Golfer agrees on the black hole-by-hole card.",
      sources: [
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/ingrebournelinksnort/detailedscorecard.htm" },
        { label: "GolfNow course details", url: "https://www.golfnow.co.uk/courses/-6384-ingrebourne-links-championship-northeast-course-details" },
        { label: "The Social Golfer black card", url: "https://www.thesocialgolfer.com/golf-courses/united-kingdom/essex/ingrebourne-links-golf-complex/scorecard/northeastblack-black-tee-scorecard" }
      ]
    },
    tees: [
      { id: "black", name: "Black", color: "#27272a", rating: "74.2", slope: "121", totalYards: 7122 },
      { id: "white", name: "White", color: "#f8f7f1", rating: "71.8", slope: "117", totalYards: 6633 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "69.7", slope: "111", totalYards: 6187 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, INGREBOURNE_SCORECARD, INGREBOURNE_COURSE_ID))
  },
  {
    id: PRINCES_PARK_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Princes Park Golf Course",
    town: "Dartford",
    postcode: "DA1 1RT",
    country: "England",
    holesCount: 9,
    par: "27",
    distanceMiles: 4.9,
    website: "https://www.dartfordfc.com/golf-course",
    phone: "+44 1322 299991",
    location: { lat: 51.449228, lng: 0.234188 },
    attribution: "9-hole par-3 scorecard from GolfSherpa. Green GPS alignment pending map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-10",
      confidence: "GolfSherpa provides the full 9-hole Princes Park par-27 card, including hole yardages and stroke indexes.",
      sources: [
        { label: "GolfSherpa scorecard", url: "https://golfsherpa.co.uk/courses/england/princes-park-golf-course" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 1020 }
    ],
    holes: Array.from({ length: 9 }, (_, index) => makeScorecardOnlyHole(index, PRINCES_PARK_SCORECARD, PRINCES_PARK_COURSE_ID))
  },
  {
    id: GRAVESEND_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Gravesend Golf Centre",
    town: "Gravesend",
    postcode: "DA12 4LG",
    country: "England",
    holesCount: 9,
    par: "27",
    distanceMiles: 5,
    website: "https://www.gravesendgolfcentre.com/",
    phone: "+44 1474 335002",
    location: { lat: 51.422422, lng: 0.405488 },
    attribution: "Current 9-hole par-3 scorecard from Golfify and 18Birdies, cross-checked against GolfSherpa. Green GPS alignment pending map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-10",
      confidence: "Golfify and 18Birdies agree on the current 1190-yard yellow par-27 card; GolfSherpa agrees on yellow/red totals and stroke indexes. Older directory pages describing an 18-hole course are not used for hole data.",
      sources: [
        { label: "Golfify scorecard", url: "https://www.golfify.io/courses/gravesend-golf-centre" },
        { label: "18Birdies scorecard", url: "https://18birdies.com/golf-courses/club/c6ca6620-04be-11e7-93e9-0680a328ea36/gravesend-golf-centre" },
        { label: "GolfSherpa scorecard", url: "https://golfsherpa.co.uk/courses/england/gravesend-golf-centre" }
      ]
    },
    tees: [
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "", slope: "", totalYards: 1190 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "", slope: "", totalYards: 2700 }
    ],
    holes: Array.from({ length: 9 }, (_, index) => makeScorecardOnlyHole(index, GRAVESEND_SCORECARD, GRAVESEND_COURSE_ID))
  },
  {
    id: LANGDON_HILLS_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Langdon Hills Golf & Country Club",
    town: "Bulphan",
    postcode: "RM14 3TY",
    country: "England",
    holesCount: 18,
    par: "72",
    distanceMiles: 5.7,
    website: "https://www.golflangdon.co.uk/",
    phone: "+44 1375 361011",
    location: { lat: 51.531174, lng: 0.365153 },
    attribution: "Langdon/Bulphan scorecard from BlueGolf, cross-checked against GolfPass and Golfshake. Green GPS alignment pending map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-10",
      confidence: "BlueGolf provides the complete Langdon/Bulphan 18-hole card. GolfPass agrees on the separate Langdon and Bulphan nines, while Golfshake agrees on the combined blue, white, and yellow totals.",
      sources: [
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/langdonhillslangdon/detailedscorecard.htm" },
        { label: "GolfPass Langdon course", url: "https://www.golfpass.com/travel-advisor/courses/33451-langdon-hills-golf-country-club-langdon-course" },
        { label: "GolfPass Bulphan course", url: "https://www.golfpass.com/travel-advisor/courses/33452-langdon-hills-golf-country-club-bulphan-course" },
        { label: "Golfshake course page", url: "https://www.golfshake.com/course/view/15252/Langdon_Hills_Golf_and_Country_Club.html" }
      ]
    },
    tees: [
      { id: "blue", name: "Blue", color: "#4f8fd9", rating: "", slope: "", totalYards: 6824 },
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 6582 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "", slope: "", totalYards: 6216 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, LANGDON_HILLS_SCORECARD, LANGDON_HILLS_COURSE_ID))
  },
  {
    id: DARTFORD_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Dartford Golf Club",
    town: "Dartford",
    postcode: "DA1 2TN",
    country: "England",
    holesCount: 18,
    par: "69",
    distanceMiles: 6,
    website: "https://www.dartfordgolfclub.co.uk/",
    phone: "+44 1322 226455",
    location: { lat: 51.435069, lng: 0.20045 },
    attribution: "Course identity, address, and scorecard from Dartford Golf Club official scorecard. BlueGolf used as a secondary cross-check. Green GPS alignment pending map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-10",
      confidence: "The official Dartford scorecard confirms white, yellow, and red hole yardages, par, stroke indexes, and WHS ratings for white/yellow. BlueGolf agrees on the full hole-by-hole card.",
      sources: [
        { label: "Official scorecard", url: "https://www.dartfordgolfclub.co.uk/course-scorecard" },
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/dartford/detailedscorecard.htm" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "69.20", slope: "119", totalYards: 5909 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "68.30", slope: "117", totalYards: 5718 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "", slope: "", totalYards: 5259 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, DARTFORD_SCORECARD, DARTFORD_COURSE_ID))
  },
  {
    id: FAWKHAM_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Corinthian Sports Club",
    town: "Fawkham",
    postcode: "DA3 8LY",
    country: "England",
    holesCount: 9,
    par: "36",
    distanceMiles: 6.4,
    website: "https://www.corinthiansportsclub.co.uk/golf-course",
    phone: "+44 1474 573116",
    location: { lat: 51.385299, lng: 0.294437 },
    attribution: "Current 9-hole Corinthian/Fawkham Valley scorecard from GolfPass and GolfSherpa, cross-checked against Golfshake/GolfNow totals. Green GPS alignment pending map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-10",
      confidence: "The old Fawkham Valley record is a 9-hole course with varied tees for an 18-hole round. This seed uses the current 9-hole card so the app does not pretend there are 18 separate greens before tee-loop support is added.",
      sources: [
        { label: "GolfPass scorecard", url: "https://www.golfpass.com/travel-advisor/courses/33017-corinthian-sports-club" },
        { label: "GolfSherpa scorecard", url: "https://golfsherpa.co.uk/courses/england/corinthian-golf-club" },
        { label: "Golfshake course page", url: "https://www.golfshake.com/course/view/14720/Corinthians_Fawkham_Valley_Golf_Club.html" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "72.2", slope: "125", totalYards: 3340 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "71.4", slope: "122", totalYards: 3255 }
    ],
    holes: Array.from({ length: 9 }, (_, index) => makeScorecardOnlyHole(index, FAWKHAM_SCORECARD, FAWKHAM_COURSE_ID))
  },
  {
    id: BARNEHURST_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Barnehurst Golf Course",
    town: "Barnehurst",
    postcode: "DA7 6JU",
    country: "England",
    holesCount: 9,
    par: "34",
    distanceMiles: 6.6,
    website: "https://www.mytimeactive.co.uk/golf/centres/barnehurst/",
    phone: "+44 1322 471128",
    location: { lat: 51.460138, lng: 0.172763 },
    attribution: "9-hole scorecard from LondonGolfCourses. Green GPS alignment pending map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-10",
      confidence: "LondonGolfCourses provides the complete current Barnehurst 9-hole scorecard with white/yellow/red yardages, par, and indexes. This seed keeps the men’s white/yellow par/SI until tee-specific par is supported.",
      sources: [
        { label: "LondonGolfCourses scorecard", url: "https://londongolfcourses.com/course/barnehurst" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 2535 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "", slope: "", totalYards: 2372 }
    ],
    holes: Array.from({ length: 9 }, (_, index) => makeScorecardOnlyHole(index, BARNEHURST_SCORECARD, BARNEHURST_COURSE_ID))
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
  const geo = geoFromCoords(BELHUS_COORDS[index]);
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
    tee: geo.tee,
    greenFront: geo.greenFront,
    greenCenter: geo.greenCenter,
    greenBack: geo.greenBack,
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
    notes: geo.tee
      ? "Satellite alignment seeded from OpenStreetMap hole geometry; use Adjust to fine-tune."
      : "OpenStreetMap has no reliable tee/green geometry for this hole yet; use Adjust to place it."
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
  const geo = geoFromCoords(courseId === CANVEY_COURSE_ID ? CANVEY_COORDS[index] : null);
  return {
    ...hole,
    name: `Hole ${number}`,
    par,
    strokeIndex: scorecard.strokeIndex[index],
    yards,
    tee: geo.tee,
    greenFront: geo.greenFront,
    greenCenter: geo.greenCenter,
    greenBack: geo.greenBack,
    hazards: [],
    visual: {
      path: schematicPath(teePoint, greenPoint, number),
      tee: teePoint,
      green: greenPoint,
      photo: null,
      render: "scorecard-schematic"
    },
    notes: geo.tee
      ? "Satellite alignment seeded from OpenStreetMap hole geometry; use Adjust to fine-tune."
      : `Scorecard verified; ${SCORECARD_COURSE_LABELS[courseId] || "course"} tee/green geometry pending.`
  };
}

function geoFromCoords(coords) {
  if (!coords) {
    return { tee: null, greenFront: null, greenCenter: null, greenBack: null };
  }
  const [teeLat, teeLng, greenLat, greenLng] = coords;
  return {
    tee: { lat: teeLat, lng: teeLng },
    greenFront: offsetPoint(greenLat, greenLng, -0.00008, -0.00004),
    greenCenter: { lat: greenLat, lng: greenLng },
    greenBack: offsetPoint(greenLat, greenLng, 0.00008, 0.00004)
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
