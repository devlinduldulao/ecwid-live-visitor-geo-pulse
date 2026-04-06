# Marketplace Submission Packet

This file is a fillable handoff sheet for the Ecwid market request form, reviewer outreach, and internal release approval.

Replace the remaining identity and hosting placeholders before submission.

## Owner Identity

- App name: `Live Visitor Geo Pulse for Ecwid`
- First name: `YOUR-FIRST-NAME`
- Last name: `YOUR-LAST-NAME`
- Contact email: `YOUR-CONTACT-EMAIL`
- Company website: `https://YOUR-COMPANY.example`
- Support URL: `https://YOUR-COMPANY.example/support/live-visitor-geo-pulse-ecwid`
- Support email: `support@YOUR-COMPANY.example`
- Privacy policy: `https://YOUR-COMPANY.example/privacy`
- Terms: `https://YOUR-COMPANY.example/terms`

## Ecwid Intake Form Answers

- Reseller or partner channel selection: `No`
- Primary integration purpose category: `Analytics`
- Expected user range: `1 to 500`

Merchant value description:

`Live Visitor Geo Pulse for Ecwid gives store owners a lightweight operational dashboard inside the Ecwid admin. It surfaces recent orders, seven-day revenue pulse, order geography, active-product counts, low-stock follow-up, fulfillment workload, and a clearly labeled preview mode for demos and onboarding.`

## Listing Copy

Short description:

`Admin-only Ecwid dashboard for recent orders, revenue pulse, order geography, low-stock focus, and preview mode.`

Medium description:

`Live Visitor Geo Pulse for Ecwid gives store owners a practical daily pulse inside the Ecwid admin. It surfaces recent orders, seven-day revenue, order-country breakdown, low-stock priorities, active product counts, and fulfillment follow-up in a lightweight dashboard that does not require external infrastructure.`

Long description:

`Live Visitor Geo Pulse for Ecwid is built for merchants who want a clearer operating view inside the Ecwid dashboard without adding a database, Redis, or an always-on application server.

The app reads live Ecwid store data directly in the admin context and turns it into a compact owner-facing pulse. Merchants can quickly review new orders, recent revenue, geography based on order destinations, low-stock items that need attention, active product counts, and open fulfillment work.

The app also includes a clearly labeled preview mode for demos, onboarding, and screenshots. Preview mode uses sample data stored only in the current browser, so it never writes fake data back to Ecwid and never presents sample activity as live store activity.

This version is intentionally admin-only. It does not add a storefront widget, does not track visitors on the storefront, and does not maintain shared background presence state.`

## Pricing Positioning

- Price label to use on listing: `YOUR-PRICE-LABEL`
- Billing model summary: `YOUR-BILLING-MODEL`
- Trial availability: `YES-OR-NO`

## Ecwid App Configuration

- App/client ID: `custom-app-132959256-1`
- Frontend app ID location: `public/index.html` meta tag `ecwid-app-id`
- `iframeUrl`: `https://YOUR-HOST.example/index.html`
- Required scopes only:
	- `read_store_profile`
	- `read_catalog`
	- `read_orders`
- Do not request for this version:
	- `update_catalog`
	- `create_catalog`
	- `update_orders`
	- `public_storefront`
- Leave empty for this version:
	- `webhookUrl`
	- `customJsUrl`
	- `customCssUrl`
	- `paymentUrl`
	- `shippingUrl`
- Keep out of the repo and submission copy:
	- client secret
	- secret token
	- public token

## Requested Scopes

- `read_store_profile`
- `read_catalog`
- `read_orders`

Scope justification:

- store profile: store name and currency
- catalog: active products and low-stock analysis
- orders: recent activity, revenue pulse, country breakdown, and fulfillment metrics

## Reviewer Notes

Use or adapt this wording in the review thread:

- This app is admin-only and is intended for Ecwid store owners inside the dashboard.
- It does not inject storefront UI or track storefront visitors.
- It is intentionally static to avoid requiring merchants to fund extra infrastructure for this use case.
- Preview mode is clearly labeled, local to the browser, and never persisted to Ecwid.
- The app requests read-only scopes and does not modify store data.

## Production Hosting

- Production `iframeUrl`: `https://YOUR-HOST.example/index.html`
- Hosted build source: `dist/`
- Hosting provider: `YOUR-HOSTING-PROVIDER`
- Public support destination tested: `YES-OR-NO`
- Privacy policy destination tested: `YES-OR-NO`

## Assets

- Primary icon: `assets/marketplace/APP-ICON-FILENAME`
- Primary banner: `assets/marketplace/BANNER-FILENAME`
- Screenshot set captured: `YES-OR-NO`
- Screenshot export baseline: `1024x538`
- Screencast recorded: `YES-OR-NO`

## Final Operator Check

- all remaining placeholders replaced
- support and legal URLs resolve publicly
- `iframeUrl` loads the hosted production app
- screenshots show the Ecwid admin context
- preview screenshots are visibly labeled as preview data
- reviewer copy does not imply storefront visitor tracking