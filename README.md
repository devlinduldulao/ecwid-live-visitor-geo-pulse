# Live Visitor Geo Pulse for Ecwid

Admin-only Ecwid dashboard for store owners who want a useful operational pulse without paying for a database, Redis, or an always-on Node.js server.

## What This Version Is

This Ecwid app is intentionally different from the WooCommerce plugin runtime.

- It runs only inside the Ecwid admin iframe.
- It does not inject storefront widgets or visitor-facing UI.
- It does not run a backend service.
- It does not store data in a custom database.
- It does not use Redis or background workers.

Instead, the dashboard reads live Ecwid store data directly from the owner session and turns it into an admin pulse view for orders, revenue, geography, and low-stock follow-up.

## What The Dashboard Shows

- Orders in the last 24 hours
- Revenue in the last 7 days
- Top countries by recent orders
- Recent order activity
- Low stock products
- Active product count
- Orders awaiting fulfillment
- Browser-local preview mode with fake demo data

The geo view is based on order geography, not visitor tracking.

## Why This Architecture

Ecwid does not give this feature the same host-level writable runtime that WooCommerce or OpenCart can use for short-lived shared presence state. To keep the Ecwid version free to operate, this project uses a static app page and avoids any external persistence layer.

Tradeoff:

- You get a useful owner dashboard with no infrastructure cost.
- Browser-local preferences are saved per store in localStorage.
- Shared storewide live visitor counts are intentionally not implemented here because they would require external shared state.

## Project Structure

```text
live-visitor-geo-pulse/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy-pages.yml
├── public/
│   ├── index.html
│   ├── app.css
│   ├── app.js
│   └── dashboard-metrics.js
├── docs/
│   ├── AGENTS.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   ├── PUBLISHING.md
│   └── SKILL.md
├── assets/
│   └── marketplace/
│       ├── app-icon.svg
│       ├── app-icon-alt.svg
│       ├── listing-banner.svg
│       ├── listing-banner-alt.svg
│       ├── app-icon-512.png
│       └── screenshot-01-overview-1024x538.png
├── scripts/
│   ├── build.mjs
│   ├── export-assets.mjs
│   └── setup.sh
├── tests/
│   ├── e2e/
│   │   └── dashboard.spec.js
│   └── dashboard-metrics.test.js
├── AGENTS.md
├── CONTRIBUTING.md
├── LICENSE
├── package-lock.json
├── package.json
├── playwright.config.js
└── README.md
```

## Local Development

Serve the static app locally:

```bash
npm run serve
```

Then open:

```text
http://localhost:5001/index.html
```

For a local preview outside Ecwid, seed a temporary session-scoped preview context before opening the page:

```js
sessionStorage.setItem('lvgp-ecwid-dashboard:preview-context', JSON.stringify({
	storeId: 'YOUR_STORE_ID',
	accessToken: 'YOUR_TOKEN',
	lang: 'en'
}));
```

Then open:

```text
http://localhost:5001/index.html
```

Use a test store and clear the session storage entry when you are done.

Inside the dashboard, store owners can also toggle preview mode to swap the live Ecwid response for browser-local sample data. That is useful for demos, onboarding, screenshots, and layout review without presenting the numbers as real store activity.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run build` | Copy the static app into `dist/` for deployment |
| `npm run export:assets` | Generate PNG marketplace assets from the SVG sources in `assets/marketplace/` |
| `npm run capture:marketplace` | Run the app UI with mocked Ecwid data and save marketplace screenshots |
| `npm run prepare:publish` | Run lint, unit tests, browser tests, build, and asset export |
| `npm run serve` | Serve the static `public/` directory locally |
| `npm run lint` | Syntax-check the dashboard JavaScript files |
| `npm test` | Run the unit test suite |
| `npm run test:all` | Run the unit and browser test suites |
| `npm run test:e2e` | Run the Playwright browser tests |
| `npm run test:unit` | Run dashboard metric tests |

## Ecwid Setup

Create or reuse a custom app in Ecwid and configure only the admin page URL.

Required app settings:

- `iframeUrl`: your hosted `index.html`
- `read_store_profile` scope
- `read_catalog` scope
- `read_orders` scope

Not required for this version:

- `webhookUrl`
- `customJsUrl`
- `customCssUrl`
- `paymentUrl`
- `shippingUrl`
- OAuth callback endpoints
- backend token exchange service

## Deployment

Run a production build with:

```bash
npm run build
```

Then host the `dist/` directory on any static HTTPS host such as:

- GitHub Pages
- Netlify
- Cloudflare Pages
- Vercel static hosting

Point the Ecwid app `iframeUrl` to the hosted `index.html` page.

## Marketplace Assets

This repository now keeps marketplace source artwork, exported banners/icons, and captured screenshots in `assets/marketplace/`.

If you plan to publish the app publicly, you still need to capture final screenshots from the live app and verify each export size against the destination marketplace requirements.

## GitHub Actions

Two workflow files are included under `.github/workflows/`:

- `ci.yml` runs install, browser setup, lint, unit tests, browser tests, build, and publish-asset export on pull requests and pushes to `main`.
- `deploy-pages.yml` exports publish assets, builds `dist/`, and deploys it to GitHub Pages from `main` or manual dispatch.

Before using the deployment workflow, enable GitHub Pages in the repository settings and set the Ecwid app `iframeUrl` to the published Pages URL.

## Validation

Run these commands before publishing changes:

```bash
npm run lint
npm run test:all
npm run build
npm run export:assets
```