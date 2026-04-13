import {
  DEFAULT_PREFERENCES,
  buildDashboardSnapshot,
  createPreviewDataset,
  formatCurrencyAmount,
  formatRelativeTime,
  sanitizePreferences,
} from './dashboard-metrics.js';

const API_BASE = 'https://app.ecwid.com/api/v3';
const STORAGE_PREFIX = 'lvgp-ecwid-dashboard';
const PREVIEW_CONTEXT_STORAGE_KEY = `${STORAGE_PREFIX}:preview-context`;
const PUBLIC_PREVIEW_STORE_ID = `${STORAGE_PREFIX}:public-preview`;
const GUIDE_DISMISSED_KEY = `${STORAGE_PREFIX}:guide-dismissed`;

const state = {
  app: null,
  storeId: '',
  accessToken: '',
  locale: 'en-US',
  currency: 'USD',
  preferences: { ...DEFAULT_PREFERENCES },
  autoRefreshTimer: null,
};

const elements = {
  statusBanner: document.getElementById('status-banner'),
  dataSourceBanner: document.getElementById('data-source-banner'),
  dataSourceTitle: document.getElementById('data-source-title'),
  dataSourceDetail: document.getElementById('data-source-detail'),
  helpToggle: document.getElementById('help-toggle'),
  gettingStartedGuide: document.getElementById('getting-started-guide'),
  guideDismiss: document.getElementById('guide-dismiss'),
  guideGotIt: document.getElementById('guide-got-it'),
  geoWindowCopy: document.getElementById('geo-window-copy'),
  lastRefreshCopy: document.getElementById('last-refresh-copy'),
  metricOrders24h: document.getElementById('metric-orders-24h'),
  metricRevenue7d: document.getElementById('metric-revenue-7d'),
  metricCountries: document.getElementById('metric-countries'),
  metricLowStock: document.getElementById('metric-low-stock'),
  metricActiveProducts: document.getElementById('metric-active-products'),
  metricAwaitingFulfillment: document.getElementById('metric-awaiting-fulfillment'),
  countryBreakdown: document.getElementById('country-breakdown'),
  recentOrders: document.getElementById('recent-orders'),
  lowStockList: document.getElementById('low-stock-list'),
  preferencesForm: document.getElementById('preferences-form'),
  lookbackDays: document.getElementById('lookback-days'),
  lowStockThreshold: document.getElementById('low-stock-threshold'),
  refreshInterval: document.getElementById('refresh-interval'),
  autoRefreshEnabled: document.getElementById('auto-refresh-enabled'),
  previewBadge: document.getElementById('preview-badge'),
  previewToggle: document.getElementById('preview-toggle'),
  refreshNow: document.getElementById('refresh-now'),
};

boot().catch((error) => {
  showStatus(error.message || 'Failed to load dashboard.', 'error');
});

async function boot() {
  bindEvents();
  renderLoadingState();
  await initializeContext();
  await refreshDashboard(false);
}

function bindEvents() {
  elements.preferencesForm.addEventListener('submit', (event) => {
    event.preventDefault();
    state.preferences = readPreferencesFromForm();
    savePreferences(state.storeId, state.preferences);
    scheduleAutoRefresh();
    showStatus('Preferences saved in this browser for this store.', 'success');
    refreshDashboard(false).catch((error) => {
      showStatus(error.message || 'Failed to refresh the dashboard.', 'error');
    });
  });

  elements.refreshNow.addEventListener('click', () => {
    refreshDashboard(true).catch((error) => {
      showStatus(error.message || 'Failed to refresh the dashboard.', 'error');
    });
  });

  elements.helpToggle.addEventListener('click', () => {
    const isHidden = elements.gettingStartedGuide.hidden;
    elements.gettingStartedGuide.hidden = !isHidden;
    elements.helpToggle.setAttribute('aria-expanded', String(isHidden));
    resizeIframe();
  });

  elements.guideDismiss.addEventListener('click', () => {
    elements.gettingStartedGuide.hidden = true;
    elements.helpToggle.setAttribute('aria-expanded', 'false');
    resizeIframe();
  });

  elements.guideGotIt.addEventListener('click', () => {
    elements.gettingStartedGuide.hidden = true;
    elements.helpToggle.setAttribute('aria-expanded', 'false');
    try { window.localStorage.setItem(GUIDE_DISMISSED_KEY, 'true'); } catch { /* noop */ }
    resizeIframe();
  });

  elements.previewToggle.addEventListener('click', async () => {
    const previewWasEnabled = state.preferences.previewModeEnabled === true;

    state.preferences.previewModeEnabled = !state.preferences.previewModeEnabled;
    savePreferences(state.storeId, state.preferences);
    populatePreferencesForm(state.preferences);
    updatePreviewUi();

    if (previewWasEnabled) {
      // Immediately wipe fake preview data from the DOM — do not wait for the
      // live fetch. Without this the simulated numbers stay on screen until the
      // network call resolves or times out.
      document.querySelectorAll('.pulse-metric__value').forEach((el) => {
        el.textContent = '--';
      });
      document.title = 'Live Visitor Geo Pulse for Ecwid';
      renderLoadingState();
    }

    try {
      await refreshDashboard(true);
    } catch (error) {
      if (previewWasEnabled) {
        renderLiveUnavailableState();
        showStatus('Preview data disabled. Live Ecwid data is currently unavailable.', 'error');
        return;
      }

      showStatus(error.message || 'Failed to refresh the dashboard.', 'error');
    }
  });
}

