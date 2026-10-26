/* editing-os/public/editor.js
 * Retouche visuelle d'une composition : scène jouable, timeline en pistes,
 * inspecteur de propriétés.
 *
 * Trois choses le rendent possible, et aucune n'allait de soi.
 *
 * 1. LA LECTURE. Une composition n'embarque pas le moteur : elle charge GSAP et
 *    pose sa timeline sur window.__timelines, rien de plus. C'est le serveur qui
 *    injecte le runtime HyperFrames (voir serveWorkspace dans server.mjs) —
 *    sans lui on n'a que des images animées, sans média ni son, et aucune
 *    lecture possible. Une fois injecté, window.__player donne
 *    play/pause/seek/getTime, la synchro des <video> et le mixeur WebAudio des
 *    <audio>. On ne touche alors PLUS __timelines à la main : le runtime la
 *    possède et la réécrit à chaque image.
 *
 * 2. LES PISTES. `data-track-index` n'est pas une piste au sens du monteur :
 *    c'est un ordre de superposition. Le prendre pour une piste donne 50
 *    rangées, dont 41 pour des bruitages de 0,15 s. Les rangées d'ici viennent
 *    du RÔLE de l'élément — parole, détourage, b-roll, texte, voix, ambiance,
 *    bruitage — d'après des règles vérifiées sur les compositions du workspace :
 *    la vidéo parole partage son src avec un <audio>, le détourage est un .webm
 *    aux timings identiques, l'ambiance d'un b-roll partage le src de sa vidéo
 *    avec un volume ≤ 0,25, les bruitages vivent sous assets/sfx/ ou n'ont pas
 *    de durée.
 *
 * 3. LES BLOCS FANTÔMES. Dans un reel, l'essentiel du visuel n'a pas de
 *    data-start : ce sont des animations GSAP. On lit leur étendue dans la
 *    timeline pour les faire apparaître quand même — mais on refuse de les
 *    déplacer, parce qu'une valeur écrite là serait réécrite à l'image d'après.
 */
