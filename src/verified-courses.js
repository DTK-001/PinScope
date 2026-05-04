import { placeholderHole } from "./course-data.js";
import { cranhamMapVisuals } from "./cranham-map-data.js";
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
const ORSETT_COURSE_ID = "osm-way-94530219";
const ST_CLERES_COURSE_ID = "osm-way-94530214";
const INGREBOURNE_COURSE_ID = "osm-way-183480485";
const WARLEY_COURSE_ID = "osm-way-127582078";
const THORNDON_COURSE_ID = "osm-way-128679377";
const BRENTWOOD_COURSE_ID = "osm-relation-3908574";
const MARDYKE_COURSE_ID = "osm-way-350806648";
const LANGDON_COURSE_ID = "osm-way-262444890";
const CRONDON_COURSE_ID = "osm-way-205993614";
const STAPLEFORD_COURSE_ID = "osm-relation-3910795";
const ABRIDGE_COURSE_ID = "osm-way-231370473";
const SOUTH_ESSEX_COURSE_ID = "osm-way-23618344";

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

const ORSETT_SCORECARD = {
  par: [5, 4, 3, 4, 5, 4, 5, 3, 4, 4, 5, 3, 4, 4, 3, 4, 4, 4],
  strokeIndex: [10, 4, 18, 6, 14, 8, 16, 12, 2, 7, 17, 15, 11, 3, 13, 1, 5, 9],
  white: [531, 443, 154, 374, 496, 318, 513, 180, 458, 388, 485, 145, 385, 358, 199, 425, 438, 404],
  blue: [506, 443, 154, 374, 496, 318, 513, 180, 424, 388, 485, 145, 385, 358, 199, 401, 438, 404],
  yellow: [469, 399, 138, 338, 468, 304, 493, 143, 390, 354, 474, 125, 358, 328, 172, 362, 404, 386],
  red: [451, 376, 123, 326, 429, 298, 451, 120, 369, 320, 433, 123, 345, 307, 161, 401, 394, 367]
};

const ST_CLERES_SCORECARD = {
  par: [4, 5, 4, 3, 4, 3, 4, 5, 4, 3, 5, 4, 3, 4, 5, 4, 4, 4],
  strokeIndex: [11, 7, 9, 15, 1, 17, 13, 5, 3, 18, 4, 12, 8, 2, 14, 10, 6, 16],
  white: [276, 472, 305, 191, 449, 165, 356, 488, 548, 140, 565, 303, 222, 443, 484, 369, 399, 312],
  yellow: [266, 444, 296, 164, 363, 156, 347, 484, 392, 133, 477, 291, 205, 385, 438, 332, 391, 301],
  red: [257, 428, 289, 148, 353, 146, 335, 475, 374, 128, 465, 280, 188, 370, 380, 308, 321, 283]
};

const INGREBOURNE_SCORECARD = {
  par: [4, 4, 5, 4, 4, 4, 4, 3, 5, 4, 3, 4, 4, 3, 5, 4, 3, 5],
  strokeIndex: [5, 9, 13, 3, 1, 11, 7, 17, 15, 16, 10, 4, 6, 12, 2, 8, 18, 14],
  black: [413, 408, 503, 428, 459, 411, 409, 168, 502, 378, 186, 454, 413, 192, 634, 443, 140, 581],
  white: [402, 390, 480, 404, 431, 381, 382, 154, 477, 347, 168, 434, 385, 166, 599, 386, 120, 527],
  yellow: [391, 371, 442, 384, 392, 358, 365, 141, 472, 321, 147, 423, 367, 130, 563, 329, 120, 471]
};

const WARLEY_SCORECARD = {
  par: [4, 5, 3, 4, 5, 4, 4, 3, 4, 4, 4, 4, 5, 3, 4, 4, 4, 3],
  strokeIndex: [11, 5, 15, 3, 9, 1, 13, 17, 7, 10, 18, 8, 2, 14, 4, 16, 6, 12],
  white: [346, 479, 164, 439, 573, 437, 327, 198, 415, 397, 265, 364, 488, 198, 354, 282, 332, 192],
  yellow: [338, 464, 146, 418, 557, 432, 302, 146, 407, 363, 247, 356, 477, 180, 348, 272, 298, 174],
  red: [307, 454, 122, 406, 547, 422, 263, 141, 382, 343, 225, 346, 470, 152, 332, 252, 288, 164]
};

