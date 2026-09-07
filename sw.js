/* The preparation script replaces build-a0ace7525ec73d2d with a content fingerprint. */
const BUILD_VERSION = "build-a0ace7525ec73d2d";
const VERSION = BUILD_VERSION.startsWith("__") ? "dev" : BUILD_VERSION;
const APP_ROOT = new URL("./", self.location);
const ROOT_PATH = APP_ROOT.pathname.endsWith("/") ? APP_ROOT.pathname : `${APP_ROOT.pathname}/`;
const CACHE_PREFIX = `meal-planner-${encodeURIComponent(ROOT_PATH)}-`;
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;

// Keep this list complete. cache.addAll is intentionally atomic: a partial shell
// must never become the version that controls a user's page.
const SHELL_ASSETS = [
  "./index.html",
  "./styles.css",
  "./app.js",
  "./model.js",
  "./data.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];
const SHELL_INTEGRITY = {
  "./index.html": "sha256-OHTpQwLW4o7ZPoWJphgYVOP5iYv0+/8apw0AVvbwM8Y=",
  "./styles.css": "sha256-fRGGxKIJBq5bQN1bBCnohEBNQF5+0D11ZdtWwCqxTHw=",
  "./app.js": "sha256-qR7soBCSnBVDzJPwnVDeOEKnq9v9eJzaYreGKmZNa5M=",
  "./model.js": "sha256-m5FvNfSgeTPSMEE7/vv8HVR/NWZZZfpOuf7H3UTN4TI=",
  "./data.js": "sha256-6oV0D/7RKwnuvJQaVDa3Hg9FB8dTT67uPPcgdB1+Gp0=",
  "./pwa.js": "sha256-2mrw2g++mndYSN1JGMiBRSV+COFkjzu7tbG7LPeGs4Y=",
  "./manifest.webmanifest": "sha256-EskvHu27/XnC/JHrrfjf8TnIBZSz1YQD1OZ2K9hL4cQ=",
  "./icons/icon-192.svg": "sha256-AeEoEyKuxFuMTk3CWUNNLplOqInwljGdkih38lJI56o=",
  "./icons/icon-512.svg": "sha256-lypz8iK/6HoSfWLbOtGiIs5Z0n3h1RL1vWRnw+c+YH8=",
  "./icons/icon-192.png": "sha256-VTEnhtXnG1LFgkqOggrHN13UDWqv6oZF/ioJQLTxYsM=",
  "./icons/icon-512.png": "sha256-il70sITSNgZAk31JvOI8YzNm2rfAkDj6FbbVFCZQAX4=",
  "./icons/apple-touch-icon.png": "sha256-gNT0Z0At+BLbC3kgyp39dJZUzuqiT4krS0bFrGM5uqE=",
};

function isInAppScope(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname === ROOT_PATH.slice(0, -1) || url.pathname.startsWith(ROOT_PATH))
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(
        SHELL_ASSETS.map(
          (asset) =>
            new Request(new URL(asset, APP_ROOT), {
              cache: "reload",
              integrity: SHELL_INTEGRITY[asset],
            }),
        ),
      ),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function cachedNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  // The active worker serves its own cached HTML so it cannot combine a new
  // index with the previous worker's asset cache while an update is waiting.
  const cached =
    (await cache.match(request)) ||
    (await cache.match(new URL("index.html", APP_ROOT).href)) ||
    (await cache.match(APP_ROOT.href));
  if (cached) return cached;

  // A first visit before install completes still needs to work online.
  return fetch(new Request(request, { cache: "no-store" }));
}

async function cachedAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (!isInAppScope(url)) return;

  event.respondWith(
    event.request.mode === "navigate"
      ? cachedNavigation(event.request)
      : cachedAsset(event.request),
  );
});
