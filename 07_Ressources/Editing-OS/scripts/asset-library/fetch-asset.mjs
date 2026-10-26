#!/usr/bin/env node
// Agent 4 · sourcing — fetch one asset for a moment and cache it into asset-library/.
//
// Routes a query to the right free providers by type, picks the first good match,
// downloads it into the library (writing a sidecar), and rebuilds registry.json.
//
// Usage:
//   node scripts/asset-library/fetch-asset.mjs "<query>" --type <type> [opts]
//     --type     logo | icon | screenshot | stock-photo | image | stock-video   (default: image)
//     --provider <name>   force one provider (else tries the type's preference order)
//     --limit N           candidates to consider (default 5)
//     --list              search only — print candidates, download nothing
//     --orientation landscape|portrait|square   (stock photos/video)
//     --width N --height N                       (screenshots)
//     --root asset-library                       (library location)
//   Examples:
//     fetch-asset.mjs "Notion" --type logo
//     fetch-asset.mjs "https://chatgpt.com" --type screenshot
//     fetch-asset.mjs "robot factory arm" --type stock-video
//
// Providers requiring a key (Pexels/Pixabay/Unsplash) silently skip when the key
// is absent, so keyless sources still work. Set keys in the workspace .env.

import { execFileSync } from "node:child_process";
import { saveAsset } from "./lib/cache.mjs";
import { loadEnv } from "./lib/env.mjs";

loadEnv();

const argv = process.argv.slice(2);
if (!argv.length || argv[0].startsWith("--")) {
  console.error('usage: fetch-asset.mjs "<query>" --type <logo|icon|screenshot|stock-photo|image|stock-video> [opts]');
  process.exit(1);
}
const query = argv[0];
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const has = (n) => argv.includes(n);
const type = opt("--type", "image");
const limit = parseInt(opt("--limit", "5"), 10);
const root = opt("--root", "asset-library");

// preference order per type (keyed providers first; they no-op without a key)
const ROUTES = {
  logo: ["clearbit", "simpleicons"],
  icon: ["simpleicons"],
  screenshot: ["screenshot"],
  "stock-video": ["pexels", "pixabay"],
  clip: ["pexels", "pixabay"],
  "stock-photo": ["pexels", "pixabay", "unsplash", "openverse", "wikimedia"],
  photo: ["pexels", "pixabay", "unsplash", "openverse", "wikimedia"],
  image: ["pexels", "pixabay", "unsplash", "openverse", "wikimedia"],
};

const forced = opt("--provider", null);
const chain = forced ? [forced] : ROUTES[type] || ROUTES.image;

const searchOpts = {
  limit,
  type,
  orientation: opt("--orientation", "landscape"),
  width: parseInt(opt("--width", "1920"), 10),
  height: parseInt(opt("--height", "1080"), 10),
};

async function load(name) {
  try {
    return await import(`./providers/${name}.mjs`);
  } catch (e) {
    console.warn(`  ! provider "${name}" failed to load: ${e.message}`);
    return null;
  }
}

const tried = [];
let chosen = null;
let chosenProvider = null;

for (const name of chain) {
  const mod = await load(name);
  if (!mod) continue;
  const needsKey = mod.meta?.needsKey;
  if (needsKey && !process.env[needsKey]) {
    tried.push(`${name} (no ${needsKey})`);
    continue;
  }
  let results = [];
  try {
    results = await mod.search(query, searchOpts);
  } catch (e) {
    tried.push(`${name} (error: ${e.message})`);
    continue;
  }
  tried.push(`${name} (${results.length})`);
  if (!results.length) continue;
  if (has("--list")) {
    console.log(`\n${name}: ${results.length} candidate(s) for "${query}"`);
    for (const r of results) console.log(`  · ${r.title || r.url}  [${r.license}]  ${r.url || ""}`);
    continue; // keep listing other providers
  }
  // try to download a candidate; fall through to the next result/provider on failure
  for (const r of results) {
    try {
      const saved = await saveAsset({ ...r, query }, { root, idHint: r.title || query });
      chosen = r;
      chosenProvider = name;
      chosen.__saved = saved;
      break;
    } catch (e) {
      tried.push(`${name}:download-failed (${e.name || e.message})`);
    }
  }
  if (chosen) break;
}

if (has("--list")) {
  console.log(`\nproviders tried: ${tried.join(", ")}`);
  process.exit(0);
}

if (!chosen) {
  console.error(`no asset found for "${query}" (type ${type}). tried: ${tried.join(", ")}`);
  process.exit(2);
}

const { assetId, file } = chosen.__saved;

// rebuild registry
try {
  execFileSync("node", ["scripts/asset-library/build-registry.mjs", "--root", root], { stdio: "ignore" });
} catch {
  /* non-fatal */
}

console.log(`✓ ${chosenProvider} → ${file}`);
console.log(`  assetId:     ${assetId}`);
console.log(`  license:     ${chosen.license}`);
console.log(`  attribution: ${chosen.attribution || "—"}`);
if (chosen.license === "unknown" || chosen.license === "editorial") {
  console.log(`  ⚠ ${chosen.license} license — comp/reference use; clear before a final published frame`);
}