async function initializeContext() {
  const fallbackConfig = getFallbackContext();
  const appId = getConfiguredAppId();

  if (window.EcwidApp && typeof window.EcwidApp.init === 'function') {
    try {
      state.app = window.EcwidApp.init({ appId });

      if (state.app && typeof state.app.getPayload === 'function') {
        const payload = await getPayload(state.app);
        state.storeId = String(payload.store_id || fallbackConfig.storeId || '');
        state.accessToken = String(payload.access_token || fallbackConfig.accessToken || '');
        state.locale = normalizeLocale(payload.lang || fallbackConfig.lang || navigator.language || 'en-US');
      }
    } catch {
      state.app = null;
    }

    if (!state.storeId || !state.accessToken) {
      state.storeId = fallbackConfig.storeId;
      state.accessToken = fallbackConfig.accessToken;
      state.locale = normalizeLocale(fallbackConfig.lang || navigator.language || 'en-US');
    }
  } else {
    state.storeId = fallbackConfig.storeId;
    state.accessToken = fallbackConfig.accessToken;
    state.locale = normalizeLocale(fallbackConfig.lang || navigator.language || 'en-US');
  }

  if (!state.storeId || !state.accessToken) {
    initializePublicPreviewContext();
    return;
  }

  state.preferences = loadPreferences(state.storeId);
  populatePreferencesForm(state.preferences);
  updatePreviewUi();
  updateDataSourceBanner();
  showGuideIfFirstVisit();
  scheduleAutoRefresh();
}

function initializePublicPreviewContext() {
  state.storeId = PUBLIC_PREVIEW_STORE_ID;
  state.accessToken = '';
  state.locale = normalizeLocale(navigator.language || 'en-US');
  state.preferences = {
    ...loadPreferences(state.storeId),
    previewModeEnabled: true,
  };

  populatePreferencesForm(state.preferences);
  updatePreviewUi();
  updateDataSourceBanner();
  showGuideIfFirstVisit();
  scheduleAutoRefresh();
  showStatus('Public preview mode is active. Open this app inside Ecwid admin for live store data.', 'success');
}

async function refreshDashboard(showToast) {
  setLoadingState(true);

  if (state.preferences.previewModeEnabled) {
    const previewDataset = createPreviewDataset(new Date());
    const snapshot = buildDashboardSnapshot({
      profile: previewDataset.profile,
      orders: previewDataset.orders,
      products: previewDataset.products,
      preferences: state.preferences,
      now: new Date(),
      orderSampleTruncated: false,
      productSampleTruncated: false,
    });

    state.currency = snapshot.meta.currency;
    renderSnapshot(snapshot, { isPreview: true });
    setLoadingState(false);

    if (showToast) {
      showStatus('Preview data is active. These numbers are simulated for this browser only.', 'success');
    }

    return;
  }

  const [profileResponse, ordersResponse, productsResponse] = await Promise.all([
    fetchEcwidObject('/profile'),
    fetchEcwidCollection('/orders', 100, 5),
    fetchEcwidCollection('/products', 100, 5),
  ]);

  const snapshot = buildDashboardSnapshot({
    profile: profileResponse,
    orders: ordersResponse.items,
    products: productsResponse.items,
    preferences: state.preferences,
    now: new Date(),
    orderSampleTruncated: ordersResponse.truncated,
    productSampleTruncated: productsResponse.truncated,
  });

  state.currency = snapshot.meta.currency;
  renderSnapshot(snapshot, { isPreview: false });
  setLoadingState(false);

  if (showToast) {
    showStatus('Dashboard refreshed from Ecwid.', 'success');
  }
}

