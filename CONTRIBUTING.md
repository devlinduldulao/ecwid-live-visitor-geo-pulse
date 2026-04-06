# Contributing

## Getting Started

1. Clone the repo.
2. Run `npm install`.
3. Run `npm run serve`.
4. Open `http://localhost:5001/index.html`.

For local preview outside Ecwid admin, set a temporary session-scoped preview context:

```js
sessionStorage.setItem('lvgp-ecwid-dashboard:preview-context', JSON.stringify({
	storeId: 'YOUR_STORE_ID',
	accessToken: 'YOUR_TOKEN',
	lang: 'en'
}));
```

Then open `http://localhost:5001/index.html` and use a test store for that flow.

## Development Workflow

1. Create a feature branch.
2. Make focused changes.
3. Run `npm run lint`.
4. Run `npm test`.
5. Update docs if behavior or setup changed.

## Code Style

- Keep the app static and admin-only.
- Prefer pure helpers in `public/dashboard-metrics.js` for data logic.
- Keep rendering and Ecwid API wiring in `public/app.js`.
- Keep styles scoped to the dashboard classes under the `pulse-` prefix.

## Adding New Features

- Metric or aggregation change: update `public/dashboard-metrics.js` and add tests.
- UI change: update `public/index.html` and `public/app.css`.
- Ecwid request change: update `public/app.js`.

## Important Rules

- Never commit secrets or hardcoded tokens.
- Do not introduce a backend server, Redis, or a database unless the project direction changes explicitly.
- Do not add storefront widgets or visitor-facing UI.
- Keep browser-local preferences namespaced by store ID.
