// tier2 + custom variant builders: label, list, media, lower-third, pip, highlight.
// All tier2 output is transparent-over-footage; glass treatments dominate
// (a strong default). Same record shape as families-t1.
import { shell, glassCss, entranceJs, driftJs, holdJs } from "./util.mjs";

const cid = (purpose, seq) => `hgv-t2-${purpose.replace(/[^a-z]/g, "")}-${String(seq).padStart(3, "0")}`;

/* ---------------- label (kinetic float / slam / tags / glass chip / arrow) */
export function buildLabel(p, seq) {
  const id = cid("label", seq);
  const b = p.timing;
  let css = "", body = "", js = "", treatment = "";
  const sideAnchor = p.side === "left" ? "left: 130px;" : "right: 130px;";
  const tilt = p.side === "left" ? "var(--kinetic-tilt-l)" : "var(--kinetic-tilt)";

  if (p.base === "kinetic") {
    treatment = `kinetic-${p.side}-${p.lines}line-${p.flip}`;
    css = `      #${id} .block { position: absolute; top: ${p.y}px; ${sideAnchor} z-index: 3; }
      #${id} .tilt { display: flex; flex-direction: column; align-items: ${p.side === "left" ? "flex-end" : "flex-start"}; gap: 10px; transform: ${tilt}; }
      #${id} .line { font-weight: var(--wt-heavy); font-size: var(--size-headline); line-height: 1.06;
        letter-spacing: 0.03em; text-transform: uppercase; color: var(--grey-pre);
        text-shadow: var(--kinetic-shadow); max-width: 520px; }`;
    body = `      <div class="block"><div class="tilt">
        <div class="line l1" data-slot="line1">AUTOMATE</div>
        ${p.lines === 2 ? `<div class="line l2" data-slot="line2">CONTENT</div>` : ""}
      </div></div>`;
    js = `${entranceJs(".l1", p.entrance, p.side, 0.1 * b)}
      ${p.lines === 2 ? `${entranceJs(".l2", p.entrance, p.side, 0.5 * b)}
      tl.to(root + " .l1", { color: ${p.flip === "white" ? "WHITE" : "LIME"}, duration: 0.22, ease: "power2.inOut" }, ${(0.55 * b).toFixed(2)});
      tl.to(root + " .l2", { color: ${p.flip === "white" ? "WHITE" : "LIME"}, duration: 0.22, ease: "power2.inOut" }, ${(0.85 * b).toFixed(2)});`
      : `tl.to(root + " .l1", { color: ${p.flip === "white" ? "WHITE" : "LIME"}, duration: 0.22, ease: "power2.inOut" }, ${(0.55 * b).toFixed(2)});`}
${driftJs(".block", { amp: 8, rot: 0.5 })}
${holdJs(6)}`;
  } else if (p.base === "slam") {
    treatment = `slam-${p.pos}-${p.size}`;
    const posCss = p.pos === "low" ? "bottom: 140px;" : "top: 120px;";
    css = `      #${id} .cap { position: absolute; left: 0; right: 0; ${posCss} z-index: 3; text-align: center;
        font-weight: var(--wt-black); font-size: ${p.size === "big" ? "76px" : "56px"}; line-height: 1;
        letter-spacing: 0.04em; text-transform: uppercase; color: var(--lime); text-shadow: var(--kinetic-shadow); }
      #${id} .cap .w { display: inline-block; white-space: pre; }`;
    body = `      <div class="cap" data-slot="text">NO MANUAL WORK</div>`;
    js = `      const cap = document.querySelector(root + " .cap");
      const words = cap.textContent.trim().split(/\\s+/); cap.textContent = "";
      words.forEach((w, i) => { const s = document.createElement("span");
        s.className = "w"; s.textContent = w + (i < words.length - 1 ? " " : ""); cap.appendChild(s); });
      tl.from(root + " .cap .w", { autoAlpha: 0, scale: 1.5, y: 10, duration: 0.3, ease: "back.out(2)", stagger: ${(0.12 * b).toFixed(2)} }, 0.1);
${holdJs(4)}`;
  } else if (p.base === "tags") {
    treatment = `tags-${p.count}-${p.dimStyle}`;
    css = `      #${id} { font-family: var(--font-mono); }
      #${id} .row { position: absolute; left: 0; right: 0; bottom: 64px; z-index: 3;
        display: flex; justify-content: center; gap: ${p.count === 3 ? 260 : 420}px; }
      #${id} .tag { font-weight: var(--wt-bold); font-size: var(--size-label);
        letter-spacing: var(--track-pill); text-transform: uppercase;
        color: var(--lime); text-shadow: var(--kinetic-shadow); }`;
    body = `      <div class="row">
        <div class="tag" data-slot="tag1">STORM AT SEA</div>
        <div class="tag" data-slot="tag2">DESERT</div>
        ${p.count === 3 ? `<div class="tag" data-slot="tag3">JUNGLE</div>` : ""}
      </div>`;
    js = `      const tags = gsap.utils.toArray(root + " .tag");
      const beat = ${(1.1 * b).toFixed(2)};
      tags.forEach((tag, i) => {
        const t = 0.15 + i * beat;
        tl.from(tag, { autoAlpha: 0, y: 18, duration: 0.38, ease: "expo.out" }, t);
        if (i > 0) tl.to(tags[i - 1], { opacity: ${p.dimStyle === "hard" ? 0.25 : 0.45}, duration: 0.3, ease: "power2.inOut" }, t);
      });
${holdJs(6.5)}`;
  } else if (p.base === "glasschip") {
    treatment = `glasschip-${p.side}-${p.iconDot ? "dot" : "plain"}`;
    css = `${glassCss(id, { side: p.side, top: p.y, width: 460, pad: "26px 34px" })}
      #${id} .tilt { flex-direction: row; align-items: center; gap: 18px; }
      #${id} .dot { width: 12px; height: 12px; border-radius: 50%; background: var(--lime);
        box-shadow: 0 0 12px rgba(var(--lime-rgb), 0.7); flex: none; ${p.iconDot ? "" : "display: none;"} }
      #${id} .txt { font-family: var(--font-mono); font-weight: var(--wt-bold);
        font-size: var(--size-label); letter-spacing: 0.1em; text-transform: uppercase; color: var(--lime-soft); }
      #${id} .txt .ch { display: inline-block; }`;
    body = `      <div class="panel"><div class="tilt">
        <div class="dot"></div>
        <div class="txt" data-slot="text">RENDERING SCENE 4</div>
      </div></div>`;
    js = `      splitChars(document.querySelector(root + " .txt"));
${entranceJs(".panel", p.entrance, p.side, 0.1 * b)}
      tl.from(root + " .txt .ch", { autoAlpha: 0, duration: 0.01, stagger: 0.02, ease: "none" }, ${(0.45 * b).toFixed(2)});
${driftJs(".panel", { amp: 8, rot: 0.4 })}
${holdJs(6)}`;
  } else { // arrow
    treatment = `arrow-${p.side}-${p.flip}`;
    css = `      #${id} .block { position: absolute; top: ${p.y}px; ${p.side === "left" ? "left: 200px;" : "right: 200px;"} z-index: 3; }
      #${id} .tilt { display: flex; flex-direction: column; align-items: center; gap: 18px; transform: ${tilt}; }
      #${id} .word { font-weight: var(--wt-black); font-size: var(--size-headline); line-height: 1;
        letter-spacing: 0.04em; text-transform: uppercase; color: var(--lime); text-shadow: var(--kinetic-shadow); }
      #${id} .shaft { stroke: var(--lime); stroke-width: 7; fill: none; stroke-linecap: round; }
      #${id} .head { fill: var(--lime); }`;
    body = `      <div class="block"><div class="tilt">
        <div class="word top" data-slot="top">IDEA</div>
        <svg width="40" height="92" viewBox="0 0 40 92">
          <line class="shaft" x1="20" y1="6" x2="20" y2="62" />
          <polygon class="head" points="20,86 4,58 36,58" />
        </svg>
        <div class="word bottom" data-slot="bottom">$$$</div>
      </div></div>`;
    js = `      const shaft = document.querySelector(root + " .shaft");
      shaft.style.strokeDasharray = 56; shaft.style.strokeDashoffset = 56;
${entranceJs(".word.top", p.entrance, p.side, 0.1 * b)}
      tl.to(shaft, { strokeDashoffset: 0, duration: 0.35, ease: "power2.inOut" }, ${(0.55 * b).toFixed(2)});
      tl.from(root + " .head", { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 0%", duration: 0.22, ease: "back.out(2)" }, ${(0.85 * b).toFixed(2)});
      tl.from(root + " .word.bottom", { autoAlpha: 0, scale: 1.5, duration: 0.32, ease: "back.out(2)" }, ${(1.05 * b).toFixed(2)});
${driftJs(".block", { amp: 8, rot: 0 })}
${holdJs(5.5)}`;
  }

  const slotsByBase = {
    kinetic: [{ name: "line1", type: "text", maxChars: 14 },
      ...(p.lines === 2 ? [{ name: "line2", type: "text", maxChars: 14 }] : [])],
    slam: [{ name: "text", type: "text", maxChars: 20 }],
    tags: [{ name: "tag1", type: "text", maxChars: 16 }, { name: "tag2", type: "text", maxChars: 16 },
      ...(p.count === 3 ? [{ name: "tag3", type: "text", maxChars: 16 }] : [])],
    glasschip: [{ name: "text", type: "text", maxChars: 20 }],
    arrow: [{ name: "top", type: "text", maxChars: 12 }, { name: "bottom", type: "text", maxChars: 12 }],
  };
  return {
    id: `higgsfield.t2.label.v${String(seq).padStart(3, "0")}`,
    tier: "tier2", purpose: "label", treatment,
    slots: slotsByBase[p.base],
    duration: { min: 3, max: 8 },
    file: `cards/variants/t2-label/${id}.html`,
    html: shell({ id, comment: `label overlay · ${treatment}`, css, body, js }),
  };
}

