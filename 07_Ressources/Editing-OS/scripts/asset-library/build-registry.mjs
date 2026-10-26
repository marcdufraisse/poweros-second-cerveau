#!/usr/bin/env node
// Asset Library — rebuild registry.json by scanning asset folders + sidecars.
//
// Scans asset-library/{clips,images,logos,screenshots,icons}/ for media files,
// reads each file's optional <file>.json sidecar (tags/description/source/license/
// attribution/sourceUrl), probes width/height (+ duration for clips) via ffprobe,
// and writes asset-library/registry.json — the index Agent 4 queries.
//
// Usage:
//   node scripts/asset-library/build-registry.mjs [--root asset-library]

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, extname, basename, relative } from "node:path";
import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const root = opt("--root", "asset-library");

const FOLDERS = {
  clips: "clip",
  images: "image",
  logos: "logo",
  screenshots: "screenshot",
  icons: "icon",
};
const MEDIA_EXT = new Set([".mp4", ".mov", ".webm", ".m4v", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm", ".m4v"]);

function probe(file) {
  // returns { width, height, duration? } or {} if ffprobe unavailable / svg
  if (extname(file).toLowerCase() === ".svg") return {};
  try {
    const isVideo = VIDEO_EXT.has(extname(file).toLowerCase());
    const entries = isVideo ? "stream=width,height:format=duration" : "stream=width,height";
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-select_streams", "v:0", "-show_entries", entries, "-of", "json", file],
      { encoding: "utf8" }
    );
    const j = JSON.parse(out);
    const s = (j.streams && j.streams[0]) || {};
    const r = {};
    if (s.width) r.width = s.width;
    if (s.height) r.height = s.height;
    if (isVideo && j.format && j.format.duration) r.duration = Math.round(parseFloat(j.format.duration) * 100) / 100;
    return r;
  } catch {
    return {};
  }
}

const assets = [];
const unknownLicense = [];

for (const [folder, type] of Object.entries(FOLDERS)) {
  const dir = join(root, folder);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".")) continue;
    const ext = extname(name).toLowerCase();
    if (!MEDIA_EXT.has(ext)) continue; // skip sidecars + junk
    const file = join(dir, name);
    if (!statSync(file).isFile()) continue;

    // sidecar: <file>.json (e.g. robot.mp4.json) or <stem>.json
    const sidecarPaths = [file + ".json", join(dir, basename(name, ext) + ".json")];
    let meta = {};
    for (const sc of sidecarPaths) {
      if (existsSync(sc)) {
        try {
          meta = JSON.parse(readFileSync(sc, "utf8"));
        } catch {
          console.warn(`  ! bad sidecar JSON: ${sc}`);
        }
        break;
      }
    }

    // infer tags from filename when none given (kebab/space/underscore → words)
    const inferredTags = basename(name, ext)
      .split(/[-_\s.]+/)
      .map((w) => w.toLowerCase())
      .filter((w) => w && !/^\d+$/.test(w));

    const dims = probe(file);
    const license = meta.license || "unknown";
    if (license === "unknown") unknownLicense.push(relative(root, file));

    assets.push({
      id: `${folder}/${basename(name, ext)}`,
      type,
      file: `${folder}/${name}`,
      tags: meta.tags && meta.tags.length ? meta.tags : inferredTags,
      description: meta.description || "",
      source: meta.source || "local",
      license,
      attribution: meta.attribution || "",
      sourceUrl: meta.sourceUrl || "",
      ...dims,
      ...(meta.fetchedAt ? { fetchedAt: meta.fetchedAt } : {}),
    });
  }
}

const registry = {
  generated_by: "scripts/asset-library/build-registry.mjs",
  assetCount: assets.length,
  types: [...new Set(Object.values(FOLDERS))],
  byType: Object.fromEntries(
    [...new Set(Object.values(FOLDERS))].map((t) => [t, assets.filter((a) => a.type === t).length])
  ),
  assets,
};

writeFileSync(join(root, "registry.json"), JSON.stringify(registry, null, 2));

console.log(`asset registry: ${assets.length} assets`);
for (const [t, n] of Object.entries(registry.byType)) if (n) console.log(`  ${t.padEnd(11)} ${n}`);
if (unknownLicense.length) {
  console.log(`\n⚠ ${unknownLicense.length} asset(s) with license "unknown" (add a sidecar before using in final frames):`);
  for (const f of unknownLicense.slice(0, 20)) console.log(`    ${f}`);
  if (unknownLicense.length > 20) console.log(`    …and ${unknownLicense.length - 20} more`);
}
console.log(`\nwrote ${join(root, "registry.json")}`);
