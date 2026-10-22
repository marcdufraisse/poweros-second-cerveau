// Unsplash — high-quality stock photos, free key (UNSPLASH_ACCESS_KEY), commercial-use OK.
import { getKey } from "../lib/env.mjs";
export const meta = { name: "unsplash", needsKey: "UNSPLASH_ACCESS_KEY", types: ["image", "stock-photo", "photo"] };

export async function search(query, { limit = 5, orientation = "landscape" } = {}) {
  const key = getKey("UNSPLASH_ACCESS_KEY");
  if (!key) return [];
  const params = new URLSearchParams({ query, per_page: String(Math.max(limit, 5)), orientation });
  let json;
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
    });
    if (!res.ok) return [];
    json = await res.json();
  } catch {
    return [];
  }
  return (json.results || []).slice(0, limit).map((p) => ({
    source: "unsplash", type: "image", ext: ".jpg",
    url: p.links?.html, downloadUrl: (p.urls?.raw ? `${p.urls.raw}&w=1920&fit=max` : p.urls?.full || p.urls?.regular),
    sourceUrl: p.links?.html,
    license: "unsplash", attribution: `Unsplash · ${p.user?.name || ""}`.trim(),
    title: p.description || p.alt_description || query, width: p.width, height: p.height,
    tags: query.split(/\s+/).filter(Boolean), query,
  })).filter((r) => r.downloadUrl);
}
