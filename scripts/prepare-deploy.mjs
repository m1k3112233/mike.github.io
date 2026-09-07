import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(repoRoot, "meal-planner");
const args = process.argv.slice(2);
const outputIndex = args.indexOf("--output");
const outputBase = outputIndex >= 0 && args[outputIndex + 1] ? args[outputIndex + 1] : "dist";
const flat = args.includes("--flat");
if (isAbsolute(outputBase) || !/^dist(?:-[a-z0-9][a-z0-9._-]*)?$/i.test(outputBase)) {
  throw new Error("--output must be a repository-local dist or dist-* directory");
}
const outputDir = resolve(repoRoot, outputBase);
const destinationDir = flat ? outputDir : join(outputDir, "meal-planner");
const sourceResolved = resolve(sourceDir);
const destinationResolved = resolve(destinationDir);
if (
  destinationResolved === sourceResolved ||
  destinationResolved.startsWith(`${sourceResolved}\\`) ||
  destinationResolved.startsWith(`${sourceResolved}/`)
) {
  throw new Error("--output cannot overlap the source app directory");
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files.sort();
}

const sourceFiles = await filesUnder(sourceDir);
const normalizeBytes = (file, bytes) => /\.(html|js|css|webmanifest|svg)$/.test(file) || file.endsWith('.htaccess')
  ? Buffer.from(bytes.toString('utf8').replaceAll('\r\n', '\n')) : bytes;
const digest = createHash("sha256");
for (const file of sourceFiles) {
  digest.update(relative(sourceDir, file).replaceAll("\\", "/"));
  digest.update(normalizeBytes(file, await readFile(file)));
}
const buildVersion = `build-${digest.digest("hex").slice(0, 16)}`;

await rm(destinationDir, { recursive: true, force: true });
await mkdir(dirname(destinationDir), { recursive: true });
await cp(sourceDir, destinationDir, { recursive: true });
// Keep integrity hashes identical before and after Git stages the release on
// Windows or Linux. Binary assets are copied unchanged.
for (const sourceFile of sourceFiles) {
  const outputFile = join(destinationDir, relative(sourceDir, sourceFile));
  await writeFile(outputFile, normalizeBytes(sourceFile, await readFile(sourceFile)));
}
await writeFile(join(destinationDir, '.gitattributes'), '* text=auto eol=lf\n');

const workerPath = join(destinationDir, "sw.js");
let worker = await readFile(workerPath, "utf8");
if (!worker.includes("__BUILD_VERSION__")) {
  throw new Error("meal-planner/sw.js is missing the __BUILD_VERSION__ replacement token");
}
worker = worker.replaceAll("__BUILD_VERSION__", buildVersion);

const shellAssets = [
  ["./index.html", "__SRI_INDEX_HTML__"],
  ["./styles.css", "__SRI_STYLES_CSS__"],
  ["./app.js", "__SRI_APP_JS__"],
  ["./model.js", "__SRI_MODEL_JS__"],
  ["./data.js", "__SRI_DATA_JS__"],
  ["./pwa.js", "__SRI_PWA_JS__"],
  ["./manifest.webmanifest", "__SRI_MANIFEST_WEBMANIFEST__"],
  ["./icons/icon-192.svg", "__SRI_ICON_192_SVG__"],
  ["./icons/icon-512.svg", "__SRI_ICON_512_SVG__"],
  ["./icons/icon-192.png", "__SRI_ICON_192_PNG__"],
  ["./icons/icon-512.png", "__SRI_ICON_512_PNG__"],
  ["./icons/apple-touch-icon.png", "__SRI_APPLE_TOUCH_ICON_PNG__"],
];
for (const [asset, marker] of shellAssets) {
  const content = await readFile(join(destinationDir, asset.slice(2)));
  const integrity = `sha256-${createHash("sha256").update(content).digest("base64")}`;
  worker = worker.replaceAll(marker, integrity);
}
if (worker.includes("__SRI_")) {
  throw new Error("meal-planner/sw.js contains an unknown SRI marker");
}
await writeFile(workerPath, worker);

console.log(`Prepared ${destinationDir}`);
console.log(`Service worker cache version: ${buildVersion}`);