/* ---------------- list (plain kinetic vs glass panel) -------------------- */
export function buildList(p, seq) {
  const id = cid("list", seq);
  const b = p.timing;
  const numFmt = p.numbering === "padded" ? ["01", "02", "03", "04"] : ["1.", "2.", "3.", "4."];
  const items = p.items;
  const rows = Array.from({ length: items }, (_, i) =>
    `        <div class="item"><span class="num">${numFmt[i]}</span><span data-slot="i${i + 1}">${["SETUP", "IDEA", "GENERATION", "PUBLISH"][i]}</span></div>`).join("\n");
  let css, body, treatment;
  if (p.glass) {
    treatment = `glass-${p.side}-${items}items-${p.numbering}`;
    css = `${glassCss(id, { side: p.side, top: p.y, width: 520, pad: "40px 46px" })}
      #${id} .tilt { gap: 26px; }
      #${id} .item { display: flex; align-items: baseline; gap: 16px;
        font-weight: var(--wt-heavy); font-size: 40px; line-height: 1;
        letter-spacing: 0.03em; text-transform: uppercase; color: rgba(255, 255, 255, 0.55); }
      #${id} .item .num { font-weight: var(--wt-bold); font-size: 0.7em; ${p.numbering === "padded" ? "font-family: var(--font-mono);" : ""} }`;
    body = `      <div class="panel"><div class="tilt">
${rows}
      </div></div>`;
  } else {
    treatment = `kinetic-${p.side}-${items}items-${p.numbering}`;
    const tilt = p.side === "left" ? "var(--kinetic-tilt-l)" : "var(--kinetic-tilt)";
    css = `      #${id} .panel { position: absolute; top: ${p.y}px; ${p.side === "left" ? "left: 150px;" : "right: 150px;"} z-index: 3; }
      #${id} .tilt { display: flex; flex-direction: column; align-items: flex-start; gap: 24px; transform: ${tilt}; }
      #${id} .item { display: flex; align-items: baseline; gap: 16px;
        font-weight: var(--wt-heavy); font-size: 44px; line-height: 1;
        letter-spacing: 0.03em; text-transform: uppercase; color: var(--grey-pre); text-shadow: var(--kinetic-shadow); }
      #${id} .item .num { font-weight: var(--wt-bold); font-size: 0.7em; ${p.numbering === "padded" ? "font-family: var(--font-mono);" : ""} }`;
    body = `      <div class="panel"><div class="tilt">
${rows}
      </div></div>`;
  }
  const flipTo = p.glass ? "LIMESOFT" : "LIME";
  const js = `${p.glass ? entranceJs(".panel", p.entrance, p.side, 0.1 * b) : ""}
      const items = gsap.utils.toArray(root + " .item");
      const beat = ${(0.9 * b).toFixed(2)};
      items.forEach((item, i) => {
        const t = ${p.glass ? "0.45" : "0.15"} + i * beat;
        tl.from(item, { autoAlpha: 0, x: ${p.side === "left" ? -40 : 40}, duration: 0.42, ease: "expo.out" }, t);
        tl.to(item, { color: ${flipTo}, duration: 0.22, ease: "power2.inOut" }, t + beat);
      });
${driftJs(".panel", { amp: 7, rot: p.glass ? 0.5 : 0 })}
${holdJs(7)}`;
  return {
    id: `higgsfield.t2.list.v${String(seq).padStart(3, "0")}`,
    tier: "tier2", purpose: "list", treatment,
    slots: Array.from({ length: items }, (_, i) => ({ name: `i${i + 1}`, type: "text", maxChars: 16 })),
    duration: { min: 5, max: 10 },
    file: `cards/variants/t2-list/${id}.html`,
    html: shell({ id, comment: `list overlay · ${treatment}`, css, body, js }),
  };
}

