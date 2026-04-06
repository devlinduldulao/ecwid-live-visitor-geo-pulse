# API Reference

This project does not expose an internal backend API.

The dashboard calls Ecwid REST API directly from the admin iframe.

## Base API

```text
https://app.ecwid.com/api/v3/{storeId}
```

Requests use the Ecwid access token returned in the iframe payload.

## Endpoints Used

### `GET /profile`

Used for:

- store name
- currency code

### `GET /orders?limit={n}&offset={n}`

Used for:

- recent orders feed
- orders in the last 24 hours
- revenue in the last 7 days
- awaiting fulfillment count
- top countries by recent order geography

### `GET /products?limit={n}&offset={n}`

Used for:

- active product count
- low stock product list

## Auth Model

The dashboard expects the Ecwid admin iframe payload to include:

- `store_id`
- `access_token`
- `lang`

In local preview mode, `storeId` and `token` can be supplied as query parameters.

## Pagination Strategy

Collections are fetched in pages with a defensive cap.

Current defaults:

- page size: `100`
- maximum pages per collection: `5`

If the cap is reached, the UI labels the data as sampled so the merchant understands the dashboard is using a partial snapshot.

## No Internal Endpoints

This project intentionally does not include:

- settings CRUD endpoints
- webhook receivers
- OAuth callback routes
- proxy routes for catalog or orders

That is deliberate so the Ecwid version stays static and free to operate.
