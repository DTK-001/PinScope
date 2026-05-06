const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'artifacts', 'satellite-hole6.png');
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
    const page = await browser.newPage({ viewport: { width: 444, height: 967 }, deviceScaleFactor: 1 });
    await page.goto(`${staticServer.origin}/?azureMaps=1#play`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Start Group Round' }).click();
    await page.waitForSelector('.photo-hole');
    if (await page.getByRole('button', { name: 'Satellite' }).count()) {
      await page.getByRole('button', { name: 'Satellite' }).click();
    }
    for (let index = 0; index < 5; index += 1) {
      await page.locator('[data-action="open-score-card"]').click();
      await page.locator('[data-action="score-card-next"]').click();
      await page.waitForTimeout(150);
    }
    await page.waitForFunction(() => {
      const tiles = Array.from(document.querySelectorAll('[data-azure-tile]'));
      return tiles.length > 0 && tiles.every((tile) => tile.dataset.loaded === '1' || tile.dataset.error === '1');
    }, null, { timeout: 20000 });
    const failed = await page.locator('[data-azure-tile][data-error="1"]').count();
    if (failed) {
      console.log(await page.locator('[data-azure-tile]').first().getAttribute('src'));
    }
    await page.waitForTimeout(500);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    await page.screenshot({ path: output, fullPage: true });
    console.log(output);
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