/* ---------------- media (glass media panel / paper doc) ------------------ */
export function buildMedia(p, seq) {
  const id = cid("media", seq);
  const b = p.timing;
  let css, body, js, treatment, slots;
  if (p.base === "glass") {
    treatment = `glass-${p.side}-${p.slots}shot-${p.orient}${p.lit ? "-lit" : ""}`;
    const dims = { square: [250, 250], land: [340, 210], portrait: [210, 300] }[p.orient];
    const ph = (n, w, h) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'%3E%3Crect width='${w}' height='${h}' fill='%23cfd6cf'/%3E%3Ctext x='${w / 2}' y='${h / 2 + 7}' text-anchor='middle' font-family='monospace' font-size='20' fill='%23616b61'%3EIMG ${n}%3C/text%3E%3C/svg%3E`;
    css = `${glassCss(id, { side: p.side, top: p.y, width: p.slots * (dims[0] + 18) + 34, pad: "26px" })}
      #${id} .tilt { gap: 18px; }
      #${id} .media-row { display: flex; gap: 18px; }
      #${id} .shot { width: ${dims[0]}px; height: ${dims[1]}px; border-radius: 12px; overflow: hidden;
        outline: 3px solid transparent; outline-offset: 3px; background: rgba(255, 255, 255, 0.4); }
      #${id} .shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
      #${id} .label { font-family: var(--font-mono); font-weight: var(--wt-med);
        font-size: var(--size-tiny); letter-spacing: var(--track-pill);
        text-transform: uppercase; color: ${p.lit ? "rgba(23,25,28,0.7)" : "rgba(255,255,255,0.6)"}; text-align: center;
        ${p.labelPos === "none" ? "display: none;" : ""} }`;
    body = `      <div class="panel"><div class="tilt">
        ${p.labelPos === "top" ? `<div class="label" data-slot="label">THE PRODUCT</div>` : ""}
        <div class="media-row">
${Array.from({ length: p.slots }, (_, i) => `          <div class="shot s${i + 1}"><img data-slot="img${i + 1}" alt="" src="${ph(i + 1, dims[0], dims[1])}" /></div>`).join("\n")}
        </div>
        ${p.labelPos === "bottom" ? `<div class="label" data-slot="label">THE PRODUCT</div>` : ""}
      </div></div>`;
    js = `${entranceJs(".panel", p.entrance, p.side, 0.1 * b)}
      tl.from(root + " .shot", { autoAlpha: 0, scale: 0.9, duration: 0.4, ease: "back.out(1.6)", stagger: 0.16 }, ${(0.4 * b).toFixed(2)});
      ${p.labelPos !== "none" ? `tl.from(root + " .label", { autoAlpha: 0, y: 10, duration: 0.3, ease: "expo.out" }, ${(0.85 * b).toFixed(2)});` : ""}
      tl.to(root + " .shot.s${p.slots}", { outlineColor: LIME, duration: 0.2, ease: "power2.out" }, ${(1.4 * b).toFixed(2)});
${driftJs(".panel")}
${holdJs(7)}`;
    slots = [
      ...Array.from({ length: p.slots }, (_, i) => ({ name: `img${i + 1}`, type: "media" })),
      ...(p.labelPos !== "none" ? [{ name: "label", type: "text", maxChars: 22 }] : []),
    ];
  } else { // paper
    treatment = `paper-${p.side}-rot${p.rot}`;
    css = `      #${id} .doc { position: absolute; top: 150px; ${p.side === "left" ? "left: 150px;" : "right: 150px;"} z-index: 3; width: 470px; }
      #${id} .tilt { padding: 44px 46px 52px; background: var(--cream-2); border-radius: 10px;
        box-shadow: var(--glass-shadow);
        transform: perspective(1400px) rotateY(${p.side === "left" ? 9 : -9}deg) rotate(${p.rot}deg); }
      #${id} .title { font-weight: var(--wt-heavy); font-size: 34px; line-height: 1.15; color: var(--charcoal); margin-bottom: 8px; }
      #${id} .sub { font-family: var(--font-mono); font-size: 15px; letter-spacing: 0.14em;
        text-transform: uppercase; color: rgba(23, 25, 28, 0.5); margin-bottom: 22px; }
      #${id} .rule { height: 2px; background: rgba(23, 25, 28, 0.14); margin-bottom: 26px; }
      #${id} .bar { height: 11px; border-radius: 6px; background: rgba(23, 25, 28, 0.13);
        margin-bottom: 14px; transform-origin: 0 50%; position: relative; }
      #${id} .bar.hl::after { content: ""; position: absolute; inset: -3px -6px;
        background: var(--lime-dim); border-radius: 8px; transform: scaleX(var(--hl, 0)); transform-origin: 0 50%; }`;
    body = `      <div class="doc"><div class="tilt">
        <div class="title" data-slot="title">Headphone Ad Script</div>
        <div class="sub" data-slot="sub">SCENE 1 · INT KITCHEN</div>
        <div class="rule"></div>
        <div class="bar" style="width: 92%"></div>
        <div class="bar" style="width: 100%"></div>
        <div class="bar hl" style="width: 84%"></div>
        <div class="bar" style="width: 96%"></div>
        <div class="bar" style="width: 65%"></div>
        <div class="bar" style="width: 100%"></div>
      </div></div>`;
    js = `      tl.from(root + " .doc", { autoAlpha: 0, x: ${p.side === "left" ? -140 : 140}, rotation: ${p.side === "left" ? -6 : 6}, duration: 0.6, ease: "expo.out" }, 0.1);
      tl.from(root + " .title", { autoAlpha: 0, y: 10, duration: 0.3, ease: "expo.out" }, ${(0.5 * b).toFixed(2)});
      tl.from(root + " .sub", { autoAlpha: 0, duration: 0.25, ease: "power2.out" }, ${(0.65 * b).toFixed(2)});
      tl.from(root + " .rule", { scaleX: 0, transformOrigin: "0 50%", duration: 0.35, ease: "power3.out" }, ${(0.75 * b).toFixed(2)});
      tl.from(root + " .bar", { scaleX: 0, duration: 0.3, ease: "power3.out", stagger: 0.07 }, ${(0.9 * b).toFixed(2)});
      tl.to(root + " .bar.hl", { "--hl": 1, duration: 0.4, ease: "power3.out" }, ${(1.8 * b).toFixed(2)});
${driftJs(".doc", { amp: 8, rot: -1 })}
${holdJs(6.5)}`;
    slots = [{ name: "title", type: "text", maxChars: 26 }, { name: "sub", type: "text", maxChars: 26 }];
  }
  return {
    id: `higgsfield.t2.media.v${String(seq).padStart(3, "0")}`,
    tier: "tier2", purpose: "media", treatment, slots,
    duration: { min: 4.5, max: 9 },
    file: `cards/variants/t2-media/${id}.html`,
    html: shell({ id, comment: `media overlay · ${treatment}`, css, body, js }),
  };
}

