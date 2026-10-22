// Load the workspace .env into process.env (without overwriting already-set vars).
// Minimal KEY=VALUE parser — no quotes/expansion needed for API keys.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

let loaded = false;
export function loadEnv(root = ".") {
  if (loaded) return;
  loaded = true;
  const p = resolve(root, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim().replace(/^["']|["']$/g, "");
    if (val && process.env[key] == null) process.env[key] = val;
  }
}

export function getKey(name) {
  loadEnv();
  return process.env[name] || null;
}
