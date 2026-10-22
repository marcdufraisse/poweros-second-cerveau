// Shared download + cache-into-library helpers for provider adapters.
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

// type → asset-library subfolder
export const FOLDER_FOR = {
  logo: "logos",
  icon: "icons",
  screenshot: "screenshots",
  image: "images",
  "stock-photo": "images",
  photo: "images",
  "stock-video": "clips",
  clip: "clips",
};
// type → registry type bucket
export const TYPE_FOR = {
  logo: "logo",
  icon: "icon",
  screenshot: "screenshot",
  image: "image",
  "stock-photo": "image",
  photo: "image",
  "stock-video": "clip",
  clip: "clip",
};

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "asset";
}

export function extFromUrl(url, fallback = ".jpg") {
  const clean = url.split("?")[0].split("#")[0];
  const e = extname(clean).toLowerCase();
  return /^\.(jpg|jpeg|png|webp|gif|svg|avif|mp4|mov|webm|m4v)$/.test(e) ? e : fallback;
}

export async function downloadBuffer(url, { timeout = 90000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "video-automation-asset-bot/1.0", ...headers } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(t);
  }
}

// Save a fetched asset into the library + write its sidecar. Returns { assetId, file }.
// `result` is a normalized provider result; `data` is either a Buffer or a {url} to download.
export async function saveAsset(result, { root = "asset-library", idHint } = {}) {
  const folder = FOLDER_FOR[result.type] || "images";
  const dir = join(root, folder);
  mkdirSync(dir, { recursive: true });

  const ext = result.ext || extFromUrl(result.downloadUrl || result.url || "", folder === "clips" ? ".mp4" : ".jpg");
  let base = slugify(idHint || result.title || result.query || result.source || "asset");
  // de-collide
  let name = `${base}${ext}`;
  let i = 2;
  while (existsSync(join(dir, name))) name = `${base}-${i++}${ext}`;
  const file = join(dir, name);

  const buf = result.buffer || (await downloadBuffer(result.downloadUrl || result.url, { headers: result.headers }));
  writeFileSync(file, buf);

  const sidecar = {
    tags: result.tags || (result.query ? result.query.split(/\s+/).filter(Boolean) : []),
    description: result.description || result.title || "",
    source: result.source,
    sourceUrl: result.sourceUrl || result.url || "",
    license: result.license || "unknown",
    attribution: result.attribution || "",
    fetchedAt: new Date().toISOString().slice(0, 10),
  };
  if (result.width) sidecar.width = result.width;
  if (result.height) sidecar.height = result.height;
  if (result.duration) sidecar.duration = result.duration;
  writeFileSync(file + ".json", JSON.stringify(sidecar, null, 2));

  return { assetId: `${folder}/${name.replace(ext, "")}`, file: `${folder}/${name}` };
}
