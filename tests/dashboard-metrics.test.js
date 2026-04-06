import assert from 'node:assert/strict';

import {
  DEFAULT_PREFERENCES,
  buildDashboardSnapshot,
  createPreviewDataset,
  formatCurrencyAmount,
  formatRelativeTime,
  sanitizePreferences,
} from '../public/dashboard-metrics.js';

const referenceNow = new Date('2026-03-19T12:00:00.000Z');

const baselineSnapshot = buildDashboardSnapshot({
  profile: {
    storeName: 'Atlas Goods',
    currency: 'USD',
  },
  orders: [
    {
      id: 101,
      orderNumber: '101',
      total: 120,
      createDate: '2026-03-18T12:00:00.000Z',
      shippingPerson: { name: 'Ada Lovelace', countryCode: 'US' },
      fulfillmentStatus: 'PROCESSING',
    },
    {
      id: 102,
      orderNumber: '102',
      total: 90,
      createDate: '2026-03-15T12:00:00.000Z',
      billingPerson: { firstName: 'Grace', lastName: 'Hopper', countryCode: 'CA' },
      fulfillmentStatus: 'FULFILLED',
    },
    {
      id: 103,
      orderNumber: '103',
      total: 75,
      createDate: '2026-02-10T12:00:00.000Z',
      billingPerson: { name: 'Linus Torvalds', countryCode: 'DE' },
      fulfillmentStatus: 'NOT_FULFILLED',
    },
  ],
  products: [
    { id: 1, name: 'Map Room Journal', enabled: true, quantity: 3, sku: 'MRJ-1' },
    { id: 2, name: 'Signal Lamp', enabled: true, quantity: 12, sku: 'SL-2' },
    { id: 3, name: 'Archive Tray', enabled: false, quantity: 1, sku: 'AT-3' },
    { id: 4, name: 'Infinite Poster', enabled: true, unlimited: true, sku: 'IP-4' },
  ],
  preferences: {
    lookbackDays: 30,
    lowStockThreshold: 5,
    refreshIntervalSeconds: 60,
    autoRefreshEnabled: true,
  },
  now: referenceNow,
});

assert.equal(baselineSnapshot.meta.storeName, 'Atlas Goods');
assert.equal(baselineSnapshot.meta.currency, 'USD');
assert.equal(baselineSnapshot.overview.orders24h, 1);
assert.equal(baselineSnapshot.overview.revenue7d, 210);
assert.equal(baselineSnapshot.overview.countriesLookback, 2);
assert.equal(baselineSnapshot.overview.lowStockProducts, 1);
assert.equal(baselineSnapshot.overview.activeProducts, 3);
assert.equal(baselineSnapshot.overview.awaitingFulfillment, 2);
assert.equal(baselineSnapshot.countries[0].countryCode, 'US');
assert.equal(baselineSnapshot.lowStockProducts[0].name, 'Map Room Journal');

assert.deepEqual(
  sanitizePreferences({
    lookbackDays: 200,
    lowStockThreshold: -1,
    refreshIntervalSeconds: 15,
    autoRefreshEnabled: 1,
    previewModeEnabled: 1,
  }),
  {
    lookbackDays: 90,
    lowStockThreshold: 0,
    refreshIntervalSeconds: 30,
    autoRefreshEnabled: true,
    previewModeEnabled: false,
  }
);

assert.deepEqual(
  sanitizePreferences({
    lookbackDays: '10',
    lowStockThreshold: '7',
    refreshIntervalSeconds: '120',
    autoRefreshEnabled: false,
    previewModeEnabled: true,
  }),
  {
    lookbackDays: 10,
    lowStockThreshold: 7,
    refreshIntervalSeconds: 120,
    autoRefreshEnabled: false,
    previewModeEnabled: true,
  }
);

assert.deepEqual(sanitizePreferences(), DEFAULT_PREFERENCES);

