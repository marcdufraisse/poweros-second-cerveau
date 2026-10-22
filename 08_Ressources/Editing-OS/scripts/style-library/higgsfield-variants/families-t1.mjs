// tier1 variant builders: section, thesis, stat, overview, quote.
// Each builder takes an axes combo + sequence number and returns a card record
// { id, tier, purpose, treatment, slots, duration, html }.
// Axes always include: canvas (navy|olive|cream), glass (0|1 = content sits in
// a centered glass panel), entrance, align, timing (1 = ref speed, 1.35 = relaxed).
import { shell, canvasLayers, entranceJs, holdJs } from "./util.mjs";

const cid = (purpose, seq) => `hgv-t1-${purpose}-${String(seq).padStart(3, "0")}`;

/* On cream, "glass" panels read as soft charcoal-tinted plates; on dark
   canvases they frost white. Text colors flip with the canvas. */
const inkFor = (canvas) => (canvas === "cream"
  ? { fg: "var(--charcoal)", pre: "rgba(23,25,28,0.4)", kick: "rgba(23,25,28,0.62)" }
  : { fg: "var(--white)", pre: "var(--grey-pre)", kick: "rgba(255,255,255,0.85)" });

function glassWrap(rootId, on, canvas, width = 1240) {
  if (!on) return { cssExtra: "", open: "", close: "" };
  const bg = canvas === "cream" ? "rgba(23,25,28,0.06)" : "var(--glass-bg)";
  return {
    cssExtra: `      #${rootId} .gpanel {
        background: ${bg}; border: var(--glass-edge); border-radius: var(--radius);
        backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);
        box-shadow: var(--glass-shadow); padding: 72px 90px; max-width: ${width}px;
      }`,
    open: `<div class="gpanel">`, close: `</div>`,
  };
}

export function buildSection(p, seq) {
  const id = cid("section", seq);
  const ink = inkFor(p.canvas);
  const bg = canvasLayers(id, p.canvas, { warmSide: p.align === "left" ? "left" : "right" });
  const g = glassWrap(id, p.glass, p.canvas, 1100);
  const alignCss = p.align === "left" ? "align-items: flex-start; text-align: left; padding-left: 150px;" : "align-items: center; text-align: center;";
  const mega = p.size === "mega" ? "var(--size-mega)" : "var(--size-display)";
  const b = p.timing;
  const kickerFirst = p.order === "kicker-first";
  const html = shell({
    id,
    comment: `section takeover · ${p.canvas} canvas · ${p.glass ? "glass plate" : "bare"} · ${p.align} · ${p.entrance} entrance`,
    css: `${bg.css}
${g.cssExtra}
      #${id} .wrap { position: absolute; inset: 0; display: flex; flex-direction: column;
        justify-content: center; gap: 26px; z-index: 2; ${alignCss} }
      #${id} .kicker { font-weight: var(--wt-semi); font-size: var(--size-label);
        letter-spacing: var(--track-eyebrow); text-transform: uppercase; color: ${ink.pre}; }
      #${id} .title { font-weight: var(--wt-black); font-size: ${mega}; line-height: 0.95;
        letter-spacing: var(--track-caps); text-transform: uppercase; color: ${ink.pre}; }`,
    body: `${bg.body}
      <div class="wrap">${g.open}
        <div class="kicker" data-slot="kicker">STEP 1:</div>
        <div class="title" data-slot="title">SETUP</div>
      ${g.close}</div>`,
    js: `${bg.js}
${entranceJs(".kicker", kickerFirst ? p.entrance : "rise", p.align, 0.1 * b)}
${entranceJs(".title", p.entrance, p.align, 0.24 * b)}
      tl.to(root + " .kicker", { color: "${ink.kick}", duration: 0.22, ease: "power2.inOut" }, ${(0.64 * b).toFixed(2)});
      tl.to(root + " .title", { color: "${ink.fg}", duration: 0.22, ease: "power2.inOut" }, ${(0.76 * b).toFixed(2)});
${holdJs(4)}`,
  });
  return {
    id: `higgsfield.t1.section.v${String(seq).padStart(3, "0")}`,
    tier: "tier1", purpose: "section",
    treatment: `${p.canvas}-${p.glass ? "glass" : "bare"}-${p.align}-${p.entrance}${p.size === "mega" ? "-mega" : ""}`,
    slots: [
      { name: "kicker", type: "text", maxChars: 16 },
      { name: "title", type: "text", maxChars: p.size === "mega" ? 14 : 20 },
    ],
    duration: { min: 3, max: 5 },
    file: `cards/variants/t1-section/${id}.html`,
    html,
  };
}

