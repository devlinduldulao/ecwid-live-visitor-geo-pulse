import { expect, test } from '@playwright/test';

const PREVIEW_CONTEXT_STORAGE_KEY = 'lvgp-ecwid-dashboard:preview-context';

test.beforeEach(async ({ page }) => {
  await page.route('**/ecwid-sdk/css/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/css',
      body: '',
    });
  });
});

test('renders owner metrics from Ecwid payload and mocked API responses', async ({ page }) => {
  await mockEcwidApp(page, {
    store_id: 'store-live',
    access_token: 'token-live',
    lang: 'en',
  });
  await mockEcwidApi(page, 'store-live');

  await page.goto('/index.html?cachebust=e2e-live');

  await expect(page.getByRole('heading', { name: 'Live Visitor Geo Pulse' })).toBeVisible();
  await expect(page.locator('#metric-orders-24h')).toHaveText('2');
  await expect(page.locator('#metric-low-stock')).toHaveText('2');
  await expect(page.locator('#metric-active-products')).toHaveText('3');
  await expect(page.locator('#country-breakdown')).toContainText('United States');
  await expect(page.locator('#recent-orders')).toContainText('#9101');
});

test('renders live dashboard from query-param fallback context when Ecwid iframe SDK is unavailable', async ({ page }) => {
  await mockEcwidSdkFailure(page);
  await mockEcwidApi(page, 'store-query-live');

  await page.goto('/index.html?cachebust=e2e-query-live&storeId=store-query-live&accessToken=token-query-live&lang=en');

  await expect(page).toHaveTitle(/Atlas Goods/);
  await expect(page.locator('#metric-orders-24h')).toHaveText('2');
  await expect(page.locator('#metric-revenue-7d')).toHaveText('$668.00');
  await expect(page.locator('#recent-orders')).toContainText('#9101');
});

test('renders empty live-data states when Ecwid returns no orders or products', async ({ page }) => {
  await mockEcwidApp(page, {
    store_id: 'store-empty',
    access_token: 'token-empty',
    lang: 'en',
  });
  await mockEmptyEcwidApi(page, 'store-empty');

  await page.goto('/index.html?cachebust=e2e-empty-live');

  await expect(page.locator('#metric-orders-24h')).toHaveText('0');
  await expect(page.locator('#metric-revenue-7d')).toHaveText('$0.00');
  await expect(page.locator('#country-breakdown')).toContainText('No orders were found inside the current geo pulse window.');
  await expect(page.locator('#low-stock-list')).toContainText('No low stock products were found with the current threshold.');
});

test('shows sampled messaging for truncated live Ecwid collections and handles Ecwid-like field variants', async ({ page }) => {
  await mockEcwidApp(page, {
    store_id: 'store-truncated',
    access_token: 'token-truncated',
    lang: 'en',
  });
  await mockTruncatedEcwidApi(page, 'store-truncated');

  await page.goto('/index.html?cachebust=e2e-truncated-live');

  await expect(page).toHaveTitle(/Nested Atlas/);
  await expect(page.locator('#last-refresh-copy')).toContainText('Static mode: orders sampled and products sampled.');
  await expect(page.locator('#recent-orders')).toContainText('#EBJFT');
  await expect(page.locator('#country-breakdown')).toContainText('United Kingdom');
});

test('shows fetch failure in local preview when live API is unavailable', async ({ page }) => {
  await mockEcwidSdkFailure(page);
  await page.route('https://app.ecwid.com/api/v3/**', async (route) => {
    await route.abort('failed');
  });

  await setPreviewContext(page, {
    storeId: 'preview-store',
    accessToken: 'preview-token',
  });

  await page.goto('/index.html?cachebust=e2e-failure');

  await expect(page.locator('#status-banner')).toContainText('Failed to fetch');
});

test('preview mode replaces failed live data with sample metrics', async ({ page }) => {
  await mockEcwidSdkFailure(page);
  await page.route('https://app.ecwid.com/api/v3/**', async (route) => {
    await route.abort('failed');
  });

  await setPreviewContext(page, {
    storeId: 'preview-store',
    accessToken: 'preview-token',
  });

  await page.goto('/index.html?cachebust=e2e-preview');
  await page.getByRole('button', { name: 'Enable Preview Data' }).click();

  await expect(page).toHaveTitle(/Preview Mercantile/);
  await expect(page.locator('#preview-badge')).toBeVisible();
  await expect(page.locator('#metric-orders-24h')).toHaveText('3');
  await expect(page.locator('#recent-orders')).toContainText('#PV-401');
  await expect(page.locator('#status-banner')).toContainText('Preview data is active');
});

