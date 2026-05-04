const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

function startStaticServer() {
  const server = http.createServer((request, response) => {
    try {
      const target = new URL(request.url, 'http://127.0.0.1');
      const requestPath = decodeURIComponent(target.pathname === '/' ? '/index.html' : target.pathname);
      const filePath = path.resolve(root, requestPath.slice(1));
      if (!filePath.startsWith(root) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }
      response.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
      });
      fs.createReadStream(filePath).pipe(response);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(error.message);
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({
        origin: `http://127.0.0.1:${server.address().port}`,
        server
      });
    });
  });
}

function stopStaticServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

(async () => {
  const staticServer = await startStaticServer();
  let browser;
  try {
  browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.addInitScript(() => {
    const coords = {
      latitude: 51.506501,
      longitude: 0.262079,
      accuracy: 4
    };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition(success) {
          setTimeout(() => success({ coords }), 0);
        },
        watchPosition(success) {
          setTimeout(() => success({ coords }), 0);
          return 1;
        },
        clearWatch() {}
      }
    });
  });
  await page.goto(`${staticServer.origin}/#play`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Start Group Round' }).click();
  await page.waitForSelector('canvas.photo-hole-canvas');
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas.photo-hole-canvas');
    if (!canvas || canvas.width < 500 || canvas.height < 700) return false;
    const data = canvas.getContext('2d').getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
    return data[3] > 0;
  }, null, { timeout: 10000 });
  const box = await page.locator('canvas.photo-hole-canvas').boundingBox();
  await page.mouse.click(box.x + box.width * 0.52, box.y + box.height * 0.48);
  await page.waitForSelector('.photo-yardage-card');
  await page.mouse.click(box.x + box.width * 0.50, box.y + box.height * 0.62);
  const firstMarker = await page.locator('.photo-plan-point').first().boundingBox();
  await page.mouse.move(firstMarker.x + firstMarker.width / 2, firstMarker.y + firstMarker.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.42, { steps: 8 });
  await page.mouse.up();
  await page.mouse.wheel(0, -500);
  await page.mouse.move(box.x + box.width * 0.30, box.y + box.height * 0.36);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.48, box.y + box.height * 0.48, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const planned = await page.evaluate(() => {
    const canvas = document.querySelector('canvas.photo-hole-canvas');
    const data = canvas.getContext('2d').getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
    const firstPoint = document.querySelector('.photo-plan-point');
    return {
      width: canvas.width,
      height: canvas.height,
      center: Array.from(data),
      badge: document.querySelector('.photo-hole-badge')?.textContent.trim(),
      planText: document.querySelector('.photo-yardage-card')?.textContent.replace(/\s+/g, ' ').trim(),
      clubText: document.querySelector('.photo-club-panel')?.textContent.replace(/\s+/g, ' ').trim(),
      clubWhiteSpace: getComputedStyle(document.querySelector('.photo-club-panel strong')).whiteSpace,
      clubBackground: getComputedStyle(document.querySelector('.photo-club-panel')).backgroundColor,
      zoomText: document.querySelector('.photo-zoom-toolbar')?.textContent.replace(/\s+/g, ' ').trim(),
      panTransform: document.querySelector('.photo-pan-layer')?.style.transform || '',
      courseId: canvas.dataset.photoCourseId,
      storedCranhamPhoto: localStorage.getItem('local-loop-golf:cranham-topdown-photo:v1'),
      firstPoint: {
        x: Number(firstPoint?.getAttribute('cx') || 0),
        y: Number(firstPoint?.getAttribute('cy') || 0)
      },
      planPoints: document.querySelectorAll('.photo-plan-point').length,
      hasPlanRoute: Boolean(document.querySelector('.photo-plan-route')),
      hasGuideRoute: Boolean(document.querySelector('.photo-guide-route'))
    };
  });
  await page.getByRole('button', { name: 'Clear shot path' }).click();
  await page.waitForSelector('.photo-tap-hint');
  const cleared = await page.evaluate(() => ({
    hasPlanRoute: Boolean(document.querySelector('.photo-plan-route')),
    hasGuideRoute: Boolean(document.querySelector('.photo-guide-route')),
    hasHint: Boolean(document.querySelector('.photo-tap-hint'))
  }));
  const pinch = await page.evaluate(async () => {
    const panel = document.querySelector('.photo-hole');
    const canvas = document.querySelector('canvas.photo-hole-canvas');
    const rect = panel.getBoundingClientRect();
    const pointer = (type, id, x, y, target = window) => {
      target.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: id,
        pointerType: 'touch',
        isPrimary: id === 41,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: type === 'pointerup' ? 0 : 1
      }));
    };
    const leftStart = { x: rect.left + rect.width * 0.44, y: rect.top + rect.height * 0.48 };
    const rightStart = { x: rect.left + rect.width * 0.56, y: rect.top + rect.height * 0.48 };
    const leftEnd = { x: rect.left + rect.width * 0.32, y: rect.top + rect.height * 0.40 };
    const rightEnd = { x: rect.left + rect.width * 0.72, y: rect.top + rect.height * 0.56 };
    pointer('pointerdown', 41, leftStart.x, leftStart.y, canvas);
    pointer('pointerdown', 42, rightStart.x, rightStart.y, canvas);
    pointer('pointermove', 41, leftEnd.x, leftEnd.y);
    pointer('pointermove', 42, rightEnd.x, rightEnd.y);
    pointer('pointerup', 41, leftEnd.x, leftEnd.y);
    pointer('pointerup', 42, rightEnd.x, rightEnd.y);
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      zoomText: document.querySelector('.photo-zoom-toolbar')?.textContent.replace(/\s+/g, ' ').trim(),
      panTransform: document.querySelector('.photo-pan-layer')?.style.transform || ''
    };
  });
  await page.getByRole('button', { name: 'Enter Scores' }).click();
  await page.waitForSelector('.score-card-backdrop');
  const scoreOpen = await page.evaluate(() => document.body.classList.contains('score-card-open'));
  await page.getByRole('button', { name: 'Save & Next' }).click();
  await page.waitForSelector('.score-card-backdrop', { state: 'detached' });
  const scoreNext = await page.evaluate(() => ({
    bodyFrozen: document.body.classList.contains('score-card-open'),
    holeTitle: document.querySelector('.round-header h2, .play-hole-hud h2')?.textContent.trim() || '',
    overlay: Boolean(document.querySelector('.score-card-backdrop'))
  }));
  await page.goto(`${staticServer.origin}/#courses`, { waitUntil: 'networkidle' });
  const belhusCard = page.locator('.course-card', { hasText: 'Belhus Park Golf Club' });
  await belhusCard.getByRole('button', { name: 'Select' }).click();
  await belhusCard.getByRole('button', { name: 'Start Round' }).click();
  await page.getByRole('button', { name: 'Start Group Round' }).click();
  await page.waitForSelector('canvas[data-photo-course-id="verified-belhus-park"]');
  await page.locator('.play-gps-button[data-action="gps"]').click();
  await page.waitForSelector('.photo-gps-marker');
  const belhus = await page.evaluate(() => ({
    source: document.querySelector('canvas.photo-hole-canvas')?.dataset.photoCourseId || '',
    marker: document.querySelector('.photo-gps-marker')?.getAttribute('style') || '',
    editKeyV1: localStorage.getItem('pinscope:course-photo-edits:verified-belhus-park:v1'),
    editKeyV2: localStorage.getItem('pinscope:course-photo-edits:verified-belhus-park:v2')
  }));
  await page.getByRole('button', { name: 'Adjust' }).click();
  const dragPhotoHandle = async (selector, xPct, yPct) => {
    await page.waitForSelector(selector);
    const panel = await page.locator('.photo-hole').boundingBox();
    const handle = await page.locator(selector).boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(panel.x + panel.width * xPct, panel.y + panel.height * yPct, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
  };
  await dragPhotoHandle('.photo-drag-handle.tee', 0.56, 0.78);
  await dragPhotoHandle('.photo-drag-handle.green', 0.46, 0.20);
  await page.waitForFunction(() => {
    try {
      return Boolean(JSON.parse(localStorage.getItem('pinscope:course-photo-edits:verified-belhus-park:v2') || '{}').__courseCalibration);
    } catch {
      return false;
    }
  });
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: /Enter Scores/i }).click();
  await page.waitForSelector('.score-card-backdrop');
  await page.getByRole('button', { name: 'Save & Next' }).click();
  await page.waitForSelector('canvas[data-photo-course-id="verified-belhus-park"][data-photo-hole="2"]');
  const belhusCalibration = await page.evaluate(() => {
    const edits = JSON.parse(localStorage.getItem('pinscope:course-photo-edits:verified-belhus-park:v2') || '{}');
    const canvas = document.querySelector('canvas[data-photo-course-id="verified-belhus-park"][data-photo-hole="2"]');
    const generatedKeys = Object.keys(edits).filter((key) => edits[key]?.courseCalibrationGenerated);
    return {
      calibration: edits.__courseCalibration || null,
      holeOneEdit: edits['1'] || null,
      editedHoleKeys: Object.keys(edits).filter((key) => key !== '__courseCalibration'),
      generatedKeys,
      holeTwoEdit: edits['2'] || null,
      badge: document.querySelector('.photo-hole-badge')?.textContent.replace(/\s+/g, ' ').trim() || '',
      resetCourseButton: Boolean(document.querySelector('[data-action="reset-course-photo-calibration"]')),
      holeTwo: {
        teeX: Number(canvas?.dataset.teeX || 0),
        teeY: Number(canvas?.dataset.teeY || 0),
        greenX: Number(canvas?.dataset.greenX || 0),
        greenY: Number(canvas?.dataset.greenY || 0)
      }
    };
  });
  await browser.close();
  browser = null;
  if (errors.length) {
    throw new Error(errors.join('\n'));
  }
  if (planned.courseId !== 'osm-way-23454278' || planned.storedCranhamPhoto) {
    throw new Error(`Cranham did not use the built-in photo source: ${JSON.stringify(planned)}`);
  }
  if (planned.planPoints !== 2 || !planned.hasPlanRoute || planned.hasGuideRoute) {
    throw new Error(`Shot plan did not render correctly: ${JSON.stringify(planned)}`);
  }
  if (!planned.zoomText.includes('1.4x')) {
    throw new Error(`Wheel zoom did not update: ${planned.zoomText}`);
  }
  if (!planned.panTransform || planned.panTransform.includes('0%, 0%')) {
    throw new Error(`Pan did not update while zoomed: ${planned.panTransform}`);
  }
  if (planned.clubWhiteSpace !== 'normal') {
    throw new Error(`Club panel text is not wrapping: ${planned.clubWhiteSpace}`);
  }
  if (planned.clubBackground !== 'rgba(0, 0, 0, 0)') {
    throw new Error(`Club panel still has a background: ${planned.clubBackground}`);
  }
  if (cleared.hasPlanRoute || !cleared.hasGuideRoute || !cleared.hasHint) {
    throw new Error(`Shot plan clear did not reset correctly: ${JSON.stringify(cleared)}`);
  }
  if (!pinch.zoomText || pinch.zoomText.includes('1.0x')) {
    throw new Error(`Pinch zoom did not update: ${JSON.stringify(pinch)}`);
  }
  if (!scoreOpen || scoreNext.bodyFrozen || scoreNext.overlay || scoreNext.holeTitle !== 'Hole 2') {
    throw new Error(`Score card did not close and advance correctly: ${JSON.stringify({ scoreOpen, scoreNext })}`);
  }
  if (belhus.source !== 'verified-belhus-park' || !belhus.marker) {
    throw new Error(`Belhus GPS marker did not render: ${JSON.stringify(belhus)}`);
  }
  if (!belhusCalibration.calibration || belhusCalibration.calibration.sourceHole !== 1 || !belhusCalibration.holeOneEdit?.tee || !belhusCalibration.holeOneEdit?.green) {
    throw new Error(`Belhus course calibration was not stored: ${JSON.stringify(belhusCalibration)}`);
  }
  if (belhusCalibration.editedHoleKeys.length !== 18 || belhusCalibration.generatedKeys.length !== 17 || !belhusCalibration.holeTwoEdit?.courseCalibrationGenerated) {
    throw new Error(`Belhus course calibration did not write every hole: ${JSON.stringify(belhusCalibration)}`);
  }
  if (!belhusCalibration.badge.includes('Course aligned')) {
    throw new Error(`Belhus course alignment badge missing on hole 2: ${JSON.stringify(belhusCalibration)}`);
  }
  if (Math.abs(belhusCalibration.holeTwo.teeX - 38.579) < 0.05 && Math.abs(belhusCalibration.holeTwo.greenX - 36.077) < 0.05) {
    throw new Error(`Belhus hole 2 did not inherit course calibration: ${JSON.stringify(belhusCalibration)}`);
  }
  console.log(JSON.stringify({ errors, result: { planned, cleared, pinch, scoreOpen, scoreNext, belhus, belhusCalibration } }, null, 2));
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    await stopStaticServer(staticServer.server);
  }
})();