export function buildThesis(p, seq) {
  const id = cid("thesis", seq);
  const ink = inkFor(p.canvas);
  const bg = canvasLayers(id, p.canvas, { warmSide: p.align === "left" ? "left" : "right" });
  const g = glassWrap(id, p.glass, p.canvas);
  const alignCss = p.align === "left" ? "align-items: flex-start; text-align: left; padding: 0 150px;" : "align-items: center; text-align: center; padding: 0 var(--pad);";
  const emColor = p.emStyle === "highlight" && p.canvas === "cream" ? null : "lime";
  const b = p.timing;
  const emCss = p.emStyle === "highlight"
    ? `#${id} .headline .em { position: relative; z-index: 1; padding: 0 8px; }
      #${id} .headline .em::before { content: ""; position: absolute; inset: 4px -4px; z-index: -1;
        background: var(--lime); border-radius: 6px; transform: scaleX(var(--hl, 0)); transform-origin: 0 50%; }`
    : "";
  const html = shell({
    id,
    comment: `thesis takeover · ${p.canvas} · ${p.glass ? "glass plate" : "bare"} · em=${p.emStyle} · ${p.entrance}`,
    css: `${bg.css}
${g.cssExtra}
      #${id} .wrap { position: absolute; inset: 0; display: flex; flex-direction: column;
        justify-content: center; gap: 34px; z-index: 2; ${alignCss} }
      #${id} .kicker { font-weight: var(--wt-semi); font-size: var(--size-label);
        letter-spacing: var(--track-eyebrow); text-transform: uppercase; color: ${ink.kick}; }
      #${id} .headline { font-weight: var(--wt-heavy); font-size: ${p.size === "big" ? "var(--size-title)" : "68px"};
        line-height: 1.14; letter-spacing: var(--track-caps); text-transform: uppercase;
        color: ${ink.pre}; max-width: 1520px; }
      #${id} .headline .w { display: inline-block; white-space: pre; }
      ${emCss}`,
    body: `${bg.body}
      <div class="wrap">${g.open}
        <div class="kicker" data-slot="kicker">THE POINT</div>
        <div class="headline" data-slot="headline">ONE PERSON CAN NOW RUN AN <em>ENTIRE</em> PRODUCTION STUDIO</div>
      ${g.close}</div>`,
    js: `${bg.js}
      /* split headline into words, keeping <em> markers */
      const hl = document.querySelector(root + " .headline");
      (function () {
        const parts = [];
        hl.childNodes.forEach((n) => {
          const em = n.nodeType === 1;
          (n.textContent || "").split(/\\s+/).filter(Boolean).forEach((w) => parts.push({ w, em }));
        });
        hl.textContent = "";
        parts.forEach(({ w, em }, i) => {
          const s = document.createElement("span");
          s.className = "w" + (em ? " em" : "");
          s.textContent = w + (i < parts.length - 1 ? " " : "");
          hl.appendChild(s);
        });
      })();
${entranceJs(".kicker", "rise", p.align, 0.1 * b)}
      tl.from(root + " .headline .w", { autoAlpha: 0, y: 30, duration: 0.4, ease: "expo.out", stagger: ${(0.055 * b).toFixed(3)} }, ${(0.3 * b).toFixed(2)});
      tl.to(root + " .headline .w:not(.em)", { color: "${ink.fg}", duration: 0.24, ease: "power2.inOut" }, ${(1.15 * b).toFixed(2)});
      ${p.emStyle === "highlight"
        ? `tl.to(root + " .headline .em", { "--hl": 1, duration: 0.4, ease: "power3.out", stagger: 0.05 }, ${(1.45 * b).toFixed(2)});
      ${p.canvas === "cream" ? "" : `tl.to(root + " .headline .em", { color: "${ink.fg}", duration: 0.22 }, ${(1.4 * b).toFixed(2)});`}`
        : `tl.to(root + " .headline .em", { color: LIME, duration: 0.22, ease: "power2.inOut" }, ${(1.45 * b).toFixed(2)});
      tl.fromTo(root + " .headline .em", { scale: 1 }, { scale: 1.06, yoyo: true, repeat: 1, duration: 0.14, ease: "power2.inOut" }, ${(1.45 * b).toFixed(2)});`}
${holdJs(5.5)}`,
  });
  return {
    id: `higgsfield.t1.thesis.v${String(seq).padStart(3, "0")}`,
    tier: "tier1", purpose: "thesis",
    treatment: `${p.canvas}-${p.glass ? "glass" : "bare"}-${p.align}-em-${p.emStyle}`,
    slots: [
      { name: "kicker", type: "text", maxChars: 20 },
      { name: "headline", type: "richtext", maxChars: 70, notes: "wrap emphasis in <em>" },
    ],
    duration: { min: 4.5, max: 7 },
    file: `cards/variants/t1-thesis/${id}.html`,
    html,
  };
}

