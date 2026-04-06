# Architecture

This Ecwid project is a static, admin-only dashboard for store owners.

## Product Direction

The Ecwid version is not a visitor-facing plugin surface.

- No storefront widget
- No live visitor badge
- No backend event collector
- No custom database
- No Redis cache
- No always-on Node.js runtime

The value is the owner dashboard inside Ecwid admin.

## Why This Is Different From WooCommerce

WooCommerce and OpenCart can keep short-lived state inside the host platform runtime. Ecwid is SaaS and does not give this repo an equivalent writable application runtime for free, shared presence state.

That means two realistic options:

1. Pay for external shared infrastructure and build a true live-presence service.
2. Stay static and admin-first.

This repository intentionally chooses option 2.

## Runtime Model

```text
Ecwid Admin
    -> loads iframeUrl
    -> serves public/index.html from static hosting
    -> EcwidApp SDK provides store context
    -> app.js calls Ecwid REST API directly
    -> dashboard-metrics.js aggregates owner metrics
    -> browser localStorage stores per-store preferences
```

## Main Files

- `public/index.html`: iframe shell mounted by Ecwid admin
- `public/app.js`: dashboard runtime, Ecwid API requests, rendering, preference storage
- `public/dashboard-metrics.js`: pure data aggregation helpers for business metrics
- `public/app.css`: dashboard styling
- `tests/dashboard-metrics.test.js`: regression tests for aggregation logic

## Data Sources

The dashboard reads directly from Ecwid REST API v3 using the current owner context.

- `/profile`
- `/orders`
- `/products`

## Dashboard Metrics

The current owner dashboard computes:

- orders in the last 24 hours
- revenue in the last 7 days
- order-country breakdown for a configurable lookback window
- recent order feed
- low stock product list
- active product count
- awaiting fulfillment count

## Persistence Model

There is no shared server-side persistence in this repo.

Saved data is limited to browser-local preferences:

- lookback window in days
- low stock threshold
- auto-refresh interval
- auto-refresh enabled flag

These values are namespaced by store ID in localStorage.

## Tradeoffs

Benefits:

- zero infrastructure cost beyond static hosting
- simple deployment
- no database migrations
- no background worker maintenance
- no Redis or cache invalidation layer

Limits:

- no true cross-session shared live-presence state
- no centralized app settings shared between admins
- large stores may be sampled because the dashboard intentionally caps pagination

## Security Model

- the repo does not hardcode store tokens
- the dashboard expects authenticated Ecwid admin context
- no client secret is stored here
- no write endpoint is exposed by this project

## If You Extend It Later

Do not add a backend by reflex. First ask whether the feature can remain static and admin-only.

If a future requirement truly needs shared writable state, document:

- why static mode is insufficient
- what new infrastructure is required
- what new operating cost it introduces
- what privacy data would be retained
