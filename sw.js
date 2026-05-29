/**
 * Service worker for Bugging You.
 *
 * Strategy: cache-first for the entire app shell.
 *
 * All static assets are pre-cached at install time so the app works fully
 * offline after the first visit.  On every fetch request the SW checks the
 * cache first; it only goes to the network when the resource isn't cached
 * (which only happens for resources not in ASSETS, e.g. an unexpected path).
 *
 * Bumping CACHE_NAME causes the `activate` handler to delete the old cache,
 * ensuring users pick up updated assets after a deployment.
 */

const CACHE_NAME = 'bugging-you-v1.0.2';

/** Static assets that make up the entire app shell. */
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/notes.js',
  '/notifications.js',
  '/manifest.json',
  '/icons/icon.svg',
];

// ---------------------------------------------------------------------------
// Install – pre-cache the app shell
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  // Skip the waiting phase so the new SW activates immediately after install,
  // rather than waiting for all existing tabs to close.
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate – clean up caches from previous versions
// ---------------------------------------------------------------------------

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Claim all open clients immediately so they're controlled by this SW
  // version without needing a reload.
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Fetch – serve from cache, fall back to network
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  // Only handle GET requests; leave POST/PUT/DELETE to the browser.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached ?? fetch(event.request)
    )
  );
});
