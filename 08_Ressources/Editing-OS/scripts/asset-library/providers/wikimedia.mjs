// Wikimedia Commons — keyless public-domain / CC image search.
// Great for diagrams, maps, historical, science, public-domain imagery.
export const meta = { name: "wikimedia", needsKey: null, types: ["image", "stock-photo", "photo"] };

export async function search(query, { limit = 5 } = {}) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6", // File:
    gsrlimit: String(Math.max(limit, 5)),
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "1600",
    format: "json",
    origin: "*",
  });
  const url = `https://commons.wikimedia.org/w/api.php?${params}`;
  let json;
  try {
    const res = await fetch(url, { headers: { "user-agent": "video-automation-asset-bot/1.0 (contact: local)" } });
    if (!res.ok) return [];
    json = await res.json();
  } catch {
    return [];
  }
  const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
  return pages
    .filter((p) => p.imageinfo && p.imageinfo[0])
    .slice(0, limit)
    .map((p) => {
      const ii = p.imageinfo[0];
      const meta = ii.extmetadata || {};
      const lic = (meta.LicenseShortName?.value || meta.License?.value || "unknown").toLowerCase();
      return {
        source: "wikimedia",
        type: "image",
        url: ii.thumburl || ii.url,
        downloadUrl: ii.thumburl || ii.url,
        sourceUrl: ii.descriptionurl || ii.url,
        license: /public domain|pd|cc0/.test(lic) ? "public-domain" : lic.replace(/\s+/g, "-"),
        attribution: (meta.Artist?.value || "Wikimedia Commons").replace(/<[^>]+>/g, "").trim(),
        title: (p.title || query).replace(/^File:/, ""),
        width: ii.thumbwidth || ii.width,
        height: ii.thumbheight || ii.height,
        tags: query.split(/\s+/).filter(Boolean),
        query,
      };
    });
}
