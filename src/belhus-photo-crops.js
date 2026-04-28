export const belhusPhotoCropSource = {
  id: "belhus-user-topdown",
  label: "Belhus top-down course image",
  url: "./assets/belhus.png"
};

const wholeCourse = { x: 0, y: 0, w: 100, h: 100 };

export const belhusPhotoClips = [
  { hole: 1, tee: [82.4, 74.6], green: [75.6, 67.4] },
  { hole: 2, tee: [75.6, 67.4], green: [81.9, 55.4] },
  { hole: 3, tee: [81.9, 55.4], green: [63.3, 47.2] },
  { hole: 4, tee: [63.3, 47.2], green: [62.2, 18.4] },
  { hole: 5, tee: [62.2, 18.4], green: [91.2, 23.4] },
  { hole: 6, tee: [91.2, 23.4], green: [82.9, 46.5] },
  { hole: 7, tee: [82.9, 46.5], green: [71.5, 57.2] },
  { hole: 8, tee: [71.5, 57.2], green: [75.6, 53.8] },
  { hole: 9, tee: [75.6, 53.8], green: [69.4, 70.1] },
  { hole: 10, tee: [69.4, 70.1], green: [52.1, 65.4] },
  { hole: 11, tee: [52.1, 65.4], green: [50.8, 48.1] },
  { hole: 12, tee: [50.8, 48.1], green: [33.7, 39.5] },
  { hole: 13, tee: [33.7, 39.5], green: [22.5, 37.1] },
  { hole: 14, tee: [22.5, 37.1], green: [31.4, 48.5] },
  { hole: 15, tee: [31.4, 48.5], green: [25.7, 72.2] },
  { hole: 16, tee: [25.7, 72.2], green: [39.2, 85.6] },
  { hole: 17, tee: [39.2, 85.6], green: [42.9, 68.3] },
  { hole: 18, tee: [42.9, 68.3], green: [74.2, 67.6] }
].map((clip) => ({ ...clip, crop: wholeCourse }));
