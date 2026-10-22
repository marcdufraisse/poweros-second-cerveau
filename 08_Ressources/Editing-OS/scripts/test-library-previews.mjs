/**
 * Les previews de la bibliothèque doivent JOUER, pas rester figées sur leur
 * première image. Les cartes s'enregistrent en pause et cachent leur contenu
 * (`tl.from(autoAlpha: 0)`) : une carte gelée à t=0 est une vignette vide.
 *
 * Ce test pilote le hub comme le ferait l'utilisateur — la vue d'un style, puis
 * "Voir en grand" — et vérifie que le temps avance réellement dans les
 * compositions. Il échoue si on repasse à un pilotage direct des timelines :
 * le runtime HyperFrames injecté par le serveur réécrit leur position à
 * chaque frame, et rien ne bouge.
 *
 * Usage : node scripts/test-library-previews.mjs [url] [style]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4200';
const STYLE = process.argv[3] || 'vox-explainer';
const SAMPLE = 8;          // vignettes échantillonnées
const fail = [];

// Le temps d'une composition, vu par le lecteur du runtime ou, à défaut, par
// ses timelines — le test ne présume pas de la voie utilisée, seulement du
// résultat : ça avance.
function readTimes(win) {
  return win.__player && win.__playerReady
    ? win.__player.getTime()
    : Object.keys(win.__timelines || {}).reduce(
        (m, k) => Math.max(m, win.__timelines[k].time()), 0);
}

const browser = await chromium.launch();
const page = await browser.newPage();
// Les erreurs JS remontées ici viennent aussi des cartes elles-mêmes (une
// carte au GSAP mal formé lève dans son iframe). Ce test juge la lecture, pas
// la santé de chaque carte : on les signale sans faire échouer.
const warn = [];
page.on('pageerror', (e) => warn.push(e.message));

await page.goto(`${BASE}/#/style/${STYLE}`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.cardp-thumb[data-mounted] iframe', { timeout: 20000 });
await page.waitForTimeout(4000);   // chargement des iframes + démarrage

// Seules les vignettes à l'écran jouent — c'est voulu, une galerie de 300
// cartes qui tourneraient toutes mettrait la page à genoux. On échantillonne
// donc ce qui est visible.
const sampleTimes = (fn) => page.evaluate(({ n, src }) => {
  const read = new Function('win', src);
  const vh = window.innerHeight;
  return [...document.querySelectorAll('.cardp-thumb[data-mounted]')]
    .filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < vh; })
    .slice(0, n)
    .map((el) => { try { return read(el.querySelector('iframe').contentWindow); } catch { return null; } });
}, { n: SAMPLE, src: fn });

const body = 'return (' + readTimes.toString() + ')(win)';
const t1 = await sampleTimes(body);
await page.waitForTimeout(1500);
const t2 = await sampleTimes(body);

// Une carte courte peut reboucler entre les deux mesures : le temps repart
// alors en arrière. Ce qu'on veut voir, c'est que le temps BOUGE.
const advanced = t1.filter((a, i) => a !== null && Math.abs(t2[i] - a) > 0.2).length;
const checked = t1.filter((a) => a !== null).length;
console.log(`vignettes : ${advanced}/${checked} jouent (échantillon de ${SAMPLE})`);
if (!checked) fail.push('aucune vignette montée : rien à vérifier');
else if (advanced < checked) fail.push(`${checked - advanced} vignette(s) figée(s) — t1=${JSON.stringify(t1)} t2=${JSON.stringify(t2)}`);

// "Voir en grand" : même exigence, la carte doit jouer dans la lightbox.
await page.click('.cardp .rev-btn');
await page.waitForSelector('.card-box iframe', { timeout: 10000 });
await page.waitForTimeout(3000);
const readBig = () => page.evaluate((src) => {
  const read = new Function('win', src);
  const f = document.querySelector('.card-box iframe');
  try { return read(f.contentWindow); } catch { return null; }
}, body);
const b1 = await readBig();
await page.waitForTimeout(1500);
const b2 = await readBig();
console.log(`voir en grand : t=${b1} -> ${b2}`);
if (b1 === null) fail.push('la carte en grand n\'est pas accessible');
else if (!(Math.abs(b2 - b1) > 0.2)) fail.push(`la carte en grand est figée (t=${b1} -> ${b2})`);

// Le pendant de la règle : ce qu'on ne regarde pas ne doit pas tourner.
const offscreen = await page.evaluate(() => {
  const vh = window.innerHeight;
  let off = 0, offPlaying = 0;
  document.querySelectorAll('.cardp-thumb[data-mounted]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) return;
    off++;
    try {
      const w = el.querySelector('iframe').contentWindow;
      if (w.__player && w.__playerReady && w.__player.isPlaying()) offPlaying++;
    } catch { /* ignore */ }
  });
  return { off, offPlaying };
});
console.log(`hors écran : ${offscreen.offPlaying}/${offscreen.off} tournent encore`);
if (offscreen.off > 4 && offscreen.offPlaying > offscreen.off / 2) {
  fail.push(`${offscreen.offPlaying} vignettes hors écran tournent : la galerie va ramer`);
}

await browser.close();

if (warn.length) console.warn('\nerreurs JS relevées (cartes ou hub) :\n- ' + [...new Set(warn)].join('\n- '));
if (fail.length) { console.error('\nECHEC :\n- ' + fail.join('\n- ')); process.exit(1); }
console.log('\nOK : les previews de la bibliothèque jouent.');
