// Openverse — keyless aggregator of CC-licensed + public-domain images.
// Cleanest free licensing for published frames (filterable to commercial use).
export const meta = { name: "openverse", needsKey: null, types: ["image", "stock-photo", "photo"] };

export async function search(query, { limit = 5, commercial = true } = {}) {
  const params = new URLSearchParams({
    q: query,
    page_size: String(Math.max(limit, 5)),
    mature: "false",
  });
  if (commercial) params.set("license_type", "commercial"); // safe for commercial use
  const url = `https://api.openverse.org/v1/images/?${params}`;
  let json;
  try {
    const res = await fetch(url, { headers: { "user-agent": "video-automation-asset-bot/1.0" } });
    if (!res.ok) return [];
    json = await res.json();
  } catch {
    return [];
  }
  return (json.results || [])
    .filter((r) => r.url)
    .slice(0, limit)
    .map((r) => ({
      source: "openverse",
      type: "image",
      url: r.url,
      downloadUrl: r.url,
      sourceUrl: r.foreign_landing_url || r.url,
      license: (r.license || "cc").toLowerCase() + (r.license_version ? `-${r.license_version}` : ""),
      attribution: [r.creator, r.source].filter(Boolean).join(" · ") || "Openverse",
      title: r.title || query,
      width: r.width,
      height: r.height,
      tags: query.split(/\s+/).filter(Boolean),
      query,
    }));
}