/* ---------------- lower-third ------------------------------------------- */
export function buildLowerThird(p, seq) {
  const id = cid("lowerthird", seq);
  const b = p.timing;
  const posCss = { left: "left: 96px;", right: "right: 96px;", center: "left: 50%; transform: translateX(-50%);" }[p.pos];
  const glass = p.skin === "glass";
  const shape = p.shape === "pill" ? "border-radius: 100px;" : "border-radius: var(--radius-sm);";
  const treatment = `${p.skin}-${p.shape}-${p.pos}${p.dot ? "-dot" : ""}${p.role ? "" : "-nameonly"}`;
  const css = `      #${id} .bar { position: absolute; ${posCss} bottom: 88px; z-index: 3;
        display: inline-flex; align-items: center; gap: 18px;
        background: ${glass ? "var(--glass-bg)" : "rgba(25, 35, 42, 0.88)"};
        border: ${glass ? "var(--glass-edge)" : "1px solid rgba(255, 255, 255, 0.14)"};
        ${glass ? "backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);" : ""}
        ${shape} padding: 18px 34px 18px 24px;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.4); }
      #${id} .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--lime);
        box-shadow: 0 0 12px rgba(var(--lime-rgb), 0.7); ${p.dot ? "" : "display: none;"} }
      #${id} .text { display: flex; flex-direction: column; gap: 3px; }
      #${id} .name { font-family: var(--font-mono); font-weight: var(--wt-bold); font-size: 26px;
        letter-spacing: 0.06em; text-transform: uppercase; color: ${glass ? "var(--lime-soft)" : "var(--white)"}; }
      #${id} .name .ch { display: inline-block; }
      #${id} .role { font-weight: var(--wt-med); font-size: 17px; letter-spacing: 0.14em;
        text-transform: uppercase; color: rgba(255, 255, 255, 0.55); font-family: var(--font-body);
        ${p.role ? "" : "display: none;"} }`;
  const body = `      <div class="bar">
        <div class="dot"></div>
        <div class="text">
          <div class="name" data-slot="name">NATE HERK</div>
          <div class="role" data-slot="role">AI AUTOMATION</div>
        </div>
      </div>`;
  const js = `      splitChars(document.querySelector(root + " .name"));
      tl.from(root + " .bar", { autoAlpha: 0, ${p.pos === "center" ? "y: 40" : `x: ${p.pos === "left" ? -60 : 60}`}, duration: 0.5, ease: "expo.out" }, 0.1);
      ${p.dot ? `tl.fromTo(root + " .dot", { scale: 0.4 }, { scale: 1, duration: 0.4, ease: "back.out(2.5)" }, ${(0.3 * b).toFixed(2)});` : ""}
      tl.from(root + " .name .ch", { autoAlpha: 0, duration: 0.01, stagger: 0.03, ease: "none" }, ${(0.5 * b).toFixed(2)});
      ${p.role ? `tl.from(root + " .role", { autoAlpha: 0, y: 6, duration: 0.35, ease: "power2.out" }, ${(1.05 * b).toFixed(2)});` : ""}
${holdJs(5.5)}`;
  return {
    id: `higgsfield.t2.lower-third.v${String(seq).padStart(3, "0")}`,
    tier: "tier2", purpose: "lower-third", treatment,
    slots: [{ name: "name", type: "text", maxChars: 22 },
      ...(p.role ? [{ name: "role", type: "text", maxChars: 28 }] : [])],
    duration: { min: 4, max: 7 },
    file: `cards/variants/t2-lowerthird/${id}.html`,
    html: shell({ id, comment: `lower-third · ${treatment}`, css, body, js }),
  };
}

