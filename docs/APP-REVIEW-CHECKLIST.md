# App Review Checklist

This checklist is tailored to the current static admin-only architecture of the Ecwid repo.

Use these companion files while closing the checklist:

- `docs/MARKETPLACE-SUBMISSION-PACKET.md`
- `docs/SCREENSHOT-RUNBOOK.md`
- `docs/REVIEWER-OUTREACH-TEMPLATE.md`

## Submission Inputs

- app name finalized
- first name and last name ready for the market request form
- contact email ready for the market request form
- company website available
- support URL available
- support email available
- privacy policy URL available
- terms URL available if required by the submission flow
- short and long descriptions finalized
- integration purpose category chosen for the request form
- expected user range chosen for the request form
- reviewer screencast recorded

## Technical Readiness

- `iframeUrl` points to a production HTTPS URL
- Ecwid app settings request only `read_store_profile`, `read_catalog`, and `read_orders`
- preview mode is visibly labeled as fake data
- no secrets are embedded in built static files
- dashboard works when loaded inside the Ecwid admin iframe
- browser-local preferences remain namespaced by store ID

## Validation Commands

- `npm run lint`
- `npm run test:all`
- `npm run build`
- `npm run export:assets`

## Asset Package

- choose one primary icon from `assets/marketplace/`
- choose one primary banner from `assets/marketplace/`
- keep alternate icon and banner variants in reserve for crop or contrast issues
- capture real screenshots from Ecwid admin in addition to generated graphics
- use `1024x538` as the first screenshot export target unless Ecwid gives you a newer exact size

## Reviewer Risk Checks

- make sure the listing never implies storefront visitor tracking
- make sure the listing never implies shared live-presence state
- make sure the listing clearly describes this as an owner dashboard
- confirm the static admin-only architecture is acceptable for the chosen Ecwid submission path

## Open Questions To Confirm Before Submission

- whether Ecwid requires exact upload sizes beyond the current baseline exports
- whether the selected submission path accepts this static native-style admin page without server-side encrypted payload handling
- whether listing terms URL is mandatory for your distribution route