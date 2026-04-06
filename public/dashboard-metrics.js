export const DEFAULT_PREFERENCES = {
  lookbackDays: 30,
  lowStockThreshold: 5,
  refreshIntervalSeconds: 60,
  autoRefreshEnabled: true,
  previewModeEnabled: false,
};

const OPEN_FULFILLMENT_STATUSES = new Set([
  'AWAITING_PROCESSING',
  'PROCESSING',
  'NOT_FULFILLED',
  'PARTIALLY_FULFILLED',
  'READY_FOR_PICKUP',
]);

const CLOSED_FULFILLMENT_STATUSES = new Set([
  'FULFILLED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
]);

export function sanitizePreferences(input = {}) {
  return {
    lookbackDays: clampInteger(input.lookbackDays, 7, 90, DEFAULT_PREFERENCES.lookbackDays),
    lowStockThreshold: clampInteger(input.lowStockThreshold, 0, 1000, DEFAULT_PREFERENCES.lowStockThreshold),
    refreshIntervalSeconds: clampInteger(input.refreshIntervalSeconds, 30, 900, DEFAULT_PREFERENCES.refreshIntervalSeconds),
    autoRefreshEnabled:
      typeof input.autoRefreshEnabled === 'boolean'
        ? input.autoRefreshEnabled
        : DEFAULT_PREFERENCES.autoRefreshEnabled,
    previewModeEnabled:
      typeof input.previewModeEnabled === 'boolean'
        ? input.previewModeEnabled
        : DEFAULT_PREFERENCES.previewModeEnabled,
  };
}

export function createPreviewDataset(now = new Date()) {
  const baseDate = toDate(now) || new Date();

  return {
    profile: {
      storeName: 'Preview Mercantile',
      currency: 'USD',
    },
    orders: [
      createPreviewOrder(baseDate, 401, 'PV-401', 2, 184, 'Maya Chen', 'US', 'PROCESSING'),
      createPreviewOrder(baseDate, 402, 'PV-402', 7, 96, 'Luca Moretti', 'IT', 'AWAITING_PROCESSING'),
      createPreviewOrder(baseDate, 403, 'PV-403', 21, 142, 'Ava Thompson', 'GB', 'PROCESSING'),
      createPreviewOrder(baseDate, 404, 'PV-404', 30, 87, 'Noah Patel', 'CA', 'FULFILLED'),
      createPreviewOrder(baseDate, 405, 'PV-405', 48, 205, 'Sofia Alvarez', 'ES', 'NOT_FULFILLED'),
      createPreviewOrder(baseDate, 406, 'PV-406', 72, 154, 'Jonas Weber', 'DE', 'PARTIALLY_FULFILLED'),
      createPreviewOrder(baseDate, 407, 'PV-407', 120, 263, 'Nina Ionescu', 'RO', 'FULFILLED'),
      createPreviewOrder(baseDate, 408, 'PV-408', 180, 111, 'Leo Santos', 'BR', 'READY_FOR_PICKUP'),
    ],
    products: [
      { id: 71, name: 'Atlas Desk Stand', enabled: true, quantity: 2, sku: 'ADS-71' },
      { id: 72, name: 'Merchant Field Notebook', enabled: true, quantity: 4, sku: 'MFN-72' },
      { id: 73, name: 'Signal Canvas Tote', enabled: true, quantity: 11, sku: 'SCT-73' },
      { id: 74, name: 'Brass Counter Bell', enabled: true, quantity: 1, sku: 'BCB-74' },
      { id: 75, name: 'Evergreen Gift Card', enabled: true, unlimited: true, sku: 'EGC-75' },
      { id: 76, name: 'Archive Shipping Tube', enabled: false, quantity: 3, sku: 'AST-76' },
      { id: 77, name: 'Window Display Tags', enabled: true, quantity: 6, sku: 'WDT-77' },
    ],
  };
}

