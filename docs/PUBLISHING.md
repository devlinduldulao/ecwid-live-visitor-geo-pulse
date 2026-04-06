# Publishing Guide

This project is a static, admin-only Ecwid app. Publishing readiness is mostly about operational correctness, listing completeness, and merchant-facing trust material rather than backend packaging.

## Minimum Requirements

- Hosted `dist/` output over HTTPS
- Ecwid custom app configured with `iframeUrl`
- Requested scopes limited to:
  - `read_store_profile`
  - `read_catalog`
  - `read_orders`
- Working support contact details outside the repository
- Privacy policy URL outside the repository if you publish publicly

## Repository Readiness

The repo now includes:

- CI workflow for lint, unit tests, browser tests, build, and publish-asset export
- GitHub Pages deployment workflow
- Static build output via `npm run build`
- Browser-local preview mode for screenshots and onboarding demos
- Marketplace source assets and generated outputs in `assets/marketplace/`
- Alternate icon and banner variants for marketplace fallback crops

The repo still does not contain final marketplace screenshots or a real support/privacy URL because those depend on your publishing identity.

Use these companion docs to close the remaining submission gaps:

- `docs/MARKETPLACE-SUBMISSION-PACKET.md`
- `docs/SCREENSHOT-RUNBOOK.md`
- `docs/REVIEWER-OUTREACH-TEMPLATE.md`

## Listing Materials You Still Need

- Final app icon export in the exact format required by your listing destination
- Final banner or cover image export in the exact format required by your listing destination
- Real screenshots taken from the app inside Ecwid admin
- Short description
- Long description
- Support email or support URL
- Privacy policy URL
- Terms URL if required by your distribution channel

The new packet and outreach templates in `docs/` are intended to hold those final values.

## Recommended Asset Workflow

Use the SVG source files in `assets/marketplace/` as the base artwork, then export the raster sizes you need for the listing destination with `npm run export:assets`.

Suggested outputs:

- `assets/marketplace/app-icon-256.png`
- `assets/marketplace/app-icon-512.png`
- `assets/marketplace/app-icon-alt-256.png`
- `assets/marketplace/app-icon-alt-512.png`
- `assets/marketplace/listing-banner-1200x675.png`
- `assets/marketplace/listing-banner-1600x900.png`
- `assets/marketplace/listing-banner-alt-1200x675.png`
- `assets/marketplace/listing-banner-alt-1600x900.png`
- `assets/marketplace/screenshot-01-overview-1024x538.png`
- `assets/marketplace/screenshot-02-country-breakdown-1024x538.png`
- `assets/marketplace/screenshot-03-low-stock-1024x538.png`
- `assets/marketplace/screenshot-04-preferences-1024x538.png`
- `assets/marketplace/screenshot-05-preview-mode-1024x538.png`
- 3 to 5 screenshots showing:
  - owner dashboard overview
  - country breakdown
  - low-stock panel
  - preview mode enabled

## Current Ecwid Review Notes

Based on current public Ecwid documentation and live app listings, the safest assumptions are:

- use a Native app style admin page with a working `iframeUrl`
- host the admin page on HTTPS
- request only the minimum required scopes
- provide a real company website and merchant-facing support destination
- expect a technical validation pass and a screencast during review

Verified from the current public intake form and live listings:

- the market request form explicitly asks for first name, last name, contact email, app name, company website URL, integration purpose, merchant value description, and expected audience size
- the market request form requires privacy-policy acceptance to submit
- live app listings prominently show price label, developer name, screenshot gallery, reviews, and a support link labeled `Contact developer at`
- observed screenshot assets on current public listings resolve to `1024x538`

Public docs do not clearly verify exact required upload dimensions for every marketplace asset. The current export sizes in `assets/marketplace/` are therefore submission baselines, not guaranteed final requirements.

Public docs also leave one architectural ambiguity for this repo shape: native app guidance frequently assumes encrypted payload handling with an app secret, while this repo is intentionally static. Confirm that static admin-only delivery is acceptable for your chosen submission path before final submission.

## Pre-Publish Checklist

- `npm run lint`
- `npm run test:all`
- `npm run build`
- `npm run export:assets`
- `npm run capture:marketplace`
- confirm `dist/` is what you want to host
- confirm `assets/marketplace/` matches the listing destination requirements
- confirm `iframeUrl` points to the hosted `index.html`
- confirm the dashboard loads inside Ecwid admin
- confirm preview mode is clearly labeled as fake data
- confirm no secrets are embedded in the repo
- confirm support and privacy URLs are ready for listing submission

## Release Notes Guidance

For the initial release, keep the positioning explicit:

- admin-only dashboard
- no visitor-facing widget
- no shared backend persistence
- browser-local preview mode for demos and onboarding

That makes the tradeoff clear and avoids overselling live visitor functionality that this Ecwid version does not implement.