const THORNDON_SCORECARD = {
  par: [4, 3, 4, 4, 3, 4, 4, 4, 5, 4, 5, 3, 4, 4, 3, 5, 4, 4],
  strokeIndex: [7, 13, 3, 9, 15, 17, 5, 1, 11, 6, 12, 18, 2, 10, 14, 16, 4, 8],
  white: [420, 178, 406, 377, 142, 337, 386, 422, 505, 406, 512, 154, 392, 378, 179, 487, 412, 397],
  yellow: [400, 162, 390, 365, 133, 322, 378, 414, 500, 394, 497, 150, 377, 353, 162, 475, 386, 386],
  red: [350, 146, 371, 344, 122, 298, 352, 401, 418, 388, 422, 129, 325, 297, 117, 420, 292, 361]
};

const BRENTWOOD_SCORECARD = {
  par: [4, 4, 4, 4, 3, 5, 3, 4, 4, 4, 4, 4, 3, 4, 3, 4, 4, 5],
  strokeIndex: [18, 14, 2, 6, 16, 8, 10, 12, 4, 9, 11, 17, 15, 1, 3, 13, 5, 7],
  white: [304, 352, 399, 416, 177, 484, 170, 372, 425, 408, 347, 317, 175, 421, 210, 362, 379, 478],
  yellow: [288, 339, 379, 379, 156, 479, 124, 342, 391, 397, 324, 306, 165, 395, 146, 302, 367, 400],
  red: [279, 291, 386, 388, 126, 450, 142, 347, 375, 323, 329, 304, 152, 364, 173, 312, 322, 432]
};

const MARDYKE_SCORECARD = {
  par: [4, 4, 4, 4, 3, 5, 4, 4, 3, 4, 4, 3, 4, 5, 4, 4, 3, 4],
  strokeIndex: [18, 6, 10, 12, 16, 4, 8, 2, 14, 3, 15, 17, 1, 11, 5, 13, 7, 9],
  white: [283, 418, 416, 357, 170, 567, 336, 328, 163, 418, 352, 176, 384, 485, 291, 403, 218, 436],
  yellow: [276, 343, 357, 347, 111, 552, 308, 313, 155, 411, 297, 171, 373, 473, 280, 339, 168, 427]
};

const LANGDON_SCORECARD = {
  par: [4, 4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 5, 4, 3, 4, 5, 3, 4],
  strokeIndex: [16, 4, 14, 8, 18, 12, 2, 10, 6, 13, 3, 9, 17, 7, 1, 11, 15, 5],
  blue: [369, 417, 340, 407, 194, 562, 380, 182, 361, 511, 472, 553, 317, 162, 445, 504, 194, 454],
  white: [369, 417, 340, 407, 173, 482, 380, 182, 350, 511, 404, 553, 317, 162, 412, 504, 165, 454],
  yellow: [349, 393, 333, 375, 173, 469, 359, 174, 325, 491, 400, 495, 310, 144, 394, 495, 141, 396],
  red: [342, 398, 319, 339, 136, 431, 353, 152, 297, 475, 387, 475, 292, 120, 341, 480, 140, 396]
};

const CRONDON_SCORECARD = {
  par: [4, 4, 5, 3, 4, 5, 3, 4, 5, 4, 3, 4, 5, 3, 4, 4, 3, 5],
  strokeIndex: [5, 17, 9, 13, 1, 7, 15, 3, 11, 4, 16, 12, 2, 8, 14, 6, 18, 10],
  black: [414, 290, 492, 177, 446, 570, 156, 400, 527, 423, 200, 407, 589, 177, 352, 400, 163, 646],
  white: [400, 290, 480, 160, 430, 570, 125, 400, 514, 406, 155, 391, 589, 165, 352, 367, 163, 586],
  yellow: [383, 268, 466, 147, 408, 538, 125, 358, 493, 384, 135, 371, 546, 148, 324, 351, 147, 566],
  red: [344, 239, 428, 130, 406, 489, 112, 341, 473, 361, 129, 355, 521, 131, 300, 400, 134, 543]
};

