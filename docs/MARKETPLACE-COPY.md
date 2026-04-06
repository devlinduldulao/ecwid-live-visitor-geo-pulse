# Marketplace Copy

This file gives you a submission-ready baseline for the Ecwid App Market listing and reviewer materials.

## Positioning

Live Visitor Geo Pulse for Ecwid is an admin-only operational dashboard for store owners. It shows recent orders, geography, revenue pulse, low-stock follow-up, and a browser-local preview mode without requiring a database, Redis, or an always-on backend service.

## Short Description

Admin-only Ecwid dashboard for recent orders, revenue pulse, order geography, low-stock focus, and preview mode.

## Medium Description

Live Visitor Geo Pulse for Ecwid gives store owners a practical daily pulse inside the Ecwid admin. It surfaces recent orders, seven-day revenue, order-country breakdown, low-stock priorities, active product counts, and fulfillment follow-up in a lightweight dashboard that does not require external infrastructure.

## Long Description

Live Visitor Geo Pulse for Ecwid is built for merchants who want a clearer operating view inside the Ecwid dashboard without adding a database, Redis, or an always-on application server.

The app reads live Ecwid store data directly in the admin context and turns it into a compact owner-facing pulse. Merchants can quickly review new orders, recent revenue, geography based on order destinations, low-stock items that need attention, active product counts, and open fulfillment work.

The app also includes a clearly labeled preview mode for demos, onboarding, and screenshots. Preview mode uses sample data stored only in the current browser, so it never writes fake data back to Ecwid and never presents sample activity as live store activity.

This version is intentionally admin-only. It does not add a storefront widget, does not track visitors on the storefront, and does not maintain shared background presence state.

## Feature Bullets

- Orders in the last 24 hours
- Revenue pulse for the last 7 days
- Country breakdown based on recent order geography
- Recent order activity feed
- Low-stock product focus list
- Active product and awaiting-fulfillment counts
- Browser-local preview mode for demos and screenshots
- Static deployment with no custom database or Redis requirement

## Scope Explanation

Requested scopes:

- `read_store_profile`
- `read_catalog`
- `read_orders`

Reasoning:

- store profile: store name and currency
- catalog: active products and low-stock analysis
- orders: recent activity, revenue pulse, country breakdown, and fulfillment metrics

The app does not request write scopes because it does not modify store data.

## Support And Legal Placeholders

Replace these before submission:

- Company website: `https://YOUR-COMPANY.example`
- Support URL: `https://YOUR-COMPANY.example/support/live-visitor-geo-pulse-ecwid`
- Support email: `support@YOUR-COMPANY.example`
- Privacy policy: `https://YOUR-COMPANY.example/privacy`
- Terms: `https://YOUR-COMPANY.example/terms`

## Ecwid Intake Form Inputs

The current public Ecwid market request form asks for these inputs directly, so prepare them in final wording before submission:

- first name
- last name
- contact email
- app name
- company website URL
- reseller-channel selection
- primary integration purpose category
- description of what the app does and how it helps store owners
- expected user range

The form also requires privacy-policy acceptance.

## Reviewer Notes

Use this wording in reviewer-facing communication if needed:

- This app is admin-only and is intended for Ecwid store owners inside the dashboard.
- It does not inject storefront UI or track storefront visitors.
- It is intentionally static to avoid requiring merchants to fund extra infrastructure for this use case.
- Preview mode is clearly labeled, local to the browser, and never persisted to Ecwid.

## Suggested Screenshot Set

- dashboard overview with live metrics visible
- top countries card with recent order geography
- low-stock card with operational follow-up items
- preferences panel with preview mode enabled
- preview mode screenshot showing the visible preview badge

Observed current public listing galleries use screenshot assets at `1024x538`. Treat that as a practical baseline, not a guaranteed formal requirement.

## Suggested Validation Screencast Outline

- open the app inside Ecwid admin
- show live dashboard load
- show recent orders and country breakdown
- adjust preferences and save them
- enable preview mode and show the preview badge
- refresh the page to demonstrate browser-local preference persistence
- disable preview mode and return to live data