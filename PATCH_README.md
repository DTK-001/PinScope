# PinScope patch package

This zip is a small patch package, not a full clone of your repository. Copy these files into your existing PinScope repo, replacing files where paths match.

## Files included

- `index.html`  
  Loads the normal app plus the new shot-marker drag helper.

- `service-worker.js`  
  Bumps the cache to `local-loop-golf-v51` and caches the two new source files. This helps phones stop using the old cached build.

- `src/storage.js`  
  Adds shared verified green defaults and changes the merge order so published/default verified GPS data wins over old local browser storage. Local storage still fills any missing GPS fields.

- `src/verified-green-defaults.js`  
  New source file for permanent tee/green GPS data. It starts empty because your existing mapped greens are inside your own browser localStorage, which cannot be read from this zip.

- `src/shot-marker-drag-patch.js`  
  Adds drag-to-move support for satellite shot planner markers after they have been placed.

- `tools/export-verified-green-defaults-console.js`  
  Paste this into the browser console on the device/browser where your green data already exists. It downloads a populated `verified-green-defaults.js` file.

## How to make your existing green data default on every device

1. On the device/browser where you added the green information, open your live PinScope app.
2. Open DevTools > Console.
3. Copy all of `tools/export-verified-green-defaults-console.js` and paste it into the console.
4. It will download `verified-green-defaults.js`.
5. Replace `src/verified-green-defaults.js` in your repo with the downloaded file.
6. Copy in the other files from this zip.
7. Commit and push to GitHub Pages.
8. On phones/tablets, hard refresh or close/reopen the installed PWA so the `v51` service-worker cache is used.

## Notes

- The app cannot automatically turn browser localStorage edits into GitHub source files without a backend or GitHub write token. The exporter gives you a safe one-time step to promote your existing local mapping work into source-controlled defaults.
- Once `src/verified-green-defaults.js` is committed, every device loading the app receives the same verified green GPS defaults.