export function buildStat(p, seq) {
  const id = cid("stat", seq);
  const ink = inkFor(p.canvas);
  const bg = canvasLayers(id, p.canvas);
  const g = glassWrap(id, p.glass, p.canvas, 1000);
  const b = p.timing;
  /* the money gradient only reads on cream; on dark canvases that axis value
     becomes a white number with a lime halo (distinct, and it stays legible) */
  if (p.canvas !== "cream" && p.numStyle === "gradient") p = { ...p, numStyle: "glow" };
  const numCss = p.numStyle === "gradient"
    ? `background: linear-gradient(180deg, var(--money-deep) 0%, var(--money-lite) 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent; padding: 0 24px;`
    : p.numStyle === "glow"
    ? `color: var(--white); text-shadow: 0 0 30px rgba(var(--lime-rgb), 0.55), 0 0 70px rgba(var(--lime-rgb), 0.3);`
    : `color: var(--lime); text-shadow: var(--kinetic-shadow);`;
  const html = shell({
    id,
    comment: `stat takeover · ${p.canvas} · num=${p.numStyle} · ${p.glass ? "glass plate" : "bare"} · countup=${p.countup}`,
    css: `${bg.css}
${g.cssExtra}
      #${id} .wrap { position: absolute; inset: 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 30px; z-index: 2; text-align: center; }
      #${id} .kicker { font-weight: var(--wt-semi); font-size: var(--size-label);
        letter-spacing: var(--track-eyebrow); text-transform: uppercase; color: ${ink.kick}; }
      #${id} .stat { font-weight: var(--wt-black); font-size: ${p.size === "mega" ? "var(--size-mega)" : "var(--size-display)"};
        line-height: 1; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; ${numCss} }
      #${id} .label { font-weight: var(--wt-bold); font-size: var(--size-headline);
        letter-spacing: 0.08em; text-transform: uppercase; color: ${ink.pre}; }`,
    body: `${bg.body}
      <div class="wrap">${g.open}
        <div class="kicker" data-slot="kicker">THE RESULT</div>
        <div class="stat" data-slot="stat">$39.5K</div>
        <div class="label" data-slot="label">EVERY SINGLE MONTH</div>
      ${g.close}</div>`,
    js: `${bg.js}
${entranceJs(".kicker", "rise", "right", 0.1 * b)}
${entranceJs(".stat", p.entrance, "right", 0.28 * b)}
      ${p.countup ? `
      const statEl = document.querySelector(root + " .stat");
      const raw = statEl.textContent.trim();
      const m = raw.match(/^([^0-9]*)([0-9][0-9.,]*)(.*)$/);
      const prefix = m ? m[1] : ""; const numStr = m ? m[2] : "0"; const suffix = m ? m[3] : "";
      const target = parseFloat(numStr.replace(/,/g, ""));
      const decimals = (numStr.split(".")[1] || "").length;
      const useCommas = numStr.includes(",");
      const fmt = (v) => { let s = v.toFixed(decimals);
        if (useCommas) s = s.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ","); return prefix + s + suffix; };
      const proxy = { v: 0 }; statEl.textContent = fmt(0);
      tl.to(proxy, { v: target, duration: ${(1.1 * b).toFixed(2)}, ease: "power2.out",
        onUpdate: () => { statEl.textContent = fmt(proxy.v); } }, ${(0.32 * b).toFixed(2)});` : ""}
      tl.from(root + " .label", { autoAlpha: 0, y: 22, duration: 0.4, ease: "expo.out" }, ${(0.7 * b).toFixed(2)});
      tl.to(root + " .label", { color: "${ink.fg}", duration: 0.24, ease: "power2.inOut" }, ${(1.5 * b).toFixed(2)});
${holdJs(5)}`,
  });
  return {
    id: `higgsfield.t1.stat.v${String(seq).padStart(3, "0")}`,
    tier: "tier1", purpose: "stat",
    treatment: `${p.canvas}-${p.numStyle}${p.countup ? "-countup" : ""}${p.glass ? "-glass" : ""}`,
    slots: [
      { name: "kicker", type: "text", maxChars: 20 },
      { name: "stat", type: "text", maxChars: 10 },
      { name: "label", type: "text", maxChars: 30 },
    ],
    duration: { min: 4, max: 6.5 },
    file: `cards/variants/t1-stat/${id}.html`,
    html,
  };
}