export function buildDashboardSnapshot({
  profile = {},
  orders = [],
  products = [],
  preferences = DEFAULT_PREFERENCES,
  now = new Date(),
  orderSampleTruncated = false,
  productSampleTruncated = false,
} = {}) {
  const safePreferences = sanitizePreferences(preferences);
  const nowDate = toDate(now) || new Date();
  const lookbackMs = safePreferences.lookbackDays * 24 * 60 * 60 * 1000;
  const sevenDayMs = 7 * 24 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;

  const normalizedOrders = orders
    .map((order) => normalizeOrder(order))
    .filter((order) => order.createdAt !== null)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  const normalizedProducts = products.map((product) => normalizeProduct(product));
  const lookbackOrders = normalizedOrders.filter((order) => nowDate.getTime() - order.createdAt.getTime() <= lookbackMs);
  const last24HoursOrders = normalizedOrders.filter((order) => nowDate.getTime() - order.createdAt.getTime() <= dayMs);
  const last7DaysOrders = normalizedOrders.filter((order) => nowDate.getTime() - order.createdAt.getTime() <= sevenDayMs);
  const countryBreakdown = buildCountryBreakdown(lookbackOrders);
  const lowStockProducts = normalizedProducts
    .filter((product) => product.enabled && product.quantity !== null && !product.unlimited && product.quantity <= safePreferences.lowStockThreshold)
    .sort((left, right) => left.quantity - right.quantity)
    .slice(0, 8);

  const awaitingFulfillment = normalizedOrders.filter((order) => isAwaitingFulfillment(order.fulfillmentStatus)).length;
  const activeProducts = normalizedProducts.filter((product) => product.enabled).length;

  return {
    meta: {
      generatedAt: nowDate.toISOString(),
      currency: getCurrency(profile),
      storeName: getStoreName(profile),
      lookbackDays: safePreferences.lookbackDays,
      orderCount: normalizedOrders.length,
      productCount: normalizedProducts.length,
      orderSampleTruncated,
      productSampleTruncated,
    },
    overview: {
      orders24h: last24HoursOrders.length,
      revenue7d: sumTotals(last7DaysOrders),
      countriesLookback: countryBreakdown.length,
      lowStockProducts: lowStockProducts.length,
      activeProducts,
      awaitingFulfillment,
    },
    countries: countryBreakdown.slice(0, 8),
    recentOrders: normalizedOrders.slice(0, 8),
    lowStockProducts,
  };
}

export function formatCurrencyAmount(amount, currencyCode = 'USD', locale = 'en-US') {
  const numericAmount = Number.isFinite(amount) ? amount : 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    return `${numericAmount.toFixed(2)} ${currencyCode}`.trim();
  }
}

