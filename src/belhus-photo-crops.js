export const belhusPhotoCropSource = {
  id: "belhus-user-topdown-20260428",
  label: "Belhus top-down course image",
  url: "./assets/belhus.png"
};

const wholeCourse = { x: 0, y: 0, w: 100, h: 100 };

export const belhusPhotoClips = [
  { hole: 1, tee: [71.86, 81.725], green: [44.911, 73.602] },
  { hole: 2, tee: [38.579, 51.315], green: [36.077, 92.898] },
  { hole: 3, tee: [31.681, 90.459], green: [34.403, 43.452] },
  { hole: 4, tee: [31.562, 39.357], green: [24.816, 92.774] },
  { hole: 5, tee: [20.72, 94.992], green: [18.783, 40.544] },
  { hole: 6, tee: [16.694, 51.887], green: [17.292, 77.063] },
  { hole: 7, tee: [5.063, 80.384], green: [10.699, 38.981] },
  { hole: 8, tee: [12.212, 34.052], green: [24.624, 38.685] },
  { hole: 9, tee: [37.719, 43.969], green: [67.534, 73.768] },
  { hole: 10, tee: [72.964, 69.263], green: [45.138, 47.865] },
  { hole: 11, tee: [53.021, 49.321], green: [48.942, 24.678] },
  { hole: 12, tee: [53.001, 24.302], green: [73.816, 64.049] },
  { hole: 13, tee: [79.163, 57.791], green: [60.694, 31.057] },
  { hole: 14, tee: [67.994, 36.553], green: [81.28, 50.655] },
  { hole: 15, tee: [82.695, 43.887], green: [54.321, 21.632] },
  { hole: 16, tee: [44.695, 12.974], green: [92.155, 23.325] },
  { hole: 17, tee: [91.524, 33.082], green: [84.039, 39.304] },
  { hole: 18, tee: [96.531, 17.525], green: [73.501, 75.641] }
].map((clip) => ({ ...clip, crop: wholeCourse }));
