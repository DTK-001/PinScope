const { chromium } = require('playwright');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1210" height="1204" viewBox="0 0 1210 1204">
  <rect width="1210" height="1204" fill="#244f35"/>
  <path d="M610 40 C530 230 660 390 560 560 C450 760 330 900 210 1120" fill="none" stroke="#79b667" stroke-width="90" stroke-linecap="round"/>
  <path d="M1020 60 C980 240 970 430 1090 610" fill="none" stroke="#78b46a" stroke-width="80" stroke-linecap="round"/>
  <ellipse cx="556" cy="499" rx="48" ry="32" fill="#b8dc7c"/>
  <ellipse cx="444" cy="861" rx="42" ry="28" fill="#b8dc7c"/>
  <ellipse cx="524" cy="321" rx="38" ry="28" fill="#b8dc7c"/>
  <ellipse cx="760" cy="560" rx="46" ry="30" fill="#b8dc7c"/>
  <ellipse cx="990" cy="143" rx="44" ry="30" fill="#b8dc7c"/>
  <ellipse cx="1092" cy="575" rx="42" ry="30" fill="#b8dc7c"/>
  <ellipse cx="120" cy="980" rx="82" ry="46" fill="#3d93ad"/>
  <ellipse cx="528" cy="335" rx="70" ry="42" fill="#2f768d"/>
</svg>`;
const photo = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

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
  await page.addInitScript((value) => {
    localStorage.setItem('local-loop-golf:cranham-topdown-photo:v1', value);
  }, photo);
  await page.goto('http://localhost:5173/#play', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Start Group Round' }).click();
  await page.waitForSelector('canvas.photo-hole-canvas');
  await page.waitForTimeout(500);
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
      zoomText: document.querySelector('.photo-zoom-toolbar')?.textContent.replace(/\s+/g, ' ').trim(),
      panTransform: document.querySelector('.photo-pan-layer')?.style.transform || '',
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
  await browser.close();
  if (errors.length) {
    throw new Error(errors.join('\n'));
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
  if (cleared.hasPlanRoute || !cleared.hasGuideRoute || !cleared.hasHint) {
    throw new Error(`Shot plan clear did not reset correctly: ${JSON.stringify(cleared)}`);
  }
  console.log(JSON.stringify({ errors, result: { planned, cleared } }, null, 2));
})();
