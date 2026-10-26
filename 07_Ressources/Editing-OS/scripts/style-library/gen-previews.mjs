#!/usr/bin/env node
/**
 * Génère les previews verticales d'un style : preview/<card-id>.mp4 (la
 * timeline jouée en temps réel, enregistrée) + preview/<card-id>.png
 * (poster extrait du MP4 à ~60% de la timeline).
 *
 *   node scripts/style-library/gen-previews.mjs style-library/12-nathan-hodgson [...]
 *
 * Lit style.json pour la liste des cartes ; data-composition-id extrait du
 * HTML. Format 304x540 (9:16). Nécessite playwright + ffmpeg.
 *
 * NOTE : ne jamais appeler tl.seek(t>0) via evaluate dans un contexte
 * recordVideo — ça bloque la page (deadlock constaté le 18/08). On joue la
 * timeline en temps réel et on extrait le poster du fichier vidéo.
 */
import { chromium } from "playwright";
import { pathToFileURL } from "url";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.slice(7) : null; /* sous-chaîne d'id de carte */
const styles = args.filter((a) => !a.startsWith("--"));
if (!styles.length) {
  console.error("usage: gen-previews.mjs <style-dir> [...] [--only=<substr-id>]");
  process.exit(1);
}

const LEAD = 0.75; /* délai entre début d'enregistrement et tl.play() */

const b = await chromium.launch();
for (const styleDir of styles) {
  const manifest = JSON.parse(fs.readFileSync(path.join(styleDir, "style.json"), "utf8"));
  const outDir = path.join(styleDir, "preview");
  fs.mkdirSync(outDir, { recursive: true });

  for (const card of manifest.cards) {
    if (only && card.id.indexOf(only) === -1) continue;
    const file = path.join(styleDir, card.file);
    if (!fs.existsSync(file)) { console.log("SKIP missing", card.id); continue; }
    const comp = (fs.readFileSync(file, "utf8").match(/data-composition-id="([^"]+)"/) || [])[1];
    if (!comp) { console.log("SKIP no comp id", card.id); continue; }
    try {
      const vdir = fs.mkdtempSync("/tmp/hf-preview-");
      const ctx = await b.newContext({
        viewport: { width: 304, height: 540 },
        recordVideo: { dir: vdir, size: { width: 304, height: 540 } },
      });
      const pg = await ctx.newPage();
      await pg.goto(pathToFileURL(file).href);
      await pg.addStyleTag({ content: "html { zoom: 0.28148; }" });
      await pg.waitForTimeout(600);
      const dur = await pg.evaluate((id) => (window.__timelines || {})[id]?.duration() || 0, comp);
      if (!dur) { console.log("SKIP no timeline", card.id); await ctx.close(); continue; }
      const played = Math.min(dur, 8);
      await pg.evaluate((id) => { const tl = window.__timelines[id]; tl.seek(0); tl.play(); }, comp);
      await pg.waitForTimeout(played * 1000 + 300);
      await ctx.close();
      const webm = fs.readdirSync(vdir).find((f) => f.endsWith(".webm"));
      const mp4 = path.join(outDir, `${card.id}.mp4`);
      execSync(`ffmpeg -v error -y -ss ${LEAD} -i "${path.join(vdir, webm)}" -c:v libx264 -pix_fmt yuv420p -crf 26 -an "${mp4}"`);
      /* poster : la frame à ~60% de la timeline, depuis le mp4 */
      execSync(`ffmpeg -v error -y -ss ${(played * 0.6).toFixed(2)} -i "${mp4}" -frames:v 1 "${path.join(outDir, `${card.id}.png`)}"`);
      fs.rmSync(vdir, { recursive: true, force: true });
      console.log("ok", card.id, dur.toFixed(1) + "s");
    } catch (e) {
      console.log("ERR", card.id, e.message.split("\n")[0]);
    }
  }
}
await b.close();
