// Pexels — photos AND video, free key (PEXELS_API_KEY), commercial-use OK.
import { getKey } from "../lib/env.mjs";
export const meta = { name: "pexels", needsKey: "PEXELS_API_KEY", types: ["image", "stock-photo", "photo", "stock-video", "clip"] };

export async function search(query, { limit = 5, type = "image", orientation = "landscape" } = {}) {
  const key = getKey("PEXELS_API_KEY");
  if (!key) return [];
  const wantVideo = type === "stock-video" || type === "clip";
  const base = wantVideo ? "https://api.pexels.com/videos/search" : "https://api.pexels.com/v1/search";
  const params = new URLSearchParams({ query, per_page: String(Math.max(limit, 5)), orientation });
  let json;
  try {
    const res = await fetch(`${base}?${params}`, { headers: { Authorization: key } });
    if (!res.ok) return [];
    json = await res.json();
  } catch {
    return [];
  }
  if (wantVideo) {
    return (json.videos || []).slice(0, limit).map((v) => {
      // pick the highest-res <=1080p mp4
      const files = (v.video_files || []).filter((f) => f.file_type === "video/mp4");
      files.sort((a, b) => (b.height || 0) - (a.height || 0));
      const pick = files.find((f) => (f.height || 0) <= 1080) || files[0];
      return {
        source: "pexels", type: "stock-video", ext: ".mp4",
        url: v.url, downloadUrl: pick?.link, sourceUrl: v.url,
        license: "pexels", attribution: `Pexels · ${v.user?.name || ""}`.trim(),
        title: query, width: pick?.width, height: pick?.height, duration: v.duration,
        tags: query.split(/\s+/).filter(Boolean), query,
      };
    }).filter((r) => r.downloadUrl);
  }
  return (json.photos || []).slice(0, limit).map((p) => ({
    source: "pexels", type: "image", ext: ".jpg",
    url: p.url, downloadUrl: p.src?.large2x || p.src?.large || p.src?.original, sourceUrl: p.url,
    license: "pexels", attribution: `Pexels · ${p.photographer || ""}`.trim(),
    title: p.alt || query, width: p.width, height: p.height,
    tags: query.split(/\s+/).filter(Boolean), query,
  })).filter((r) => r.downloadUrl);
}