const emptySnapshot = buildDashboardSnapshot({
  profile: {},
  orders: [],
  products: [],
  preferences: DEFAULT_PREFERENCES,
  now: referenceNow,
});

assert.equal(emptySnapshot.meta.storeName, 'Your Ecwid store');
assert.equal(emptySnapshot.meta.currency, 'USD');
assert.equal(emptySnapshot.overview.orders24h, 0);
assert.equal(emptySnapshot.overview.revenue7d, 0);
assert.equal(emptySnapshot.overview.countriesLookback, 0);
assert.equal(emptySnapshot.overview.lowStockProducts, 0);
assert.equal(emptySnapshot.overview.activeProducts, 0);
assert.equal(emptySnapshot.overview.awaitingFulfillment, 0);
assert.equal(emptySnapshot.countries.length, 0);
assert.equal(emptySnapshot.recentOrders.length, 0);

const unhappyPathSnapshot = buildDashboardSnapshot({
  profile: {
    storeName: 'Fallback Store',
    currency: 'usd',
  },
  orders: [
    {
      id: 'bad-date',
      orderNumber: 'BAD-DATE',
      total: '55.5',
      createDate: 'not-a-date',
      shippingPerson: { name: 'Missing Date', countryCode: 'US' },
      fulfillmentStatus: 'FULFILLED',
    },
    {
      id: 'bad-country',
      orderNumber: 'BAD-COUNTRY',
      total: '44.5',
      createDate: '2026-03-18T02:00:00.000Z',
      shippingPerson: { name: 'No Country', countryCode: '???' },
      fulfillmentStatus: 'UNKNOWN_STATUS',
    },
  ],
  products: [
    { id: 11, name: 'Unknown Count', enabled: true, quantity: 'oops', sku: 'UC-11' },
    { id: 12, name: 'Unlimited', enabled: true, unlimited: true, sku: 'UL-12' },
  ],
  preferences: {
    ...DEFAULT_PREFERENCES,
    lowStockThreshold: 5,
  },
  now: referenceNow,
  orderSampleTruncated: true,
  productSampleTruncated: true,
});

assert.equal(unhappyPathSnapshot.meta.currency, 'USD');
assert.equal(unhappyPathSnapshot.meta.orderSampleTruncated, true);
assert.equal(unhappyPathSnapshot.meta.productSampleTruncated, true);
assert.equal(unhappyPathSnapshot.meta.orderCount, 1);
assert.equal(unhappyPathSnapshot.overview.orders24h, 0);
assert.equal(unhappyPathSnapshot.overview.awaitingFulfillment, 1);
assert.equal(unhappyPathSnapshot.countries[0].countryCode, 'XX');
assert.equal(unhappyPathSnapshot.lowStockProducts.length, 0);

const ecwidLikePayloadSnapshot = buildDashboardSnapshot({
  profile: {
    generalInfo: { storeName: 'Nested Atlas' },
    account: { currency: 'eur' },
  },
  orders: [
    {
      id: 492512057,
      vendorNumber: 'EBJFT',
      orderNumber: 492512057,
      total: '310.75',
      date: String(Math.floor(new Date('2026-03-19T11:00:00.000Z').getTime() / 1000)),
      customer: { name: 'Merchant Buyer', email: 'buyer@example.com' },
      billingPerson: { countryCode: 'GB' },
      fulfillmentStatus: 'READY_FOR_PICKUP',
    },
  ],
  products: [
    { id: 21, name: 'String Quantity', enabled: true, quantity: '2', sku: 'SQ-21' },
    { id: 22, name: 'Unlimited Quantity', enabled: true, quantity: 'unlimited', sku: 'UQ-22' },
  ],
  preferences: {
    ...DEFAULT_PREFERENCES,
    lowStockThreshold: 2,
  },
  now: referenceNow,
});

