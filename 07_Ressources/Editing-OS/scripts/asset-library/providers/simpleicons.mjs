// Simple Icons — keyless brand/tech logos as SVG (cdn.simpleicons.org/<slug>).
// Great for tool/brand logos (ChatGPT, Notion, Slack, …). Monochrome SVG.
export const meta = { name: "simpleicons", needsKey: null, types: ["logo", "icon"] };

// common spoken-name → simple-icons slug
const ALIAS = {
  chatgpt: "openai", gpt: "openai", "vs code": "visualstudiocode", vscode: "visualstudiocode",
  "google sheets": "googlesheets", sheets: "googlesheets", excel: "microsoftexcel",
  powerpoint: "microsoftpowerpoint", outlook: "microsoftoutlook", teams: "microsoftteams",
  x: "x", twitter: "x", gmail: "gmail", "google drive": "googledrive",
};

function toSlug(query) {
  const q = query.toLowerCase().replace(/\blogo\b/g, "").trim();
  if (ALIAS[q]) return ALIAS[q];
  return q.replace(/[^a-z0-9]+/g, "");
}

export async function search(query, { limit = 1 } = {}) {
  const slug = toSlug(query);
  if (!slug) return [];
  const url = `https://cdn.simpleicons.org/${slug}`;
  // verify it exists (404 → brand not in set)
  try {
    const res = await fetch(url, { headers: { "user-agent": "video-automation-asset-bot/1.0" } });
    if (!res.ok) return [];
    const buffer = Buffer.from(await res.arrayBuffer());
    return [
      {
        source: "simple-icons",
        type: "logo",
        ext: ".svg",
        buffer,
        url,
        sourceUrl: `https://simpleicons.org/?q=${encodeURIComponent(slug)}`,
        license: "CC0", // Simple Icons icons are CC0; brand marks remain the owners' trademarks
        attribution: "Simple Icons",
        title: `${query} logo`,
        tags: [query.toLowerCase().replace(/\blogo\b/, "").trim(), "logo"].filter(Boolean),
        query,
      },
    ].slice(0, limit);
  } catch {
    return [];
  }
}