export function buildOverview(p, seq) {
  const id = cid("overview", seq);
  const ink = inkFor(p.canvas);
  const bg = canvasLayers(id, p.canvas);
  const g = glassWrap(id, p.glass, p.canvas, 1100);
  const b = p.timing;
  const tilt = p.tilt === "none" ? "" : `transform: perspective(1600px) rotateY(${p.tilt === "left" ? "3deg" : "-3deg"});`;
  const numFmt = p.numbering === "padded" ? ["01", "02", "03"] : ["1.", "2.", "3."];
  const rowsAlign = p.align === "left" ? "align-items: flex-start; padding-left: 190px;" : "align-items: center;";
  const flipColor = p.canvas === "cream" ? "LIME" : (p.flip === "white" ? "WHITE" : "LIME");
  const html = shell({
    id,
    comment: `overview takeover · ${p.canvas} · ${p.numbering} numbering · tilt=${p.tilt} · flip=${p.flip}`,
    css: `${bg.css}
${g.cssExtra}
      #${id} .wrap { position: absolute; inset: 0; display: flex; flex-direction: column;
        justify-content: center; gap: 40px; z-index: 2; ${rowsAlign} ${tilt} }
      #${id} .kicker { font-weight: var(--wt-semi); font-size: var(--size-label);
        letter-spacing: var(--track-eyebrow); text-transform: uppercase; color: ${ink.kick}; margin-bottom: 14px; }
      #${id} .row { display: flex; align-items: baseline; gap: 28px;
        font-weight: var(--wt-heavy); font-size: var(--size-title); line-height: 1;
        letter-spacing: var(--track-caps); text-transform: uppercase;
        color: ${ink.pre}; ${p.canvas === "cream" ? "" : "text-shadow: var(--kinetic-shadow);"} }
      #${id} .row .num { font-weight: var(--wt-bold); font-size: 0.62em; ${p.numbering === "padded" ? "font-family: var(--font-mono);" : ""} }`,
    body: `${bg.body}
      <div class="wrap">${g.open}
        <div class="kicker" data-slot="kicker">THE WORKFLOW</div>
        <div class="row"><span class="num">${numFmt[0]}</span><span data-slot="s1">SETUP</span></div>
        <div class="row"><span class="num">${numFmt[1]}</span><span data-slot="s2">IDEA</span></div>
        <div class="row"><span class="num">${numFmt[2]}</span><span data-slot="s3">GENERATION</span></div>
      ${g.close}</div>`,
    js: `${bg.js}
${entranceJs(".kicker", "rise", "right", 0.1 * b)}
      const rows = gsap.utils.toArray(root + " .row");
      const beat = ${(0.85 * b).toFixed(2)};
      rows.forEach((row, i) => {
        const t = ${(0.4 * b).toFixed(2)} + i * beat;
        tl.from(row, { autoAlpha: 0, x: ${p.align === "left" ? -46 : 46}, duration: 0.45, ease: "expo.out" }, t);
        tl.to(row, { color: ${flipColor}, duration: 0.24, ease: "power2.inOut" }, t + beat);
      });
${holdJs(5.5)}`,
  });
  return {
    id: `higgsfield.t1.overview.v${String(seq).padStart(3, "0")}`,
    tier: "tier1", purpose: "overview",
    treatment: `${p.canvas}-${p.numbering}-${p.align}${p.glass ? "-glass" : ""}`,
    slots: [
      { name: "kicker", type: "text", maxChars: 20 },
      { name: "s1", type: "text", maxChars: 18 },
      { name: "s2", type: "text", maxChars: 18 },
      { name: "s3", type: "text", maxChars: 18 },
    ],
    duration: { min: 4.5, max: 7 },
    file: `cards/variants/t1-overview/${id}.html`,
    html,
  };
}

