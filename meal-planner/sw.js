/* The preparation script replaces __BUILD_VERSION__ with a content fingerprint. */
const BUILD_VERSION = "__BUILD_VERSION__";
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
  "./index.html": "__SRI_INDEX_HTML__",
  "./styles.css": "__SRI_STYLES_CSS__",
  "./app.js": "__SRI_APP_JS__",
  "./model.js": "__SRI_MODEL_JS__",
  "./data.js": "__SRI_DATA_JS__",
  "./pwa.js": "__SRI_PWA_JS__",
  "./manifest.webmanifest": "__SRI_MANIFEST_WEBMANIFEST__",
  "./icons/icon-192.svg": "__SRI_ICON_192_SVG__",
  "./icons/icon-512.svg": "__SRI_ICON_512_SVG__",
  "./icons/icon-192.png": "__SRI_ICON_192_PNG__",
  "./icons/icon-512.png": "__SRI_ICON_512_PNG__",
  "./icons/apple-touch-icon.png": "__SRI_APPLE_TOUCH_ICON_PNG__",
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