async function fetchEcwidObject(path) {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(state.storeId)}${path}`, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Ecwid request failed for ${path} with status ${response.status}.`);
  }

  return response.json();
}

async function fetchEcwidCollection(path, limit, maxPages) {
  let offset = 0;
  let page = 0;
  const items = [];
  let truncated = false;

  while (page < maxPages) {
    const url = new URL(`${API_BASE}/${encodeURIComponent(state.storeId)}${path}`);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));

    const response = await fetch(url.toString(), { headers: buildHeaders() });
    if (!response.ok) {
      throw new Error(`Ecwid request failed for ${path} with status ${response.status}.`);
    }

    const payload = await response.json();
    const pageItems = Array.isArray(payload.items) ? payload.items : [];
    items.push(...pageItems);

    if (pageItems.length < limit) {
      return { items, truncated: false };
    }

    page += 1;
    offset += limit;
  }

  truncated = true;
  return { items, truncated };
}

function renderSnapshot(snapshot, options = {}) {
  const isPreview = options.isPreview === true;

  document.title = `${snapshot.meta.storeName} - Live Visitor Geo Pulse`;
  document.getElementById('main-content').dataset.preview = String(isPreview);

  elements.metricOrders24h.textContent = String(snapshot.overview.orders24h);
  elements.metricRevenue7d.textContent = formatCurrencyAmount(snapshot.overview.revenue7d, snapshot.meta.currency, state.locale);
  elements.metricCountries.textContent = String(snapshot.overview.countriesLookback);
  elements.metricLowStock.textContent = String(snapshot.overview.lowStockProducts);
  elements.metricActiveProducts.textContent = String(snapshot.overview.activeProducts);
  elements.metricAwaitingFulfillment.textContent = String(snapshot.overview.awaitingFulfillment);

  elements.geoWindowCopy.textContent = isPreview
    ? `Preview mode using the last ${snapshot.meta.lookbackDays} days of sample activity.`
    : `Using the last ${snapshot.meta.lookbackDays} days.`;

  const generatedAt = new Date(snapshot.meta.generatedAt);
  const truncationNotes = [];
  if (snapshot.meta.orderSampleTruncated) {
    truncationNotes.push('orders sampled');
  }
  if (snapshot.meta.productSampleTruncated) {
    truncationNotes.push('products sampled');
  }
  elements.lastRefreshCopy.textContent = [
    isPreview
      ? `Preview refreshed ${formatRelativeTime(generatedAt, new Date(), state.locale)}.`
      : `Updated ${formatRelativeTime(generatedAt, new Date(), state.locale)}.`,
    isPreview ? 'Showing sample data only.' : '',
    !isPreview && truncationNotes.length > 0 ? `Static mode: ${truncationNotes.join(' and ')}.` : '',
  ].filter(Boolean).join(' ');

  renderCountryBreakdown(snapshot.countries, snapshot.meta.currency);
  renderRecentOrders(snapshot.recentOrders, snapshot.meta.currency);
  renderLowStock(snapshot.lowStockProducts);
  resizeIframe();
}

function renderCountryBreakdown(countries, currencyCode) {
  if (countries.length === 0) {
    elements.countryBreakdown.innerHTML = emptyState('No orders were found inside the current geo pulse window.');
    return;
  }

  const maxOrders = countries[0].orders || 1;
  elements.countryBreakdown.innerHTML = countries.map((country) => {
    const barWidth = `${Math.max(8, Math.round((country.orders / maxOrders) * 100))}%`;
    return `
      <div class="pulse-list__item pulse-country-bar" style="--pulse-bar-width: ${barWidth};">
        <div>
          <strong>${escapeHtml(country.countryName)}</strong>
          <span>${escapeHtml(country.countryCode)} · ${country.orders} orders</span>
        </div>
        <div class="pulse-list__meta">
          <strong>${escapeHtml(formatCurrencyAmount(country.revenue, currencyCode, state.locale))}</strong>
        </div>
      </div>
    `;
  }).join('');
}

