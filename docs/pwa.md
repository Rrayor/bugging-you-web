# PWA Implementation

## Required baseline

| Requirement           | Implementation                          |
|-----------------------|-----------------------------------------|
| Web app manifest      | `/manifest.json`                        |
| Service worker        | `/sw.js`, registered in `app.js`        |
| Offline capability    | Cache-first strategy in the SW          |
| Installable           | Manifest + SW + served over HTTPS       |

---

## Service worker strategy

**Cache-first for all static assets.**

On `install`, the SW pre-caches the full app shell (HTML, CSS, JS, manifest, icon). On `fetch`, it checks the cache first and falls back to the network only on a cache miss. This gives instant loads and true offline functionality after the first visit.

A versioned cache name (`CACHE_NAME`) is defined at the top of `sw.js`. Bumping this string at deploy time triggers the `activate` handler to delete the old cache, ensuring users always get the latest assets after an update.

### Why not a network-first or stale-while-revalidate strategy?

The app has no dynamic server data. Every resource is a static file. Cache-first is the simplest strategy that meets the offline requirement and delivers the best perceived performance on mobile networks.

---

## Manifest icons

The manifest references a single SVG icon with `"sizes": "any"`. SVG is supported as a manifest icon in Chrome, Edge, and Firefox. Safari requires a separate `apple-touch-icon` link element in the HTML `<head>`, which is provided.

If raster icons are needed for broader compatibility in the future, they can be added alongside the SVG entry without removing it.

---

## Vercel deployment

`vercel.json` sets `Cache-Control: no-cache` on `sw.js`. This is critical: if the service worker file itself were aggressively cached by the CDN, users would never receive updates. All other static assets can be cached normally because the SW controls their lifetime via the versioned cache.

No rewrites are needed because the app is a true single-page application with no client-side routing (there is only one URL: `/`).
