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
const LANGDON_HILLS_LANGDON_COURSE_ID = "verified-langdon-hills-langdon";
const LANGDON_HILLS_BULPHAN_COURSE_ID = "verified-langdon-hills-bulphan";
const LANGDON_HILLS_HORNDON_COURSE_ID = "verified-langdon-hills-horndon";
const LANGDON_HILLS_BULPHAN_LANGDON_COURSE_ID = "verified-langdon-hills-bulphan-langdon";
const LANGDON_HILLS_LANGDON_HORNDON_COURSE_ID = "verified-langdon-hills-langdon-horndon";
const LANGDON_HILLS_BULPHAN_HORNDON_COURSE_ID = "verified-langdon-hills-bulphan-horndon";
const LANGDON_HILLS_HORNDON_BULPHAN_COURSE_ID = "verified-langdon-hills-horndon-bulphan";
const LANGDON_HILLS_HORNDON_LANGDON_COURSE_ID = "verified-langdon-hills-horndon-langdon";
const DARTFORD_COURSE_ID = "verified-dartford";
const FAWKHAM_COURSE_ID = "verified-corinthian-fawkham-valley";
const BARNEHURST_COURSE_ID = "verified-barnehurst";
const CARNOUSTIE_CHAMPIONSHIP_COURSE_ID = "verified-carnoustie-championship";
const CARNOUSTIE_BURNSIDE_COURSE_ID = "verified-carnoustie-burnside";
const CARNOUSTIE_BUDDON_COURSE_ID = "verified-carnoustie-buddon";
const ROYAL_ST_GEORGES_COURSE_ID = "verified-royal-st-georges";
const SUNNINGDALE_NEW_COURSE_ID = "verified-sunningdale-new";
const MUIRFIELD_COURSE_ID = "verified-muirfield";
const NORTH_BERWICK_WEST_LINKS_COURSE_ID = "verified-north-berwick-west-links";
const ROYAL_DORNOCH_CHAMPIONSHIP_COURSE_ID = "verified-royal-dornoch-championship";
const ROYAL_DORNOCH_STRUIE_COURSE_ID = "verified-royal-dornoch-struie";
const BELFRY_BRABAZON_COURSE_ID = "verified-belfry-brabazon";
const GLENEAGLES_KINGS_COURSE_ID = "verified-gleneagles-kings";
const GLENEAGLES_PGA_CENTENARY_COURSE_ID = "verified-gleneagles-pga-centenary";
const AUCHTERARDER_COURSE_ID = "verified-auchterarder";
const ROYAL_TROON_OLD_COURSE_ID = "verified-royal-troon-old";
const TURNBERRY_AILSA_COURSE_ID = "verified-turnberry-ailsa";
const CELTIC_MANOR_TWENTY_TEN_COURSE_ID = "verified-celtic-manor-twenty-ten";
const WENTWORTH_WEST_COURSE_ID = "verified-wentworth-west";
const ST_ANDREWS_OLD_COURSE_ID = "verified-st-andrews-old";
const ROYAL_BIRKDALE_COURSE_ID = "verified-royal-birkdale";
const ROYAL_LYTHAM_COURSE_ID = "verified-royal-lytham-st-annes";
const GANTON_COURSE_ID = "verified-ganton";
const WOODHALL_SPA_HOTCHKIN_COURSE_ID = "verified-woodhall-spa-hotchkin";
const SWINLEY_FOREST_COURSE_ID = "verified-swinley-forest";
const HILLSIDE_COURSE_ID = "verified-hillside";

const SNAPSHOT_VERIFIED_COURSE_IDS = new Set([
  "osm-way-23454278",
  BELHUS_COURSE_ID,
  BASILDON_COURSE_ID,
  MARDYKE_COURSE_ID,
  ORSETT_COURSE_ID,
  WARLEY_COURSE_ID,
  CANVEY_COURSE_ID,
  MID_KENT_COURSE_ID,
  TOP_MEADOW_COURSE_ID,
  INGREBOURNE_COURSE_ID,
  LANGDON_HILLS_COURSE_ID,
  LANGDON_HILLS_LANGDON_COURSE_ID,
  LANGDON_HILLS_BULPHAN_COURSE_ID,
  LANGDON_HILLS_HORNDON_COURSE_ID,
  LANGDON_HILLS_BULPHAN_LANGDON_COURSE_ID,
  LANGDON_HILLS_LANGDON_HORNDON_COURSE_ID,
  LANGDON_HILLS_BULPHAN_HORNDON_COURSE_ID,
  LANGDON_HILLS_HORNDON_BULPHAN_COURSE_ID,
  LANGDON_HILLS_HORNDON_LANGDON_COURSE_ID,
  CARNOUSTIE_CHAMPIONSHIP_COURSE_ID,
  CARNOUSTIE_BURNSIDE_COURSE_ID,
  CARNOUSTIE_BUDDON_COURSE_ID,
  ROYAL_ST_GEORGES_COURSE_ID,
  SUNNINGDALE_NEW_COURSE_ID,
  MUIRFIELD_COURSE_ID,
  NORTH_BERWICK_WEST_LINKS_COURSE_ID,
  ROYAL_DORNOCH_CHAMPIONSHIP_COURSE_ID,
  ROYAL_DORNOCH_STRUIE_COURSE_ID,
  BELFRY_BRABAZON_COURSE_ID,
  GLENEAGLES_KINGS_COURSE_ID,
  GLENEAGLES_PGA_CENTENARY_COURSE_ID,
  AUCHTERARDER_COURSE_ID,
  ROYAL_TROON_OLD_COURSE_ID,
  TURNBERRY_AILSA_COURSE_ID,
  CELTIC_MANOR_TWENTY_TEN_COURSE_ID,
  WENTWORTH_WEST_COURSE_ID,
  ST_ANDREWS_OLD_COURSE_ID,
  ROYAL_BIRKDALE_COURSE_ID,
  ROYAL_LYTHAM_COURSE_ID,
  GANTON_COURSE_ID,
  WOODHALL_SPA_HOTCHKIN_COURSE_ID,
  SWINLEY_FOREST_COURSE_ID,
  HILLSIDE_COURSE_ID
]);

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
  yellow: [349, 393, 333, 375, 173, 469, 359, 174, 325, 491, 400, 495, 310, 144, 394, 495, 141, 396],
  red: [342, 398, 319, 339, 136, 431, 353, 152, 297, 475, 387, 475, 292, 120, 341, 480, 140, 396]
};

const LANGDON_HILLS_HORNDON_SCORECARD = {
  par: [4, 4, 3, 5, 4, 4, 5, 3, 4],
  strokeIndex: [9, 17, 15, 7, 3, 13, 1, 5, 11],
  blue: [355, 357, 234, 468, 405, 339, 533, 195, 340],
  white: [336, 325, 159, 468, 358, 339, 494, 195, 318],
  yellow: [307, 309, 140, 455, 340, 324, 478, 177, 305],
  red: [300, 290, 124, 416, 317, 296, 417, 156, 274]
};

