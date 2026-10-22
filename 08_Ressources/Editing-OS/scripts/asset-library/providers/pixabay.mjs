// Pixabay — photos, illustrations, AND video, free key (PIXABAY_API_KEY), commercial-use OK.
import { getKey } from "../lib/env.mjs";
export const meta = { name: "pixabay", needsKey: "PIXABAY_API_KEY", types: ["image", "stock-photo", "photo", "stock-video", "clip"] };

export async function search(query, { limit = 5, type = "image" } = {}) {
  const key = getKey("PIXABAY_API_KEY");
  if (!key) return [];
  const wantVideo = type === "stock-video" || type === "clip";
  const base = wantVideo ? "https://pixabay.com/api/videos/" : "https://pixabay.com/api/";
  const params = new URLSearchParams({ key, q: query, per_page: String(Math.max(limit, 5)), safesearch: "true" });
  let json;
  try {
    const res = await fetch(`${base}?${params}`);
    if (!res.ok) return [];
    json = await res.json();
  } catch {
    return [];
  }
  if (wantVideo) {
    return (json.hits || []).slice(0, limit).map((h) => {
      const v = h.videos?.large?.url ? h.videos.large : h.videos?.medium;
      return {
        source: "pixabay", type: "stock-video", ext: ".mp4",
        url: h.pageURL, downloadUrl: v?.url, sourceUrl: h.pageURL,
        license: "pixabay", attribution: `Pixabay · ${h.user || ""}`.trim(),
        title: query, width: v?.width, height: v?.height, duration: h.duration,
        tags: (h.tags || query).split(",").map((s) => s.trim()).filter(Boolean), query,
      };
    }).filter((r) => r.downloadUrl);
  }
  return (json.hits || []).slice(0, limit).map((h) => ({
    source: "pixabay", type: "image", ext: ".jpg",
    url: h.pageURL, downloadUrl: h.largeImageURL || h.webformatURL, sourceUrl: h.pageURL,
    license: "pixabay", attribution: `Pixabay · ${h.user || ""}`.trim(),
    title: query, width: h.imageWidth, height: h.imageHeight,
    tags: (h.tags || query).split(",").map((s) => s.trim()).filter(Boolean), query,
  })).filter((r) => r.downloadUrl);
}
