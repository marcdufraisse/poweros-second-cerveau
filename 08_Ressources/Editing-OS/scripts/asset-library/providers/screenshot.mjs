// Live URL screenshots — local, keyless. Prefers Playwright (better waits / framing);
// falls back to the system Google Chrome in headless --screenshot mode.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const meta = { name: "screenshot", needsKey: null, types: ["screenshot"] };

function normalizeUrl(q) {
  let u = q.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, "");
  return u;
}

async function viaPlaywright(url, { width, height, fullPage, timeout }) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return null; // not installed
  }
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: "networkidle", timeout }).catch(() => page.goto(url, { waitUntil: "domcontentloaded", timeout }));
    await page.waitForTimeout(800);
    return await page.screenshot({ fullPage });
  } catch (e) {
    if (browser) await browser.close();
    throw e;
  } finally {
    if (browser) await browser.close();
  }
}

function viaSystemChrome(url, { width, height, timeout }) {
  const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!existsSync(CHROME)) return null;
  const out = join(tmpdir(), `shot-${slug(url)}.png`);
  if (existsSync(out)) unlinkSync(out);
  execFileSync(
    CHROME,
    [
      "--headless=new", "--disable-gpu", "--hide-scrollbars",
      `--window-size=${width},${height}`,
      `--virtual-time-budget=${Math.min(timeout, 8000)}`,
      `--screenshot=${out}`,
      url,
    ],
    { stdio: "ignore", timeout: timeout + 5000 }
  );
  if (!existsSync(out)) return null;
  const buf = readFileSync(out);
  unlinkSync(out);
  return buf;
}
const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").slice(0, 40);

export async function search(query, { width = 1920, height = 1080, fullPage = false, timeout = 20000 } = {}) {
  const url = normalizeUrl(query);
  let buffer = null;
  try {
    buffer = await viaPlaywright(url, { width, height, fullPage, timeout });
  } catch {
    buffer = null;
  }
  if (!buffer) buffer = viaSystemChrome(url, { width, height, timeout });
  if (!buffer) return [];
  const host = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return [
    {
      source: "screenshot",
      type: "screenshot",
      ext: ".png",
      buffer,
      url,
      sourceUrl: url,
      license: "unknown", // a capture of someone's site — comp/reference only unless cleared
      attribution: host,
      title: `${host} screenshot`,
      width,
      height,
      tags: [host, "screenshot"],
      query,
    },
  ];
}
