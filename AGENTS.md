# Live Visitor Geo Pulse for Ecwid — AI Agent Instructions

> Conventions and patterns for AI coding agents working on this project.
> This file is read automatically by GitHub Copilot, Cursor, Cline, and similar AI assistants.

---

## Project Overview

| Key | Value                                                        |
|-----|--------------------------------------------------------------|
| Plugin Name | live-visitor-geo-pulse-ecwid                                 |
| Platform | Ecwid by Lightspeed (SaaS e-commerce widget)                 |
| Architecture | Static admin iframe page                                     |
| Store API | Ecwid REST API v3                                            |
| Auth | Ecwid app payload inside the admin iframe                      |
| Runtime | Static HTTPS hosting                                           |

---

## Documentation

Refer to the complete documentation in the `docs/` folder:

- [API.md](docs/API.md) — Ecwid REST endpoints used by the dashboard
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Static admin-only architecture and constraints
- [DEVELOPMENT.md](docs/DEVELOPMENT.md) — Local preview, development workflow, and testing
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Static hosting and Ecwid app configuration

---

## Critical Rules

### 1. This Repo Is Admin-Only

- Do not add storefront widgets or visitor-facing UI.
- Do not add a Node.js server, Redis, WebSockets, or a database.
- Keep the feature valuable to the Ecwid business owner inside the dashboard.
- Browser-local preferences are acceptable; shared backend persistence is not the default for this repo.

### 2. Design System & Native Look (Priority #1)

- **Number One Priority:** Building a seamless, Ecwid/Lightspeed native look and feel for this plugin app module.
- Always refer to the [Lightspeed Brand System](https://brand.lightspeedhq.com/document/170#/brand-system/logo-1).
- **Colors:** Use Charcoal gray on light backgrounds, pure white on dark backgrounds, and apply Fire Red judiciously ensuring WCAG AA contrast compliance.
- **Styling:** Adhere to clean, simple geometry (incorporating Lightspeed's brand elements like the Dash, Period, and Fireball conceptually where appropriate).
- The dashboard must feel entirely native to the Ecwid environment.

### 3. Prefer Static Delivery

- The app should be publishable as static files under `public/`.
- Any new capability should first be evaluated for whether it can work without a custom backend.
- If a future feature truly requires a hosted endpoint, document the cost and tradeoff clearly before adding it.

### 3. Security Rules

- Do not hardcode tokens in the repo.
- Use the Ecwid iframe payload for authenticated admin requests.
- Keep storage limited to browser-local preferences unless the project direction changes explicitly.
- Do not reintroduce webhook or OAuth assumptions into this static version.

---

## File Map

| File | Purpose |
|------|---------|
| `public/index.html` | Admin dashboard HTML shell |
| `public/app.css` | Dashboard styling |
| `public/app.js` | Dashboard runtime and Ecwid API calls |
| `public/dashboard-metrics.js` | Pure metric aggregation helpers |
| `tests/dashboard-metrics.test.js` | Regression tests for aggregation logic |

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `dashboard-metrics.js` |
| Variables | camelCase | `storeId` |
| CSS classes (custom) | prefixed | `.pulse-card` |
| localStorage keys | namespaced | `lvgp-ecwid-dashboard:12345` |

---

## Common Mistakes to Avoid

```javascript
// ❌ No external persistence by default
new Redis();
mongoose.connect(process.env.MONGO_URL);

// ❌ No always-on backend assumptions
app.listen(3000);
router.post('/webhooks/ecwid', handler);

// ❌ No storefront widget work for this repo direction
Ecwid.OnPageLoaded.add(function () { });

// ✅ Correct: static admin iframe page
const app = EcwidApp.init({ appId: 'your-app-id' });

// ✅ Correct: direct Ecwid API call from admin context
fetch(`https://app.ecwid.com/api/v3/${storeId}/orders`, { headers });
```

---

## Testing Requirements

**Every feature or bug fix MUST include unit tests.** No pull request will be accepted without accompanying tests that cover the new or changed behavior.

- Write unit tests for all new features before marking them complete
- Write unit tests for every bug fix that reproduce the bug and verify the fix
- Aim for meaningful coverage — test business logic, edge cases, and error paths
- Use the project's established testing framework and conventions
- Tests must pass in CI before a PR can be merged

---

## PR/Review Checklist

- [ ] No database, Redis, or Node service introduced
- [ ] Dashboard remains admin-only
- [ ] Browser-local preferences stay namespaced by store ID
- [ ] REST API calls remain limited to required owner metrics
- [ ] Admin dashboard tested inside the Ecwid admin iframe when possible
- [ ] Unit tests included for all new features and bug fixes

## Quality Gates

- After any new feature, bug fix, or refactor, always lint, run build, and run test
- Do not consider the task complete until these checks pass, unless the user explicitly asks not to run them or the environment prevents it
- Every new feature must include automated tests that cover the new behavior, including both happy paths and unhappy paths where practical
- Bug fixes should include a regression test when practical
- Refactors must keep existing tests passing and should add tests if behavior changes or previously untested behavior becomes important