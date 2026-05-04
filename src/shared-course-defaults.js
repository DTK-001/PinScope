// PinScope shared course defaults.
//
// This file is for courses you have already mapped on one device and want to
// ship inside the app so every phone/browser gets the same course data.
//
// In PinScope, select a mapped course and tap "Export shared data". Replace
// this file with the downloaded shared-course-defaults.js, then deploy the app.
//
// Shape:
// export const sharedCourseDefaults = [
//   {
//     id: "osm-way-12345",
//     source: "shared",
//     name: "Example Golf Club",
//     holesCount: 18,
//     location: { lat: 51.5, lng: 0.1 },
//     holes: [
//       {
//         number: 1,
//         tee: { lat: 51.5, lng: 0.1 },
//         greenCenter: { lat: 51.501, lng: 0.102 },
//         geometry: { greenPolygon: [] }
//       }
//     ]
//   }
// ];

export const sharedCourseDefaults = [];