export function formatRelativeTime(value, now = new Date(), locale = 'en-US') {
  const dateValue = toDate(value);
  const nowDate = toDate(now) || new Date();

  if (!dateValue) {
    return 'Unknown time';
  }

  const deltaSeconds = Math.round((dateValue.getTime() - nowDate.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];

  for (const [unit, seconds] of units) {
    if (Math.abs(deltaSeconds) >= seconds || unit === 'second') {
      return formatter.format(Math.round(deltaSeconds / seconds), unit);
    }
  }

  return 'Just now';
}

function buildCountryBreakdown(orders) {
  const groups = new Map();

  for (const order of orders) {
    const countryCode = normalizeCountryCode(order.countryCode);
    const current = groups.get(countryCode) || {
      countryCode,
      countryName: countryCode,
      orders: 0,
      revenue: 0,
    };

    current.orders += 1;
    current.revenue += order.total;
    current.countryName = resolveCountryName(countryCode);
    groups.set(countryCode, current);
  }

  return Array.from(groups.values()).sort((left, right) => {
    if (right.orders !== left.orders) {
      return right.orders - left.orders;
    }

    return right.revenue - left.revenue;
  });
}

function normalizeOrder(order) {
  const createdAt =
    toDate(order.createDate) ||
    toDate(order.date) ||
    toDate(order.created) ||
    toDate(order.createdAt) ||
    toDate(order.updateDate) ||
    null;

  return {
    id: String(order.id || order.orderNumber || order.internalId || ''),
    orderNumber: String(order.vendorNumber || order.orderNumber || order.id || 'Unknown'),
    customerName: getCustomerName(order),
    createdAt,
    total: toNumber(order.total),
    countryCode: order.shippingPerson?.countryCode || order.billingPerson?.countryCode || order.countryCode || 'XX',
    fulfillmentStatus: String(order.fulfillmentStatus || order.fulfillmentStatusName || 'UNKNOWN').toUpperCase(),
    paymentStatus: String(order.paymentStatus || 'UNKNOWN').toUpperCase(),
  };
}

function normalizeProduct(product) {
  return {
    id: String(product.id || ''),
    name: String(product.name || 'Untitled product'),
    sku: String(product.sku || ''),
    enabled: product.enabled !== false,
    quantity: getQuantity(product),
    unlimited: Boolean(product.unlimited || product.quantity === 'unlimited'),
  };
}

function getCustomerName(order) {
  const shipping = order.shippingPerson || {};
  const billing = order.billingPerson || {};
  const customer = order.customer || {};
  const candidate = [
    `${customer.name || ''}`.trim(),
    `${shipping.name || ''}`.trim(),
    `${billing.name || ''}`.trim(),
    `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
    `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim(),
    `${billing.firstName || ''} ${billing.lastName || ''}`.trim(),
    String(customer.email || '').trim(),
    String(order.email || '').trim(),
  ].find(Boolean);

  return candidate || 'Guest customer';
}

function getCurrency(profile) {
  return String(profile.currency || profile.account?.currency || profile.settings?.currency || 'USD').toUpperCase();
}

function getStoreName(profile) {
  return String(profile.storeName || profile.generalInfo?.storeName || profile.company?.companyName || 'Your Ecwid store');
}

function getQuantity(product) {
  if (product.unlimited) {
    return null;
  }

  const numericQuantity = Number.parseFloat(product.quantity);
  return Number.isFinite(numericQuantity) ? numericQuantity : null;
}

function isAwaitingFulfillment(status) {
  if (OPEN_FULFILLMENT_STATUSES.has(status)) {
    return true;
  }

  if (CLOSED_FULFILLMENT_STATUSES.has(status)) {
    return false;
  }

  return status !== 'FULFILLED';
}

function resolveCountryName(countryCode) {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(countryCode) || countryCode;
  } catch (error) {
    return countryCode;
  }
}

function normalizeCountryCode(countryCode) {
  const normalized = String(countryCode || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : 'XX';
}

function sumTotals(orders) {
  return orders.reduce((sum, order) => sum + order.total, 0);
}

function toDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalizedValue = value < 1e12 ? value * 1000 : value;
    const parsedNumeric = new Date(normalizedValue);
    return Number.isNaN(parsedNumeric.getTime()) ? null : parsedNumeric;
  }

  const stringValue = String(value).trim();
  if (/^\d+$/.test(stringValue)) {
    const numericValue = Number.parseInt(stringValue, 10);
    if (Number.isFinite(numericValue)) {
      const normalizedValue = stringValue.length <= 10 ? numericValue * 1000 : numericValue;
      const parsedNumeric = new Date(normalizedValue);
      return Number.isNaN(parsedNumeric.getTime()) ? null : parsedNumeric;
    }
  }

  const parsed = new Date(stringValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toNumber(value) {
  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function clampInteger(value, min, max, fallback) {
  const numericValue = Number.parseInt(value, 10);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numericValue));
}

function createPreviewOrder(baseDate, id, orderNumber, hoursAgo, total, customerName, countryCode, fulfillmentStatus) {
  const createdAt = new Date(baseDate.getTime() - hoursAgo * 60 * 60 * 1000);

  return {
    id,
    orderNumber,
    total,
    createDate: createdAt.toISOString(),
    shippingPerson: {
      name: customerName,
      countryCode,
    },
    fulfillmentStatus,
  };
}