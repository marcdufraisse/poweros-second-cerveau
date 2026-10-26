// Clearbit Logo — keyless full-color company logos by domain (logo.clearbit.com/<domain>).
// Better visual than monochrome icons for b-roll; nominative/editorial use.
export const meta = { name: "clearbit", needsKey: null, types: ["logo"] };

// spoken-name → domain
const DOMAIN = {
  chatgpt: "openai.com", openai: "openai.com", claude: "claude.ai", anthropic: "anthropic.com",
  gemini: "gemini.google.com", notion: "notion.so", slack: "slack.com", zapier: "zapier.com",
  airtable: "airtable.com", hubspot: "hubspot.com", salesforce: "salesforce.com", figma: "figma.com",
  canva: "canva.com", zoom: "zoom.us", microsoft: "microsoft.com", google: "google.com",
  youtube: "youtube.com", linkedin: "linkedin.com", shopify: "shopify.com", stripe: "stripe.com",
  github: "github.com", perplexity: "perplexity.ai", midjourney: "midjourney.com", elevenlabs: "elevenlabs.io",
  nvidia: "nvidia.com", apple: "apple.com", amazon: "amazon.com", tesla: "tesla.com", spotify: "spotify.com",
};

function toDomain(query) {
  const q = query.toLowerCase().replace(/\blogo\b/g, "").trim();
  if (/\./.test(q)) return q.replace(/\s+/g, ""); // already a domain
  if (DOMAIN[q]) return DOMAIN[q];
  return `${q.replace(/[^a-z0-9]+/g, "")}.com`;
}

export async function search(query, { limit = 1 } = {}) {
  const domain = toDomain(query);
  const url = `https://logo.clearbit.com/${domain}?size=512&format=png`;
  try {
    const res = await fetch(url, { headers: { "user-agent": "video-automation-asset-bot/1.0" } });
    if (!res.ok) return [];
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 300) return []; // empty/placeholder
    return [
      {
        source: "clearbit",
        type: "logo",
        ext: ".png",
        buffer,
        url,
        sourceUrl: `https://${domain}`,
        license: "editorial", // brand mark, nominative use
        attribution: domain,
        title: `${query} logo`,
        tags: [query.toLowerCase().replace(/\blogo\b/, "").trim(), "logo"].filter(Boolean),
        query,
      },
    ].slice(0, limit);
  } catch {
    return [];
  }
}