function renderRecentOrders(orders, currencyCode) {
  if (orders.length === 0) {
    elements.recentOrders.innerHTML = emptyState('No recent orders are available from the current Ecwid response.');
    return;
  }

  elements.recentOrders.innerHTML = orders.map((order) => {
    return `
      <div class="pulse-list__item">
        <div>
          <strong>#${escapeHtml(order.orderNumber)}</strong>
          <span>${escapeHtml(order.customerName)}</span>
        </div>
        <div class="pulse-list__meta">
          <strong>${escapeHtml(formatCurrencyAmount(order.total, currencyCode, state.locale))}</strong>
          <span>${escapeHtml(order.countryCode)} · ${escapeHtml(formatRelativeTime(order.createdAt, new Date(), state.locale))}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderLowStock(products) {
  if (products.length === 0) {
    elements.lowStockList.innerHTML = emptyState('No low stock products were found with the current threshold.');
    return;
  }

  elements.lowStockList.innerHTML = products.map((product) => {
    const quantityLabel = product.quantity === null ? 'Unlimited' : `${product.quantity} left`;
    return `
      <div class="pulse-list__item">
        <div>
          <strong>${escapeHtml(product.name)}</strong>
          <span>${escapeHtml(product.sku || 'No SKU')}</span>
        </div>
        <div class="pulse-list__meta">
          <strong>${escapeHtml(quantityLabel)}</strong>
        </div>
      </div>
    `;
  }).join('');
}

function renderLoadingState() {
  [
    elements.countryBreakdown,
    elements.recentOrders,
    elements.lowStockList,
  ].forEach((element) => {
    element.innerHTML = '<div class="pulse-empty pulse-loading">Loading data from Ecwid...</div>';
  });
}

function renderLiveUnavailableState() {
  document.title = 'Live Visitor Geo Pulse';
  document.getElementById('main-content').dataset.preview = 'false';

  elements.metricOrders24h.textContent = '--';
  elements.metricRevenue7d.textContent = '--';
  elements.metricCountries.textContent = '--';
  elements.metricLowStock.textContent = '--';
  elements.metricActiveProducts.textContent = '--';
  elements.metricAwaitingFulfillment.textContent = '--';

  elements.geoWindowCopy.textContent = 'Live Ecwid data is unavailable right now.';
  elements.lastRefreshCopy.textContent = 'Preview is off. Reconnect the app iframe or refresh when live data is reachable.';

  const unavailableMessage = 'Live Ecwid data could not be loaded.';
  elements.countryBreakdown.innerHTML = emptyState(unavailableMessage);
  elements.recentOrders.innerHTML = emptyState(unavailableMessage);
  elements.lowStockList.innerHTML = emptyState(unavailableMessage);

  setLoadingState(false);
  resizeIframe();
}

function setLoadingState(isLoading) {
  document.querySelectorAll('.pulse-metric__value').forEach((element) => {
    element.classList.toggle('pulse-loading', isLoading);
  });
}

function buildHeaders() {
  return {
    Authorization: `Bearer ${state.accessToken}`,
    Accept: 'application/json',
  };
}

function loadPreferences(storeId) {
  const storageKey = getStorageKey(storeId);
  const rawValue = window.localStorage.getItem(storageKey);

  if (!rawValue) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    return sanitizePreferences(JSON.parse(rawValue));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function savePreferences(storeId, preferences) {
  window.localStorage.setItem(getStorageKey(storeId), JSON.stringify(sanitizePreferences(preferences)));
}

function populatePreferencesForm(preferences) {
  elements.lookbackDays.value = String(preferences.lookbackDays);
  elements.lowStockThreshold.value = String(preferences.lowStockThreshold);
  elements.refreshInterval.value = String(preferences.refreshIntervalSeconds);
  elements.autoRefreshEnabled.checked = preferences.autoRefreshEnabled;
}

function updatePreviewUi() {
  const isPreview = state.preferences.previewModeEnabled === true;

  elements.previewBadge.hidden = !isPreview;
  elements.previewToggle.textContent = isPreview ? 'Disable Preview Data' : 'Enable Preview Data';
  updateDataSourceBanner();
}

function updateDataSourceBanner() {
  const isPublicPreview = state.storeId === PUBLIC_PREVIEW_STORE_ID;
  const isPreview = state.preferences.previewModeEnabled === true;

  if (isPublicPreview) {
    elements.dataSourceBanner.dataset.mode = 'public-preview';
    elements.dataSourceTitle.textContent = 'Sample Data — Not Connected to a Store';
    elements.dataSourceDetail.textContent = 'Open this app inside your Ecwid admin panel (Apps → Live Visitor Geo Pulse) to see your real store metrics.';
  } else if (isPreview) {
    elements.dataSourceBanner.dataset.mode = 'preview';
    elements.dataSourceTitle.textContent = 'Preview Mode — Showing Sample Data';
    elements.dataSourceDetail.textContent = 'These metrics are simulated for demonstration. Disable preview in Dashboard Controls below to see your real store data.';
  } else {
    elements.dataSourceBanner.dataset.mode = 'live';
    elements.dataSourceTitle.textContent = 'Live Data — Connected to Your Ecwid Store';
    elements.dataSourceDetail.textContent = 'All metrics below are sourced directly from your store\'s real orders and products.';
  }
}

function showGuideIfFirstVisit() {
  try {
    if (window.localStorage.getItem(GUIDE_DISMISSED_KEY) === 'true') {
      return;
    }
  } catch { /* noop */ }

  elements.gettingStartedGuide.hidden = false;
  elements.helpToggle.setAttribute('aria-expanded', 'true');
  resizeIframe();
}

function readPreferencesFromForm() {
  return sanitizePreferences({
    lookbackDays: elements.lookbackDays.value,
    lowStockThreshold: elements.lowStockThreshold.value,
    refreshIntervalSeconds: elements.refreshInterval.value,
    autoRefreshEnabled: elements.autoRefreshEnabled.checked,
    previewModeEnabled: state.preferences.previewModeEnabled,
  });
}

function scheduleAutoRefresh() {
  if (state.autoRefreshTimer) {
    window.clearInterval(state.autoRefreshTimer);
    state.autoRefreshTimer = null;
  }

  if (!state.preferences.autoRefreshEnabled) {
    return;
  }

  state.autoRefreshTimer = window.setInterval(() => {
    refreshDashboard(false).catch((error) => {
      showStatus(error.message || 'Auto-refresh failed.', 'error');
    });
  }, state.preferences.refreshIntervalSeconds * 1000);
}

function getStorageKey(storeId) {
  return `${STORAGE_PREFIX}:${storeId}`;
}

function getConfiguredAppId() {
  const metaTag = document.querySelector('meta[name="ecwid-app-id"]');
  return metaTag ? metaTag.content : 'live-visitor-geo-pulse';
}

function getFallbackContext() {
  const params = new URLSearchParams(window.location.search);
  const previewContext = readPreviewContext();

  return {
    storeId: previewContext.storeId || params.get('storeId') || '',
    accessToken: previewContext.accessToken || params.get('accessToken') || params.get('token') || '',
    lang: previewContext.lang || params.get('lang') || '',
  };
}

function readPreviewContext() {
  try {
    const rawValue = window.sessionStorage.getItem(PREVIEW_CONTEXT_STORAGE_KEY);

    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue);
    return {
      storeId: typeof parsed.storeId === 'string' ? parsed.storeId : '',
      accessToken: typeof parsed.accessToken === 'string' ? parsed.accessToken : '',
      lang: typeof parsed.lang === 'string' ? parsed.lang : '',
    };
  } catch {
    return {};
  }
}

function getPayload(app) {
  return new Promise((resolve, reject) => {
    app.getPayload((payload) => {
      if (!payload) {
        reject(new Error('Ecwid did not return an app payload.'));
        return;
      }

      resolve(payload);
    });
  });
}

function normalizeLocale(locale) {
  return String(locale || 'en-US').replace('_', '-');
}

function showStatus(message, tone) {
  elements.statusBanner.hidden = false;
  elements.statusBanner.dataset.tone = tone;
  elements.statusBanner.textContent = message;
  resizeIframe();
}

function resizeIframe() {
  if (window.EcwidApp && typeof window.EcwidApp.setSize === 'function') {
    window.setTimeout(() => {
      window.EcwidApp.setSize({ height: document.body.scrollHeight + 24 });
    }, 60);
  }
}

function emptyState(message) {
  return `<div class="pulse-empty">${escapeHtml(message)}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}