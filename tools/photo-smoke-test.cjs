const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('http://localhost:5173/#play', { waitUntil: 'networkidle' });
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
    holeTitle: document.querySelector('.round-header h2')?.textContent.trim() || '',
    overlay: Boolean(document.querySelector('.score-card-backdrop'))
  }));
  await browser.close();
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
  console.log(JSON.stringify({ errors, result: { planned, cleared, pinch, scoreOpen, scoreNext } }, null, 2));
})();
