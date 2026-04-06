# Reviewer Outreach Template

Use this template when you need to confirm the static admin-only architecture with Ecwid or respond to reviewer questions.

## Subject

`Live Visitor Geo Pulse for Ecwid review context`

## Message

Hello Ecwid team,

I am submitting `Live Visitor Geo Pulse for Ecwid` for review.

This app is an admin-only dashboard for store owners inside the Ecwid admin. It reads store profile, catalog, and order data to show recent orders, seven-day revenue pulse, order-country breakdown, low-stock follow-up, active product counts, and fulfillment workload.

Important implementation notes:

- the app is intentionally admin-only
- it does not inject storefront UI
- it does not track storefront visitors
- it requests only `read_store_profile`, `read_catalog`, and `read_orders`
- it does not modify store data
- it includes a clearly labeled preview mode that uses browser-local sample data only

This build is intentionally static because the product does not require merchant-funded database, Redis, or always-on backend infrastructure.

Please confirm that this static native-style admin delivery path is acceptable for the selected submission route, and let me know if you require any additional encrypted payload handling or exact asset dimensions beyond the current submission package.

Helpful review links:

- Production app URL: `https://YOUR-HOST.example/index.html`
- Support URL: `https://YOUR-COMPANY.example/support/live-visitor-geo-pulse-ecwid`
- Privacy policy: `https://YOUR-COMPANY.example/privacy`

Thank you.

`YOUR-NAME`