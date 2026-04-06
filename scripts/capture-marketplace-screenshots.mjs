import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const currentFilePath = fileURLToPath(import.meta.url);
const scriptsDirectory = path.dirname(currentFilePath);
const projectRoot = path.resolve(scriptsDirectory, '..');
const publicDirectory = path.join(projectRoot, 'public');
const outputDirectory = path.join(projectRoot, 'assets', 'marketplace');
const port = 5012;
const baseUrl = `http://127.0.0.1:${port}`;

await mkdir(outputDirectory, { recursive: true });

const server = createStaticServer(publicDirectory);
await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  await mockEcwidSdk(page, {
    store_id: 'store-marketplace',
    access_token: 'token-marketplace',
    lang: 'en',
  });
  await mockEcwidApi(page, 'store-marketplace');

  await page.goto(`${baseUrl}/index.html?cachebust=marketplace-capture`, { waitUntil: 'networkidle' });
  await page.locator('#metric-revenue-7d').waitFor({ state: 'visible' });
  await waitForDashboardIdle(page);

  await captureViewportScreenshot(page, 'screenshot-01-overview-1024x538.png', 0);
  await captureViewportScreenshot(page, 'screenshot-02-country-breakdown-1024x538.png', 420);
  await captureViewportScreenshot(page, 'screenshot-03-low-stock-1024x538.png', 900);
  await captureViewportScreenshot(page, 'screenshot-04-preferences-1024x538.png', 900, '#preferences-form');

  await page.locator('#preview-toggle').click();
  await page.locator('#preview-badge').waitFor({ state: 'visible' });
  await waitForDashboardIdle(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(150);
  await captureViewportScreenshot(page, 'screenshot-05-preview-mode-1024x538.png', 0);
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

console.log(`Captured marketplace screenshots to ${path.relative(projectRoot, outputDirectory)}`);

async function captureViewportScreenshot(page, fileName, scrollTop, waitForSelector) {
  await page.evaluate((value) => window.scrollTo({ top: value, behavior: 'instant' }), scrollTop);

  if (waitForSelector) {
    await page.locator(waitForSelector).waitFor({ state: 'visible' });
  }

  await page.waitForTimeout(200);

  const buffer = await page.screenshot({
    clip: {
      x: 0,
      y: 0,
      width: 1440,
      height: 756,
    },
  });

  await sharp(buffer)
    .resize(1024, 538, { fit: 'cover', position: 'top' })
    .png()
    .toFile(path.join(outputDirectory, fileName));
}

async function waitForDashboardIdle(page) {
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('.pulse-loading')).length === 0;
  });
}

function createStaticServer(rootDirectory) {
  return createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      const relativePath = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
      const normalizedPath = path.normalize(relativePath).replace(/^([.][.][/\\])+/, '');
      const filePath = path.join(rootDirectory, normalizedPath);
      const fileStat = await stat(filePath);

      if (!fileStat.isFile()) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        'Content-Type': getContentType(filePath),
        'Cache-Control': 'no-store',
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };

  return contentTypes[extension] || 'application/octet-stream';
}

async function mockEcwidSdk(page, payload) {
  await page.route('**/ecwid-sdk/css/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
  });

  await page.route('**/ecwid-sdk/js/**/ecwid-app.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: [
        'window.EcwidApp = {',
        '  init() {',
        '    return {',
        `      getPayload(cb) { cb(${JSON.stringify(payload)}); }`,
        '    };',
        '  },',
        '  setSize() {}',
        '};',
      ].join('\n'),
    });
  });
}

async function mockEcwidApi(page, storeId) {
  const now = Date.now();

  await page.route(`https://app.ecwid.com/api/v3/${storeId}/profile`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ storeName: 'Atlas Goods', currency: 'USD' }),
    });
  });

  await page.route(`https://app.ecwid.com/api/v3/${storeId}/orders?**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 9101,
            orderNumber: '9101',
            total: 220,
            createDate: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
            shippingPerson: { name: 'Ada Lovelace', countryCode: 'US' },
            fulfillmentStatus: 'PROCESSING',
          },
          {
            id: 9102,
            orderNumber: '9102',
            total: 125,
            createDate: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
            shippingPerson: { name: 'Grace Hopper', countryCode: 'CA' },
            fulfillmentStatus: 'AWAITING_PROCESSING',
          },
          {
            id: 9103,
            orderNumber: '9103',
            total: 99,
            createDate: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
            shippingPerson: { name: 'Linus Torvalds', countryCode: 'US' },
            fulfillmentStatus: 'FULFILLED',
          },
          {
            id: 9104,
            orderNumber: '9104',
            total: 687,
            createDate: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
            shippingPerson: { name: 'Margaret Hamilton', countryCode: 'GB' },
            fulfillmentStatus: 'READY_FOR_PICKUP',
          },
        ],
      }),
    });
  });

  await page.route(`https://app.ecwid.com/api/v3/${storeId}/products?**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { id: 1, name: 'Map Room Journal', enabled: true, quantity: 2, sku: 'MRJ-1' },
          { id: 2, name: 'Signal Lamp', enabled: true, quantity: 4, sku: 'SL-2' },
          { id: 3, name: 'Archive Tray', enabled: true, quantity: 12, sku: 'AT-3' },
          { id: 4, name: 'Gift Card', enabled: false, quantity: 1, sku: 'GC-4' },
          { id: 5, name: 'Merchant Counter Stand', enabled: true, quantity: 3, sku: 'MCS-5' },
        ],
      }),
    });
  });
}