const LANGDON_HILLS_LOOP_SCORECARDS = {
  langdon: sliceScorecard(LANGDON_HILLS_SCORECARD, 0, 9),
  bulphan: sliceScorecard(LANGDON_HILLS_SCORECARD, 9, 18),
  horndon: LANGDON_HILLS_HORNDON_SCORECARD
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

const CARNOUSTIE_CHAMPIONSHIP_SCORECARD = {
  par: [4, 4, 4, 4, 4, 5, 4, 3, 4, 4, 4, 4, 3, 4, 4, 3, 4, 4],
  strokeIndex: [10, 4, 14, 16, 12, 2, 8, 18, 6, 3, 15, 9, 17, 1, 7, 13, 5, 11],
  yellow: [389, 407, 325, 364, 369, 500, 373, 157, 416, 417, 351, 407, 141, 459, 437, 235, 421, 421],
  green: [364, 382, 310, 358, 350, 485, 350, 133, 402, 332, 330, 395, 121, 440, 418, 212, 374, 383],
  black: [364, 303, 290, 305, 298, 485, 295, 133, 343, 332, 292, 330, 121, 375, 384, 212, 374, 374]
};

const CARNOUSTIE_BURNSIDE_SCORECARD = {
  par: [4, 4, 3, 4, 3, 4, 4, 4, 3, 4, 4, 4, 4, 3, 5, 3, 4, 4],
  strokeIndex: [18, 4, 16, 2, 10, 14, 12, 6, 8, 15, 7, 13, 5, 1, 11, 9, 3, 17],
  white: [319, 456, 172, 457, 158, 335, 362, 424, 163, 330, 372, 383, 379, 228, 490, 151, 461, 303],
  yellow: [309, 441, 161, 445, 146, 335, 345, 414, 151, 318, 355, 363, 364, 212, 490, 151, 441, 290],
  green: [301, 437, 156, 435, 139, 295, 337, 366, 127, 282, 351, 347, 346, 168, 455, 141, 436, 281]
};

const CARNOUSTIE_BUDDON_SCORECARD = {
  par: [4, 3, 4, 3, 4, 4, 3, 5, 4, 4, 4, 4, 3, 4, 3, 5, 3, 4],
  strokeIndex: [6, 16, 8, 18, 14, 4, 12, 2, 10, 1, 7, 9, 13, 3, 17, 11, 15, 5],
  white: [423, 171, 364, 164, 323, 401, 193, 517, 358, 395, 411, 398, 170, 399, 165, 493, 159, 417],
  yellow: [413, 151, 354, 149, 313, 389, 178, 485, 348, 385, 400, 361, 150, 389, 155, 483, 149, 400]
};

const CARNOUSTIE_HOLE_NAMES = {
  championship: ["Cup", "Gulley", "Jockie's Burn", "Hillocks", "Brae", "Hogan's Alley", "Plantation", "Short", "Railway", "South America", "John Philp", "Southward Ho", "Whins", "Spectacles", "Lucky Slap", "Barry Burn", "Island", "Home"],
  burnside: ["Peninsula", "Ravensby", "Fence", "South America", "Burn", "Camp", "Shelter", "Battery", "Grog", "Kopje", "Deil's Ha'", "Heather", "Punchbowl", "Scoop", "Sou'western", "Whins", "Sinkies", "Lismore"],
  buddon: ["Alma", "Corunna", "Wadi Akarit", "Ypres", "Kohima", "Vimy", "Mareth", "El Alamein", "Caen", "Somme", "The Hook", "St Valery", "Marne", "Waterloo", "Falaise", "Cassino", "Tobruk", "Rhine"]
};

const ROYAL_ST_GEORGES_SCORECARD = {
  par: [4, 4, 3, 4, 4, 3, 5, 4, 4, 4, 3, 4, 4, 5, 4, 3, 4, 4],
  strokeIndex: [10, 6, 16, 2, 8, 18, 14, 4, 12, 9, 3, 15, 7, 13, 1, 17, 5, 11],
  championship: [442, 426, 239, 496, 416, 176, 573, 457, 410, 412, 242, 379, 457, 545, 493, 161, 424, 456],
  medal: [411, 385, 195, 415, 416, 152, 490, 419, 373, 371, 215, 361, 442, 533, 436, 161, 418, 437],
  weekday: [399, 350, 180, 412, 406, 142, 464, 395, 366, 351, 202, 340, 420, 507, 435, 150, 392, 429]
};

const SUNNINGDALE_NEW_SCORECARD = {
  par: [4, 3, 4, 4, 3, 5, 4, 4, 4, 3, 4, 4, 5, 3, 4, 4, 3, 5],
  strokeIndex: [8, 16, 10, 4, 12, 2, 18, 14, 6, 9, 1, 15, 5, 11, 3, 13, 17, 7],
  white: [440, 161, 395, 430, 164, 476, 367, 391, 425, 204, 436, 388, 543, 178, 402, 380, 168, 469],
  yellow: [416, 148, 359, 427, 159, 435, 357, 366, 402, 179, 426, 347, 517, 156, 385, 353, 154, 463],
  blue: [460, 164, 409, 455, 182, 517, 377, 399, 458, 215, 442, 398, 560, 189, 437, 396, 170, 488]
};

const MUIRFIELD_SCORECARD = {
  par: [4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 4, 3, 4, 4, 3, 5, 4],
  strokeIndex: [5, 17, 11, 13, 7, 3, 15, 1, 9, 4, 18, 16, 14, 2, 8, 12, 10, 6],
  yellowRed: [446, 365, 377, 182, 510, 440, 147, 443, 505, 470, 354, 380, 156, 449, 394, 186, 506, 418]
};

const NORTH_BERWICK_SCORECARD = {
  par: [4, 4, 4, 3, 4, 3, 4, 5, 5, 3, 5, 4, 4, 4, 3, 4, 4, 4],
  strokeIndex: [9, 11, 1, 15, 5, 17, 3, 13, 7, 18, 2, 8, 12, 6, 14, 4, 10, 16],
  white: [342, 433, 459, 177, 372, 161, 366, 509, 522, 172, 549, 402, 388, 375, 189, 378, 426, 277],
  blue: [322, 419, 444, 168, 360, 139, 345, 489, 504, 153, 526, 366, 363, 359, 178, 359, 405, 269]
};

const ROYAL_DORNOCH_SCORECARD = {
  par: [4, 3, 4, 4, 4, 3, 4, 4, 5, 3, 4, 5, 3, 4, 4, 4, 4, 4],
  strokeIndex: [13, 5, 11, 3, 15, 9, 1, 7, 17, 14, 4, 16, 12, 2, 18, 8, 10, 6],
  blue: [331, 184, 413, 422, 353, 161, 479, 434, 529, 174, 449, 535, 180, 445, 360, 401, 405, 456],
  white: [331, 177, 413, 422, 353, 161, 479, 434, 529, 146, 446, 535, 171, 445, 322, 401, 405, 456]
};

const ROYAL_DORNOCH_STRUIE_SCORECARD = {
  par: [4, 3, 4, 4, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 5, 3],
  strokeIndex: [12, 18, 8, 14, 2, 4, 10, 6, 16, 3, 11, 7, 5, 1, 13, 9, 17, 15],
  white: [318, 122, 343, 399, 406, 354, 351, 175, 553, 439, 348, 215, 527, 429, 309, 372, 478, 127],
  yellow: [315, 109, 339, 392, 395, 339, 336, 172, 524, 421, 292, 207, 499, 418, 301, 365, 469, 109],
  blue: [303, 71, 329, 315, 346, 295, 289, 159, 454, 339, 268, 147, 432, 384, 265, 313, 400, 121]
};

const BELFRY_BRABAZON_SCORECARD = {
  par: [4, 4, 5, 4, 4, 4, 3, 4, 4, 4, 4, 3, 4, 3, 5, 4, 5, 4],
  strokeIndex: [9, 17, 13, 3, 11, 5, 15, 1, 7, 8, 16, 6, 18, 14, 2, 12, 10, 4],
  blue: [411, 379, 538, 442, 408, 448, 177, 441, 456, 311, 426, 226, 384, 190, 566, 413, 564, 473],
  white: [393, 330, 512, 407, 388, 430, 171, 428, 433, 301, 406, 188, 363, 183, 545, 405, 545, 441],
  yellow: [369, 321, 501, 389, 359, 385, 156, 409, 402, 284, 372, 179, 350, 166, 488, 371, 530, 418]
};

const GLENEAGLES_KINGS_SCORECARD = {
  par: [4, 4, 4, 4, 3, 4, 4, 3, 4, 4, 3, 4, 4, 4, 4, 3, 4, 4],
  strokeIndex: [6, 14, 9, 2, 16, 8, 4, 17, 12, 1, 10, 13, 7, 15, 3, 18, 11, 5],
  yellow: [352, 386, 360, 443, 149, 455, 430, 155, 335, 429, 221, 352, 423, 249, 438, 128, 367, 453]
};

const GLENEAGLES_PGA_CENTENARY_SCORECARD = {
  par: [4, 5, 4, 3, 4, 3, 4, 4, 5, 3, 4, 4, 4, 4, 4, 5, 3, 5],
  strokeIndex: [9, 7, 3, 13, 1, 15, 5, 17, 11, 12, 16, 6, 2, 14, 4, 8, 18, 10],
  blue: [426, 516, 431, 239, 461, 201, 468, 419, 618, 208, 350, 445, 481, 320, 463, 543, 194, 513],
  white: [394, 501, 388, 211, 423, 176, 406, 392, 564, 190, 326, 445, 464, 308, 436, 518, 179, 483]
};

const AUCHTERARDER_SCORECARD = {
  par: [4, 4, 4, 3, 4, 5, 4, 3, 5, 4, 4, 3, 4, 3, 5, 3, 4, 3],
  strokeIndex: [3, 16, 10, 17, 7, 1, 5, 13, 11, 9, 6, 15, 18, 14, 4, 8, 2, 12],
  white: [376, 301, 362, 140, 401, 473, 354, 151, 478, 356, 331, 164, 289, 205, 509, 235, 441, 184]
};

const ROYAL_TROON_OLD_SCORECARD = {
  par: [4, 4, 4, 5, 3, 5, 4, 3, 4, 4, 4, 4, 4, 3, 4, 5, 3, 4],
  strokeIndex: [16, 7, 11, 4, 14, 2, 9, 18, 5, 10, 1, 6, 12, 15, 3, 8, 13, 17],
  blue: [370, 391, 379, 560, 210, 601, 405, 123, 423, 438, 490, 431, 472, 178, 483, 542, 222, 457]
};

const TURNBERRY_AILSA_SCORECARD = {
  par: [4, 4, 4, 3, 5, 3, 5, 4, 3, 5, 3, 4, 4, 5, 3, 4, 4, 4],
  strokeIndex: [6, 10, 4, 16, 8, 18, 12, 2, 14, 9, 15, 3, 13, 11, 17, 1, 5, 7],
  black: [441, 425, 496, 194, 531, 171, 575, 476, 248, 565, 215, 468, 409, 568, 234, 479, 509, 485]
};

const CELTIC_MANOR_TWENTY_TEN_SCORECARD = {
  par: [4, 5, 3, 4, 4, 4, 3, 4, 5, 3, 5, 4, 3, 4, 4, 4, 3, 5],
  strokeIndex: [11, 3, 13, 15, 1, 7, 17, 9, 5, 18, 8, 4, 14, 2, 12, 6, 16, 10],
  blue: [456, 610, 189, 461, 457, 452, 213, 439, 666, 210, 562, 458, 189, 413, 377, 508, 211, 613]
};

const WENTWORTH_WEST_SCORECARD = {
  par: [5, 3, 4, 5, 3, 4, 4, 4, 4, 3, 4, 5, 4, 3, 4, 4, 5, 5],
  strokeIndex: [16, 14, 2, 18, 8, 12, 10, 6, 4, 7, 11, 17, 3, 9, 1, 5, 13, 15],
  white: [473, 154, 448, 498, 184, 351, 396, 391, 449, 184, 389, 509, 437, 179, 477, 383, 566, 521]
};

const ST_ANDREWS_OLD_SCORECARD = {
  par: [4, 4, 4, 4, 5, 4, 4, 3, 4, 4, 3, 4, 4, 5, 4, 4, 4, 4],
  strokeIndex: [10, 6, 16, 8, 2, 12, 4, 14, 18, 15, 7, 3, 11, 1, 9, 13, 5, 17],
  blue: [376, 411, 370, 419, 514, 374, 359, 166, 347, 340, 174, 316, 418, 530, 414, 381, 455, 357]
};

const ROYAL_BIRKDALE_SCORECARD = {
  par: [4, 4, 4, 3, 4, 5, 3, 4, 4, 4, 4, 3, 4, 3, 5, 4, 5, 5],
  strokeIndex: [11, 3, 7, 15, 13, 1, 17, 9, 5, 14, 8, 16, 4, 18, 2, 12, 6, 10],
  white: [450, 418, 406, 200, 343, 488, 177, 413, 410, 408, 378, 181, 433, 199, 544, 370, 527, 472]
};

const ROYAL_LYTHAM_SCORECARD = {
  par: [3, 4, 4, 4, 3, 5, 5, 4, 3, 4, 5, 3, 4, 4, 4, 4, 4, 4],
  strokeIndex: [13, 5, 1, 9, 15, 7, 3, 11, 17, 10, 4, 14, 18, 6, 2, 16, 8, 12],
  green: [198, 424, 457, 381, 188, 494, 569, 396, 156, 334, 540, 187, 340, 436, 455, 351, 432, 393]
};

const GANTON_SCORECARD = {
  par: [4, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 5, 4, 4, 4, 3, 4],
  strokeIndex: [13, 7, 15, 3, 17, 11, 1, 9, 5, 18, 6, 14, 4, 16, 2, 8, 10, 12],
  club: [359, 395, 288, 365, 148, 438, 414, 368, 499, 165, 398, 357, 497, 278, 427, 427, 235, 387]
};

const WOODHALL_SPA_HOTCHKIN_SCORECARD = {
  par: [4, 4, 4, 4, 3, 5, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 5],
  strokeIndex: [17, 7, 3, 11, 16, 1, 9, 13, 5, 12, 6, 18, 2, 8, 14, 4, 15, 10],
  medal: [361, 411, 415, 414, 148, 510, 437, 192, 555, 338, 437, 172, 451, 488, 321, 395, 336, 540]
};

const SWINLEY_FOREST_SCORECARD = {
  par: [4, 4, 4, 3, 5, 4, 4, 3, 4, 3, 4, 4, 3, 4, 5, 4, 3, 4],
  strokeIndex: [5, 9, 17, 13, 11, 7, 1, 15, 3, 8, 16, 2, 18, 12, 6, 4, 14, 10],
  white: [400, 369, 295, 175, 480, 394, 400, 146, 425, 205, 277, 435, 174, 354, 470, 400, 176, 380]
};

const HILLSIDE_SCORECARD = {
  par: [4, 5, 4, 3, 5, 4, 3, 4, 4, 3, 5, 4, 4, 4, 4, 3, 5, 4],
  strokeIndex: [9, 5, 13, 15, 7, 1, 17, 3, 11, 10, 6, 16, 2, 14, 4, 18, 8, 12],
  black: [396, 526, 397, 195, 562, 444, 170, 393, 419, 172, 509, 400, 402, 419, 421, 218, 547, 439]
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
  [LANGDON_HILLS_LANGDON_COURSE_ID]: "Langdon Hills",
  [LANGDON_HILLS_BULPHAN_COURSE_ID]: "Langdon Hills",
  [LANGDON_HILLS_HORNDON_COURSE_ID]: "Langdon Hills",
  [LANGDON_HILLS_BULPHAN_LANGDON_COURSE_ID]: "Langdon Hills",
  [LANGDON_HILLS_LANGDON_HORNDON_COURSE_ID]: "Langdon Hills",
  [LANGDON_HILLS_BULPHAN_HORNDON_COURSE_ID]: "Langdon Hills",
  [LANGDON_HILLS_HORNDON_BULPHAN_COURSE_ID]: "Langdon Hills",
  [LANGDON_HILLS_HORNDON_LANGDON_COURSE_ID]: "Langdon Hills",
  [DARTFORD_COURSE_ID]: "Dartford",
  [FAWKHAM_COURSE_ID]: "Corinthian Fawkham Valley",
  [BARNEHURST_COURSE_ID]: "Barnehurst",
  [CARNOUSTIE_CHAMPIONSHIP_COURSE_ID]: "Carnoustie Championship",
  [CARNOUSTIE_BURNSIDE_COURSE_ID]: "Carnoustie Burnside",
  [CARNOUSTIE_BUDDON_COURSE_ID]: "Carnoustie Buddon",
  [ROYAL_ST_GEORGES_COURSE_ID]: "Royal St George's",
  [SUNNINGDALE_NEW_COURSE_ID]: "Sunningdale New",
  [MUIRFIELD_COURSE_ID]: "Muirfield",
  [NORTH_BERWICK_WEST_LINKS_COURSE_ID]: "North Berwick West Links",
  [ROYAL_DORNOCH_CHAMPIONSHIP_COURSE_ID]: "Royal Dornoch Championship",
  [ROYAL_DORNOCH_STRUIE_COURSE_ID]: "Royal Dornoch Struie",
  [BELFRY_BRABAZON_COURSE_ID]: "The Belfry Brabazon",
  [GLENEAGLES_KINGS_COURSE_ID]: "Gleneagles King's",
  [GLENEAGLES_PGA_CENTENARY_COURSE_ID]: "Gleneagles PGA Centenary",
  [AUCHTERARDER_COURSE_ID]: "Auchterarder",
  [ROYAL_TROON_OLD_COURSE_ID]: "Royal Troon Old",
  [TURNBERRY_AILSA_COURSE_ID]: "Turnberry Ailsa",
  [CELTIC_MANOR_TWENTY_TEN_COURSE_ID]: "Celtic Manor Twenty Ten",
  [WENTWORTH_WEST_COURSE_ID]: "Wentworth West",
  [ST_ANDREWS_OLD_COURSE_ID]: "St Andrews Old Course",
  [ROYAL_BIRKDALE_COURSE_ID]: "Royal Birkdale",
  [ROYAL_LYTHAM_COURSE_ID]: "Royal Lytham & St Annes",
  [GANTON_COURSE_ID]: "Ganton",
  [WOODHALL_SPA_HOTCHKIN_COURSE_ID]: "Woodhall Spa Hotchkin",
  [SWINLEY_FOREST_COURSE_ID]: "Swinley Forest",
  [HILLSIDE_COURSE_ID]: "Hillside"
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
  makeLangdonHillsLayoutCourse({
    id: LANGDON_HILLS_LANGDON_COURSE_ID,
    layoutName: "Langdon",
    loopIds: ["langdon"],
    sourceUrl: "https://course.bluegolf.com/bluegolf/course/course/langdonhillslangdon/detailedscorecard.htm"
  }),
  makeLangdonHillsLayoutCourse({
    id: LANGDON_HILLS_BULPHAN_COURSE_ID,
    layoutName: "Bulphan",
    loopIds: ["bulphan"],
    sourceUrl: "https://course.bluegolf.com/bluegolf/course/course/langdonhillslangdon/detailedscorecard.htm"
  }),
  makeLangdonHillsLayoutCourse({
    id: LANGDON_HILLS_HORNDON_COURSE_ID,
    layoutName: "Horndon",
    loopIds: ["horndon"],
    sourceUrl: "https://www.golfpass.com/travel-advisor/courses/33453-langdon-hills-golf-country-club-horndon-course"
  }),
  makeLangdonHillsLayoutCourse({
    id: LANGDON_HILLS_COURSE_ID,
    layoutName: "Langdon/Bulphan",
    loopIds: ["langdon", "bulphan"],
    sourceUrl: "https://course.bluegolf.com/bluegolf/course/course/langdonhillslangdon/detailedscorecard.htm"
  }),
  makeLangdonHillsLayoutCourse({
    id: LANGDON_HILLS_BULPHAN_LANGDON_COURSE_ID,
    layoutName: "Bulphan/Langdon",
    loopIds: ["bulphan", "langdon"],
    sourceUrl: "https://course.bluegolf.com/bluegolf/course/course/langdonhillslangdon/detailedscorecard.htm"
  }),
  makeLangdonHillsLayoutCourse({
    id: LANGDON_HILLS_LANGDON_HORNDON_COURSE_ID,
    layoutName: "Langdon/Horndon",
    loopIds: ["langdon", "horndon"],
    sourceUrl: "https://www.golfpass.com/travel-advisor/courses/33453-langdon-hills-golf-country-club-horndon-course"
  }),
  makeLangdonHillsLayoutCourse({
    id: LANGDON_HILLS_BULPHAN_HORNDON_COURSE_ID,
    layoutName: "Bulphan/Horndon",
    loopIds: ["bulphan", "horndon"],
    sourceUrl: "https://course.bluegolf.com/bluegolf/course/course/langdonhillsbulphan/detailedscorecard.htm"
  }),
  makeLangdonHillsLayoutCourse({
    id: LANGDON_HILLS_HORNDON_BULPHAN_COURSE_ID,
    layoutName: "Horndon/Bulphan",
    loopIds: ["horndon", "bulphan"],
    sourceUrl: "https://course.bluegolf.com/bluegolf/course/course/langdonhillsbulphan/detailedscorecard.htm"
  }),
  makeLangdonHillsLayoutCourse({
    id: LANGDON_HILLS_HORNDON_LANGDON_COURSE_ID,
    layoutName: "Horndon/Langdon",
    loopIds: ["horndon", "langdon"],
    sourceUrl: "https://www.golfpass.com/travel-advisor/courses/33453-langdon-hills-golf-country-club-horndon-course"
  }),
  makeMappedVerifiedCourse({
    id: ROYAL_ST_GEORGES_COURSE_ID,
    name: "Royal St George's Golf Club",
    town: "Sandwich",
    postcode: "CT13 9PB",
    country: "England",
    par: "70",
    website: "https://www.royalstgeorges.com/the-course/",
    phone: "+44 1304 613090",
    location: { lat: 51.274, lng: 1.367 },
    scorecard: ROYAL_ST_GEORGES_SCORECARD,
    tees: [
      { id: "championship", name: "Championship", color: "#27272a", rating: "", slope: "", totalYards: 7204 },
      { id: "medal", name: "Medal", color: "#f8f7f1", rating: "", slope: "", totalYards: 6630 },
      { id: "weekday", name: "Weekday", color: "#d7a44d", rating: "", slope: "", totalYards: 6340 }
    ],
    confidence: "The official club hole pages provide Championship, Medal, and Weekday yardages, par, and stroke index for all 18 holes. The selected OSM routing is the only complete nearby 18-hole set whose par sequence and measured lengths agree with that card.",
    sources: [
      { label: "Official course page", url: "https://www.royalstgeorges.com/the-course/" },
      { label: "Official first-hole card", url: "https://www.royalstgeorges.com/the-course/01st/" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/51.2740/1.3670" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: SUNNINGDALE_NEW_COURSE_ID,
    venueId: "venue-sunningdale",
    venueName: "Sunningdale Golf Club",
    layoutName: "New Course",
    name: "Sunningdale Golf Club - New Course",
    town: "Sunningdale",
    postcode: "SL5 9RR",
    country: "England",
    par: "70",
    website: "https://www.sunningdalegolfclub.co.uk/new_course",
    phone: "+44 1344 621681",
    location: { lat: 51.373, lng: -0.638 },
    scorecard: SUNNINGDALE_NEW_SCORECARD,
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 6417 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "", slope: "", totalYards: 6049 },
      { id: "blue", name: "Blue", color: "#4f8fd9", rating: "", slope: "", totalYards: 6716 }
    ],
    confidence: "Sunningdale's published scorecard is headed New Course and provides complete white, yellow, and blue cards. Its public URL is incorrectly named old_course_scorecard; the heading, totals, and par sequence identify the New Course, and that sequence uniquely selects the matching OSM routing.",
    sources: [
      { label: "Official New Course page", url: "https://www.sunningdalegolfclub.co.uk/new_course" },
      { label: "Official scorecard", url: "https://www.sunningdalegolfclub.co.uk/old_course_scorecard" },
      { label: "Official contact page", url: "https://www.sunningdalegolfclub.co.uk/contact_us" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/51.3730/-0.6380" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: MUIRFIELD_COURSE_ID,
    name: "Muirfield",
    town: "Gullane",
    postcode: "EH31 2EG",
    country: "Scotland",
    par: "71",
    website: "https://www.muirfield.org.uk/the-course/",
    phone: "+44 1620 842123",
    location: { lat: 56.043, lng: -2.821 },
    scorecard: MUIRFIELD_SCORECARD,
    tees: [
      { id: "yellowRed", name: "Yellow / Red", color: "#d7a44d", rating: "", slope: "", totalYards: 6728 }
    ],
    confidence: "Muirfield's official strokesaver supplies the complete 6,728-yard yellow/red card. OSM explicitly tags one complete set of 18 hole ways as Muirfield, preventing contamination from the neighbouring Gullane courses.",
    sources: [
      { label: "Official course page", url: "https://www.muirfield.org.uk/the-course/" },
      { label: "Official scorecard", url: "https://www.muirfield.org.uk/strokesaver" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/56.0430/-2.8210" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: NORTH_BERWICK_WEST_LINKS_COURSE_ID,
    name: "North Berwick Golf Club - West Links",
    town: "North Berwick",
    postcode: "EH39 4BB",
    country: "Scotland",
    par: "71",
    website: "https://www.northberwickgolfclub.com/the_west_links",
    phone: "+44 1620 895040",
    location: { lat: 56.058, lng: -2.716 },
    scorecard: NORTH_BERWICK_SCORECARD,
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 6497 },
      { id: "blue", name: "Blue", color: "#4f8fd9", rating: "", slope: "", totalYards: 6168 }
    ],
    confidence: "The official club hole pages publish white and blue yardages, par, and stroke index for every hole. The selected OSM set is the complete West Links routing; the separate nine-hole Children's Course is excluded by way identity and length.",
    sources: [
      { label: "Official West Links page", url: "https://www.northberwickgolfclub.com/the_west_links" },
      { label: "Official hole-by-hole overview", url: "https://www.northberwickgolfclub.com/hole_by_hole" },
      { label: "Official first-hole card", url: "https://www.northberwickgolfclub.com/hole_1" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/56.0580/-2.7160" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: ROYAL_DORNOCH_CHAMPIONSHIP_COURSE_ID,
    venueId: "venue-royal-dornoch",
    venueName: "Royal Dornoch Golf Club",
    layoutName: "Championship Course",
    name: "Royal Dornoch Golf Club - Championship Course",
    town: "Dornoch",
    postcode: "IV25 3LW",
    country: "Scotland",
    par: "70",
    website: "https://royaldornoch.com/",
    phone: "+44 1862 810219",
    location: { lat: 57.88, lng: -4.03 },
    scorecard: ROYAL_DORNOCH_SCORECARD,
    tees: [
      { id: "blue", name: "Blue", color: "#4f8fd9", rating: "", slope: "", totalYards: 6711 },
      { id: "white", name: "White", color: "#f8f7f1", rating: "70.0", slope: "", totalYards: 6626 }
    ],
    confidence: "Golfify provides the full current Championship card and venue contact details. OSM explicitly labels a complete 18-hole set as Championship Course; the neighbouring Struie routing is separately tagged and excluded. The club website was temporarily returning 502 responses during the 2026-06-21 verification.",
    sources: [
      { label: "Official club site", url: "https://royaldornoch.com/" },
      { label: "Golfify Championship scorecard", url: "https://www.golfify.io/courses/royal-dornoch-golf-club-championship" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/57.8800/-4.0300" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: ROYAL_DORNOCH_STRUIE_COURSE_ID,
    venueId: "venue-royal-dornoch",
    venueName: "Royal Dornoch Golf Club",
    layoutName: "Struie Course",
    name: "Royal Dornoch Golf Club - Struie Course",
    town: "Dornoch",
    postcode: "IV25 3LW",
    country: "Scotland",
    par: "71",
    website: "https://royaldornoch.com/",
    phone: "+44 1862 810219",
    location: { lat: 57.879504, lng: -4.022882 },
    scorecard: ROYAL_DORNOCH_STRUIE_SCORECARD,
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "73.0", slope: "", totalYards: 6265 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "71.0", slope: "", totalYards: 6002 },
      { id: "blue", name: "Blue", color: "#4f8fd9", rating: "74.0", slope: "", totalYards: 5230 }
    ],
    confidence: "Golfify provides the complete current Struie card and venue details. OSM explicitly labels all 18 selected hole ways as Struie Course, separating them cleanly from the Championship routing.",
    sources: [
      { label: "Official club site", url: "https://royaldornoch.com/" },
      { label: "Golfify Struie scorecard", url: "https://www.golfify.io/courses/royal-dornoch-golf-club-struie" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/57.8795/-4.0229" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: BELFRY_BRABAZON_COURSE_ID,
    venueId: "venue-belfry",
    venueName: "The Belfry",
    layoutName: "The Brabazon",
    name: "The Belfry - The Brabazon",
    town: "Sutton Coldfield",
    postcode: "B76 9PR",
    country: "England",
    par: "72",
    website: "https://www.thebelfry.com/golf/the-brabazon/",
    phone: "+44 1675 470301",
    location: { lat: 52.554312, lng: -1.733309 },
    scorecard: BELFRY_BRABAZON_SCORECARD,
    tees: [
      { id: "blue", name: "Blue", color: "#4f8fd9", rating: "74.0", slope: "", totalYards: 7253 },
      { id: "white", name: "White", color: "#f8f7f1", rating: "74.8", slope: "145", totalYards: 6869 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "72.7", slope: "142", totalYards: 6449 }
    ],
    confidence: "Golfify provides complete blue, white, and yellow cards. The selected OSM routing is a single numbered 18-hole set whose par sequence and measured lengths match the Brabazon card.",
    sources: [
      { label: "Official Brabazon page", url: "https://www.thebelfry.com/golf/the-brabazon/" },
      { label: "Golfify Brabazon scorecard", url: "https://www.golfify.io/courses/the-belfry-the-brabazon" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/52.5543/-1.7333" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: GLENEAGLES_KINGS_COURSE_ID,
    venueId: "venue-gleneagles",
    venueName: "Gleneagles",
    layoutName: "The King's Course",
    name: "Gleneagles - The King's Course",
    town: "Auchterarder",
    postcode: "PH3 1NF",
    country: "Scotland",
    par: "68",
    website: "https://gleneagles.com/golf/the-kings/",
    phone: "+44 1764 662231",
    location: { lat: 56.283248, lng: -3.751453 },
    scorecard: GLENEAGLES_KINGS_SCORECARD,
    tees: [
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "71.1", slope: "128", totalYards: 6125 }
    ],
    confidence: "The official Gleneagles guide identifies the King's routing and named holes. Its mapped western 18-hole set is uniquely closest to the published King's yellow card; only that tee is included because Gleneagles publishes tee-specific pars.",
    sources: [
      { label: "Official King's Course guide", url: "https://gleneagles.com/golf/the-kings/" },
      { label: "Golfify King's scorecard", url: "https://www.golfify.io/courses/gleneagles-golf-resort-kings" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/56.2832/-3.7515" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: GLENEAGLES_PGA_CENTENARY_COURSE_ID,
    venueId: "venue-gleneagles",
    venueName: "Gleneagles",
    layoutName: "PGA Centenary Course",
    name: "Gleneagles - PGA Centenary Course",
    town: "Auchterarder",
    postcode: "PH3 1NF",
    country: "Scotland",
    par: "72",
    website: "https://gleneagles.com/golf/the-pga-centenary/",
    phone: "+44 1764 662231",
    location: { lat: 56.2801, lng: -3.7419 },
    scorecard: GLENEAGLES_PGA_CENTENARY_SCORECARD,
    tees: [
      { id: "blue", name: "Blue", color: "#4f8fd9", rating: "", slope: "", totalYards: 7296 },
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 6804 }
    ],
    confidence: "The official course guide's Bracken Brae-to-Dun Roamin' hole names match the OSM ways hole for hole. The same routing also closely matches Golfify's complete white and blue cards.",
    sources: [
      { label: "Official PGA Centenary guide", url: "https://gleneagles.com/golf/the-pga-centenary/" },
      { label: "Golfify PGA Centenary scorecard", url: "https://www.golfify.io/courses/gleneagles-golf-resort-pga-centenary" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/56.2801/-3.7419" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: AUCHTERARDER_COURSE_ID,
    name: "Auchterarder Golf Club",
    town: "Auchterarder",
    postcode: "PH3 1LS",
    country: "Scotland",
    par: "69",
    website: "https://www.auchterardergolf.co.uk/",
    phone: "+44 1764 662804",
    location: { lat: 56.284975, lng: -3.728335 },
    scorecard: AUCHTERARDER_SCORECARD,
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 5750 }
    ],
    confidence: "Golfify provides the complete white card and venue details. The neighbouring OSM routing is fully numbered and named; its par sequence and measured lengths match the Auchterarder card exactly, excluding all three Gleneagles layouts.",
    sources: [
      { label: "Official club site", url: "https://www.auchterardergolf.co.uk/" },
      { label: "Golfify scorecard", url: "https://www.golfify.io/courses/auchterarder-golf-club" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/56.2850/-3.7283" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: ROYAL_TROON_OLD_COURSE_ID,
    venueId: "venue-royal-troon",
    venueName: "Royal Troon Golf Club",
    layoutName: "Old Course",
    name: "Royal Troon Golf Club - Old Course",
    town: "Troon",
    postcode: "KA10 6EP",
    country: "Scotland",
    par: "71",
    website: "https://www.royaltroon.co.uk/",
    phone: "+44 (0)1292 311555",
    location: { lat: 55.532449, lng: -4.647742 },
    scorecard: ROYAL_TROON_OLD_SCORECARD,
    tees: [
      { id: "blue", name: "Blue", color: "#4f8fd9", rating: "", slope: "", totalYards: 7175 }
    ],
    confidence: "Golfify supplies a complete 18-hole card and venue details. The selected continuous OSM routing is isolated from nearby courses by its hole sequence, measured lengths, and course tags where available.",
    sources: [
      { label: "Official course site", url: "https://www.royaltroon.co.uk/" },
      { label: "Golfify scorecard", url: "https://www.golfify.io/courses/royal-troon-golf-club-old" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/55.5324/-4.6477" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: TURNBERRY_AILSA_COURSE_ID,
    venueId: "venue-turnberry",
    venueName: "Turnberry",
    layoutName: "Ailsa Course",
    name: "Turnberry - Ailsa Course",
    town: "Turnberry",
    postcode: "KA26 9LT",
    country: "Scotland",
    par: "71",
    website: "https://www.turnberry.co.uk/golf/ailsa-course",
    phone: "+44 (0)1655 331000",
    location: { lat: 55.318681, lng: -4.831584 },
    scorecard: TURNBERRY_AILSA_SCORECARD,
    tees: [
      { id: "black", name: "Black", color: "#27272a", rating: "70", slope: "113", totalYards: 7489 }
    ],
    confidence: "Golfify supplies a complete 18-hole card and venue details. The selected continuous OSM routing is isolated from nearby courses by its hole sequence, measured lengths, and course tags where available.",
    sources: [
      { label: "Official course site", url: "https://www.turnberry.co.uk/golf/ailsa-course" },
      { label: "Golfify scorecard", url: "https://www.golfify.io/courses/turnberry-golf-club-ailsa" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/55.3187/-4.8316" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: CELTIC_MANOR_TWENTY_TEN_COURSE_ID,
    venueId: "venue-celtic-manor",
    venueName: "Celtic Manor Resort",
    layoutName: "Twenty Ten Course",
    name: "Celtic Manor Resort - Twenty Ten Course",
    town: "Newport",
    postcode: "NP18 1HQ",
    country: "Wales",
    par: "71",
    website: "https://www.celtic-manor.com/golf/courses/the-twenty-ten-course/",
    phone: "+44 (0)1633 413000",
    location: { lat: 51.6022056, lng: -2.9335758 },
    scorecard: CELTIC_MANOR_TWENTY_TEN_SCORECARD,
    tees: [
      { id: "blue", name: "Blue", color: "#4f8fd9", rating: "", slope: "", totalYards: 7484 }
    ],
    confidence: "Golfify supplies a complete 18-hole card and venue details. The selected continuous OSM routing is isolated from nearby courses by its hole sequence, measured lengths, and course tags where available.",
    sources: [
      { label: "Official course site", url: "https://www.celtic-manor.com/golf/courses/the-twenty-ten-course/" },
      { label: "Golfify scorecard", url: "https://www.golfify.io/courses/celtic-manor-resort-twenty-ten" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/51.6022/-2.9336" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: WENTWORTH_WEST_COURSE_ID,
    venueId: "venue-wentworth",
    venueName: "Wentworth Club",
    layoutName: "West Course",
    name: "Wentworth Club - West Course",
    town: "Virginia Water",
    postcode: "GU25 4LS",
    country: "England",
    par: "73",
    website: "https://www.wentworthclub.com/golf/west-course/",
    phone: "+44 (0)1344 842201",
    location: { lat: 51.398958, lng: -0.5920816 },
    scorecard: WENTWORTH_WEST_SCORECARD,
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 6989 }
    ],
    confidence: "Golfify supplies a complete 18-hole card and venue details. The selected continuous OSM routing is isolated from nearby courses by its hole sequence, measured lengths, and course tags where available.",
    sources: [
      { label: "Official course site", url: "https://www.wentworthclub.com/golf/west-course/" },
      { label: "Golfify scorecard", url: "https://www.golfify.io/courses/wentworth-club-west" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/51.3990/-0.5921" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: ST_ANDREWS_OLD_COURSE_ID,
    venueId: "venue-st-andrews-links",
    venueName: "St Andrews Links",
    layoutName: "Old Course",
    name: "St Andrews Links - Old Course",
    town: "St. Andrews",
    postcode: "KY16 9SF",
    country: "Scotland",
    par: "72",
    website: "https://standrews.com/golf/courses/old-course",
    phone: "+44 (0)1334 466666",
    location: { lat: 56.352211, lng: -2.818685 },
    scorecard: ST_ANDREWS_OLD_SCORECARD,
    tees: [
      { id: "blue", name: "Blue", color: "#4f8fd9", rating: "73.1", slope: "132", totalYards: 6721 }
    ],
    confidence: "Golfify supplies a complete 18-hole card and venue details. The selected continuous OSM routing is isolated from nearby courses by its hole sequence, measured lengths, and course tags where available.",
    sources: [
      { label: "Official course site", url: "https://standrews.com/golf/courses/old-course" },
      { label: "Golfify scorecard", url: "https://www.golfify.io/courses/st-andrews-golf-links-old" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/56.3522/-2.8187" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: ROYAL_BIRKDALE_COURSE_ID,
    name: "Royal Birkdale Golf Club",
    town: "Southport",
    postcode: "PR8 2LX",
    country: "England",
    par: "72",
    website: "https://royalbirkdale.com/",
    phone: "+44 (0) 1704 552020",
    location: { lat: 53.621885, lng: -3.03257 },
    scorecard: ROYAL_BIRKDALE_SCORECARD,
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "", slope: "", totalYards: 6817 }
    ],
    confidence: "Golfify supplies a complete 18-hole card and venue details. The selected continuous OSM routing is isolated from nearby courses by its hole sequence, measured lengths, and course tags where available.",
    sources: [
      { label: "Official course site", url: "https://royalbirkdale.com/" },
      { label: "Golfify scorecard", url: "https://www.golfify.io/courses/the-royal-birkdale-golf-club" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/53.6219/-3.0326" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: ROYAL_LYTHAM_COURSE_ID,
    name: "Royal Lytham & St Annes Golf Club",
    town: "Lytham St Annes",
    postcode: "FY8 3LQ",
    country: "England",
    par: "71",
    website: "https://www.royallytham.org/",
    phone: "+44 (0)1253 643790",
    location: { lat: 53.749606, lng: -3.01788 },
    scorecard: ROYAL_LYTHAM_SCORECARD,
    tees: [
      { id: "green", name: "Green", color: "#73b94e", rating: "72.5", slope: "139", totalYards: 6731 }
    ],
    confidence: "Golfify supplies a complete 18-hole card and venue details. The selected continuous OSM routing is isolated from nearby courses by its hole sequence, measured lengths, and course tags where available.",
    sources: [
      { label: "Official course site", url: "https://www.royallytham.org/" },
      { label: "Golfify scorecard", url: "https://www.golfify.io/courses/royal-lytham-and-st-annes-golf-club" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/53.7496/-3.0179" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: GANTON_COURSE_ID,
    name: "Ganton Golf Club",
    town: "Scarborough",
    postcode: "YO12 4PA",
    country: "England",
    par: "72",
    website: "https://www.gantongolfclub.com/",
    phone: "+44 (0)1944 710329",
    location: { lat: 54.190664, lng: -0.495003 },
    scorecard: GANTON_SCORECARD,
    tees: [
      { id: "club", name: "Club", color: "#f8f7f1", rating: "71", slope: "", totalYards: 6445 }
    ],
    confidence: "Golfify supplies a complete 18-hole card and venue details. The selected continuous OSM routing is isolated from nearby courses by its hole sequence, measured lengths, and course tags where available.",
    sources: [
      { label: "Official course site", url: "https://www.gantongolfclub.com/" },
      { label: "Golfify scorecard", url: "https://www.golfify.io/courses/ganton-golf-club" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/54.1907/-0.4950" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: WOODHALL_SPA_HOTCHKIN_COURSE_ID,
    venueId: "venue-woodhall-spa",
    venueName: "Woodhall Spa Golf Club",
    layoutName: "Hotchkin Course",
    name: "Woodhall Spa Golf Club - Hotchkin Course",
    town: "Woodhall Spa",
    postcode: "LN10 6PU",
    country: "England",
    par: "73",
    website: "https://www.woodhallspagolf.com/",
    phone: "+44 (0) 1526 352511",
    location: { lat: 53.15549, lng: -0.205512 },
    scorecard: WOODHALL_SPA_HOTCHKIN_SCORECARD,
    tees: [
      { id: "medal", name: "Medal", color: "#f8f7f1", rating: "74.4", slope: "151", totalYards: 6921 }
    ],
    confidence: "Golfify supplies a complete 18-hole card and venue details. The selected continuous OSM routing is isolated from nearby courses by its hole sequence, measured lengths, and course tags where available.",
    sources: [
      { label: "Official course site", url: "https://www.woodhallspagolf.com/" },
      { label: "Golfify scorecard", url: "https://www.golfify.io/courses/woodhall-spa-and-golf-club-hotchkin" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/53.1555/-0.2055" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: SWINLEY_FOREST_COURSE_ID,
    name: "Swinley Forest Golf Club",
    town: "Ascot",
    postcode: "SL5 9LE",
    country: "England",
    par: "69",
    website: "https://www.swinleyforest.co.uk/",
    phone: "+44 (0)1344 620197",
    location: { lat: 51.3904971, lng: -0.6834174 },
    scorecard: SWINLEY_FOREST_SCORECARD,
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "69", slope: "113", totalYards: 5955 }
    ],
    confidence: "Golfify supplies a complete 18-hole card and venue details. The selected continuous OSM routing is isolated from nearby courses by its hole sequence, measured lengths, and course tags where available.",
    sources: [
      { label: "Official course site", url: "https://www.swinleyforest.co.uk/" },
      { label: "Golfify scorecard", url: "https://www.golfify.io/courses/swinley-forest-golf-club" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/51.3905/-0.6834" }
    ]
  }),
  makeMappedVerifiedCourse({
    id: HILLSIDE_COURSE_ID,
    name: "Hillside Golf Club",
    town: "Southport",
    postcode: "PR8 2LU",
    country: "England",
    par: "72",
    website: "https://www.hillside-golfclub.co.uk/",
    phone: "+44 (0)1704 567169",
    location: { lat: 53.620002, lng: -3.027553 },
    scorecard: HILLSIDE_SCORECARD,
    tees: [
      { id: "black", name: "Black", color: "#27272a", rating: "75.2", slope: "138", totalYards: 7029 }
    ],
    confidence: "Golfify supplies a complete 18-hole card and venue details. The selected continuous OSM routing is isolated from nearby courses by its hole sequence, measured lengths, and course tags where available.",
    sources: [
      { label: "Official course site", url: "https://www.hillside-golfclub.co.uk/" },
      { label: "Golfify scorecard", url: "https://www.golfify.io/courses/hillside-golf-club" },
      { label: "OpenStreetMap", url: "https://www.openstreetmap.org/#map=15/53.6200/-3.0276" }
    ]
  }),
  makeCarnoustieCourse({
    id: CARNOUSTIE_CHAMPIONSHIP_COURSE_ID,
    layoutId: "championship",
    layoutName: "Championship Course",
    par: "70",
    location: { lat: 56.493734, lng: -2.726024 },
    scorecard: CARNOUSTIE_CHAMPIONSHIP_SCORECARD,
    scorecardUrl: "https://www.carnoustiegolflinks.com/wp-content/uploads/2025/02/carnoustie_championship_2022_scorecard_coverless-copy.pdf",
    tees: [
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "73.6", slope: "135", totalYards: 6589 },
      { id: "green", name: "Green", color: "#73b94e", rating: "71.5", slope: "130", totalYards: 6139 },
      { id: "black", name: "Black", color: "#27272a", rating: "69.1", slope: "126", totalYards: 5610 }
    ]
  }),
  makeCarnoustieCourse({
    id: CARNOUSTIE_BURNSIDE_COURSE_ID,
    layoutId: "burnside",
    layoutName: "Burnside Course",
    par: "68",
    location: { lat: 56.493824, lng: -2.728002 },
    scorecard: CARNOUSTIE_BURNSIDE_SCORECARD,
    scorecardUrl: "https://www.carnoustiegolflinks.com/wp-content/uploads/2025/02/carnoustie_burnside_2022_scorecard_coverless-copy.pdf",
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "69.5", slope: "125", totalYards: 5943 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "68.3", slope: "122", totalYards: 5731 },
      { id: "green", name: "Green", color: "#73b94e", rating: "66.5", slope: "122", totalYards: 5400 }
    ]
  }),
  makeCarnoustieCourse({
    id: CARNOUSTIE_BUDDON_COURSE_ID,
    layoutId: "buddon",
    layoutName: "Buddon Course",
    par: "68",
    location: { lat: 56.491151, lng: -2.730347 },
    scorecard: CARNOUSTIE_BUDDON_SCORECARD,
    scorecardUrl: "https://www.carnoustiegolflinks.com/wp-content/uploads/2025/02/carnoustie_buddon_2022_scorecard_coverless-copy.pdf",
    tees: [
      { id: "white", name: "White", color: "#f8f7f1", rating: "69.0", slope: "120", totalYards: 5921 },
      { id: "yellow", name: "Yellow", color: "#d7a44d", rating: "67.7", slope: "117", totalYards: 5652 }
    ]
  }),
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
].filter((course) => SNAPSHOT_VERIFIED_COURSE_IDS.has(course.id));

function makeMappedVerifiedCourse({
  id,
  venueId,
  venueName,
  layoutName,
  name,
  town,
  postcode,
  country,
  par,
  website,
  phone,
  location,
  scorecard,
  tees,
  confidence,
  sources
}) {
  return {
    id,
    source: "verified",
    homeAreaId: homeArea.id,
    ...(venueId ? { venueId } : {}),
    ...(venueName ? { venueName } : {}),
    ...(layoutName ? { layoutName } : {}),
    name,
    town,
    postcode,
    country,
    holesCount: 18,
    par,
    website,
    phone,
    location,
    attribution: "Scorecard from the cited club or scorecard source. Hole routing from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-06-21",
      confidence,
      sources
    },
    tees,
    holes: Array.from({ length: 18 }, (_, index) => makeScorecardOnlyHole(index, scorecard, id))
  };
}

function makeCarnoustieCourse({ id, layoutId, layoutName, par, location, scorecard, scorecardUrl, tees }) {
  const courseUrl = `https://www.carnoustiegolflinks.com/course/${layoutId === "championship" ? "championship-course" : layoutId === "buddon" ? "buddon-links-course" : "burnside-course"}/`;
  return {
    id,
    source: "verified",
    homeAreaId: homeArea.id,
    venueId: "venue-carnoustie-golf-links",
    venueName: "Carnoustie Golf Links",
    layoutName,
    name: `Carnoustie Golf Links - ${layoutName}`,
    town: "Carnoustie",
    postcode: "DD7 7JE",
    country: "Scotland",
    holesCount: 18,
    par,
    website: courseUrl,
    phone: "+44 1241 802270",
    location,
    attribution: "Identity and scorecard from Carnoustie Golf Links. Hole routing from OpenStreetMap contributors under ODbL.",
    verification: {
      status: "verified",
      updated: "2026-06-21",
      confidence: `Carnoustie Golf Links publishes the official ${layoutName} scorecard with hole-by-hole yardages, par, stroke indexes, course ratings, and slopes. OpenStreetMap identifies all 18 hole ways by both number and the ${layoutName} course name. Only tees sharing this record's par are included until PinScope supports tee-specific par.`,
      sources: [
        { label: "Official course page", url: courseUrl },
        { label: "Official scorecard", url: scorecardUrl },
        { label: "Official contact page", url: "https://www.carnoustiegolflinks.com/contact-us/" },
        { label: "OpenStreetMap hole geometry", url: "https://www.openstreetmap.org/#map=15/56.4930/-2.7270" }
      ]
    },
    tees,
    holes: Array.from({ length: 18 }, (_, index) => ({
      ...makeScorecardOnlyHole(index, scorecard, id),
      name: CARNOUSTIE_HOLE_NAMES[layoutId][index]
    }))
  };
}

function sliceScorecard(scorecard, start, end) {
  return Object.fromEntries(
    Object.entries(scorecard)
      .filter(([, value]) => Array.isArray(value))
      .map(([key, value]) => [key, value.slice(start, end)])
  );
}

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

function makeLangdonHillsLayoutCourse({ id, layoutName, loopIds, sourceUrl }) {
  const scorecard = composeLoopScorecard(loopIds);
  const parTotal = sumValues(scorecard.par);
  const loopNames = loopIds.map((loopId) => loopId[0].toUpperCase() + loopId.slice(1));
  const holesCount = scorecard.par.length;
  return {
    id,
    source: "verified",
    homeAreaId: homeArea.id,
    venueId: "venue-langdon-hills",
    venueName: "Langdon Hills Golf & Country Club",
    layoutName,
    loopIds,
    name: `Langdon Hills Golf & Country Club - ${layoutName}`,
    town: "Bulphan",
    postcode: "RM14 3TY",
    country: "England",
    holesCount,
    par: String(parTotal),
    distanceMiles: 5.7,
    website: "https://www.golflangdon.co.uk/",
    phone: "+44 1268 548444",
    location: { lat: 51.531174, lng: 0.365153 },
    attribution: "Langdon Hills loop scorecards from BlueGolf and GolfPass. Green GPS alignment pending map/OSM sync.",
    verification: {
      status: "verified",
      updated: "2026-05-10",
      confidence: `Langdon Hills is a 27-hole venue made from Langdon, Bulphan, and Horndon 9-hole loops. This layout uses ${loopNames.join(" + ")} as a ${holesCount}-hole playable routing, generated from shared loop scorecards so loop corrections update every combination.`,
      sources: [
        { label: "Layout scorecard", url: sourceUrl },
        { label: "GolfPass Langdon course", url: "https://www.golfpass.com/travel-advisor/courses/33451-langdon-hills-golf-country-club-langdon-course" },
        { label: "GolfPass Bulphan course", url: "https://www.golfpass.com/travel-advisor/courses/33452-langdon-hills-golf-country-club-bulphan-course" },
        { label: "GolfPass Horndon course", url: "https://www.golfpass.com/travel-advisor/courses/33453-langdon-hills-golf-country-club-horndon-course" },
        { label: "Golfshake venue page", url: "https://www.golfshake.com/course/view/15252/Langdon_Hills_Golf_and_Country_Club.html" }
      ]
    },
    tees: makeTeesFromScorecard(scorecard),
    holes: Array.from({ length: holesCount }, (_, index) => makeScorecardOnlyHole(index, scorecard, id))
  };
}

function composeLoopScorecard(loopIds) {
  const keys = ["par", "strokeIndex", "blue", "white", "yellow", "red"];
  return Object.fromEntries(
    keys.map((key) => [
      key,
      loopIds.flatMap((loopId) => LANGDON_HILLS_LOOP_SCORECARDS[loopId]?.[key] || [])
    ])
  );
}

function makeTeesFromScorecard(scorecard) {
  const teeMeta = {
    blue: { name: "Blue", color: "#4f8fd9" },
    white: { name: "White", color: "#f8f7f1" },
    yellow: { name: "Yellow", color: "#d7a44d" },
    red: { name: "Red", color: "#e85d3f" }
  };
  return Object.entries(teeMeta)
    .filter(([teeId]) => Array.isArray(scorecard[teeId]) && scorecard[teeId].length)
    .map(([teeId, meta]) => ({
      id: teeId,
      ...meta,
      rating: "",
      slope: "",
      totalYards: sumValues(scorecard[teeId])
    }));
}

function sumValues(values = []) {
  return values.reduce((sum, value) => sum + Number(value || 0), 0);
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