const STAPLEFORD_SCORECARD = {
  par: [4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 4, 4, 3, 5, 3, 4, 4, 5],
  strokeIndex: [11, 13, 1, 3, 7, 15, 17, 5, 9, 16, 6, 2, 18, 10, 14, 4, 8, 12],
  white: [422, 190, 521, 403, 400, 175, 464, 350, 324, 302, 400, 445, 127, 487, 153, 398, 427, 513],
  yellow: [361, 175, 506, 385, 382, 166, 433, 336, 314, 287, 352, 433, 117, 473, 120, 387, 401, 485],
  red: [277, 158, 471, 345, 369, 129, 433, 319, 303, 269, 341, 402, 94, 461, 120, 326, 340, 452]
};

const ABRIDGE_SCORECARD = {
  par: [4, 3, 4, 5, 5, 4, 4, 4, 3, 4, 4, 4, 5, 4, 3, 5, 3, 4],
  strokeIndex: [6, 18, 2, 14, 4, 8, 12, 10, 16, 7, 3, 5, 13, 1, 11, 9, 17, 15],
  white: [419, 162, 418, 478, 479, 385, 335, 375, 177, 409, 403, 448, 490, 469, 201, 536, 169, 351],
  yellow: [399, 142, 394, 461, 468, 345, 304, 361, 152, 378, 373, 407, 470, 433, 169, 480, 135, 317],
  red: [384, 134, 382, 434, 406, 326, 287, 338, 140, 351, 358, 342, 428, 418, 129, 420, 109, 286]
};