assert.equal(ecwidLikePayloadSnapshot.meta.storeName, 'Nested Atlas');
assert.equal(ecwidLikePayloadSnapshot.meta.currency, 'EUR');
assert.equal(ecwidLikePayloadSnapshot.overview.orders24h, 1);
assert.equal(ecwidLikePayloadSnapshot.overview.revenue7d, 310.75);
assert.equal(ecwidLikePayloadSnapshot.overview.awaitingFulfillment, 1);
assert.equal(ecwidLikePayloadSnapshot.recentOrders[0].orderNumber, 'EBJFT');
assert.equal(ecwidLikePayloadSnapshot.recentOrders[0].customerName, 'Merchant Buyer');
assert.equal(ecwidLikePayloadSnapshot.countries[0].countryCode, 'GB');
assert.equal(ecwidLikePayloadSnapshot.lowStockProducts[0].name, 'String Quantity');

const fallbackProfileSnapshot = buildDashboardSnapshot({
  profile: {
    company: { companyName: 'Company Fallback' },
    settings: { currency: 'cad' },
  },
  orders: [],
  products: [],
  preferences: DEFAULT_PREFERENCES,
  now: referenceNow,
});

assert.equal(fallbackProfileSnapshot.meta.storeName, 'Company Fallback');
assert.equal(fallbackProfileSnapshot.meta.currency, 'CAD');

const countryOrderingSnapshot = buildDashboardSnapshot({
  profile: { storeName: 'Country Sort', currency: 'USD' },
  orders: [
    {
      id: 1,
      orderNumber: 'A',
      total: 200,
      createDate: '2026-03-18T10:00:00.000Z',
      shippingPerson: { name: 'A', countryCode: 'US' },
      fulfillmentStatus: 'FULFILLED',
    },
    {
      id: 2,
      orderNumber: 'B',
      total: 150,
      createDate: '2026-03-18T09:00:00.000Z',
      shippingPerson: { name: 'B', countryCode: 'US' },
      fulfillmentStatus: 'FULFILLED',
    },
    {
      id: 3,
      orderNumber: 'C',
      total: 500,
      createDate: '2026-03-18T08:00:00.000Z',
      shippingPerson: { name: 'C', countryCode: 'CA' },
      fulfillmentStatus: 'FULFILLED',
    },
    {
      id: 4,
      orderNumber: 'D',
      total: 100,
      createDate: '2026-03-18T07:00:00.000Z',
      shippingPerson: { name: 'D', countryCode: 'CA' },
      fulfillmentStatus: 'FULFILLED',
    },
  ],
  products: [],
  preferences: DEFAULT_PREFERENCES,
  now: referenceNow,
});

assert.equal(countryOrderingSnapshot.countries[0].countryCode, 'CA');
assert.equal(countryOrderingSnapshot.countries[1].countryCode, 'US');

const previewDataset = createPreviewDataset(referenceNow);
assert.equal(previewDataset.profile.storeName, 'Preview Mercantile');
assert.equal(previewDataset.orders.length, 8);
assert.equal(previewDataset.products.length, 7);

const previewSnapshot = buildDashboardSnapshot({
  profile: previewDataset.profile,
  orders: previewDataset.orders,
  products: previewDataset.products,
  preferences: {
    ...DEFAULT_PREFERENCES,
    previewModeEnabled: true,
  },
  now: referenceNow,
});

assert.equal(previewSnapshot.overview.orders24h, 3);
assert.equal(previewSnapshot.overview.lowStockProducts, 3);
assert.equal(previewSnapshot.overview.activeProducts, 6);
assert.equal(previewSnapshot.overview.awaitingFulfillment, 6);
assert.equal(previewSnapshot.recentOrders[0].orderNumber, 'PV-401');
assert.equal(previewSnapshot.countries.length, 8);

assert.equal(formatCurrencyAmount(120, 'USD', 'en-US'), '$120.00');
assert.match(formatCurrencyAmount(120, 'INVALID', 'en-US'), /120\.00 INVALID/);
assert.equal(formatRelativeTime('invalid-date', referenceNow, 'en-US'), 'Unknown time');

console.log('dashboard-metrics tests passed');