(function () {
  "use strict";

  var FPS = 30;
  var state = null;
  var globalsWired = false;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }

  /* Le moteur, quand il tourne dans une iframe, TAMPONNE un data-start="0" et
     un data-duration égal à la durée totale sur tout élément qui n'en a pas —
     108 éléments sur le reel de référence. Il les marque `data-hf-autostamped`.
     Ces timings n'existent pas dans la source : les lire revient à inventer des
     clips pleine longueur, et les ÉCRIRE transformerait une animation en clip
     chronométré, qui disparaîtrait du début de la vidéo au rendu. Partout où on
     parle de timing, on ne considère donc que les attributs authentiques. */
  function stamped(el) { return el.hasAttribute("data-hf-autostamped"); }
  function realAttr(el, name) { return stamped(el) ? null : el.getAttribute(name); }
  // Un data-start peut aussi être relatif ("intro + 2") : légal au rendu, mais
  // ce n'est pas un nombre — on l'affiche sans jamais le réécrire.
  function isNumeric(v) { return v !== null && v !== "" && isFinite(parseFloat(v)) && /^[\s\d.+-]+$/.test(v); }
  function px(v) { return Math.round(num(v) * 10) / 10; }
  function q(id) { return document.getElementById(id); }
  // Un temps qui ne tombe pas sur une image est un mensonge : on quantifie.
  function frames(t) { return Math.round(t * FPS) / FPS; }

  function api(path) {
    return fetch(path, { headers: { accept: "application/json" } }).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (b) {
        throw new Error(b.error || "HTTP " + r.status);
      });
      return r.json();
    });
  }

  // ═══ vue ══════════════════════════════════════════════════════════════════

  function render(host, slug) {
    state = {
      slug: slug, file: "index.html", files: [],
      sel: null, edits: {}, time: 0, duration: 0, scale: 1,
      player: null, playing: false, pps: 20, lanes: [], clips: [], muted: false,
    };

    host.innerHTML =
      '<div class="ed-head">' +
        '<a class="rev-btn" href="#/project/' + encodeURIComponent(slug) + '">&#8592; Le projet</a>' +
        '<select class="select" id="ed-file"></select>' +
        '<span class="ed-dirty" id="ed-dirty"></span>' +
        '<button type="button" class="btn btn-sm" id="ed-reset" disabled>Annuler</button>' +
        '<button type="button" class="btn btn-primary btn-sm" id="ed-save" disabled>Appliquer</button>' +
        '<button type="button" class="btn btn-sm" id="ed-render">Rendre</button>' +
      "</div>" +

      '<div class="ed-body">' +
        '<div class="ed-left">' +
          '<div class="ed-stage" id="ed-stage">' +
            '<div class="ed-scaler" id="ed-scaler">' +
              '<iframe id="ed-frame" title="Composition" allow="autoplay; fullscreen"></iframe>' +
              '<div class="ed-box" id="ed-box" hidden></div>' +
            "</div>" +
          "</div>" +
          '<div class="ed-transport">' +
            '<button type="button" class="tbtn" id="ed-home" title="Début">&#9198;</button>' +
            '<button type="button" class="tbtn" id="ed-fb" title="Image précédente (&#8592;)">&#9664;</button>' +
            '<button type="button" class="tbtn play" id="ed-play" title="Lecture (Espace)">&#9654;</button>' +
            '<button type="button" class="tbtn" id="ed-ff" title="Image suivante (&#8594;)">&#9654;</button>' +
            '<button type="button" class="tbtn" id="ed-end" title="Fin">&#9197;</button>' +
            '<span class="ed-time tnum" id="ed-tc">0:00.00</span>' +
            '<button type="button" class="tbtn" id="ed-mute" title="Couper le son">&#9834;</button>' +
          "</div>" +
        "</div>" +

        '<div class="ed-tl">' +
          '<div class="tl-scroll" id="tl-scroll">' +
            '<div class="tl-inner" id="tl-inner">' +
              '<div class="tl-ruler" id="tl-ruler"></div>' +
              '<div class="tl-lanes" id="tl-lanes"></div>' +
              '<div class="tl-playhead" id="tl-playhead"></div>' +
            "</div>" +
          "</div>" +
          '<div class="tl-foot">' +
            '<span class="tl-hint" id="tl-count"></span>' +
            '<label class="tl-zoom">zoom<input type="range" id="tl-zoom" min="0" max="100" value="20" /></label>' +
            '<button type="button" class="btn btn-sm" id="tl-fit">Ajuster</button>' +
          "</div>" +
        "</div>" +

        '<div class="ed-panel" id="ed-panel"><div class="ed-empty">Clique un élément, ' +
          "dans l'image ou dans la timeline.</div></div>" +
      "</div>";

    wireChrome();
    // Les écouteurs de fenêtre ne se posent qu'une fois pour la vie de la page :
    // sans ça, chaque aller-retour vers l'éditeur en empilait une couche de plus
    // (glisser déplaçait par bonds, l'espace jouait deux fois).
    if (!globalsWired) { wireDrag(); wireKeys(); globalsWired = true; }
    loadFiles();
  }

  // ═══ chargement ═══════════════════════════════════════════════════════════

  function loadFiles() {
    api("/api/project/" + encodeURIComponent(state.slug)).then(function (p) {
      var files = ["index.html"].concat((p.compositions || []).map(function (c) {
        return "compositions/" + c + ".html";
      }));
      state.files = files;
      q("ed-file").innerHTML = files.map(function (f) {
        return '<option value="' + esc(f) + '">' + esc(f) + "</option>";
      }).join("");
      q("ed-file").value = state.file;
      state.lastRender = p.preview ? p.preview.file : null;
      loadFrame();
    }).catch(function (e) {
      setPanel('<div class="ed-empty">Projet illisible : ' + esc(e.message) + "</div>");
    });
  }

  function loadFrame() {
    var f = q("ed-frame");
    hideBox();
    stopClock();
    if (state.stampWatcher) { state.stampWatcher.disconnect(); state.stampWatcher = null; }
    state.player = null; state.playing = false;
    setPanel('<div class="ed-empty">Chargement du moteur…</div>');
    f.onload = onFrameLoad;
    f.src = "/workspace/video-projects/" + encodeURIComponent(state.slug) + "/" +
      state.file.split("/").map(encodeURIComponent).join("/") + "?t=" + Date.now();
  }

  // Le runtime démarre sur DOMContentLoaded puis capture la timeline dans sa
  // propre boucle : on le sonde, comme le fait le lecteur officiel.
  function waitForPlayer(cb) {
    var n = 0;
    var iv = setInterval(function () {
      n++;
      var f = q("ed-frame");
      var p = null;
      try { p = f && f.contentWindow && f.contentWindow.__player; } catch (e) { p = null; }
      if (p && typeof p.getDuration === "function" && p.getDuration() > 0) { clearInterval(iv); cb(p); return; }
      if (n >= 40) { clearInterval(iv); cb(null); }     // 8 s, comme le lecteur officiel
    }, 200);
  }

  function onFrameLoad() {
    var f = q("ed-frame");
    var d = f.contentDocument;
    if (!d) return;

    var root = d.querySelector("[data-composition-id]");
    state.compId = root ? root.getAttribute("data-composition-id") : null;
    state.W = root ? Number(root.getAttribute("data-width")) || 1080 : 1080;
    state.H = root ? Number(root.getAttribute("data-height")) || 1920 : 1920;
    f.style.width = state.W + "px";
    f.style.height = state.H + "px";
    fitStage();

    watchStamps(d);        // dès maintenant : le moteur peut tamponner à tout instant

    d.addEventListener("click", function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      select(ev.target);
    }, true);

    waitForPlayer(function (p) {
      if (!p) {
        setPanel('<div class="ed-empty">Moteur HyperFrames introuvable : la lecture est ' +
          "désactivée. La composition s'affiche quand même.</div>");
        buildTimeline();
        return;
      }
      state.player = p;
      state.duration = p.getDuration();
      watchStamps(d);                    // voir plus bas : le moteur tamponne après coup
      bridge("set-muted", { muted: !!state.muted });
      bridge("set-volume", { volume: 1 });
      p.seek(0);
      p.seek(state.time || 0);             // par 0 : GSAP rejoue les états initiaux
      paintTime();
      buildTimeline();
      setPanel('<div class="ed-empty">Clique un élément, dans l\'image ou dans la timeline.</div>');
      replayPending();
    });
  }

  /* Le moteur, en iframe, tamponne data-start="0" + data-duration=<durée totale>
     sur tout élément qui n'en a pas, et pilote ensuite leur visibilité d'après
     ces valeurs. Résultat : quarante panneaux qui n'entrent qu'à la moitié du
     reel sont affichés dès la première image — l'aperçu ne ressemble plus au
     rendu, et on croit son projet abîmé alors que le fichier n'a pas bougé.
     On retire donc ces attributs inventés : privés d'eux, le moteur laisse ces
     éléments tranquilles et GSAP seul les anime, exactement comme au rendu. */
  function unstamp(d) {
    var n = 0;
    Array.prototype.forEach.call(d.querySelectorAll("[data-hf-autostamped]"), function (el) {
      el.removeAttribute("data-start");
      el.removeAttribute("data-duration");
      el.removeAttribute("data-hf-autostamped");
      // Le moteur a figé une visibilité en ligne sur ces éléments. La laisser,
      // c'est garder des plans ultérieurs affichés dès la première image. On
      // l'efface et on rend la main à GSAP, seul maître de ces éléments — comme
      // au rendu, où ce tamponnage n'a pas lieu.
      if (el.style && el.style.visibility) el.style.visibility = "";
      n++;
    });
    return n;
  }

  /* Le tamponnage n'a pas lieu au chargement : il arrive après, quand le moteur
     lie la composition. Un nettoyage unique passe donc à côté. On observe
     l'apparition de l'attribut et on nettoie à la source, sans sondage. */
  function watchStamps(d) {
    if (state.stampWatcher) { state.stampWatcher.disconnect(); state.stampWatcher = null; }
    unstamp(d);
    var obs = new MutationObserver(function (muts) {
      var touche = false;
      muts.forEach(function (m) {
        if (m.type === "attributes" && m.attributeName === "data-hf-autostamped" &&
            m.target.hasAttribute && m.target.hasAttribute("data-hf-autostamped")) touche = true;
      });
      if (!touche) return;
      if (unstamp(d) && state.player) {
        // Repasser par 0 : GSAP ne rejoue l'état initial d'un élément qu'en
        // revenant en arrière. Sans ce détour, les éléments libérés gardent
        // l'apparence que le moteur leur avait imposée.
        var t = state.player.getTime();
        state.player.seek(0);
        state.player.seek(t, { keepPlaying: true });
      }
      if (state.clips && state.clips.length) buildTimeline();
    });
    obs.observe(d.documentElement, { subtree: true, attributes: true,
      attributeFilter: ["data-hf-autostamped"] });
    state.stampWatcher = obs;
  }

  // Le pont postMessage : seul chemin pour le volume et le mute.
  function bridge(action, payload) {
    var f = q("ed-frame");
    try {
      f.contentWindow.postMessage(
        Object.assign({}, payload || {}, { source: "hf-parent", type: "control", action: action }), "*");
    } catch (e) { /* iframe pas prête */ }
  }

  window.addEventListener("message", function (e) {
    if (!state) return;
    var f = q("ed-frame");
    if (!f || e.source !== f.contentWindow) return;
    var d = e.data;
    if (!d || d.source !== "hf-preview") return;
    if (d.type === "timeline" && d.durationSeconds > 0) {
      state.duration = d.durationSeconds;
      paintTime(); layoutTimeline();
    }
    if (d.type === "state") {
      state.time = (d.frame || 0) / FPS;
      state.playing = !!d.isPlaying;
      paintTime(); paintPlaying();
    }
    if (d.type === "media-autoplay-blocked") {
      toast("Le navigateur a bloqué le son — clique sur lecture pour l'autoriser.");
    }
  });

  // ═══ transport ════════════════════════════════════════════════════════════

  // L'horloge d'interface ne fait que LIRE le temps du moteur. Un intervalle et
  // non requestAnimationFrame : rAF se met en pause dès que l'onglet passe en
  // arrière-plan, alors que la composition, elle, continue de jouer — le
  // compteur et la tête de lecture se figeaient en donnant l'impression que
  // rien ne se passait.
  var clock = null;
  function startClock() {
    stopClock();
    clock = setInterval(function () {
      var p = state.player;
      if (!p) { stopClock(); return; }
      state.time = p.getTime();
      paintTime();
      if (!p.isPlaying()) { stopClock(); state.playing = false; paintPlaying(); }
    }, 1000 / 30);
  }
  function stopClock() { if (clock) clearInterval(clock); clock = null; }

  function fmtTime(t) {
    var s = Math.max(0, t || 0);
    return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0") +
      "." + String(Math.floor((s % 1) * 100)).padStart(2, "0");
  }
  function paintTime() {
    var tc = q("ed-tc");
    if (tc) tc.textContent = fmtTime(state.time) + " / " + fmtTime(state.duration);
    movePlayhead();
  }
  function paintPlaying() {
    var b = q("ed-play");
    if (b) { b.innerHTML = state.playing ? "&#10073;&#10073;" : "&#9654;"; b.classList.toggle("on", state.playing); }
  }

  function seek(t, keepPlaying) {
    var p = state.player;
    state.time = Math.max(0, Math.min(t, state.duration || 0));
    if (p) {
      p.seek(state.time, keepPlaying ? { keepPlaying: true } : undefined);
      state.time = p.getTime();      // le runtime quantifie : on relit
    }
    paintTime(); drawBox();
    // « La pile » décrit ce qui est à l'écran À CET INSTANT : elle doit suivre
    // le déplacement. On ne la redessine pas pendant la lecture (30 fois par
    // seconde pour rien, et on perdrait le focus d'un champ en cours de saisie).
    if (state.sel && !state.playing) drawPanel();
  }

  function wireChrome() {
    q("ed-file").onchange = function () {
      if (dirtyCount() && !confirm("Des retouches ne sont pas appliquées. Changer de composition ?")) {
        this.value = state.file; return;
      }
      state.file = this.value; state.edits = {}; state.time = 0;
      markDirty(); loadFrame();
    };
    q("ed-save").onclick = save;
    q("ed-reset").onclick = function () { state.edits = {}; markDirty(); loadFrame(); };

    // play() doit être appelé SYNCHRONEMENT dans le geste : l'horloge est
    // asservie à l'AudioContext, qui reste suspendu sans clic direct.
    q("ed-play").onclick = function () {
      var p = state.player; if (!p) { toast("Moteur pas encore prêt."); return; }
      if (p.isPlaying()) { p.pause(); stopClock(); state.playing = false; paintPlaying(); return; }
      if (state.duration && p.getTime() >= state.duration - 0.001) p.seek(0);
      p.play();
      state.playing = true; paintPlaying(); startClock();
    };
    q("ed-home").onclick = function () { seek(0); };
    q("ed-end").onclick = function () { seek(state.duration); };
    q("ed-fb").onclick = function () { seek(state.time - 1 / FPS); };
    q("ed-ff").onclick = function () { seek(state.time + 1 / FPS); };
    q("ed-mute").onclick = function () {
      state.muted = !state.muted;
      bridge("set-muted", { muted: state.muted });
      this.classList.toggle("off", state.muted);
    };

    q("tl-zoom").oninput = function () {
      var min = 4, max = 400;                      // px par seconde
      state.pps = min * Math.pow(max / min, Number(this.value) / 100);
      layoutTimeline();
    };
    q("tl-fit").onclick = fitTimeline;

    q("ed-render").onclick = function () {
      var b = this;
      if (dirtyCount() && !confirm("Des retouches ne sont pas appliquées. Rendre quand même ?")) return;
      b.disabled = true; b.textContent = "Rendu…";
      var body = { slug: state.slug, action: "render-verify" };
      if (state.file.indexOf("compositions/") === 0) {
        body.composition = state.file.slice("compositions/".length).replace(/\.html$/, "");
      } else if (state.lastRender) {
        // sans composition dédiée, on donne le dernier rendu du projet : c'est
        // lui qui nomme le livrable, sinon le rendu fabrique un « draft »
        // fantôme à côté des vraies versions
        body.file = state.lastRender;
      }
      fetch("/api/run", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (x) { return { ok: r.ok, x: x }; }); })
        .then(function (r) {
          if (!r.ok) throw new Error(r.x.error || "refusé");
          pollRender(r.x.job.id, b);
        })
        .catch(function (e) { b.disabled = false; b.textContent = "Rendre"; toast("Rendu : " + e.message); });
    };

    window.addEventListener("resize", function () { fitStage(); layoutTimeline(); });
  }

  function pollRender(id, btn) {
    fetch("/api/job/" + encodeURIComponent(id) + "?since=0").then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.status === "running") {
          btn.textContent = j.stepLabel + "…";
          setTimeout(function () { pollRender(id, btn); }, 1500);
          return;
        }
        btn.disabled = false; btn.textContent = "Rendre";
        toast(j.status === "done" ? "Nouveau rendu prêt — il est sur la page du projet."
          : "Rendu " + j.status + " — voir la page du projet.");
      })
      .catch(function () { btn.disabled = false; btn.textContent = "Rendre"; });
  }

  function wireKeys() {
    window.addEventListener("keydown", function (ev) {
      if (!state || !document.getElementById("ed-frame")) return;   // vue quittée
      var t = document.activeElement;
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;

      if (ev.code === "Space") { ev.preventDefault(); q("ed-play").click(); return; }
      if (ev.key === "Home") { ev.preventDefault(); seek(0); return; }
      if (ev.key === "End") { ev.preventDefault(); seek(state.duration); return; }
      if (ev.key === "Escape") { hideBox(); setPanel('<div class="ed-empty">Rien de sélectionné.</div>'); return; }

      // Sans sélection, les flèches naviguent dans le temps ; avec une
      // sélection, elles déplacent l'élément. La sélection lève l'ambiguïté.
      var map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      var d = map[ev.key];
      if (!d) return;
      ev.preventDefault();
      if (!state.sel) {
        if (d[1] === 0) seek(state.time + d[0] * (ev.shiftKey ? 1 : 1 / FPS));
        return;
      }
      var el = state.sel;
      var cur = parseTranslate(el.style.translate ||
        q("ed-frame").contentWindow.getComputedStyle(el).translate);
      var k = ev.shiftKey ? 10 : 1;
      applyTranslate(el, cur.x + d[0] * k, cur.y + d[1] * k);
      syncFields();
    });
  }

  // ═══ scène ════════════════════════════════════════════════════════════════

  function fitStage() {
    if (!state || !state.W) return;
    var stage = q("ed-stage"), scaler = q("ed-scaler");
    if (!stage || !scaler) return;
    var s = Math.min((stage.clientWidth - 20) / state.W, (stage.clientHeight - 20) / state.H);
    s = Math.max(0.05, Math.min(s, 1));
    state.scale = s;
    scaler.style.width = state.W * s + "px";
    scaler.style.height = state.H * s + "px";
    scaler.style.setProperty("--s", s);
    drawBox();
  }

  function select(el, fromTimeline) {
    var node = el;
    while (node && node.nodeType === 1) {
      if (node.id && !/^hf-/.test(node.id)) break;
      node = node.parentElement;
    }
    if (!node || node.nodeType !== 1 || !node.id) {
      setPanel('<div class="ed-empty">Cet élément n\'a pas d\'<code>id</code> dans la source : ' +
        "impossible de le viser sans risque. Sélectionne son conteneur.</div>");
      hideBox();
      return;
    }
    state.sel = node;
    drawBox();
    drawPanel();
    highlightBlock(node.id);
    if (fromTimeline) scrollBlockIntoView(node.id);
  }

  function drawBox() {
    var box = q("ed-box");
    if (!box || !state || !state.sel) return;
    var f = q("ed-frame");
    if (!f.contentDocument || !f.contentDocument.contains(state.sel)) { hideBox(); return; }
    var r = state.sel.getBoundingClientRect(), s = state.scale;
    box.hidden = false;
    box.style.left = r.left * s + "px"; box.style.top = r.top * s + "px";
    box.style.width = r.width * s + "px"; box.style.height = r.height * s + "px";
  }
  function hideBox() {
    var b = q("ed-box"); if (b) b.hidden = true;
    if (state) state.sel = null;
    highlightBlock(null);
  }

  function parseTranslate(v) {
    var m = String(v || "").trim().match(/^(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?/);
    return m ? { x: parseFloat(m[1]), y: m[2] ? parseFloat(m[2]) : 0 } : { x: 0, y: 0 };
  }

  // `translate` et `scale` sont des propriétés CSS indépendantes de
  // `transform` : elles se COMPOSENT avec l'animation GSAP au lieu de se battre
  // avec elle. C'est ce qui permet de recadrer un élément animé sans toucher à
  // sa timeline, et pour toute la durée du plan.
  function applyTranslate(el, x, y) {
    var v = px(x) + "px " + px(y) + "px";
    stageEdit(el.id, "css", "translate", v);
    el.style.translate = v;
    drawBox(); markDirty();
  }

  function wireDrag() {
    var drag = null;
    // délégué sur le document : la boîte est recréée à chaque entrée dans la vue
    document.addEventListener("mousedown", function (ev) {
      if (!state || !state.sel) return;
      var box = q("ed-box");
      if (!box || ev.target !== box) return;
      var cur = parseTranslate(state.sel.style.translate ||
        q("ed-frame").contentWindow.getComputedStyle(state.sel).translate);
      ev.preventDefault();
      drag = { x0: ev.clientX, y0: ev.clientY, tx: cur.x, ty: cur.y };
      box.classList.add("dragging");
    });
    window.addEventListener("mousemove", function (ev) {
      if (!state || !drag || !state.sel) return;
      var s = state.scale || 1;
      applyTranslate(state.sel, drag.tx + (ev.clientX - drag.x0) / s, drag.ty + (ev.clientY - drag.y0) / s);
      syncFields();
    });
    window.addEventListener("mouseup", function () {
      if (!drag) return;
      drag = null;
      var b = q("ed-box"); if (b) b.classList.remove("dragging");
    });
  }

  function syncFields() {
    if (!state.sel) return;
    var cur = parseTranslate(state.sel.style.translate);
    if (q("ed-tx")) q("ed-tx").value = px(cur.x);
    if (q("ed-ty")) q("ed-ty").value = px(cur.y);
  }

  // ═══ pistes et timeline ═══════════════════════════════════════════════════

  var LANES = [
    { id: "parole", label: "Parole", kind: "video" },
    { id: "cutout", label: "Détourage", kind: "video" },
    { id: "broll", label: "B-roll", kind: "video" },
    { id: "image", label: "Images", kind: "video" },
    { id: "texte", label: "Texte", kind: "gfx" },
    { id: "cartes", label: "Cartes", kind: "gfx" },
    { id: "anim", label: "Animations", kind: "gfx" },
    { id: "voix", label: "Voix", kind: "audio" },
    { id: "ambiance", label: "Ambiance", kind: "audio" },
    { id: "sfx", label: "Bruitages", kind: "audio" },
    { id: "groupes", label: "Groupes", kind: "grp" },
  ];
  function laneLabel(id) {
    var l = LANES.filter(function (x) { return x.id === id; })[0];
    return l ? l.label : id;
  }

  function laneOf(el, ctx) {
    var tag = el.tagName.toLowerCase();
    var src = (el.getAttribute("src") || "").toLowerCase();
    var cls = (el.getAttribute("class") || "").toLowerCase();
    var vol = el.hasAttribute("data-volume") ? num(el.getAttribute("data-volume")) : null;
    var dur = el.hasAttribute("data-duration") ? num(el.getAttribute("data-duration")) : null;

    if (tag === "audio") {
      if (/\/sfx\//.test(src) || dur === null) return "sfx";
      if (vol !== null && vol <= 0.25 && ctx.videoSrc[src]) return "ambiance";
      return "voix";
    }
    if (tag === "video") {
      if (/\.webm($|\?)/.test(src) || /cut/.test(el.id + " " + src)) return "cutout";
      // Partager son src avec un <audio> ne suffit PAS à faire une vidéo de
      // parole : chaque b-roll a son ambiance jumelle, sur le même fichier.
      // Ce qui distingue les deux, c'est le volume de cet audio — une voix est
      // à plein niveau, une ambiance passe sous la voix (≤ 0,25 en pratique).
      if (ctx.voiceSrc[src]) return "parole";
      if (dur !== null && state.duration && dur > state.duration * 0.6) return "parole";
      return "broll";
    }
    if (tag === "img") return "image";
    if (/\b(words|caption|cap|text|sub|karaoke|kword|titre|title)\b/.test(cls + " " + el.id)) return "texte";
    return "cartes";
  }

  // Étendue d'un élément animé sans data-start : on parcourt la timeline et on
  // retient la première et la dernière seconde où GSAP le touche.
  function ghostSpans(w) {
    var out = {};
    // Trouver LA timeline de la composition, dans cet ordre : l'API du runtime,
    // puis la globalTimeline de GSAP. `__timelines` n'est plus fiable une fois
    // le runtime en place — il la remplace par un Proxy, et getMainTimeline()
    // rend null tant que la composition n'est pas liée.
    var tl = null;
    try { tl = state.player && state.player.getMainTimeline && state.player.getMainTimeline(); } catch (e) { tl = null; }
    if (!tl || !tl.getChildren) {
      try {
        var kids = w.gsap && w.gsap.globalTimeline ? w.gsap.globalTimeline.getChildren(true, false, true) : [];
        // la plus longue : c'est la composition, les autres sont des
        // animations ponctuelles posées à côté
        (kids || []).forEach(function (c) {
          if (c.getChildren && (!tl || c.duration() > tl.duration())) tl = c;
        });
      } catch (e) { tl = null; }
    }
    if (!tl || !tl.getChildren) return out;

    function walk(node, offset, depth) {
      if (depth > 6) return;
      var kids;
      try { kids = node.getChildren(false, true, true); } catch (e) { return; }
      (kids || []).forEach(function (c) {
        var st = offset + (c.startTime ? c.startTime() : 0);
        if (c.getChildren) { walk(c, st, depth + 1); return; }
        var targets = [];
        try { targets = c.targets ? c.targets() : []; } catch (e) { targets = []; }
        var end = st + (c.duration ? c.duration() : 0);
        targets.forEach(function (t) {
          if (!t || t.nodeType !== 1 || !t.id || /^hf-/.test(t.id)) return;
          var cur = out[t.id];
          if (!cur) out[t.id] = { el: t, start: st, end: end };
          else { cur.start = Math.min(cur.start, st); cur.end = Math.max(cur.end, end); }
        });
      });
    }
    walk(tl, 0, 0);
    return out;
  }

  function buildTimeline() {
    var f = q("ed-frame");
    var d = f.contentDocument, w = f.contentWindow;
    if (!d) return;

    var ctx = { audioSrc: {}, videoSrc: {}, voiceSrc: {} };
    Array.prototype.forEach.call(d.querySelectorAll("audio[src]"), function (a) {
      var src = a.getAttribute("src").toLowerCase();
      ctx.audioSrc[src] = true;
      var v = a.hasAttribute("data-volume") ? num(a.getAttribute("data-volume")) : 1;
      if (v > 0.5) ctx.voiceSrc[src] = true;
    });
    Array.prototype.forEach.call(d.querySelectorAll("video[src]"), function (v) {
      ctx.videoSrc[v.getAttribute("src").toLowerCase()] = true;
    });

    var clips = [];
    var skip = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, TEMPLATE: 1, NOSCRIPT: 1 };
    Array.prototype.forEach.call(d.querySelectorAll("[data-start]"), function (el) {
      if (el.hasAttribute("data-composition-id") || skip[el.tagName]) return;
      if (stamped(el)) return;                       // timing inventé par le moteur
      var rawStart = el.getAttribute("data-start");
      var start = num(rawStart);
      var dur = el.hasAttribute("data-duration") ? num(el.getAttribute("data-duration")) : null;
      // Un élément chronométré qui en CONTIENT d'autres est une structure, pas
      // un plan : #mewide, #act2, #p5card portent une durée qui couvre tout le
      // reel. Mélangés aux vraies cartes, ils remplissent la piste de barres
      // pleine longueur et on n'y lit plus rien. Ils vont dans leur propre
      // rangée, repliée.
      var isGroup = Array.prototype.some.call(el.querySelectorAll("[data-start]"),
        function (k) { return !stamped(k); });
      clips.push({
        id: el.id || null, el: el, lane: isGroup ? "groupes" : laneOf(el, ctx), start: start,
        end: dur !== null ? start + dur : start + 0.3,
        ghost: false, oneShot: dur === null, group: isGroup,
        relative: !isNumeric(rawStart),
        label: el.id || el.tagName.toLowerCase(),
      });
    });

    // les animations : bien à l'écran, absentes du DOM chronométré
    var ghosts = ghostSpans(w);
    Object.keys(ghosts).forEach(function (id) {
      var g = ghosts[id];
      if (g.el.hasAttribute("data-start") && !stamped(g.el)) return;
      if (g.end - g.start < 0.05) return;
      var lane = laneOf(g.el, ctx);
      clips.push({
        id: id, el: g.el, lane: lane === "cartes" ? "anim" : lane,
        start: g.start, end: g.end, ghost: true, oneShot: false, label: id,
      });
    });

    // La parole, deuxième passe. Le premier critère (src partagé avec un
    // <audio>) rate le cas où la voix est un fichier à part : dans la pub UGC
    // la parole est découpée en quatre morceaux d'edit.mp4 alors que la voix
    // est un .m4a. La signature qui tient : un clip de détourage a TOUJOURS les
    // mêmes bornes que son clip de parole — c'est la même prise, l'une avec
    // fond, l'autre détourée.
    var cuts = clips.filter(function (c) { return c.lane === "cutout"; });
    if (cuts.length) {
      clips.forEach(function (c) {
        if (c.lane !== "broll") return;
        var jumeau = cuts.some(function (k) {
          return Math.abs(k.start - c.start) < 0.05 && Math.abs(k.end - c.end) < 0.05;
        });
        if (jumeau) c.lane = "parole";
      });
    }

    state.clips = clips;
    var used = {};
    clips.forEach(function (c) { used[c.lane] = (used[c.lane] || 0) + 1; });
    state.lanes = LANES.filter(function (l) { return used[l.id]; })
      .map(function (l) { return { id: l.id, label: l.label, kind: l.kind, count: used[l.id] }; });

    q("tl-count").textContent = clips.length + " éléments · " + state.lanes.length + " pistes";
    // On n'ajuste qu'au premier chargement : reconstruire le modèle après une
    // retouche ne doit pas faire perdre le zoom et le cadrage en cours.
    if (!state.fitted) { state.fitted = true; fitTimeline(); } else layoutTimeline();
  }

  function fitTimeline() {
    var w = q("tl-scroll").clientWidth - 150;      // la gouttière ne compte pas
    state.pps = Math.max(4, w / Math.max(1, state.duration || 1));
    var z = q("tl-zoom");
    if (z) z.value = String(Math.round(Math.log(state.pps / 4) / Math.log(100) * 100));
    layoutTimeline();
  }

  function layoutTimeline() {
    if (!state || !state.lanes) return;
    var pps = state.pps || 20;
    var W = Math.max(200, (state.duration || 1) * pps);

    // un pas rond qui laisse au moins 60 px entre deux libellés
    var steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60];
    var step = 60;
    for (var i = 0; i < steps.length; i++) { if (steps[i] * pps >= 60) { step = steps[i]; break; } }
    var ticks = "";
    for (var t = 0; t <= (state.duration || 0); t += step) {
      ticks += '<span class="tl-tick" style="left:' + (t * pps) + "px\">" +
        (step >= 1 ? Math.round(t) + "s" : t.toFixed(2) + "s") + "</span>";
    }
    q("tl-ruler").style.width = W + "px";
    q("tl-ruler").innerHTML = ticks;

    var ROW = 26;                     // hauteur d'une sous-rangée
    var html = state.lanes.map(function (lane) {
      // Empilement : deux éléments qui se chevauchent dans le temps vont sur
      // deux sous-rangées. C'est tout l'intérêt d'une timeline — sur une seule
      // ligne, les 50 cartes du reel se recouvrent et ne disent plus rien.
      var items = state.clips.filter(function (c) { return c.lane === lane.id; })
        .slice().sort(function (a, b) { return a.start - b.start || b.end - a.end; });
      var MAXROWS = lane.id === "groupes" ? 2 : 5;   // au-delà, on ne lit plus
      var rowEnds = [];
      items.forEach(function (c) {
        var wPx = Math.max(c.oneShot ? 5 : 3, (c.end - c.start) * pps);
        var leftPx = c.start * pps;
        var rightPx = leftPx + wPx + 2;              // 2 px de marge visuelle
        var r = 0;
        while (r < rowEnds.length && rowEnds[r] > leftPx) r++;
        if (r >= MAXROWS) r = r % MAXROWS;           // on empile à nouveau plutôt que de fuir
        rowEnds[r] = rightPx;
        c._row = r; c._left = leftPx; c._w = wPx;
      });
      var rows = Math.max(1, Math.min(rowEnds.length, MAXROWS));

      var blocks = items.map(function (c) {
        return '<div class="tl-block' + (c.ghost ? " is-ghost" : "") + (c.oneShot ? " is-shot" : "") +
          '" data-cid="' + esc(c.id || "") + '" title="' + esc(c.label) + " · " +
          c.start.toFixed(2) + "s → " + c.end.toFixed(2) + 's" style="left:' + c._left +
          "px;width:" + c._w + "px;top:" + (c._row * ROW + 3) + "px;height:" + (ROW - 6) + 'px">' +
          '<span class="tl-lb">' + esc(c.label) + "</span></div>";
      }).join("");

      return '<div class="tl-lane lane-' + lane.kind + '" style="min-height:' + (rows * ROW + 4) + 'px">' +
        '<div class="tl-gutter"><span>' + esc(lane.label) + "</span><em>" + lane.count + "</em></div>" +
        '<div class="tl-track" style="width:' + W + "px;height:" + (rows * ROW + 4) + 'px">' + blocks + "</div></div>";
    }).join("");
    q("tl-lanes").innerHTML = html;
    q("tl-inner").style.width = (W + 150) + "px";

    Array.prototype.forEach.call(document.querySelectorAll(".tl-block"), function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        var id = b.getAttribute("data-cid");
        if (!id) return;
        var el = q("ed-frame").contentDocument.getElementById(id);
        if (el) select(el, false);
      };
      b.ondblclick = function (ev) {
        ev.stopPropagation();
        var id = b.getAttribute("data-cid");
        var c = state.clips.filter(function (x) { return x.id === id; })[0];
        if (c) seek(c.start + 0.001);
      };
    });
    wireScrub();
    movePlayhead();
    // un re-rendu de la timeline (zoom, ajustement) ne doit pas perdre la
    // sélection en cours
    if (state.sel) highlightBlock(state.sel.id);
  }

  function highlightBlock(id) {
    Array.prototype.forEach.call(document.querySelectorAll(".tl-block"), function (b) {
      b.classList.toggle("is-sel", !!id && b.getAttribute("data-cid") === id);
    });
  }
  function scrollBlockIntoView(id) {
    var b = document.querySelector('.tl-block[data-cid="' + id + '"]');
    if (b && b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function movePlayhead() {
    var ph = q("tl-playhead");
    if (!ph || !state) return;
    ph.style.left = (150 + (state.time || 0) * (state.pps || 20)) + "px";
  }

  function wireScrub() {
    var ruler = q("tl-ruler");
    if (!ruler || ruler.dataset.wired) return;
    ruler.dataset.wired = "1";
    var dragging = false, wasPlaying = false;

    function toTime(ev) {
      var r = ruler.getBoundingClientRect();
      return Math.max(0, Math.min((ev.clientX - r.left) / (state.pps || 20), state.duration || 0));
    }
    ruler.addEventListener("pointerdown", function (ev) {
      dragging = true;
      wasPlaying = !!(state.player && state.player.isPlaying());
      if (wasPlaying && state.player) { state.player.pause(); stopClock(); state.playing = false; paintPlaying(); }
      if (ruler.setPointerCapture) ruler.setPointerCapture(ev.pointerId);
      seek(toTime(ev));
    });
    ruler.addEventListener("pointermove", function (ev) { if (dragging) seek(toTime(ev), true); });
    function up() {
      if (!dragging) return;
      dragging = false;
      if (wasPlaying && state.player) { state.player.play(); state.playing = true; paintPlaying(); startClock(); }
      wasPlaying = false;
    }
    ruler.addEventListener("pointerup", up);
    ruler.addEventListener("pointercancel", up);
  }

  // ═══ inspecteur ═══════════════════════════════════════════════════════════

  function setPanel(html) { var p = q("ed-panel"); if (p) p.innerHTML = html; }

  // GSAP a ses alias : autoAlpha pilote l'opacité ET la visibilité, x/y le
  // déplacement, scaleX/scaleY l'échelle. Sans les déplier, on proposait un
  // champ « Opacité » sur un élément dont l'opacité est animée — la valeur
  // écrite n'aurait aucun effet, mais resterait dans le fichier.
  var GSAP_ALIAS = {
    autoAlpha: ["opacity", "visibility"],
    x: ["translate"], y: ["translate"], xPercent: ["translate"], yPercent: ["translate"],
    scaleX: ["scale"], scaleY: ["scale"],
  };
  var GSAP_IGNORE = ["duration", "ease", "delay", "stagger", "onComplete", "onUpdate", "onStart",
    "parent", "immediateRender", "overwrite", "id", "data", "paused", "repeat", "yoyo",
    "repeatDelay", "runBackwards", "startAt", "keyframes", "css"];

  function tweenedProps(el) {
    var w = q("ed-frame").contentWindow;
    var out = {};
    function add(k) {
      if (GSAP_IGNORE.indexOf(k) !== -1) return;
      out[k] = true;
      (GSAP_ALIAS[k] || []).forEach(function (a) { out[a] = true; });
    }
    try {
      (w.gsap ? w.gsap.getTweensOf(el) : []).forEach(function (t) {
        var v = t.vars || {};
        Object.keys(v).forEach(add);
        // les propriétés cachées dans keyframes / css / startAt comptent autant
        ["keyframes", "css", "startAt"].forEach(function (nest) {
          var n = v[nest];
          if (n && typeof n === "object") {
            (Array.isArray(n) ? n : [n]).forEach(function (o) { Object.keys(o || {}).forEach(add); });
          }
        });
      });
    } catch (e) { /* pas de gsap */ }
    return out;
  }

  function drawPanel() {
    var el = state.sel;
    var cs = q("ed-frame").contentWindow.getComputedStyle(el);
    var animated = tweenedProps(el);
    var pending = (state.edits[el.id] || {}).css || {};
    var tr = parseTranslate(pending.translate !== undefined ? pending.translate : el.style.translate || cs.translate);
    var sc = parseFloat(pending.scale !== undefined ? pending.scale : (el.style.scale || cs.scale)) || 1;
    var start = realAttr(el, "data-start");
    var dur = realAttr(el, "data-duration");
    var relatif = start !== null && !isNumeric(start);
    var sizeLocked = !!(animated.width || animated.height);
    var clip = state.clips.filter(function (c) { return c.id === el.id; })[0];

    function row(label, id, value, unit, locked, step) {
      return '<label class="ed-row' + (locked ? " warn" : "") + '"><span>' + esc(label) + "</span>" +
        '<input type="number" step="' + (step || 1) + '" id="' + id + '" value="' + esc(value) + '"' +
        (locked ? " disabled" : "") + " />" + (unit ? "<em>" + unit + "</em>" : "") + "</label>";
    }

    // La pile : ce qui est à l'écran ICI, du dessus vers le dessous. C'est la
    // réponse directe à « comprendre les éléments qui se superposent ».
    // Ordre d'empilement RÉEL : le z-index calculé, puis l'ordre du document.
    // `data-track-index` est une contrainte de piste au rendu, pas ce que l'œil
    // voit — trier dessus donnait un ordre faux là où on vient justement
    // chercher qui masque qui.
    var w = q("ed-frame").contentWindow;
    var here = state.clips.filter(function (c) {
      return c.start <= state.time + 0.001 && c.end >= state.time - 0.001;
    }).map(function (c) {
      var z = 0;
      try { z = parseInt(w.getComputedStyle(c.el).zIndex, 10) || 0; } catch (e) { z = 0; }
      return { c: c, z: z };
    }).sort(function (a, b) {
      if (b.z !== a.z) return b.z - a.z;
      // à z égal, le dernier dans le document est au-dessus
      return (a.c.el.compareDocumentPosition(b.c.el) & Node.DOCUMENT_POSITION_FOLLOWING) ? 1 : -1;
    }).map(function (x) { return x.c; });
    var pile = here.map(function (c) {
      return '<button type="button" class="ed-pile-row' + (c.id === el.id ? " on" : "") +
        '" data-pid="' + esc(c.id || "") + '"><span class="ed-pile-lane">' + esc(laneLabel(c.lane)) +
        "</span><span>" + esc(c.label) + "</span></button>";
    }).join("");

    setPanel(
      '<div class="ed-sel"><span class="ed-tag">&lt;' + esc(el.tagName.toLowerCase()) + "&gt;</span>" +
        '<span class="ed-id">#' + esc(el.id) + "</span>" +
        (clip && clip.ghost ? '<span class="ed-ghost-tag">animé</span>' : "") + "</div>" +

      (start !== null && !relatif
        ? '<div class="ed-group"><div class="ed-group-h">Timing</div>' +
            row("Entrée", "ed-start", start, "s", false, 1 / FPS) +
            (dur !== null ? row("Durée", "ed-dur", dur, "s", false, 1 / FPS) : "") +
            '<div class="ed-note">Piste de superposition : <code>' +
            esc(el.getAttribute("data-track-index") || "aucune") + "</code></div>" +
            '<div id="ed-overlap"></div>' +
          "</div>"
        : '<div class="ed-group"><div class="ed-group-h">Timing</div><div class="ed-note warn">' +
            (relatif
              ? "Son entrée est <b>relative</b> (<code>" + esc(start) + "</code>), calée sur un autre " +
                "clip. La réécrire en nombre casserait la chaîne — on ne la touche pas d'ici."
              : "Pas de <code>data-start</code> dans la source" +
                (clip && clip.ghost
                  ? " : animé par GSAP de " + clip.start.toFixed(2) + " s à " + clip.end.toFixed(2) + " s."
                  : ".") +
                " Son timing vit dans la timeline, pas dans un attribut — et lui en créer un le " +
                "ferait disparaître du début de la vidéo au rendu.") +
          "</div></div>") +

      '<div class="ed-group"><div class="ed-group-h">Position et échelle</div>' +
        '<div class="ed-note">Glisse dans l\'image, ou règle ici. Le décalage se compose ' +
        "avec l'animation : il vaut pour tout le plan.</div>" +
        row("Décalage X", "ed-tx", px(tr.x), "px") +
        row("Décalage Y", "ed-ty", px(tr.y), "px") +
        row("Échelle", "ed-scale", sc, "×", false, 0.01) +
      "</div>" +

      '<div class="ed-group"><div class="ed-group-h">Taille et opacité</div>' +
        (sizeLocked
          ? '<div class="ed-note warn">Largeur et hauteur sont animées ici — passe par l\'échelle.</div>'
          : row("Largeur", "ed-width", px(cs.width), "px") + row("Hauteur", "ed-height", px(cs.height), "px")) +
        (animated.opacity
          ? '<div class="ed-note warn">L\'opacité est animée : une valeur fixe serait réécrite ' +
            "à l'image suivante.</div>"
          : row("Opacité", "ed-opacity", parseFloat(cs.opacity).toFixed(2), "", false, 0.05)) +
      "</div>" +

      '<div class="ed-group"><div class="ed-group-h">Visibilité</div>' +
        '<label class="ed-check"><input type="checkbox" id="ed-hide"' +
        (((state.edits[el.id] || {}).attrs || {})["data-hidden"] !== undefined
          ? (((state.edits[el.id] || {}).attrs || {})["data-hidden"] !== null ? " checked" : "")
          : (el.hasAttribute("data-hidden") ? " checked" : "")) +
        " /> Masquer cet élément</label>" +
        '<div class="ed-note">Passe par <code>data-hidden</code>, que le moteur respecte — ' +
        "un <code>display:none</code> serait effacé par le moteur à l'image suivante.</div></div>" +

      (pile ? '<div class="ed-group"><div class="ed-group-h">La pile à ' + fmtTime(state.time) + "</div>" +
        '<div class="ed-pile">' + pile + "</div></div>" : "")
    );
    wirePanel(el, animated, sizeLocked);
  }

  function wirePanel(el, animated, sizeLocked) {
    function onAttr(id, name) {
      var input = q(id); if (!input) return;
      input.onchange = function () {
        var v = String(frames(num(this.value)));
        this.value = v;
        stageEdit(el.id, "attrs", name, v);
        el.setAttribute(name, v);
        markDirty(); buildTimeline(); highlightBlock(el.id);
        warnOverlap(el);
      };
    }
    onAttr("ed-start", "data-start");
    onAttr("ed-dur", "data-duration");

    var tx = q("ed-tx"), ty = q("ed-ty");
    function fromFields() { applyTranslate(el, num(tx.value), num(ty.value)); }
    if (tx) tx.oninput = fromFields;
    if (ty) ty.oninput = fromFields;

    var scl = q("ed-scale");
    if (scl) scl.oninput = function () {
      var v = String(num(this.value) || 1);
      stageEdit(el.id, "css", "scale", v);
      el.style.scale = v; drawBox(); markDirty();
    };

    function onCss(id, prop, unit) {
      var input = q(id); if (!input || input.disabled) return;
      input.oninput = function () {
        var v = this.value + (unit || "");
        stageEdit(el.id, "css", prop, v);
        el.style[prop] = v; drawBox(); markDirty();
      };
    }
    if (!sizeLocked) { onCss("ed-width", "width", "px"); onCss("ed-height", "height", "px"); }
    if (!animated.opacity) onCss("ed-opacity", "opacity", "");

    var hide = q("ed-hide");
    if (hide) hide.onchange = function () {
      stageEdit(el.id, "attrs", "data-hidden", this.checked ? "" : null);
      if (this.checked) el.setAttribute("data-hidden", "");
      else el.removeAttribute("data-hidden");
      el.style.visibility = this.checked ? "hidden" : "";   // aperçu immédiat
      drawBox(); markDirty();
    };

    Array.prototype.forEach.call(document.querySelectorAll(".ed-pile-row"), function (b) {
      b.onclick = function () {
        var t = q("ed-frame").contentDocument.getElementById(b.getAttribute("data-pid"));
        if (t) select(t);
      };
    });
  }

  /* Deux clips ne peuvent pas se chevaucher sur la MÊME data-track-index : c'est
     une règle du contrat de rendu, et le lint la refuse. Comme la piste n'est
     pas visible dans la timeline (elle groupe par rôle), on prévient ici plutôt
     que de laisser découvrir l'erreur au rendu suivant. */
  function warnOverlap(el) {
    var ti = el.getAttribute("data-track-index");
    if (ti === null) return;
    var me = state.clips.filter(function (c) { return c.id === el.id; })[0];
    if (!me) return;
    var heurte = state.clips.filter(function (c) {
      if (c.id === el.id || c.ghost) return false;
      if (c.el.getAttribute("data-track-index") !== ti) return false;
      return c.start < me.end - 0.001 && c.end > me.start + 0.001;
    });
    var box = q("ed-overlap");
    if (!box) return;
    box.innerHTML = heurte.length
      ? '<div class="ed-note warn">Chevauchement sur la piste <code>' + esc(ti) + "</code> avec " +
        heurte.map(function (c) { return "<b>" + esc(c.label) + "</b>"; }).join(", ") +
        ". Deux clips ne peuvent pas se superposer sur la même piste — le lint le refusera.</div>"
      : "";
  }

  // ═══ tampon d'édition ═════════════════════════════════════════════════════

  function stageEdit(id, kind, name, value) {
    if (!state.edits[id]) state.edits[id] = {};
    if (!state.edits[id][kind]) state.edits[id][kind] = {};
    state.edits[id][kind][name] = value;
  }
  function dirtyCount() { return Object.keys(state.edits).length; }
  function markDirty() {
    var n = dirtyCount();
    q("ed-save").disabled = !n;
    q("ed-reset").disabled = !n;
    q("ed-dirty").textContent = n ? n + " élément" + (n > 1 ? "s" : "") + " retouché" + (n > 1 ? "s" : "") : "";
  }
  function replayPending() {
    var d = q("ed-frame").contentDocument;
    if (!d) return;
    Object.keys(state.edits).forEach(function (id) {
      var el = d.getElementById(id); if (!el) return;
      var e = state.edits[id];
      Object.keys(e.attrs || {}).forEach(function (k) { el.setAttribute(k, e.attrs[k]); });
      Object.keys(e.css || {}).forEach(function (k) { el.style[k] = e.css[k] === null ? "" : e.css[k]; });
    });
    markDirty();
  }

  function save() {
    var btn = q("ed-save");
    btn.disabled = true;
    var edits = Object.keys(state.edits).map(function (id) {
      return { id: id, attrs: state.edits[id].attrs || {}, css: state.edits[id].css || {} };
    });
    fetch("/api/edit", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: state.slug, file: state.file, edits: edits }) })
      .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, b: b }; }); })
      .then(function (x) {
        if (!x.ok) throw new Error(x.b.error || "écriture refusée");
        state.edits = {}; markDirty(); loadFrame();
        toast(x.b.applied.length + " retouche(s) écrite(s) dans " + state.file);
      })
      .catch(function (e) { btn.disabled = false; toast("Échec : " + e.message); });
  }

  function toast(msg) {
    var t = q("toast"); if (!t) return;
    t.textContent = msg; t.hidden = false; t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); setTimeout(function () { t.hidden = true; }, 220); }, 2600);
  }

  window.EditorView = { render: render };
})();
