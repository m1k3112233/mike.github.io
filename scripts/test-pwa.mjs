import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(new URL("..", import.meta.url)));
const appDir = join(repoRoot, "meal-planner");
const required = [
  "index.html",
  "styles.css",
  "app.js",
  "model.js",
  "data.js",
  "pwa.js",
  "sw.js",
  "manifest.webmanifest",
  "icons/icon-192.svg",
  "icons/icon-512.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

for (const file of required) await access(join(appDir, file));

const worker = await readFile(join(appDir, "sw.js"), "utf8");
const pwa = await readFile(join(appDir, "pwa.js"), "utf8");
const headers = await readFile(join(appDir, ".htaccess"), "utf8");
const manifest = await readFile(join(appDir, "manifest.webmanifest"), "utf8");
const packageJson = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(worker.includes('"__BUILD_VERSION__"'), "worker must retain its build replacement token");
assert(worker.includes("cache.addAll"), "worker must atomically cache its shell");
assert(worker.includes("__SRI_INDEX_HTML__"), "worker must carry shell integrity markers");
assert(worker.includes("SKIP_WAITING"), "worker must support explicit updates");
assert(!worker.includes("caches.delete(CACHE_NAME)"), "worker must not delete its active cache");
assert(pwa.includes("export function setupPWA"), "PWA helper must export setupPWA");
assert(pwa.includes("updateViaCache: \"none\""), "worker registration must bypass stale HTTP worker cache");
assert(pwa.includes("controllerchange"), "PWA helper must reload once after a controller change");
assert(!pwa.includes("localStorage.clear"), "PWA updates must preserve local storage");
assert(headers.includes("Cache-Control") && headers.includes("no-store"), "HTML and worker must be no-cache");
assert(headers.includes("X-Robots-Tag") && headers.includes("noindex"), "app must be hidden from indexing");
assert(headers.includes("Options -Indexes"), "directory indexes must be disabled");
assert(headers.includes("Require all denied"), "hidden deployment metadata must be denied");
assert(manifest.includes('"scope": "./"'), "manifest scope must remain app-relative");
assert(packageJson.scripts["prepare-deploy"], "prepare-deploy script must be available");

console.log("PWA and deployment checks passed.");
