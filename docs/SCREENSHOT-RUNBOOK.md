# Screenshot Runbook

This runbook is for the final Ecwid marketplace screenshots and the reviewer screencast.

## Baseline Format

- use `1024x538` as the first export target because that matches the currently observed public listing gallery output
- keep source captures at a larger size if possible so you can re-crop later
- avoid browser chrome when the Ecwid admin iframe already provides enough context

## Capture Sequence

1. Open the app inside the Ecwid admin with live data available.
2. Confirm the store name and live metrics are visible.
3. Capture the overview state first before changing any preferences.
4. Navigate to or scroll to the geography and low-stock sections.
5. Enable preview mode only after live screenshots are complete.
6. Capture one clearly labeled preview screenshot.

## Required Screenshot Set

1. Dashboard overview
Text visible:
`Orders 24h`, `Revenue 7d`, active products, awaiting fulfillment.

2. Country breakdown
Text visible:
country names or country codes and recent order geography.

3. Low-stock focus
Text visible:
product names and stock status.

4. Preferences panel
Text visible:
lookback days, low-stock threshold, refresh controls, preview toggle.

5. Preview mode state
Text visible:
preview badge and sample operational data.

## Content Rules

- do not show placeholder URLs or unfinished company identity fields
- do not include fake storefront visitor messaging
- do not show preview mode unless the preview badge is visible
- avoid merchant-sensitive live order details if the capture store contains private data

## Reviewer Screencast Flow

1. Open the Ecwid admin app.
2. Show the live dashboard load.
3. Point out orders, revenue, country breakdown, and low-stock panels.
4. Open preferences and adjust a setting.
5. Enable preview mode and show the preview badge.
6. Refresh the page to show browser-local persistence.
7. Disable preview mode and return to live data.

## File Naming

- `screenshot-01-overview-1024x538.png`
- `screenshot-02-country-breakdown-1024x538.png`
- `screenshot-03-low-stock-1024x538.png`
- `screenshot-04-preferences-1024x538.png`
- `screenshot-05-preview-mode-1024x538.png`
- `reviewer-screencast.mp4`

## Final Review Before Upload

- all screenshots are sharp at listing size
- preview screenshot is clearly labeled as preview data
- no support or legal placeholders are visible anywhere
- capture order matches the marketplace story you want to tell