const SOUTH_ESSEX_HAWK_VIXEN_SCORECARD = {
  par: [5, 4, 4, 4, 4, 3, 4, 3, 5, 4, 4, 3, 4, 4, 3, 4, 4, 5],
  strokeIndex: [15, 17, 5, 7, 1, 13, 3, 11, 9, 10, 6, 12, 16, 2, 4, 18, 14, 8],
  white: [510, 320, 371, 384, 451, 156, 416, 173, 536, 376, 404, 167, 354, 422, 242, 342, 309, 590],
  yellow: [497, 307, 361, 364, 423, 146, 397, 150, 520, 356, 380, 162, 304, 400, 230, 335, 293, 567],
  blue: [425, 278, 347, 328, 391, 128, 385, 141, 502, 334, 375, 148, 277, 364, 162, 268, 286, 475],
  red: [425, 278, 337, 328, 391, 128, 348, 141, 455, 324, 375, 148, 261, 364, 162, 263, 286, 475]
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
    osm: { type: "way", id: 94530219 },
    attribution: "Identity and scorecard from Orsett Golf Club official course overview. Course shell from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-04",
      confidence: "Official course overview confirms the RM16 3DR address, phone number, WHS ratings, and hole-by-hole white, blue, yellow, and red scorecard. BlueGolf cross-checks the white tee total, par, and stroke indexes.",
      sources: [
        { label: "Official course overview", url: "https://www.orsettgolfclub.co.uk/the-course/course-overview/" },
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/orsettgc/detailedscorecard.htm" },
        { label: "OpenStreetMap course shell", url: "https://www.openstreetmap.org/way/94530219" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "73.3", slope: "135", totalYards: 6694 },
      { id: "blue", name: "Blue", color: "#4f83ff", rating: "72.3", slope: "132", totalYards: 6611 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "70.4", slope: "127", totalYards: 6105 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "74.5", slope: "126", totalYards: 5794 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, ORSETT_SCORECARD, ORSETT_COURSE_ID))
  },
  {
    id: ST_CLERES_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "St Clere's Hall Golf Club",
    town: "Stanford-le-Hope",
    postcode: "SS17 0LX",
    country: "England",
    holesCount: 18,
    par: "72",
    distanceMiles: 4.3,
    website: "http://stclereshallgolfclub.weebly.com/",
    phone: "+44 1375 673007",
    location: { lat: 51.50759, lng: 0.410656 },
    osm: { type: "way", id: 94530214 },
    attribution: "Scorecard cross-checked from Golfify and Albrecht Golf Guide. Course shell from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-04",
      confidence: "Golfify provides the full white/yellow/red hole-by-hole scorecard, while Albrecht confirms the 18-hole course, London Road / SS17 0LX address, visitor status, and yellow/red total yardages. Red stroke indexes differ on a couple of holes; this seed keeps the men's SI until tee-specific SI support exists.",
      sources: [
        { label: "Golfify scorecard", url: "https://www.golfify.io/courses/st-clere-s-hall-golf-club-st-clere" },
        { label: "Albrecht Golf Guide", url: "https://www.1golf.eu/en/club/st-clere-s-hall-golf-club/" },
        { label: "OpenStreetMap course shell", url: "https://www.openstreetmap.org/way/94530214" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "72.0", slope: "", totalYards: 6487 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "69.0", slope: "", totalYards: 5865 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "72.0", slope: "", totalYards: 5528 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, ST_CLERES_SCORECARD, ST_CLERES_COURSE_ID))
  },
  {
    id: INGREBOURNE_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Ingrebourne Links Golf Course",
    town: "Rainham",
    postcode: "RM13 9FL",
    country: "England",
    holesCount: 18,
    par: "72",
    distanceMiles: 4.8,
    website: "https://www.ingrebournelinks.com/",
    phone: "+44 1708 552054",
    location: { lat: 51.513613, lng: 0.230958 },
    osm: { type: "way", id: 183480485 },
    attribution: "North/East scorecard cross-checked from BlueGolf, The Social Golfer, GolfPass, and GolfNow/TeeOff course details. Course shell from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-04",
      confidence: "This verifies the 18-hole Championship North/East layout rather than the separate par-3 course. BlueGolf gives the full black/white/yellow scorecard; GolfPass and GolfNow/TeeOff confirm par 72, 7122 yards from black, and rating/slope details.",
      sources: [
        { label: "BlueGolf North/East scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/ingrebournelinksnort/detailedscorecard.htm" },
        { label: "GolfPass North/East course page", url: "https://www.golfpass.com/travel-advisor/courses/38672-ingrebourne-links-golf-country-club-north-east-course" },
        { label: "GolfNow/TeeOff tee details", url: "https://www.teeoff.com/courses/-6384-ingrebourne-links-championship-northeast-course-details" },
        { label: "OpenStreetMap course shell", url: "https://www.openstreetmap.org/way/183480485" }
      ]
    },
    tees: [
      { id: "black", name: "Black", color: "#171719", rating: "74.2", slope: "121", totalYards: 7122 },
      { id: "white", name: "White", color: "#f8f7f1", rating: "71.8", slope: "117", totalYards: 6633 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "69.7", slope: "111", totalYards: 6187 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, INGREBOURNE_SCORECARD, INGREBOURNE_COURSE_ID))
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
    osm: { type: "way", id: 127582078 },
    attribution: "Scorecard cross-checked from Warley Park official course page, Golfify, and BlueGolf. Course shell from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-04",
      confidence: "Warley Park is a 27-hole facility; this seed uses the public 18-hole Warley scorecard set with white/yellow/red yardages. Official course page confirms the facility and scorecard tables; Golfify and BlueGolf cross-check the par-71, 6250-yard white card.",
      sources: [
        { label: "Official course page", url: "https://www.warleyparkgc.co.uk/golf/the-course/" },
        { label: "Golfify scorecard", url: "https://www.golfify.io/courses/warley-park-golf-club-warley" },
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/warleypark/detailedscorecard.htm" },
        { label: "OpenStreetMap course shell", url: "https://www.openstreetmap.org/way/127582078" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "70.0", slope: "110", totalYards: 6250 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "69.0", slope: "", totalYards: 5925 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "71.0", slope: "", totalYards: 5616 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, WARLEY_SCORECARD, WARLEY_COURSE_ID))
  },
  {
    id: THORNDON_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Thorndon Park Golf Club",
    town: "Brentwood",
    postcode: "CM13 3RH",
    country: "England",
    holesCount: 18,
    par: "71",
    distanceMiles: 8.4,
    website: "https://www.thorndonpark.com/",
    phone: "+44 1277 810345",
    location: { lat: 51.595948, lng: 0.34113 },
    osm: { type: "way", id: 128679377 },
    attribution: "Scorecard from Thorndon Park official course card and cross-checked against BlueGolf and The Social Golfer. Course shell from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-04",
      confidence: "Official course card gives white/yellow/red yardages, ratings, slopes, par, and SI. BlueGolf and The Social Golfer broadly cross-check the par-71 layout; the official card is used where public sources differ slightly on yardages.",
      sources: [
        { label: "Official course card", url: "https://www.thorndonpark.com/course-card" },
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/thorndonparkgc/detailedscorecard.htm" },
        { label: "The Social Golfer yellow tee scorecard", url: "https://www.thesocialgolfer.com/golf-courses/united-kingdom/thorndon-park-golf-club/scorecard/thorndon-park-golf-club-yellow-tee-scorecard" },
        { label: "OpenStreetMap course shell", url: "https://www.openstreetmap.org/way/128679377" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "71.1", slope: "126", totalYards: 6490 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "69.7", slope: "124", totalYards: 6244 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "71.9", slope: "129", totalYards: 5553 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, THORNDON_SCORECARD, THORNDON_COURSE_ID))
  },
  {
    id: BRENTWOOD_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Brentwood Golf Centre at Hartswood",
    town: "Brentwood",
    postcode: "CM14 5AE",
    country: "England",
    holesCount: 18,
    par: "70",
    distanceMiles: 9.1,
    website: "https://www.brentwood.gov.uk/hartswood-golf-course",
    phone: "+44 1277 312500",
    location: { lat: 51.607225, lng: 0.325331 },
    osm: { type: "relation", id: 3908574 },
    attribution: "Scorecard cross-checked from Golfify and GolfSherpa. Course shell from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-04",
      confidence: "Golfify provides a full white/yellow/red scorecard and ratings summary; GolfSherpa confirms the Hartswood identity, CM14 5AE postcode, and tee totals. The app currently stores one par per hole, so the yellow par-70 card is used while white/red tee-specific par differences are noted.",
      sources: [
        { label: "Golfify scorecard", url: "https://www.golfify.io/courses/the-brentwood-golf-centre-at-hartswood" },
        { label: "GolfSherpa scorecard", url: "https://golfsherpa.co.uk/courses/england/the-brentwood-golf-centre-at-hartswood" },
        { label: "OpenStreetMap course shell", url: "https://www.openstreetmap.org/relation/3908574" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "69.0", slope: "", totalYards: 6196 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "70.0", slope: "113", totalYards: 5679 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "71.0", slope: "", totalYards: 5495 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, BRENTWOOD_SCORECARD, BRENTWOOD_COURSE_ID))
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
    osm: { type: "way", id: 350806648 },
    attribution: "Scorecard from BlueGolf. Course identity and shell from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-04",
      confidence: "BlueGolf provides a full 18-hole par-70 scorecard with white/yellow yardages and stroke indexes. Local OSM course shell confirms the RM15 6RR Mardyke Valley course identity, website, phone, and location.",
      sources: [
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/mardykevalleygcentr/detailedscorecard.htm" },
        { label: "Official site", url: "https://www.mardykevalley.co.uk/" },
        { label: "OpenStreetMap course shell", url: "https://www.openstreetmap.org/way/350806648" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "70.0", slope: "113", totalYards: 6201 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "70.0", slope: "113", totalYards: 5701 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, MARDYKE_SCORECARD, MARDYKE_COURSE_ID))
  },
  {
    id: LANGDON_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Langdon Hills Golf and Country Club",
    town: "Bulphan",
    postcode: "",
    country: "England",
    holesCount: 18,
    par: "72",
    distanceMiles: 5.7,
    website: "https://www.golflangdon.co.uk/",
    phone: "+44 1268 548444",
    location: { lat: 51.544871, lng: 0.395428 },
    osm: { type: "way", id: 262444890 },
    attribution: "Langdon/Bulphan scorecard cross-checked from BlueGolf and Golfify. Course shell from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-04",
      confidence: "Langdon Hills is a 27-hole venue; this seed verifies the Langdon/Bulphan 18-hole combination. BlueGolf gives the full blue/white/yellow/red card, while Golfify confirms the Lower Dunton Road facility identity, phone, and yellow tee rating/slope.",
      sources: [
        { label: "BlueGolf Langdon/Bulphan scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/langdonhillslangdon/detailedscorecard.htm" },
        { label: "Golfify Langdon scorecard", url: "https://www.golfify.io/courses/langdon-hills-golf-club-langdon" },
        { label: "OpenStreetMap course shell", url: "https://www.openstreetmap.org/way/262444890" }
      ]
    },
    tees: [
      { id: "blue", name: "Blue", color: "#4f83ff", rating: "", slope: "", totalYards: 6824 },
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 6582 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "70.1", slope: "123", totalYards: 6216 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "", slope: "", totalYards: 5873 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, LANGDON_SCORECARD, LANGDON_COURSE_ID))
  },
  {
    id: CRONDON_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Crondon Park Golf & Country Club",
    town: "Stock",
    postcode: "",
    country: "England",
    holesCount: 18,
    par: "72",
    distanceMiles: 14.7,
    website: "https://www.crondon.com/",
    phone: "",
    location: { lat: 51.675416, lng: 0.440505 },
    osm: { type: "way", id: 205993614 },
    attribution: "Scorecard cross-checked from Crondon Park members scorecard and BlueGolf. Course shell from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-04",
      confidence: "The members scorecard provides public black/white/yellow/red par and SI, while GolfPass and Albrecht cross-check the 18-hole par-72 championship card and tee totals. Public sources vary slightly on the white yardage; this seed uses the GolfPass/Albrecht totals for consistency.",
      sources: [
        { label: "Crondon members scorecard", url: "https://www.crondonmembers.com/scorecard" },
        { label: "BlueGolf detailed scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/crondonpark/detailedscorecard.htm" },
        { label: "GolfPass course page", url: "https://www.golfpass.com/travel-advisor/courses/32844-crondon-park-golf-country-club-championship-course" },
        { label: "OpenStreetMap course shell", url: "https://www.openstreetmap.org/way/205993614" }
      ]
    },
    tees: [
      { id: "black", name: "Black", color: "#171719", rating: "", slope: "", totalYards: 6829 },
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 6543 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "", slope: "", totalYards: 6158 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "", slope: "", totalYards: 5836 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, CRONDON_SCORECARD, CRONDON_COURSE_ID))
  },
  {
    id: STAPLEFORD_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Stapleford Abbotts Golf Course",
    town: "Stapleford Abbotts",
    postcode: "RM4 1JU",
    country: "England",
    holesCount: 18,
    par: "72",
    distanceMiles: 12.2,
    website: "https://staplefordabbottsgolf.co.uk/",
    phone: "+44 1708 381108",
    location: { lat: 51.636229, lng: 0.205635 },
    osm: { type: "relation", id: 3910795 },
    attribution: "Abbotts course scorecard cross-checked from Golfify and BlueGolf. Course shell from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-04",
      confidence: "Stapleford Abbotts is a multi-course facility; this seed verifies the 18-hole Abbotts course using Golfify for current ratings and BlueGolf as a full scorecard cross-check.",
      sources: [
        { label: "Golfify Abbotts scorecard", url: "https://www.golfify.io/courses/stapleford-abbotts-golf-club-abbotts" },
        { label: "BlueGolf Abbotts scorecard", url: "https://course.bluegolf.com/bluegolf/course/course/staplefordabbottsgc/detailedscorecard.htm" },
        { label: "OpenStreetMap course shell", url: "https://www.openstreetmap.org/relation/3910795" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "71.9", slope: "133", totalYards: 6501 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "70.2", slope: "131", totalYards: 6113 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "73.1", slope: "134", totalYards: 5609 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, STAPLEFORD_SCORECARD, STAPLEFORD_COURSE_ID))
  },
  {
    id: ABRIDGE_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "Abridge Golf and Country Club",
    town: "Stapleford Tawney",
    postcode: "RM4 1ST",
    country: "England",
    holesCount: 18,
    par: "72",
    distanceMiles: 15.3,
    website: "https://www.abridgegolf.com/",
    phone: "+44 1708 688396",
    location: { lat: 51.66659, lng: 0.147339 },
    osm: { type: "way", id: 231370473 },
    attribution: "Scorecard from Golfify. Course shell from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-04",
      confidence: "Golfify provides a full white/yellow/red scorecard, ratings, slopes, Epping Lane location, and phone. The red tee has tee-specific par/SI differences; the current app stores one par/SI per hole, so the men's par/SI is used until tee-specific cards are supported.",
      sources: [
        { label: "Golfify scorecard", url: "https://www.golfify.io/courses/abridge-golf-and-country-club" },
        { label: "OpenStreetMap course shell", url: "https://www.openstreetmap.org/way/231370473" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "69.5", slope: "123", totalYards: 6704 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "", slope: "", totalYards: 6188 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "69.1", slope: "117", totalYards: 5672 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, ABRIDGE_SCORECARD, ABRIDGE_COURSE_ID))
  },
  {
    id: SOUTH_ESSEX_COURSE_ID,
    source: "verified",
    homeAreaId: homeArea.id,
    name: "The Heron Country Club - Hawk/Vixen",
    town: "Herongate",
    postcode: "CM13 3LW",
    country: "England",
    holesCount: 18,
    par: "71",
    distanceMiles: 7.9,
    website: "https://www.heroncountryclub.uk/",
    phone: "+44 1277 811289",
    location: { lat: 51.587385, lng: 0.366777 },
    osm: { type: "way", id: 23618344 },
    attribution: "Hawk and Vixen scorecards cross-checked from The Heron Country Club official pages, Golfify, and GolfPass. Course shell from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-05-04",
      confidence: "South Essex is now The Heron Country Club and has 27 holes. This seed verifies the Hawk/Vixen 18-hole combination, using official nine-hole Hawk and Vixen scorecards and Golfify/GolfPass for combined 18-hole totals and ratings.",
      sources: [
        { label: "Official Hawk scorecard", url: "https://www.heroncountryclub.uk/the_hawk" },
        { label: "Official Vixen scorecard", url: "https://www.heroncountryclub.uk/the_vixen" },
        { label: "Golfify Hawk/Vixen scorecard", url: "https://www.golfify.io/courses/south-essex-golf-country-club-hawk-vixen" },
        { label: "GolfPass Hawk/Vixen course page", url: "https://www.golfpass.com/travel-advisor/courses/34081-south-essex-golf-club-hawk-vixen" },
        { label: "OpenStreetMap course shell", url: "https://www.openstreetmap.org/way/23618344" }
      ]
    },
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "70.8", slope: "123", totalYards: 6523 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "69.5", slope: "124", totalYards: 6192 },
      { id: "blue", name: "Blue", color: "#4f83ff", rating: "72.0", slope: "", totalYards: 5614 },
      { id: "red", name: "Red", color: "#e85d3f", rating: "72.1", slope: "125", totalYards: 5489 }
    ],
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, SOUTH_ESSEX_HAWK_VIXEN_SCORECARD, SOUTH_ESSEX_COURSE_ID))
  }
];

function makeCranhamHole(index) {
  const number = index + 1;
  const hole = placeholderHole(number);
  const [teeLat, teeLng, greenLat, greenLng] = CRANHAM_COORDS[index];
  const visual = cranhamMapVisuals.find((item) => item.ref === number) || CRANHAM_VISUALS[index];
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
      render: visual.features ? "mapped-osm" : "schematic"
    },
    notes: visual.signature || ""
  };
}

function makeBelhusHole(index) {
  const number = index + 1;
  const hole = placeholderHole(number);
  const par = BELHUS_SCORECARD.par[index];
  const teePoint = schematicTeePoint(number, par);
  const greenPoint = schematicGreenPoint(number, par);
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
      path: schematicPath(teePoint, greenPoint, number),
      render: "scorecard-schematic"
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
  const geo = geoFromCoords(scorecardCoordsForCourse(courseId)?.[index] || null);
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
      : "Scorecard verified; tee/green geometry pending. Use OSM holes to map this course when you select it."
  };
}

function scorecardCoordsForCourse(courseId) {
  return courseId === CANVEY_COURSE_ID ? CANVEY_COORDS : null;
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