test('preview mode persists for the same store after reload', async ({ page }) => {
  await mockEcwidSdkFailure(page);
  await page.route('https://app.ecwid.com/api/v3/**', async (route) => {
    await route.abort('failed');
  });

  await setPreviewContext(page, {
    storeId: 'preview-store',
    accessToken: 'preview-token',
  });

  await page.goto('/index.html?cachebust=e2e-persist');
  await page.getByRole('button', { name: 'Enable Preview Data' }).click();
  await page.reload();

  await expect(page.locator('#preview-badge')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Disable Preview Data' })).toBeVisible();
  await expect(page.locator('#metric-revenue-7d')).toHaveText('$1,131.00');
});

test('disabling preview clears simulated metrics when live Ecwid data is unavailable', async ({ page }) => {
  await mockEcwidSdkFailure(page);
  await page.route('https://app.ecwid.com/api/v3/**', async (route) => {
    await route.abort('failed');
  });

  await setPreviewContext(page, {
    storeId: 'preview-store',
    accessToken: 'preview-token',
  });

  await page.goto('/index.html?cachebust=e2e-disable-preview');
  await page.getByRole('button', { name: 'Enable Preview Data' }).click();
  await page.getByRole('button', { name: 'Disable Preview Data' }).click();

  await expect(page.locator('#preview-badge')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Enable Preview Data' })).toBeVisible();
  await expect(page.locator('#metric-orders-24h')).toHaveText('--');
  await expect(page.locator('#recent-orders')).toContainText('Live Ecwid data could not be loaded');
  await expect(page.locator('#status-banner')).toContainText('Preview data disabled. Live Ecwid data is currently unavailable.');
});

async function mockEcwidSdkFailure(page) {
  await page.route('**/ecwid-sdk/js/**/ecwid-app.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: [
        'window.EcwidApp = {',
        '  init() { throw new Error("Ecwid iframe unavailable"); },',
        '  setSize() {}',
        '};',
      ].join('\n'),
    });
  });
}

async function setPreviewContext(page, payload) {
  await page.addInitScript(([storageKey, previewPayload]) => {
    window.sessionStorage.setItem(storageKey, JSON.stringify(previewPayload));
  }, [PREVIEW_CONTEXT_STORAGE_KEY, payload]);
}

async function mockEcwidApp(page, payload) {
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
            total: 224,
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
        ],
      }),
    });
  });
}

async function mockEmptyEcwidApi(page, storeId) {
  await page.route(`https://app.ecwid.com/api/v3/${storeId}/profile`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ storeName: 'Empty Atlas', currency: 'USD' }),
    });
  });

  await page.route(`https://app.ecwid.com/api/v3/${storeId}/orders?**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    });
  });

  await page.route(`https://app.ecwid.com/api/v3/${storeId}/products?**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    });
  });
}

async function mockTruncatedEcwidApi(page, storeId) {
  await page.route(`https://app.ecwid.com/api/v3/${storeId}/profile`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        generalInfo: { storeName: 'Nested Atlas' },
        account: { currency: 'GBP' },
      }),
    });
  });

  await page.route(`https://app.ecwid.com/api/v3/${storeId}/orders?**`, async (route) => {
    const url = new URL(route.request().url());
    const offset = Number.parseInt(url.searchParams.get('offset') || '0', 10);
    const pageIndex = Math.floor(offset / 100);
    const items = Array.from({ length: 100 }, (_, index) => ({
      id: pageIndex * 100 + index + 1,
      vendorNumber: pageIndex === 0 && index === 0 ? 'EBJFT' : `ORD-${pageIndex}-${index}`,
      total: pageIndex === 0 && index === 0 ? 310.75 : 10,
      date: String(Math.floor(new Date('2026-03-19T11:00:00.000Z').getTime() / 1000) - index * 60),
      customer: pageIndex === 0 && index === 0 ? { name: 'Merchant Buyer', email: 'buyer@example.com' } : { email: `buyer-${pageIndex}-${index}@example.com` },
      billingPerson: { countryCode: pageIndex === 0 && index === 0 ? 'GB' : 'US' },
      fulfillmentStatus: pageIndex === 0 && index === 0 ? 'READY_FOR_PICKUP' : 'FULFILLED',
    }));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items }),
    });
  });

  await page.route(`https://app.ecwid.com/api/v3/${storeId}/products?**`, async (route) => {
    const url = new URL(route.request().url());
    const offset = Number.parseInt(url.searchParams.get('offset') || '0', 10);
    const pageIndex = Math.floor(offset / 100);
    const items = Array.from({ length: 100 }, (_, index) => ({
      id: pageIndex * 100 + index + 1,
      name: pageIndex === 0 && index === 0 ? 'String Quantity' : `Product ${pageIndex}-${index}`,
      enabled: true,
      quantity: pageIndex === 0 && index === 0 ? '2' : 50,
      sku: `SKU-${pageIndex}-${index}`,
    }));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items }),
    });
  });
}