/* ---------------- custom: pip frame -------------------------------------- */
export function buildPip(p, seq) {
  const id = cid("pip", seq);
  const [w, h] = p.size === "big" ? [340, 270] : [300, 240];
  const corner = { br: "right: 60px; bottom: 60px;", bl: "left: 60px; bottom: 60px;", tr: "right: 60px; top: 60px;", tl: "left: 60px; top: 60px;" }[p.corner];
  const pillSide = p.corner.includes("r") ? `right: ${w + 80}px;` : `left: ${w + 80}px;`;
  const pillV = p.corner.includes("b") ? "bottom: 92px;" : "top: 92px;";
  const glass = p.skin === "glass";
  const treatment = `${p.corner}-${p.size}-${p.skin}${p.pill ? "-pill" : ""}`;
  const css = `      #${id} { font-family: var(--font-mono); }
      #${id} .pip { position: absolute; ${corner} z-index: 3; width: ${w}px; height: ${h}px;
        border-radius: var(--radius-pip);
        background: ${glass ? "var(--glass-bg)" : "rgba(25, 35, 42, 0.55)"};
        ${glass ? "backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);" : ""}
        border: 2px solid rgba(255, 255, 255, 0.22);
        box-shadow: 0 22px 48px rgba(0, 0, 0, 0.5); }
      #${id} .pill { position: absolute; ${pillSide} ${pillV} z-index: 3;
        font-weight: var(--wt-bold); font-size: var(--size-tiny);
        letter-spacing: 0.08em; text-transform: uppercase;
        color: var(--charcoal); background: var(--lime);
        border-radius: var(--radius-sm); padding: 12px 20px;
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35); ${p.pill ? "" : "display: none;"} }`;
  const body = `      <div class="pip"></div>
      <div class="pill" data-slot="pill">GENERATING...</div>`;
  const js = `      tl.from(root + " .pip", { autoAlpha: 0, y: ${p.corner.includes("b") ? 60 : -60}, scale: 0.9, duration: 0.5, ease: "expo.out" }, 0.1);
      ${p.pill ? `tl.from(root + " .pill", { autoAlpha: 0, x: ${p.corner.includes("r") ? 40 : -40}, duration: 0.4, ease: "back.out(1.9)" }, 0.5);
      tl.to(root + " .pill", { scale: 1.04, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: 3 }, 1.0);` : ""}
${holdJs(8)}`;
  return {
    id: `higgsfield.custom.pip.v${String(seq).padStart(3, "0")}`,
    tier: "custom", purpose: "pip", treatment,
    slots: p.pill ? [{ name: "pill", type: "text", maxChars: 18 }] : [],
    duration: { min: 6, max: 30 },
    file: `cards/variants/cx-pip/${id}.html`,
    html: shell({ id, comment: `speaker PIP frame · ${treatment}`, css, body, js }),
  };
}

