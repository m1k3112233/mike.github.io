import { execFile } from "node:child_process";
import { access, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);
const repoRoot = join(import.meta.dirname, "..");

test("NB deployment build is isolated, complete, and private", async () => {
  const outputName = `dist-nb-test-${process.pid}`;
  const outputDir = join(repoRoot, outputName, "nb-meal-planner");
  try {
    await run(process.execPath, [
      join(repoRoot, "scripts", "prepare-deploy.mjs"),
      "--source",
      "nb-meal-planner",
      "--output",
      outputName,
    ], { cwd: repoRoot });

    const manifest = JSON.parse(await readFile(join(outputDir, "manifest.webmanifest"), "utf8"));
    const worker = await readFile(join(outputDir, "sw.js"), "utf8");
    const headers = await readFile(join(outputDir, ".htaccess"), "utf8");

    if (manifest.name !== "NB Meal Planner" || manifest.short_name !== "NB Mealplan") {
      throw new Error("NB manifest branding is incorrect");
    }
    if (manifest.id !== "./" || manifest.start_url !== "./" || manifest.scope !== "./") {
      throw new Error("NB manifest URLs must remain relative to its deployment directory");
    }
    if (worker.includes("__BUILD_VERSION__") || worker.includes("__SRI_")) {
      throw new Error("NB build must replace all service-worker build and integrity markers");
    }
    for (const asset of [
      "./index.html", "./styles.css", "./app.js", "./model.js", "./data.js", "./pwa.js",
      "./manifest.webmanifest", "./icons/icon-192.svg", "./icons/icon-512.svg",
      "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png",
    ]) {
      if (!worker.includes(`"${asset}"`)) throw new Error(`NB precache is missing ${asset}`);
      await access(join(outputDir, asset.slice(2)));
    }
    if (!headers.includes("X-Robots-Tag") || !headers.includes("noindex")) {
      throw new Error("NB deployment must be hidden from indexing");
    }
    if (!headers.includes("Options -Indexes") || !headers.includes("Require all denied")) {
      throw new Error("NB deployment must protect directory metadata");
    }
    await access(join(repoRoot, outputName, "nb-meal-planner", ".gitattributes"));
  } finally {
    await rm(join(repoRoot, outputName), { recursive: true, force: true });
  }
});
