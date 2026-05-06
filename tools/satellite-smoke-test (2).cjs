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
    await page.goto(`${staticServer.origin}/#play`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Start Group Round' }).click();
    await page.waitForSelector('canvas.photo-hole-canvas');
    await page.getByRole('button', { name: 'Satellite' }).click();
    await page.waitForSelector('.azure-hole');
    await page.waitForFunction(() => {
      const tiles = Array.from(document.querySelectorAll('[data-azure-tile]'));
      return tiles.length > 0 && tiles.every((tile) => tile.dataset.loaded === '1' || tile.dataset.error === '1');
    }, null, { timeout: 20000 });
    const result = await page.evaluate(() => {
      const tiles = Array.from(document.querySelectorAll('[data-azure-tile]'));
      const loadedTiles = tiles.filter((tile) => tile.dataset.loaded === '1');
      const failedTiles = tiles.filter((tile) => tile.dataset.error === '1');
      const status = document.querySelector('[data-azure-map-status]');
      const photoButton = document.querySelector('[data-action="toggle-azure-maps"]');
      return {
        loaded: loadedTiles.length,
        failed: failedTiles.length,
        tileCount: tiles.length,
        firstLoadedSrc: loadedTiles[0]?.currentSrc || loadedTiles[0]?.src || '',
        statusText: status?.textContent.trim() || '',
        statusDisplay: status ? getComputedStyle(status).display : '',
        toggleText: photoButton?.textContent.trim() || '',
        attribution: document.querySelector('.satellite-attribution')?.textContent.trim() || ''
      };
    });
    if (errors.length) {
      throw new Error(`Browser errors: ${errors.join(' | ')}`);
    }
    if (!result.loaded || result.statusDisplay !== 'none' || result.toggleText !== 'Photo') {
      throw new Error(`Satellite did not render correctly: ${JSON.stringify(result)}`);
    }
    if (!result.firstLoadedSrc.includes('World_Imagery') && !result.firstLoadedSrc.includes('atlas.microsoft.com')) {
      throw new Error(`Unexpected satellite tile source: ${JSON.stringify(result)}`);
    }
    console.log(JSON.stringify(result, null, 2));
  } finally {
    if (browser) {
      await browser.close();
    }
    await stopStaticServer(staticServer.server);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