export function buildQuote(p, seq) {
  const id = cid("quote", seq);
  const ink = inkFor(p.canvas);
  const bg = canvasLayers(id, p.canvas);
  const g = glassWrap(id, p.glass, p.canvas);
  const b = p.timing;
  const emCss = p.emStyle === "highlight"
    ? `#${id} .quote .em { position: relative; z-index: 1; font-style: normal; padding: 0 6px; }
      #${id} .quote .em::before { content: ""; position: absolute; inset: 4px -4px; z-index: -1;
        background: var(--lime); border-radius: 6px; transform: scaleX(var(--hl, 0)); transform-origin: 0 50%; }`
    : `#${id} .quote .em { font-style: normal; }`;
  const html = shell({
    id,
    comment: `quote takeover · ${p.canvas} · em=${p.emStyle} · ${p.glass ? "glass plate" : "bare"} · ${p.entrance}`,
    css: `${bg.css}
${g.cssExtra}
      #${id} .wrap { position: absolute; inset: 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 48px; z-index: 2;
        padding: 0 150px; text-align: center; }
      #${id} .quote { font-weight: var(--wt-heavy); font-size: ${p.size === "big" ? "72px" : "58px"};
        line-height: 1.22; color: ${p.canvas === "cream" ? "var(--charcoal)" : ink.fg}; max-width: 1480px; }
      #${id} .quote .w { display: inline-block; white-space: pre; }
      ${emCss}
      #${id} .attribution { font-family: var(--font-mono); font-weight: var(--wt-med);
        font-size: var(--size-label); letter-spacing: var(--track-pill);
        text-transform: uppercase; color: ${ink.kick}; }
      #${id} .attribution .ch { display: inline-block; }`,
    body: `${bg.body}
      <div class="wrap">${g.open}
        <div class="quote" data-slot="quote">I STOPPED HIRING EDITORS BECAUSE <em>THIS IS FASTER</em></div>
        <div class="attribution" data-slot="attribution">ACTUAL CLIENT, LAST MONTH</div>
      ${g.close}</div>`,
    js: `${bg.js}
      const q = document.querySelector(root + " .quote");
      (function () {
        const parts = [];
        q.childNodes.forEach((n) => {
          const em = n.nodeType === 1;
          (n.textContent || "").split(/\\s+/).filter(Boolean).forEach((w) => parts.push({ w, em }));
        });
        q.textContent = "";
        parts.forEach(({ w, em }, i) => {
          const s = document.createElement("span");
          s.className = "w" + (em ? " em" : "");
          s.textContent = w + (i < parts.length - 1 ? " " : "");
          q.appendChild(s);
        });
      })();
      splitChars(document.querySelector(root + " .attribution"));
      tl.from(root + " .quote .w", { autoAlpha: 0, y: 26, duration: 0.4, ease: "expo.out", stagger: ${(0.07 * b).toFixed(3)} }, ${(0.15 * b).toFixed(2)});
      ${p.emStyle === "highlight"
        ? `tl.to(root + " .quote .em", { "--hl": 1, duration: 0.4, ease: "power3.out", stagger: 0.05 }, ${(1.2 * b).toFixed(2)});
      ${p.canvas === "cream" ? "" : `tl.to(root + " .quote .em", { color: "var(--charcoal)", duration: 0.22 }, ${(1.2 * b).toFixed(2)});`}`
        : `tl.to(root + " .quote .em", { color: LIME, duration: 0.24, ease: "power2.inOut" }, ${(1.2 * b).toFixed(2)});`}
      tl.from(root + " .attribution .ch", { autoAlpha: 0, duration: 0.01, stagger: 0.02, ease: "none" }, ${(1.7 * b).toFixed(2)});
${holdJs(5.5)}`,
  });
  return {
    id: `higgsfield.t1.quote.v${String(seq).padStart(3, "0")}`,
    tier: "tier1", purpose: "quote",
    treatment: `${p.canvas}-em-${p.emStyle}${p.glass ? "-glass" : ""}`,
    slots: [
      { name: "quote", type: "richtext", maxChars: 90, notes: "wrap highlight phrase in <em>" },
      { name: "attribution", type: "text", maxChars: 32 },
    ],
    duration: { min: 4.5, max: 7 },
    file: `cards/variants/t1-quote/${id}.html`,
    html,
  };
}