/* ---------------- custom: ui highlight ring ------------------------------ */
export function buildHighlight(p, seq) {
  const id = cid("highlight", seq);
  const chipPos = { tl: "left: var(--hx); top: calc(var(--hy) - 54px);", tr: "left: calc(var(--hx) + var(--hw) - 180px); top: calc(var(--hy) - 54px);",
    bl: "left: var(--hx); top: calc(var(--hy) + var(--hh) + 12px);", br: "left: calc(var(--hx) + var(--hw) - 180px); top: calc(var(--hy) + var(--hh) + 12px);" }[p.chipPos];
  const treatment = `chip-${p.chipPos}-scrim-${p.scrim}${p.pulse ? "-pulse" : ""}`;
  const css = `      #${id} { font-family: var(--font-mono); --hx: 640px; --hy: 380px; --hw: 640px; --hh: 320px; }
      #${id} .scrim { position: absolute; background: rgba(0, 0, 0, ${p.scrim === "heavy" ? 0.55 : 0.42}); z-index: 2; }
      #${id} .scrim.top { left: 0; right: 0; top: 0; height: var(--hy); }
      #${id} .scrim.bottom { left: 0; right: 0; top: calc(var(--hy) + var(--hh)); bottom: 0; }
      #${id} .scrim.left { left: 0; width: var(--hx); top: var(--hy); height: var(--hh); }
      #${id} .scrim.right { left: calc(var(--hx) + var(--hw)); right: 0; top: var(--hy); height: var(--hh); }
      #${id} .ring { position: absolute; z-index: 3; left: var(--hx); top: var(--hy);
        width: var(--hw); height: var(--hh);
        border: ${p.ringW}px solid var(--lime); border-radius: var(--radius-sm);
        box-shadow: 0 0 22px rgba(var(--lime-rgb), 0.5), inset 0 0 22px rgba(var(--lime-rgb), 0.18); }
      #${id} .chip { position: absolute; z-index: 4; ${chipPos}
        font-weight: var(--wt-bold); font-size: var(--size-tiny);
        letter-spacing: 0.08em; text-transform: uppercase;
        color: var(--charcoal); background: var(--lime);
        border-radius: 8px; padding: 10px 18px; }`;
  const body = `      <div class="scrim top"></div><div class="scrim bottom"></div>
      <div class="scrim left"></div><div class="scrim right"></div>
      <div class="ring"></div>
      <div class="chip" data-slot="label">CLICK HERE</div>`;
  const js = `      tl.from(root + " .scrim", { autoAlpha: 0, duration: 0.35, ease: "power2.out" }, 0.1);
      tl.from(root + " .ring", { autoAlpha: 0, scale: 1.12, duration: 0.4, ease: "expo.out" }, 0.25);
      tl.from(root + " .chip", { autoAlpha: 0, y: ${p.chipPos.startsWith("t") ? 12 : -12}, duration: 0.32, ease: "back.out(1.9)" }, 0.6);
      ${p.pulse ? `tl.to(root + " .ring", { scale: 1.02, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, 1.0);` : ""}
${holdJs(5)}`;
  return {
    id: `higgsfield.custom.highlight.v${String(seq).padStart(3, "0")}`,
    tier: "custom", purpose: "highlight", treatment,
    slots: [{ name: "label", type: "text", maxChars: 18 }],
    duration: { min: 3, max: 8 },
    file: `cards/variants/cx-highlight/${id}.html`,
    html: shell({ id, comment: `UI highlight ring · ${treatment}`, css, body, js }),
  };
}
