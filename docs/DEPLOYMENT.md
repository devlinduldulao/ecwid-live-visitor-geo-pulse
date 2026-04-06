# Deployment Guide

This Ecwid version is deployed as static files.

## What You Need

- a static HTTPS host
- an Ecwid custom app
- an `iframeUrl` pointing to your hosted `index.html`

You do not need:

- a Node.js server
- a database
- Redis
- PM2
- Docker
- nginx reverse proxy
- webhook endpoints

## Recommended Hosting Options

Any static host is fine. Examples:

- GitHub Pages
- Netlify
- Cloudflare Pages
- Vercel static hosting

This repository now includes a GitHub Actions workflow that can deploy `dist/` to GitHub Pages automatically.

## GitHub Pages Deployment

This repository already contains `.github/workflows/deploy-pages.yml` for free GitHub Pages hosting.

1. Push the repository to GitHub.
2. In GitHub, open `Settings > Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to `main`, or run the `Deploy GitHub Pages` workflow manually from the `Actions` tab.
5. Wait for the workflow to finish, then open the published Pages URL.

If the repository is published as a project site, the URL format is:

```text
https://<github-username>.github.io/<repository-name>/
```

For the repository URL the app should be deployed from, that becomes:

```text
https://devlinduldulao.github.io/ecwid-checkout-geo-flash/
```

The workflow now validates the app before deployment and writes a `.nojekyll` marker into `dist/` so GitHub Pages serves the static artifact exactly as built.

## Deploy The App Files

Create a deployment build first:

```bash
npm run build
```

Deploy the contents of `dist/` so the final URL serves:

```text
https://your-static-host.example/index.html
```

## Configure The Ecwid App

In Ecwid app settings, configure:

- `iframeUrl`: `https://your-static-host.example/index.html`

Requested scopes should stay minimal:

- `read_store_profile`
- `read_catalog`
- `read_orders`

Leave these empty for this version:

- `webhookUrl`
- `customJsUrl`
- `customCssUrl`
- `paymentUrl`
- `shippingUrl`

## App ID Note

The HTML is configured to read the Ecwid app identifier from the `public/index.html` meta tag `ecwid-app-id` and pass it to `EcwidApp.init()` at runtime.

Current configured value:

- `custom-app-132959256-1`

## Local Preview Outside Ecwid

For temporary local testing outside the Ecwid iframe, set a session-scoped preview context:

```js
sessionStorage.setItem('lvgp-ecwid-dashboard:preview-context', JSON.stringify({
	storeId: 'YOUR_STORE_ID',
	accessToken: 'YOUR_TOKEN',
	lang: 'en'
}));
```

Then open `http://localhost:5001/index.html`. Use a test store and clear the session entry when finished.

## Publish Checklist

- `npm run lint`
- `npm test`
- `npm run build`
- host `dist/` on HTTPS
- set Ecwid `iframeUrl`
- confirm the dashboard loads inside Ecwid admin
- confirm recent orders, geography, and low-stock sections render correctly
- export final marketplace/listing assets and capture screenshots in `assets/marketplace/`

See `docs/PUBLISHING.md` for the broader listing and release checklist.
