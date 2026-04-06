# Development Guide

This project is developed as static files plus lightweight tests.

## Local Workflow

Serve the app locally:

```bash
npm run serve
```

Create a deployment build with:

```bash
npm run build
```

Open the dashboard directly:

```text
http://localhost:5001/index.html
```

For local preview outside Ecwid admin, set a temporary preview context in session storage:

```js
sessionStorage.setItem('lvgp-ecwid-dashboard:preview-context', JSON.stringify({
	storeId: 'YOUR_STORE_ID',
	accessToken: 'YOUR_TOKEN',
	lang: 'en'
}));
```

Then open `http://localhost:5001/index.html` and use a test store for that flow.

## Main Edit Targets

- `public/index.html`: page structure and iframe shell
- `public/app.css`: visual system and responsive layout
- `public/app.js`: Ecwid payload bootstrapping, fetch calls, rendering, local preference storage
- `public/dashboard-metrics.js`: pure data aggregation helpers
- `tests/dashboard-metrics.test.js`: regression tests for metric logic

## Testing

Run validation with:

```bash
npm run build
npm run lint
npm test
```

What they cover:

- JavaScript syntax for the dashboard files
- static build output generation into `dist/`
- metric aggregation behavior
- preference sanitization
- currency formatting fallback

## Ecwid Context

Inside Ecwid admin, the app uses the EcwidApp SDK payload to obtain:

- `store_id`
- `access_token`
- `lang`

The dashboard then calls Ecwid REST API directly from the iframe.

## Data Retrieval Strategy

The dashboard currently reads:

- `/profile`
- `/orders`
- `/products`

Collections are paginated with a defensive page cap so the static app stays fast and inexpensive.

## Browser Storage

Preferences are saved to localStorage and namespaced per store.

Stored values:

- lookback window
- low stock threshold
- refresh interval
- auto-refresh enabled flag
- preview mode enabled flag

Do not quietly turn these into shared backend settings unless the project direction changes.

## Preview Mode

The dashboard includes a browser-local preview toggle that replaces live Ecwid responses with sample data.

- It is intended for demos, screenshots, and onboarding.
- It never writes fake data back to Ecwid.
- It persists only in localStorage for the current browser and store.

## Adding Features

Preferred order of operations:

1. Add or update pure logic in `public/dashboard-metrics.js`.
2. Add tests in `tests/dashboard-metrics.test.js`.
3. Wire the result into `public/app.js`.
4. Update `public/index.html` and `public/app.css` only as needed.
5. Update docs if the dashboard behavior or setup changes.

## Debugging Notes

- Use the iframe console inside Ecwid admin for runtime issues.
- If requests fail, verify app scopes and token availability first.
- If local preview fails, verify `storeId` and `token` query parameters.
- If the iframe height is wrong, inspect the `EcwidApp.setSize` calls after render.