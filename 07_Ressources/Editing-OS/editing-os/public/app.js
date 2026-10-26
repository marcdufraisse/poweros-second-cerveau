/* Editing OS - UI (Workstream B)
 * Vanilla JS. Consumes only CONTRACT endpoints. Fixture mode via ?fixture=1.
 */
(function () {
  "use strict";

  var BUILD = String(Date.now());
  var FIXTURE = new URLSearchParams(location.search).get("fixture") === "1";

  // ---------- Canonical stage order + labels ----------
  var STAGES = [
    { id: "source", label: "Source", code: "SRC" },
    { id: "transcript", label: "Transcript", code: "TRN" },
    { id: "silences", label: "Silences", code: "SIL" },
    { id: "mistakes", label: "Mistakes", code: "MIS" },
    { id: "verify", label: "Verify", code: "VER" },
    { id: "motion", label: "Motion", code: "MOT" },
    { id: "broll", label: "B-roll", code: "BRL" },
    { id: "render", label: "Render", code: "RND" },
    { id: "delivered", label: "Delivered", code: "DEL" }
  ];
  var STAGE_LABEL = {};
  STAGES.forEach(function (s) { STAGE_LABEL[s.id] = s.label; });

  // =====================================================================
  // FIXTURE DATA - realistic, exercises every UI state
  // =====================================================================
  var DAY = 86400000, HOUR = 3600000, MIN = 60000;
  var NOW = Date.parse("2026-07-24T09:30:00Z");

  function ev(file, kind, ago) { return { file: file, kind: kind, mtime: NOW - ago }; }
  function stage(id, status, evidence) { return { id: id, status: status, evidence: evidence || [] }; }

  // helper to guarantee all 9 stages present in canonical order
  function stages(map) {
    return STAGES.map(function (s) { return map[s.id] || stage(s.id, "unknown", []); });
  }

  var FX_PROJECTS = [
    // 1. Talking-head, direct evidence, final render, fresh
    {
      slug: "course-p33-workflow",
      name: "Course P3.3 Workflow",
      family: "course",
      archetype: "talking-head",
      utility: false,
      stages: stages({
        source: stage("source", "done", [ev("assets/p33-raw.mp4", "direct", 6 * DAY)]),
        transcript: stage("transcript", "done", [ev("assets/p33-raw.json", "direct", 6 * DAY - 2 * HOUR)]),
        silences: stage("silences", "done", [ev("assets/p33-raw.silence-edl.json", "direct", 5 * DAY)]),
        mistakes: stage("mistakes", "done", [ev("assets/approved-cuts.json", "direct", 5 * DAY - HOUR)]),
        verify: stage("verify", "done", [ev("assets/p33.verify.json", "proxy", 5 * DAY - 2 * HOUR)]),
        motion: stage("motion", "done", [ev("index.html", "direct", 3 * DAY)]),
        broll: stage("broll", "done", [ev("assets/broll/", "direct", 2 * DAY)]),
        render: stage("render", "done", [ev("renders/final.mp4", "direct", 26 * HOUR)]),
        delivered: stage("delivered", "unknown", [])
      }),
      renders: [
        { file: "renders/final.mp4", bytes: 214_800_000, mtime: NOW - 26 * HOUR, kind: "final", durationMs: 512000, stale: false },
        { file: "renders/draft.mp4", bytes: 42_100_000, mtime: NOW - 4 * DAY, kind: "draft", durationMs: 511000, stale: true }
      ],
      staleRender: false,
      lastTouched: NOW - 26 * HOUR,
      hasNotes: true,
      dirSizes: { renders: 256_900_000, assets: 1_940_000_000, total: 2_197_000_000 }
    },
    // 2. Talking-head, PROXY-only (clean.mp4) evidence, no render
    {
      slug: "course-p22-scaling",
      name: "Course P2.2 Scaling",
      family: "course",
      archetype: "talking-head",
      utility: false,
      stages: stages({
        source: stage("source", "done", [ev("assets/clean.mp4", "proxy", 3 * DAY)]),
        transcript: stage("transcript", "done", [ev("assets/p22.json", "direct", 3 * DAY - HOUR)]),
        silences: stage("silences", "done", [ev("assets/clean.mp4", "proxy", 3 * DAY)]),
        mistakes: stage("mistakes", "done", [ev("assets/clean.mp4", "proxy", 3 * DAY)]),
        verify: stage("verify", "done", [ev("assets/clean.mp4", "proxy", 3 * DAY)]),
        motion: stage("motion", "unknown", []),
        broll: stage("broll", "unknown", []),
        render: stage("render", "unknown", []),
        delivered: stage("delivered", "unknown", [])
      }),
      renders: [],
      staleRender: false,
      lastTouched: NOW - 3 * DAY + HOUR,
      hasNotes: false,
      dirSizes: { renders: 0, assets: 880_000_000, total: 881_200_000 }
    },
    // 3. Graphics-only, aucun rendu, talking-head stages n-a
    {
      slug: "summit-testimonials",
      name: "Summit Testimonials",
      family: "summit",
      archetype: "graphics-only",
      utility: false,
      stages: stages({
        source: stage("source", "n-a", []),
        transcript: stage("transcript", "n-a", []),
        silences: stage("silences", "n-a", []),
        mistakes: stage("mistakes", "n-a", []),
        verify: stage("verify", "n-a", []),
        motion: stage("motion", "done", [ev("index.html", "direct", 20 * HOUR), ev("cards/building.html", "direct", 22 * HOUR)]),
        broll: stage("broll", "n-a", []),
        render: stage("render", "unknown", []),
        delivered: stage("delivered", "unknown", [])
      }),
      renders: [],
      staleRender: false,
      lastTouched: NOW - 20 * HOUR,
      hasNotes: true,
      dirSizes: { renders: 0, assets: 34_400_000, total: 35_100_000 }
    },
    // 4. Stale render - source edited after newest render
    {
      slug: "course-vsl",
      name: "Course VSL Edit",
      family: "course",
      archetype: "talking-head",
      utility: false,
      stages: stages({
        source: stage("source", "done", [ev("assets/vsl-raw.mov", "direct", 8 * DAY)]),
        transcript: stage("transcript", "done", [ev("assets/vsl-raw.json", "direct", 8 * DAY)]),
        silences: stage("silences", "done", [ev("assets/vsl-raw.silence-edl.json", "direct", 7 * DAY)]),
        mistakes: stage("mistakes", "partial", [ev("assets/vsl-raw.cut-candidates.json", "direct", 7 * DAY)]),
        verify: stage("verify", "unknown", []),
        motion: stage("motion", "done", [ev("index.html", "direct", 5 * HOUR)]),
        broll: stage("broll", "unknown", []),
        render: stage("render", "done", [ev("renders/course-vsl_2026-07-20_18-20-04.mp4", "direct", 4 * DAY)]),
        delivered: stage("delivered", "unknown", [])
      }),
      renders: [
        { file: "renders/course-vsl_2026-07-20_18-20-04.mp4", bytes: 388_200_000, mtime: NOW - 4 * DAY, kind: "timestamped", durationMs: 903000, stale: true }
      ],
      staleRender: true,
      lastTouched: NOW - 5 * HOUR,
      hasNotes: true,
      dirSizes: { renders: 388_200_000, assets: 2_610_000_000, total: 2_999_000_000 }
    },
    // 5. Delivered project - final/ delivery mp4
    {
      slug: "summit-day1-sizzle",
      name: "Summit Day 1 Opening Sizzle",
      family: "summit",
      archetype: "graphics-only",
      utility: false,
      stages: stages({
        source: stage("source", "n-a", []),
        transcript: stage("transcript", "n-a", []),
        silences: stage("silences", "n-a", []),
        mistakes: stage("mistakes", "n-a", []),
        verify: stage("verify", "n-a", []),
        motion: stage("motion", "done", [ev("index.html", "direct", 9 * DAY)]),
        broll: stage("broll", "n-a", []),
        render: stage("render", "done", [ev("renders/final.mp4", "direct", 8 * DAY), ev("renders/final/day1-sizzle-final.mp4", "direct", 7 * DAY)]),
        delivered: stage("delivered", "done", [ev("renders/final/day1-sizzle-final.mp4", "direct", 7 * DAY)])
      }),
      renders: [
        { file: "renders/final/day1-sizzle-final.mp4", bytes: 96_400_000, mtime: NOW - 7 * DAY, kind: "delivery", durationMs: 32000, stale: false },
        { file: "renders/final.mp4", bytes: 94_200_000, mtime: NOW - 8 * DAY, kind: "final", durationMs: 32000, stale: false }
      ],
      staleRender: false,
      lastTouched: NOW - 7 * DAY,
      hasNotes: true,
      dirSizes: { renders: 190_600_000, assets: 12_800_000, total: 204_100_000 }
    },
    // 6. Utility project (slug starts with _)
    {
      slug: "_broll-test",
      name: "Broll Test",
      family: "misc",
      archetype: "graphics-only",
      utility: true,
      stages: stages({
        motion: stage("motion", "done", [ev("index.html", "direct", 12 * DAY)]),
        source: stage("source", "n-a", []),
        transcript: stage("transcript", "n-a", []),
        silences: stage("silences", "n-a", []),
        mistakes: stage("mistakes", "n-a", []),
        verify: stage("verify", "n-a", []),
        broll: stage("broll", "n-a", []),
        render: stage("render", "unknown", []),
        delivered: stage("delivered", "unknown", [])
      }),
      renders: [],
      staleRender: false,
      lastTouched: NOW - 12 * DAY,
      hasNotes: false,
      dirSizes: { renders: 0, assets: 147_000_000, total: 147_400_000 }
    },
    // 7. Empty / unknown archetype project - nothing detected
    {
      slug: "membership-membership",
      name: "Membership Membership",
      family: "membership",
      archetype: "unknown",
      utility: false,
      stages: stages({}),
      renders: [],
      staleRender: false,
      lastTouched: NOW - 15 * DAY,
      hasNotes: false,
      dirSizes: { renders: 0, assets: 0, total: 4200 }
    },
    // 8. Extra talking-head partial to fill grid, aucun rendu, mid-pipeline
    {
      slug: "summit-day2-reenergize",
      name: "Summit Day 2 Re-Energize",
      family: "summit",
      archetype: "talking-head",
      utility: false,
      stages: stages({
        source: stage("source", "done", [ev("assets/day2-raw.mp4", "direct", 2 * DAY)]),
        transcript: stage("transcript", "done", [ev("assets/day2-raw.json", "direct", 2 * DAY)]),
        silences: stage("silences", "done", [ev("assets/day2-raw.silence-edl.json", "direct", 30 * HOUR)]),
        mistakes: stage("mistakes", "partial", [ev("assets/day2-raw.cut-candidates.json", "direct", 28 * HOUR)]),
        verify: stage("verify", "unknown", []),
        motion: stage("motion", "partial", [ev("assets/day2-raw.beat-candidates.json", "direct", 10 * HOUR)]),
        broll: stage("broll", "unknown", []),
        render: stage("render", "unknown", []),
        delivered: stage("delivered", "unknown", [])
      }),
      renders: [],
      staleRender: false,
      lastTouched: NOW - 10 * HOUR,
      hasNotes: true,
      dirSizes: { renders: 0, assets: 1_120_000_000, total: 1_121_000_000 }
    }
  ];

  function fxSummary() {
    var real = FX_PROJECTS.filter(function (p) { return !p.utility; });
    return {
      projectCount: real.length,
      utilityCount: FX_PROJECTS.length - real.length,
      withRenders: FX_PROJECTS.filter(function (p) { return p.renders.length > 0; }).length,
      staleRenderCount: FX_PROJECTS.filter(function (p) { return p.staleRender; }).length,
      renderBytes: FX_PROJECTS.reduce(function (a, p) { return a + p.dirSizes.renders; }, 0),
      scannedAt: NOW,
      scanMs: 640
    };
  }

  var FIXTURE_STATE = { summary: fxSummary(), projects: FX_PROJECTS.slice() };

  var FIXTURE_NOTES = {
    "course-p33-workflow": "# Course P3.3 Workflow\n\n**Status:** Delivered to Drive 7/23.\n\nFull pipeline: clean cuts (3 verify rounds), Kallaway motion edits, square PIP crop on FULL beats.\n\n## Cuts\n\n- 61 cuts total, 21:15 down to 14:35\n- stretched-token verify gotcha handled\n\n## Renders\n\n| file | quality | notes |\n| --- | --- | --- |\n| final.mp4 | standard | delivered |\n| draft.mp4 | draft | stale |\n",
    "summit-testimonials": "# Summit Testimonials\n\nCommunity testimonial reels (#4 Building / #5 Earning).\n\n**Template:** slideshow placeholder, rounded 16:9 clip slots.\n\n## Swap-in\n\nMiguel Zamarripa swapped for Lutfiya in the building reel. Reel now ~63.92s.\n",
    "course-vsl": "# Course VSL Edit\n\n**v3 Studio render DELIVERED 7/23 8:20pm.**\n\nNOTE: source was re-touched after the render landed, so the render now reads stale. Re-render before final delivery.\n\n## Gotchas\n\n- stale-render trap (render mtime vs asset mtime)\n- keep-range-sliver: union leaves 2-4 frame flashes, MIN_KEEP 0.3 bridge fix\n",
    "summit-day1-sizzle": "# Summit Day 1 Opening Sizzle\n\nDraft scaffold promoted to final. Delivered to Drive Block 1 Assets.\n\n**Duration:** 32s. Doors 8:30 card at tail.\n",
    "summit-day2-reenergize": "# Summit Day 2 Re-Energize\n\nDraft scaffold. Beat candidates staged, motion pass pending review.\n"
  };

  var FIXTURE_LIBRARIES = {
    styles: [
      { id: "vox-explainer", number: 1, name: "Vox Explainer", status: "draft", cardCount: 24, palette: { bg: "#efe9dc", fg: "#17130e", accent: "#37BDF8", red: "#e23b2e", orange: "#f26a1b" }, fonts: { display: "Georgia", body: "Inter", mono: "SF Mono" } },
      { id: "kallaway", number: 2, name: "Kallaway", status: "published", cardCount: 38, palette: { bg: "#0b0b0d", fg: "#f4f4f2", accent: "#37BDF8", red: "#ff4d4d", orange: "#ff8a1f" }, fonts: { display: "Helvetica Neue", body: "Helvetica Neue", mono: null } },
      { id: "summit", number: 3, name: "Summit", status: "published", cardCount: 31, palette: { bg: "#05070c", fg: "#eaf4ff", accent: "#37BDF8", red: "#f0564a", orange: "#f5b942" }, fonts: { display: "Inter", body: "Inter", mono: "SF Mono" } },
      { id: "keynote", number: 4, name: "Keynote", status: "draft", cardCount: 18, palette: { bg: "#0a0a0a", fg: "#ffffff", accent: "#37BDF8", red: null, orange: null }, fonts: { display: "Helvetica Neue", body: "Helvetica Neue", mono: null } },
      { id: "harris", number: 5, name: "Harris", status: "draft", cardCount: 21, palette: { bg: "#12100e", fg: "#f6efe6", accent: "#37BDF8", red: "#d94b3a", orange: "#e88a2a" }, fonts: { display: "Georgia", body: "Inter", mono: null } },
      { id: "fireship", number: 6, name: "Fireship", status: "draft", cardCount: 16, palette: { bg: "#0d1117", fg: "#e6edf3", accent: "#37BDF8", red: "#f85149", orange: "#f0883e" }, fonts: { display: "Inter", body: "Inter", mono: "JetBrains Mono" } },
      { id: "bloomberg", number: 7, name: "Bloomberg", status: "draft", cardCount: 19, palette: { bg: "#000000", fg: "#f2f2f2", accent: "#37BDF8", red: "#ff433d", orange: null }, fonts: { display: "Helvetica Neue", body: "Helvetica Neue", mono: "SF Mono" } },
      { id: "abram", number: 8, name: "Abram", status: "draft", cardCount: 15, palette: { bg: "#111111", fg: "#ededed", accent: "#37BDF8", red: null, orange: "#f5b942" }, fonts: { display: "Inter", body: null, mono: null } },
      { id: "higgsfield", number: 9, name: "Higgsfield", status: "draft", cardCount: 20, palette: { bg: "#0f1109", fg: "#f2f4e8", accent: "#D6FD03", red: null, orange: null }, fonts: { display: "Inter", body: "Inter", mono: null } }
    ],
    styleCount: 9,
    cardCount: 202,
    registryMtime: NOW - 2 * DAY,
    registryStale: true,
    assets: {
      assetCount: 148,
      byType: { logo: 62, video: 41, photo: 33, screenshot: 12 },
      registryMtime: NOW - 5 * DAY
    }
  };

  var FIXTURE_ACTIVITY = {
    branch: "add-testimonial-reels",
    dirtyCount: 34,
    commits: [
      { hash: "5fb92ce", subject: "Add Summit community testimonial reels (#4 Building / #5 Earning)", date: NOW - 6 * HOUR },
      { hash: "e6097cf", subject: "Add Doors-Open Loop (#1) + Summit style library", date: NOW - 2 * DAY },
      { hash: "3070caf", subject: "Add Day 1 Opening Sizzle (#2) draft scaffold", date: NOW - 3 * DAY },
      { hash: "fd9a7e9", subject: "Add Day 2 Re-Energize (#3) draft scaffold", date: NOW - 3 * DAY - 3 * HOUR },
      { hash: "f6441ec", subject: "Add Membership Membership video (#6) draft scaffold", date: NOW - 4 * DAY },
      { hash: "a12bd90", subject: "Wire cut-mistakes review gate into master workflow", date: NOW - 5 * DAY },
      { hash: "b83ee01", subject: "Verify-cuts passing agent: three mandatory passes", date: NOW - 6 * DAY }
    ],
    recentFiles: [
      { path: "summit-testimonials/cards/building.html", mtime: NOW - 5 * HOUR },
      { path: "summit-testimonials/index.html", mtime: NOW - 6 * HOUR },
      { path: "course-vsl/index.html", mtime: NOW - 5 * HOUR },
      { path: "summit-day2-reenergize/assets/day2-raw.beat-candidates.json", mtime: NOW - 10 * HOUR },
      { path: "summit-day1-sizzle/NOTES.md", mtime: NOW - 20 * HOUR },
      { path: "course-p33-workflow/renders/final.mp4", mtime: NOW - 26 * HOUR },
      { path: "membership-membership/index.html", mtime: NOW - 15 * DAY }
    ]
  };

  // =====================================================================
  // Fetch layer
  // =====================================================================
  function api(path) {
    if (FIXTURE) return Promise.resolve(fixtureFor(path));
    return fetch(path, { headers: { accept: "application/json" } }).then(function (r) {
      if (!r.ok) {
        return r.json().catch(function () { return { error: "HTTP " + r.status }; })
          .then(function (b) { throw new Error(b.error || "HTTP " + r.status); });
      }
      return r.json();
    });
  }

  function fixtureFor(path) {
    if (path === "/api/state") return clone(FIXTURE_STATE);
    if (path === "/api/libraries") return clone(FIXTURE_LIBRARIES);
    if (path === "/api/activity") return clone(FIXTURE_ACTIVITY);
    if (path.indexOf("/api/project/") === 0) {
      var slug = decodeURIComponent(path.slice("/api/project/".length));
      var p = FX_PROJECTS.filter(function (x) { return x.slug === slug; })[0];
      if (!p) { var e = new Error("Unknown project: " + slug); throw e; }
      var d = clone(p);
      d.absPath = "<workspace>/video-projects/" + slug;
      d.notes = FIXTURE_NOTES[slug] || null;
      d.hasNotes = !!d.notes;
      d.extraFiles = ["_gen.mjs", "NOTES.md"].filter(function () { return true; });
      return d;
    }
    return {};
  }

  function postRescan() {
    if (FIXTURE) return Promise.resolve({ ok: true, scannedAt: Date.now(), ms: 620 });
    return fetch("/api/rescan", { method: "POST" }).then(function (r) { return r.json(); });
  }
  function postReveal(absPath) {
    if (FIXTURE) return Promise.resolve({ ok: true });
    return fetch("/api/reveal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: absPath })
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (b) { throw new Error(b.error || "reveal failed"); });
      return r.json();
    });
  }

  function postJSON(path, body) {
    if (FIXTURE) return Promise.resolve({ ok: true, moved: [], freedBytes: 0 });
    return fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; })
        .then(function (b) { throw new Error(b.error || "HTTP " + r.status); });
      return r.json();
    });
  }

  // Une confirmation avant tout geste irréversible. Les rendus partent à la
  // corbeille et pas au néant, mais on montre quand même la liste exacte : on
  // ne fait pas disparaître des fichiers d'un projet sans les nommer.
  function confirmDialog(title, bodyHTML, okLabel) {
    return new Promise(function (resolve) {
      var back = document.createElement("div");
      back.className = "player-back";
      back.innerHTML =
        '<div class="confirm-box" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
          '<div class="confirm-head">' + esc(title) + "</div>" +
          '<div class="confirm-body">' + bodyHTML + "</div>" +
          '<div class="confirm-acts">' +
            '<button type="button" class="btn btn-sm" data-no="1">Annuler</button>' +
            '<button type="button" class="btn btn-primary" data-yes="1">' + esc(okLabel) + "</button>" +
          "</div>" +
        "</div>";
      function close(v) {
        document.removeEventListener("keydown", onKey);
        back.remove();
        resolve(v);
      }
      function onKey(e) { if (e.key === "Escape") close(false); }
      back.addEventListener("click", function (e) {
        if (e.target === back || e.target.getAttribute("data-no")) close(false);
        else if (e.target.getAttribute("data-yes")) close(true);
      });
      document.body.appendChild(back);
      document.addEventListener("keydown", onKey);
      var ok = back.querySelector("[data-yes]");
      if (ok) ok.focus();
    });
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // =====================================================================
  // Formatters
  // =====================================================================
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtBytes(n) {
    if (n == null || n === 0) return "0 B";
    var u = ["B", "KB", "MB", "GB", "TB"], i = Math.floor(Math.log(n) / Math.log(1024));
    i = Math.min(i, u.length - 1);
    var v = n / Math.pow(1024, i);
    return (v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)) + " " + u[i];
  }
  function fmtDuration(ms) {
    if (ms == null) return null;
    var s = Math.round(ms / 1000), m = Math.floor(s / 60);
    s = s % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function relTime(ms) {
    if (ms == null) return "inconnu";
    var diff = Date.now() - ms;
    if (FIXTURE) diff = NOW - ms; // stable in fixture mode
    if (diff < 0) diff = 0;
    var s = Math.floor(diff / 1000);
    if (s < 45) return "à l'instant";
    var m = Math.floor(s / 60);
    if (m < 1) return "à l'instant";
    if (m < 60) return "il y a " + m + " min";
    var h = Math.floor(m / 60);
    if (h < 24) return "il y a " + h + " h";
    var d = Math.floor(h / 24);
    if (d < 30) return "il y a " + d + (d === 1 ? " jour" : " jours");
    var mo = Math.floor(d / 30);
    if (mo < 12) return "il y a " + mo + " mois";
    return "il y a " + Math.floor(mo / 12) + " an" + (Math.floor(mo / 12) > 1 ? "s" : "");
  }
  function fmtDate(ms) {
    if (ms == null) return "unknown";
    var d = new Date(ms);
    var mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
    var hh = d.getHours(), ap = hh >= 12 ? "pm" : "am";
    hh = hh % 12 || 12;
    var min = d.getMinutes();
    return mm + " " + d.getDate() + ", " + hh + ":" + (min < 10 ? "0" : "") + min + ap;
  }
  // « 17 août 2026 » plutôt que le préfixe 26-08-17 recollé au titre.
  function fmtDay(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }

  function pretty(slug) {
    return slug.replace(/^_/, "").split("-").map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  }
  function famLabel(f) {
    if (!f || f === "misc") return "Misc";
    return String(f).replace(/[-_]+/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  // Families are user-defined (the leading token sur a project slug), so colors are
  // assigned by a stable hash into a fixed 6-swatch palette instead sur a lookup table.
  function famClass(f) {
    if (!f || f === "misc") return "fam-misc";
    var h = 0;
    for (var i = 0; i < f.length; i++) h = (h * 31 + f.charCodeAt(i)) >>> 0;
    return "fam-c" + (h % 6);
  }

  // reached stage index: highest stage index that is done/proxy/partial
  var STAGE_INDEX = {};
  STAGES.forEach(function (s, i) { STAGE_INDEX[s.id] = i; });
  // Le rail des 9 étapes vit sur la page projet, avec ses preuves sur disque.
  // Sur la grille, il ne disait rien qu'on lise vraiment d'un coup d'œil : on y
  // cherche « où en est cette vidéo », pas « quel agent a écrit un fichier ».
  // Cinq états en français, dans l'ordre où on les rencontre.
  var STATUSES = [
    ["a-demarrer", "à démarrer"],
    ["en-montage", "en montage"],
    ["pret", "prêt à relire"],
    ["a-re-rendre", "à re-rendre"],
    ["livre", "livré"]
  ];

  function statusOf(p) {
    var byId = {};
    p.stages.forEach(function (st, i) { byId[STAGES[i].id] = st.status; });
    if (byId.delivered === "done") return "livre";
    if (p.staleRender) return "a-re-rendre";
    if (p.preview) return "pret";
    if (byId.source === "done" || byId.transcript === "done") return "en-montage";
    return "a-demarrer";
  }
  function statusLabel(key) {
    for (var i = 0; i < STATUSES.length; i++) if (STATUSES[i][0] === key) return STATUSES[i][1];
    return key;
  }

  function isProxyStage(st) {
    return st.status === "done" && st.evidence.length > 0 &&
      st.evidence.every(function (e) { return e.kind === "proxy"; });
  }
  function segClass(st) {
    if (st.status === "n-a") return "na";
    if (st.status === "partial") return "partial";
    if (st.status === "unknown") return "unknown";
    if (st.status === "done") return isProxyStage(st) ? "proxy" : "done";
    return "unknown";
  }

  // =====================================================================
  // DOM helpers
  // =====================================================================
  var view = document.getElementById("view");
  var summaryStrip = document.getElementById("summary-strip");
  var toastEl = document.getElementById("toast");
  var refreshBtn = document.getElementById("refresh-btn");

  function h(html) {
    // On quitte une vue : ses vignettes disparaissent, leurs pilotes aussi.
    // Sans ça, l'observateur garderait des éléments détachés et le minuteur
    // des lecteurs morts.
    if (typeof resetPlayback === "function") resetPlayback();
    view.classList.remove("review-page");
    view.innerHTML = html;
  }
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(function () { toastEl.classList.add("show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
      setTimeout(function () { toastEl.hidden = true; }, 220);
    }, 2400);
  }

  function railHTML(p, small) {
    var segs = p.stages.map(function (st, i) {
      var cls = segClass(st);
      var meta = STAGES[i];
      var title = meta.label + ": " + st.status + (isProxyStage(st) ? " (proxy)" : "");
      return '<div class="seg ' + cls + '" title="' + esc(title) + '">' +
        '<div class="seg-fill"></div>' +
        (small ? "" : '<span class="seg-code">' + meta.code + "</span>") +
        "</div>";
    }).join("");
    return '<div class="rail">' + segs + "</div>";
  }

  // =====================================================================
  // Mission Control
  // =====================================================================
  var msState = null;
  var filters = {
    q: "", family: "", archetype: "", format: "", state: "", staleOnly: false, hideUtility: true, sort: "touched"
  };

  function renderSummary(sum) {
    summaryStrip.hidden = false;
    summaryStrip.innerHTML = [
      cell(sum.projectCount, "Projets", sum.utilityCount + " utilitaire masqué", ""),
      cell(sum.withRenders, "Avec un rendu", "sur " + sum.projectCount + " projets", "accent"),
      cell(sum.staleRenderCount, "Rendus périmés", sum.staleRenderCount ? "à re-rendre" : "tous à jour", sum.staleRenderCount ? "warn" : ""),
      cell(fmtBytes(sum.renderBytes), "Disque rendus", "", "",
        // La tuile annonçait un volume à ranger sans offrir le geste : le
        // ménage n'existait que projet par projet. Un clic, tout l'espace.
        // Le bouton reste posé même quand il n'y a rien à faire — masqué, son
        // absence se lit comme une panne plutôt que comme un disque à jour.
        sum.prunableCount
          ? '<button class="cell-act" id="prune-all-btn">Ranger ' +
            esc(fmtBytes(sum.prunableBytes)) + "</button>"
          : '<button class="cell-act" id="prune-all-btn" disabled>Rien à ranger</button>')
    ].join("");
    wirePruneAll();
  }
  function cell(val, lbl, sub, mod, extraHTML) {
    return '<div class="summary-cell ' + mod + '">' +
      '<div class="val tnum">' + esc(val) + "</div>" +
      '<div class="lbl">' + esc(lbl) + "</div>" +
      (sub ? '<div class="sub">' + esc(sub) + "</div>" : "") +
      (extraHTML || "") + "</div>";
  }

  /**
   * Le ménage sur tout l'espace de travail, depuis la tuile.
   * Même contrat que le bouton d'un projet : on montre d'abord ce qui part,
   * projet par projet, et rien ne bouge sans confirmation. Corbeille système,
   * masters et livraisons protégés.
   */
  function wirePruneAll() {
    var btn = document.getElementById("prune-all-btn");
    if (!btn) return;
    if (btn.disabled) {
      btn.title = "Les 3 derniers rendus de chaque livrable sont gardés. Rien ne dépasse pour l'instant.";
      return;
    }
    btn.title = "Ne garder que les 3 derniers rendus de chaque livrable, sur tous les projets. " +
      "Masters et livraisons protégés, corbeille système.";
    btn.onclick = function () {
      btn.disabled = true;
      api("/api/prune-all?keep=3").then(function (plan) {
        if (!plan.removeCount) { toast("Rien à ranger"); btn.disabled = false; return; }
        var list = plan.projects.map(function (p) {
          return '<div class="ev" style="padding:6px 0"><span class="file">' + esc(p.slug) + "</span>" +
            '<span class="mt">' + p.removed + (p.removed > 1 ? " rendus" : " rendu") + "</span>" +
            '<span class="mt tnum">' + fmtBytes(p.bytes) + "</span></div>";
        }).join("");
        var body = "<p>" + plan.removeCount + " rendus partent à la corbeille du système sur " +
          plan.projects.length + (plan.projects.length > 1 ? " projets" : " projet") +
          " (&#8776; " + fmtBytes(plan.freeBytes) + " libérés). Les " + plan.keep +
          " plus récents <b>de chaque livrable</b> restent" +
          (plan.protected ? ", ainsi que " + plan.protected + " master ou livraison" : "") + ".</p>" +
          '<div class="confirm-list">' + list + "</div>";
        return confirmDialog("Ranger tous les rendus", body, "Mettre à la corbeille").then(function (ok) {
          if (!ok) { btn.disabled = false; return; }
          return postJSON("/api/prune-all", { keep: 3 }).then(function (res) {
            toast((res.moved || []).length + " rendus à la corbeille · " + fmtBytes(res.freedBytes || 0) + " libérés");
            msState = null;
            renderMission();
          });
        });
      }).catch(function (e) {
        toast("Rangement impossible : " + (e && e.message ? e.message : "erreur"));
        btn.disabled = false;
      });
    };
  }

  function renderMission() {
    setActiveNav("mission");
    if (!msState) {
      h('<div class="skeleton-grid">' + Array(6).join("<div class='skel'></div>") + "</div>");
      api("/api/state").then(function (s) {
        msState = s;
        renderSummary(s.summary);
        renderMission();
      }).catch(showError);
      return;
    }
    renderSummary(msState.summary);

    // Families are derived from whatever project slugs exist on disk, not a fixed list,
    // so the filter reflects this workspace rather than the one it was authored in.
    var families = {};
    msState.projects.forEach(function (p) { if (p.family) families[p.family] = 1; });
    var famKeys = Object.keys(families);
    var famOpts = famKeys.sort().map(function (f) {
      return '<option value="' + f + '"' + (filters.family === f ? " selected" : "") + ">" + famLabel(f) + "</option>";
    }).join("");
    var archOpts = ["talking-head", "graphics-only", "unknown"].map(function (a) {
      return '<option value="' + a + '"' + (filters.archetype === a ? " selected" : "") + ">" + a + "</option>";
    }).join("");
    // Un reel vertical et un tuto 16:9 ne se montent pas pareil et ne se
    // publient pas au même endroit : pouvoir isoler un format est aussi utile
    // que d'isoler un client. Le format vient du dernier rendu.
    var fmtOpts = [["vertical", "Vertical (9:16)"], ["horizontal", "Horizontal (16:9)"], ["square", "Carré (1:1)"]].map(function (o) {
      return '<option value="' + o[0] + '"' + (filters.format === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
    }).join("");
    var stateOpts = STATUSES.map(function (o) {
      return '<option value="' + o[0] + '"' + (filters.state === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
    }).join("");
    var sortOpts = [["touched", "Modifié récemment"], ["name", "Nom"]].map(function (o) {
      return '<option value="' + o[0] + '"' + (filters.sort === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
    }).join("");

    var filtered = applyFilters(msState.projects);

    var cardsHTML = filtered.length ? filtered.map(cardHTML).join("") :
      '<div class="empty" style="grid-column:1/-1"><h3>No projects match</h3><div>Adjust the filters or search above.</div></div>';

    h(
      '<div class="view-head">' +
        '<div><div class="view-title">Projets<span class="count tnum">' + filtered.length + " / " + msState.projects.length + "</span></div>" +
        '<div class="view-sub">Le système de fichiers fait foi. Relevé ' + esc(relTime(msState.summary.scannedAt)) + " en " + esc(msState.summary.scanMs) + " ms.</div></div>" +
      "</div>" +

      '<div class="filters">' +
        '<label class="search"><span class="icon">&#8981;</span>' +
          '<input id="f-q" type="search" placeholder="Chercher un nom ou un slug" value="' + esc(filters.q) + '" aria-label="Search projects" /></label>' +
        (famKeys.length > 1
          ? '<select class="select" id="f-family" aria-label="Family"><option value="">Toutes les familles</option>' + famOpts + "</select>"
          : "") +
        '<select class="select" id="f-arch" aria-label="Archetype"><option value="">Tous les types</option>' + archOpts + "</select>" +
        '<select class="select" id="f-format" aria-label="Format"><option value="">Tous les formats</option>' + fmtOpts + "</select>" +
        '<select class="select" id="f-state" aria-label="État"><option value="">Tous les états</option>' + stateOpts + "</select>" +
        '<select class="select" id="f-sort" aria-label="Sort">' + sortOpts + "</select>" +
        '<label class="toggle ' + (filters.staleOnly ? "on" : "") + '"><input type="checkbox" id="f-stale"' + (filters.staleOnly ? " checked" : "") + " /><span class=\"box\"></span>Périmés seuls</label>" +
        '<label class="toggle ' + (filters.hideUtility ? "on" : "") + '"><input type="checkbox" id="f-util"' + (filters.hideUtility ? " checked" : "") + " /><span class=\"box\"></span>Masquer l'utilitaire</label>" +
      "</div>" +

      '<div class="grid">' + cardsHTML + "</div>"
    );

    wireFilters();
  }

  function applyFilters(projects) {
    var out = projects.filter(function (p) {
      if (filters.hideUtility && p.utility) return false;
      if (filters.family && p.family !== filters.family) return false;
      if (filters.archetype && p.archetype !== filters.archetype) return false;
      // Format inconnu (pas encore sondé, ou aucun rendu) : le projet ne sort
      // que dans « tous les formats », jamais dans une sélection précise.
      if (filters.format && (!p.preview || p.preview.orientation !== filters.format)) return false;
      if (filters.staleOnly && !p.staleRender) return false;
      if (filters.state && statusOf(p) !== filters.state) return false;
      if (filters.q) {
        var q = filters.q.toLowerCase();
        if ((p.slug + " " + p.name).toLowerCase().indexOf(q) === -1) return false;
      }
      return true;
    });
    out.sort(function (a, b) {
      if (filters.sort === "name") return a.name.localeCompare(b.name);
      return b.lastTouched - a.lastTouched;
    });
    return out;
  }

  // La vignette du dernier rendu. Sans elle, cinq cartes de reels verticaux se
  // ressemblent toutes : on lit le slug pour savoir de quelle vidéo il s'agit.
  // L'image est extraite côté serveur (une frame, mise en cache), donc la
  // grille n'a aucun MP4 à décoder.
  function thumbHTML(p) {
    if (!p.preview) {
      return '<div class="card-thumb none"><span>aucun rendu</span></div>';
    }
    var base = "/api/thumb/" + encodeURIComponent(p.slug);
    var poster = base + "?v=" + p.preview.mtime;
    var loop = base + "?kind=loop&v=" + p.preview.mtime;
    var tag = p.preview.master ? "master" : p.preview.kind;
    var ratio = p.preview.ratio
      ? '<span class="th-tag ratio">' + esc(p.preview.ratio) + "</span>" : "";
    return '<div class="card-thumb" data-loop="' + esc(loop) + '">' +
      '<img class="th-bg" src="' + esc(poster) + '" alt="" aria-hidden="true" loading="lazy" />' +
      '<img class="th-img" src="' + esc(poster) + '" alt="Dernier rendu de ' + esc(p.name) + '" loading="lazy" />' +
      '<span class="th-tag">' + esc(tag) + "</span>" + ratio +
      "</div>";
  }

  function cardHTML(p) {
    var st = statusOf(p);
    var newest = p.renders.length ? p.renders[0] : null;
    var renderMeta = newest
      ? '<span class="meta-item"><span class="dot ok"></span>rendu ' + esc(relTime(newest.mtime)) + "</span>"
      : '<span class="meta-item"><span class="dot none"></span>aucun rendu</span>';
    return '<button type="button" class="card ' + (p.staleRender ? "stale" : "") + '" data-slug="' + esc(p.slug) + '">' +
      '<div class="card-top">' +
        "<div>" +
          '<div class="card-name">' + esc(p.name) + "</div>" +
          '<div class="card-date">' + esc(p.date ? fmtDay(p.date) : p.slug) + "</div>" +
        "</div>" +
        '<div class="card-badges">' +
          (p.family && p.family !== "misc" ? '<span class="badge ' + famClass(p.family) + '">' + esc(famLabel(p.family)) + "</span>" : "") +
          (p.archetype !== "unknown" ? '<span class="badge arch arch-' + p.archetype + '">' + esc(p.archetype) + "</span>" : "") +
          (p.utility ? '<span class="badge util">utility</span>' : "") +
        "</div>" +
      "</div>" +
      thumbHTML(p) +
      '<div class="card-meta">' +
        '<div class="meta-left">' +
          '<span class="state st-' + esc(st) + '">' + esc(statusLabel(st)) + "</span>" +
          renderMeta +
          ((p.deliverables || []).length > 1
            ? '<span class="meta-item dlv-chip">' + p.deliverables.length + " livrables</span>" : "") +
          (p.feedback && p.feedback.open
            ? '<span class="meta-item fb-chip">' + p.feedback.open + " retour" +
              (p.feedback.open > 1 ? "s" : "") + "</span>" : "") +
          "</div>" +
        '<div class="meta-right">' + esc(relTime(p.lastTouched)) + "</div>" +
      "</div>" +
      "</button>";
  }

  // Au survol, la vignette passe à une petite boucle animée (webp, ~2,4 s).
  // Elle n'est demandée qu'au premier survol : ouvrir la grille ne déclenche
  // pas cinq encodages pour rien.
  function wireThumbs(scope) {
    var host = scope || document;
    Array.prototype.forEach.call(host.querySelectorAll(".card-thumb"), function (t) {
      var img = t.querySelector(".th-img");
      if (!img) return;
      img.onerror = function () { t.classList.add("broken"); };
      var loop = t.getAttribute("data-loop");
      if (!loop) return;
      var poster = img.getAttribute("src");
      var loaded = false;
      t.parentNode.addEventListener("mouseenter", function () {
        if (loaded || t.classList.contains("broken")) return;
        loaded = true;
        var pre = new Image();
        pre.onload = function () { img.src = loop; t.classList.add("live"); };
        pre.onerror = function () { img.src = poster; };
        pre.src = loop;
      });
    });
  }

  function wireCards(scope) {
    var host = scope || document;
    Array.prototype.forEach.call(host.querySelectorAll(".card"), function (c) {
      c.onclick = function () { location.hash = "#/project/" + c.getAttribute("data-slug"); };
    });
    wireThumbs(host);
  }

  function wireFilters() {
    var q = document.getElementById("f-q");
    if (q) q.oninput = function () { filters.q = this.value; debounceMission(); };
    bind("f-family", "family");
    bind("f-arch", "archetype");
    bind("f-format", "format");
    bind("f-state", "state");
    bind("f-sort", "sort");
    var stale = document.getElementById("f-stale");
    if (stale) stale.onchange = function () { filters.staleOnly = this.checked; renderMission(); };
    var util = document.getElementById("f-util");
    if (util) util.onchange = function () { filters.hideUtility = this.checked; renderMission(); };

    wireCards();
  }
  function bind(id, key) {
    var el = document.getElementById(id);
    if (el) el.onchange = function () { filters[key] = this.value; renderMission(); };
  }
  var dbTimer = null;
  function debounceMission() {
    clearTimeout(dbTimer);
    dbTimer = setTimeout(function () {
      // re-render only the grid + count to preserve focus in the search box
      var filtered = applyFilters(msState.projects);
      var grid = document.querySelector(".grid");
      var count = document.querySelector(".view-title .count");
      if (count) count.textContent = filtered.length + " / " + msState.projects.length;
      if (grid) {
        grid.innerHTML = filtered.length ? filtered.map(cardHTML).join("") :
          '<div class="empty" style="grid-column:1/-1"><h3>No projects match</h3><div>Adjust the filters or search above.</div></div>';
        wireCards(grid);
      }
    }, 130);
  }

  // =====================================================================
  // Actions du pipeline
  // =====================================================================
  // Le hub lance lint / rendu / master / vérification et montre la sortie en
  // direct. Un rendu draft de reel prend ~60 s : ce qui coûtait cher n'était
  // pas l'attente mais l'aller-retour vers le terminal, et le fait de devoir
  // penser à lancer la vérification derrière. Les actions enchaînées le font.
  var ACTIONS = null;
  var jobTimer = null;
  var jobSince = 0;

  // Chaque bouton dit ce qu'il fait. Sans ça, on ne sait pas si un rendu suffit
  // à finir un projet — il ne suffit pas : le fichier qu'on publie est le
  // master, et c'est ce que le groupe « Pour publier » rend évident.
  var ACTION_GROUPS = [
    ["montage", "Pendant le montage", "à chaque itération, tant qu'on corrige"],
    ["publication", "Pour publier", "quand le montage est validé — c'est le master qu'on envoie"]
  ];

  function actionsPanelHTML(target) {
    if (!ACTIONS) return "";
    var groups = ACTION_GROUPS.map(function (g) {
      var acts = ACTIONS.filter(function (a) { return (a.group || "montage") === g[0]; });
      if (!acts.length) return "";
      return '<div class="act-group">' +
        '<div class="act-group-head"><span class="act-group-name">' + esc(g[1]) + "</span>" +
        '<span class="act-group-sub">' + esc(g[2]) + "</span></div>" +
        acts.map(function (a) {
          return '<div class="act-item' + (a.primary ? " primary" : "") + '">' +
            '<button type="button" class="btn btn-sm act' + (a.primary ? " btn-primary" : "") +
              '" data-action="' + esc(a.id) + '">' + esc(a.label) + "</button>" +
            '<span class="act-desc">' + esc(a.desc || a.hint || "") + "</span>" +
            "</div>";
        }).join("") + "</div>";
    }).join("");

    return '<div class="panel" id="actions-panel">' +
      '<div class="panel-head"><h2>Actions</h2>' +
      '<span class="hint">' + (target
        ? "sur le livrable <b>" + esc(target) + "</b>"
        : "la sortie des commandes s'affiche ici") + "</span></div>" +
      '<div class="act-groups">' + groups + "</div>" +
      '<div class="job" id="job" hidden>' +
        '<div class="job-head"><span class="job-label" id="job-label"></span>' +
          '<span class="job-step" id="job-step"></span>' +
          '<button type="button" class="btn btn-sm" id="job-stop">Arrêter</button></div>' +
        '<pre class="job-log" id="job-log"></pre>' +
      "</div></div>";
  }

  function wireActions(slug, p) {
    Array.prototype.forEach.call(document.querySelectorAll(".act"), function (b) {
      b.onclick = function () { runAction(slug, b.getAttribute("data-action"), p); };
    });
    var stop = document.getElementById("job-stop");
    if (stop) stop.onclick = function () {
      if (!stop.getAttribute("data-job")) return;
      postJSON("/api/job-stop/" + encodeURIComponent(stop.getAttribute("data-job")), {});
    };
  }

  function runAction(slug, action, p) {
    setActionsBusy(true);
    // Le livrable choisi décide de ce qu'on rend et de ce qu'on vérifie : sur
    // un projet à quatre publicités, « rendu draft » sans précision écraserait
    // toujours le même fichier.
    var d = p ? deliverableOf(p, currentDeliverable) : null;
    var comps = (p && p.compositions) || [];
    var body = { slug: slug, action: action };
    if (d) {
      if (comps.indexOf(d.id) !== -1) body.composition = d.id;
      body.file = d.latest.file;
    }
    postJSON("/api/run", body).then(function (r) {
      jobSince = 0;
      showJob(r.job, true);
      pollJob(slug, r.job.id);
    }).catch(function (e) {
      setActionsBusy(false);
      toast(e.message || "action refusée");
    });
  }

  function setActionsBusy(on) {
    Array.prototype.forEach.call(document.querySelectorAll(".act"), function (b) { b.disabled = on; });
  }

  function showJob(job, reset) {
    var box = document.getElementById("job");
    var log = document.getElementById("job-log");
    if (!box || !log) return;
    box.hidden = false;
    box.className = "job " + job.status;
    document.getElementById("job-label").textContent = job.label;
    document.getElementById("job-step").textContent =
      job.status === "running"
        ? "étape " + (job.step + 1) + "/" + job.stepCount + " · " + job.stepLabel
        : job.status === "done" ? "terminé"
        : job.status === "canceled" ? "arrêté" : "échec (code " + job.exitCode + ")";
    var stop = document.getElementById("job-stop");
    if (stop) { stop.setAttribute("data-job", job.id); stop.hidden = job.status !== "running"; }
    if (reset) log.textContent = "";
    if (job.lines && job.lines.length) {
      log.textContent += job.lines.join("\n") + "\n";
      log.scrollTop = log.scrollHeight;
    }
  }

  function pollJob(slug, id) {
    clearTimeout(jobTimer);
    api("/api/job/" + encodeURIComponent(id) + "?since=" + jobSince).then(function (job) {
      jobSince = job.lineCount;
      showJob(job, false);
      if (job.status === "running") {
        jobTimer = setTimeout(function () { pollJob(slug, id); }, 900);
        return;
      }
      setActionsBusy(false);
      toast(job.label + " — " + (job.status === "done" ? "terminé" :
        job.status === "canceled" ? "arrêté" : "échec"));
      // le disque a changé : on redessine la page projet avec le nouveau rendu
      msState = null;
      if (location.hash === "#/project/" + encodeURIComponent(slug)) renderDetail(slug);
    }).catch(function () {
      setActionsBusy(false);
    });
  }

  // =====================================================================
  // Retours de review
  // =====================================================================
  function feedbackPanelHTML(p) {
    var files = p.feedbackFiles || [];
    if (!files.length) return "";
    var rows = files.map(function (f) {
      var notes = f.notes.map(function (n) {
        return '<div class="fb-note"><span class="fb-t tnum">' + esc(fmtClock(n.t)) + "</span>" +
          '<span class="fb-txt"></span></div>';
      }).join("");
      return '<div class="fb-file' + (f.done ? " done" : "") + '">' +
        '<div class="fb-head"><span class="fb-render">' + esc(f.render) + "</span>" +
          '<span class="fb-count">' + f.notes.length + " retour" + (f.notes.length > 1 ? "s" : "") +
          (f.done ? " · traité" : "") + "</span>" +
          '<button type="button" class="btn btn-sm fb-done" data-render="' + esc(f.render) +
          '" data-done="' + (f.done ? "0" : "1") + '">' +
          (f.done ? "Rouvrir" : "Marquer traité") + "</button></div>" +
        '<div class="fb-notes">' + notes + "</div></div>";
    }).join("");
    var open = files.reduce(function (n, f) { return n + (f.done ? 0 : f.notes.length); }, 0);
    return '<div class="panel"><div class="panel-head"><h2>Retours de review</h2>' +
      '<span class="hint">' + (open ? open + " à traiter" : "tout est traité") + "</span></div>" +
      '<div class="fb-body">' + rows + "</div></div>";
  }

  // Le texte des retours est écrit par l'utilisateur : il passe par textContent,
  // jamais par innerHTML.
  function fillFeedbackText(p) {
    var files = p.feedbackFiles || [];
    var els = document.querySelectorAll(".fb-txt");
    var i = 0;
    files.forEach(function (f) {
      f.notes.forEach(function (n) {
        if (els[i]) els[i].textContent = n.txt;
        i++;
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".fb-done"), function (b) {
      b.onclick = function () {
        b.disabled = true;
        postJSON("/api/feedback/done", {
          slug: p.slug, render: b.getAttribute("data-render"), done: b.getAttribute("data-done") === "1"
        }).then(function () { msState = null; renderDetail(p.slug); })
          .catch(function (e) { toast(e.message || "échec"); b.disabled = false; });
      };
    });
  }

  function fmtClock(t) {
    var s = Math.floor(t || 0);
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }

  // =====================================================================
  // Project Detail
  // =====================================================================
  function renderDetail(slug) {
    setActiveNav("mission");
    summaryStrip.hidden = true;
    clearTimeout(jobTimer);
    if (detailSlug !== slug) { currentDeliverable = null; detailSlug = slug; }
    h('<div class="loading">Chargement du projet&#8230;</div>');
    var actions = ACTIONS
      ? Promise.resolve({ actions: ACTIONS })
      : api("/api/actions").catch(function () { return { actions: [] }; });
    Promise.all([api("/api/project/" + encodeURIComponent(slug)), actions]).then(function (r) {
      ACTIONS = r[1].actions;
      drawDetail(r[0]);
      // une action déjà en cours sur ce projet reprend son affichage
      api("/api/jobs/" + encodeURIComponent(slug)).then(function (jl) {
        var running = (jl.jobs || []).filter(function (j) { return j.status === "running"; })[0];
        if (!running) return;
        setActionsBusy(true);
        jobSince = 0;
        showJob(running, true);
        pollJob(slug, running.id);
      }).catch(function () {});
    }).catch(function (e) {
      h('<a class="back-link" href="#/">&#8592; Projets</a>' +
        '<div class="error-box">Projet introuvable : <code>' + esc(slug) + "</code><br>" + esc(e.message || "") + "</div>");
    });
  }

  // Le dernier rendu, en tête de la page projet. C'est ce qu'on vient voir :
  // à quoi ressemble la vidéo aujourd'hui, et par où repartir pour la
  // corriger. Le bouton mène droit à la review image par image — d'où la
  // disparition de l'entrée « Review » du menu : on y entre par le projet.
  // Le livrable affiché : par défaut le plus récemment touché. Un projet porte
  // souvent plusieurs vidéos différentes (quatre publicités tirées du même
  // rush, plusieurs verticaux tirés d'une vidéo longue), donc « le rendu du
  // projet » ne veut rien dire — il faut savoir duquel on parle.
  var currentDeliverable = null;
  var detailSlug = null;

  function deliverableOf(p, id) {
    var list = p.deliverables || [];
    if (!list.length) return null;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  }

  function heroHTML(p) {
    if (!p.preview) {
      return '<div class="panel hero none">' +
        '<div class="hero-none-in"><h3>Aucun rendu</h3>' +
        "<div>Rends une composition, puis reviens ici pour la regarder et la commenter.</div></div></div>";
    }
    var d = deliverableOf(p, currentDeliverable);
    var pr = d ? d.latest : p.preview;
    var wsPath = "video-projects/" + p.slug + "/" + pr.file;
    var src = "/workspace/" + wsPath.split("/").map(encodeURIComponent).join("/");
    var poster = "/api/thumb/" + encodeURIComponent(p.slug) +
      "?file=" + encodeURIComponent(pr.file) + "&v=" + pr.mtime;
    var many = (p.deliverables || []).length > 1;
    var row = p.renders.filter(function (r) { return r.file === pr.file; })[0];
    var stale = row && row.stale;

    var flags = "";
    if (pr.newerExists) {
      flags += '<div class="hero-flag"><span class="dot"></span>Master affiché. Un rendu plus récent existe : <code>' +
        esc(pr.newerFile) + "</code></div>";
    }
    if (stale) {
      flags += '<div class="hero-flag warn"><span class="dot"></span>Rendu périmé : une source a bougé depuis.</div>';
    }

    return '<div class="panel hero">' +
      '<div class="hero-video">' +
        '<video id="hero-v" controls playsinline preload="metadata" poster="' + esc(poster) + '" src="' + esc(src) + '"></video>' +
      "</div>" +
      '<div class="hero-side">' +
        '<div class="hero-label">' + (many ? esc(d.id) : "Dernier rendu") +
          (pr.master ? ' <span class="rk delivery">master</span>' : "") +
          (many && d.versions > 1 ? ' <span class="hero-vers">' + d.versions + " versions</span>" : "") +
          "</div>" +
        '<div class="hero-file">' + esc(pr.file) + "</div>" +
        '<div class="hero-meta tnum"><span>' + fmtBytes(pr.bytes) + "</span>" +
          (pr.width && pr.height ? "<span>" + pr.width + "&#215;" + pr.height +
            (pr.ratio ? " &#183; " + esc(pr.ratio) : "") + "</span>" : "") +
          '<span id="hero-dur">' + (pr.durationMs ? esc(fmtDuration(pr.durationMs)) : "&#183;&#183;&#183;") + "</span>" +
          "<span>" + esc(relTime(pr.mtime)) + "</span></div>" +
        flags +
        '<div class="hero-actions">' +
          '<a class="btn btn-primary" href="#/review/' + encodeURIComponent(p.slug) + '">Apporter des modifications</a>' +
          '<a class="btn btn-sm" href="#/edit/' + encodeURIComponent(p.slug) + '">Ouvrir le Studio</a>' +
          '<a class="btn btn-sm" href="' + esc(src) + '" target="_blank" rel="noopener">Ouvrir dans un onglet</a>' +
        "</div>" +
      "</div>" +
      "</div>";
  }

  // La liste des livrables du projet. Elle n'apparaît que s'il y en a plusieurs :
  // sur un projet à une seule vidéo, elle ne dirait rien.
  function deliverablesHTML(p) {
    var list = p.deliverables || [];
    if (list.length < 2) return "";
    var cur = deliverableOf(p, currentDeliverable);
    var cards = list.map(function (d) {
      var thumb = "/api/thumb/" + encodeURIComponent(p.slug) +
        "?file=" + encodeURIComponent(d.latest.file) + "&v=" + d.latest.mtime;
      return '<button type="button" class="dlv' + (d.id === cur.id ? " on" : "") +
        '" data-dlv="' + esc(d.id) + '">' +
        '<span class="dlv-thumb"><img src="' + esc(thumb) + '" alt="" loading="lazy" /></span>' +
        '<span class="dlv-meta"><span class="dlv-id">' + esc(d.id) + "</span>" +
        '<span class="dlv-sub tnum">' + d.versions + " version" + (d.versions > 1 ? "s" : "") +
        (d.latest.master ? " · master" : "") + " · " + esc(relTime(d.latest.mtime)) + "</span></span>" +
        "</button>";
    }).join("");
    return '<div class="panel"><div class="panel-head"><h2>Livrables</h2>' +
      '<span class="hint">' + list.length + " vidéos différentes dans ce projet</span></div>" +
      '<div class="dlv-row">' + cards + "</div></div>";
  }

  function drawDetail(p) {
    var stageRows = p.stages.map(function (st, i) {
      var meta = STAGES[i];
      var proxy = isProxyStage(st);
      var pillCls = st.status === "done" ? "status-done"
        : st.status === "partial" ? "status-partial"
        : st.status === "n-a" ? "status-na" : "status-unknown";
      var pillLabel = st.status === "n-a" ? "n/a" : st.status;
      if (proxy) pillLabel = "done - proxy";
      var evHTML = st.evidence.length
        ? '<div class="evidence">' + st.evidence.map(function (e) {
            return '<div class="ev">' +
              '<span class="kind ' + e.kind + '">' + e.kind + "</span>" +
              '<span class="file">' + esc(e.file) + "</span>" +
              '<span class="mt tnum">' + esc(fmtDate(e.mtime)) + "</span>" +
              "</div>";
          }).join("") + "</div>"
        : '<div class="ev-none">' + (st.status === "n-a" ? "not applicable for this archetype" : "no evidence on disk") + "</div>";
      return '<div class="stage-row">' +
        '<div class="stage-name"><span class="stage-idx tnum">' + (i + 1) + "</span>" + esc(meta.label) + "</div>" +
        '<div><span class="status-pill ' + pillCls + '"><span class="d"></span>' + esc(pillLabel) + "</span></div>" +
        evHTML +
        "</div>";
    }).join("");

    var rendersPanel = p.renders.length
      ? '<table class="tbl"><thead><tr><th>Fichier</th><th>Type</th><th>Taille</th><th>Durée</th><th>Modifié</th><th>État</th></tr></thead><tbody>' +
        p.renders.map(function (r) {
          var dur = fmtDuration(r.durationMs);
          return '<tr class="playable" data-play="video-projects/' + esc(p.slug) + "/" + esc(r.file) + '" data-title="' + esc(r.file) + '">' +
            '<td class="fname"><span class="play-dot">&#9654;</span>' + esc(r.file) + "</td>" +
            '<td><span class="rk ' + r.kind + '">' + esc(r.kind) + "</span></td>" +
            '<td class="tnum">' + fmtBytes(r.bytes) + "</td>" +
            '<td class="tnum">' + (dur ? esc(dur) : '<span style="color:var(--text-faint)">n/a</span>') + "</td>" +
            '<td class="tnum">' + esc(fmtDate(r.mtime)) + "</td>" +
            "<td>" + (r.stale
              ? '<span class="stale-tag"><span class="d"></span>Périmé</span>'
              : '<span class="fresh-tag">À jour</span>') + "</td>" +
            "</tr>";
        }).join("") + "</tbody></table>"
      : '<div class="empty" style="margin:16px;padding:36px"><h3>Aucun rendu</h3><div>Le dossier renders/ de ce projet est vide.</div></div>';

    var notesPanel = p.notes
      ? '<div class="panel"><div class="panel-head"><h2>NOTES.md</h2></div>' +
        '<div class="notes-body">' + mdLite(p.notes) + "</div></div>"
      : "";

    var extra = (p.extraFiles && p.extraFiles.length)
      ? '<div class="panel"><div class="panel-head"><h2>Root files</h2><span class="hint">generators + notes</span></div>' +
        '<div class="panel-body">' + p.extraFiles.map(function (f) {
          return '<div class="ev" style="padding:10px 18px"><span class="file">' + esc(f) + "</span></div>";
        }).join("") + "</div></div>"
      : "";

    h(
      '<a class="back-link" href="#/">&#8592; Projets</a>' +
      '<div class="detail-head">' +
        '<div class="detail-title-row">' +
          "<div><div class=\"detail-title\">" + esc(p.name) + "</div>" +
          '<div class="detail-slug">' + esc(p.date ? fmtDay(p.date) : p.slug) + "</div></div>" +
          '<div class="card-badges">' +
            (p.family && p.family !== "misc" ? '<span class="badge ' + famClass(p.family) + '">' + esc(famLabel(p.family)) + "</span>" : "") +
            (p.archetype !== "unknown" ? '<span class="badge arch arch-' + p.archetype + '">' + esc(p.archetype) + "</span>" : "") +
            (p.staleRender ? '<span class="badge" style="color:var(--red);border-color:rgba(240,86,74,.4)">stale render</span>' : "") +
          "</div>" +
        "</div>" +
        '<div class="detail-path"><span class="p">' + esc(p.absPath || "") + "</span>" +
          '<button type="button" class="btn btn-sm" id="copy-path">Copy path</button>' +
          '<button type="button" class="btn btn-sm" id="reveal">Reveal in Finder</button>' +
        "</div>" +
      "</div>" +

      deliverablesHTML(p) +
      heroHTML(p) +

      actionsPanelHTML((p.deliverables || []).length > 1 ? deliverableOf(p, currentDeliverable).id : null) +
      feedbackPanelHTML(p) +

      '<div class="panel"><div class="panel-head"><h2>Pipeline</h2><span class="hint">9 étapes, détectées sur le disque</span></div>' +
        railHTML(p) .replace('<div class="rail">', '<div class="rail" style="margin:16px 18px 4px">') +
        '<div class="panel-body">' + stageRows + "</div></div>" +

      '<div class="panel"><div class="panel-head"><h2>Renders</h2>' +
        '<span class="hint">' + p.renders.length + " fichier" + (p.renders.length === 1 ? "" : "s") +
        (p.prunable && p.prunable.count
          ? " &#183; " + p.prunable.count + " à ranger (" + fmtBytes(p.prunable.bytes) + ")" : "") + "</span>" +
        (p.prunable && p.prunable.count
          ? '<button type="button" class="btn btn-sm" id="prune-btn">Ne garder que les 3 derniers par livrable</button>' : "") +
        "</div>" +
        rendersPanel + "</div>" +

      notesPanel +

      '<div class="panel"><div class="size-grid">' +
        '<div class="size-cell"><div class="lbl">Rendus</div><div class="val tnum">' + fmtBytes(p.dirSizes.renders) + "</div></div>" +
        '<div class="size-cell"><div class="lbl">Assets</div><div class="val tnum">' + fmtBytes(p.dirSizes.assets) + "</div></div>" +
        '<div class="size-cell"><div class="lbl">Total sur disque</div><div class="val tnum">' + fmtBytes(p.dirSizes.total) + "</div></div>" +
      "</div></div>" +

      extra
    );

    var heroV = document.getElementById("hero-v");
    var durEl = document.getElementById("hero-dur");
    if (heroV && durEl) {
      heroV.addEventListener("loadedmetadata", function () {
        if (isFinite(heroV.duration)) durEl.textContent = fmtDuration(heroV.duration * 1000);
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll(".dlv"), function (b) {
      b.onclick = function () {
        currentDeliverable = b.getAttribute("data-dlv");
        drawDetail(p);
      };
    });

    wireActions(p.slug, p);
    fillFeedbackText(p);

    var pruneBtn = document.getElementById("prune-btn");
    if (pruneBtn) pruneBtn.onclick = function () {
      pruneBtn.disabled = true;
      api("/api/prune/" + encodeURIComponent(p.slug) + "?keep=3").then(function (plan) {
        if (!plan.remove.length) { toast("Rien à ranger"); pruneBtn.disabled = false; return; }
        var list = plan.remove.map(function (r) {
          return '<div class="ev" style="padding:6px 0"><span class="file">' + esc(r.file) + "</span>" +
            (plan.deliverables > 1 ? '<span class="mt">' + esc(r.deliverable) + "</span>" : "") +
            '<span class="mt tnum">' + fmtBytes(r.bytes) + "</span></div>";
        }).join("");
        var body = "<p>Ces " + plan.remove.length + " rendus partent à la corbeille du système " +
          "(&#8776; " + fmtBytes(plan.freeBytes) + " libérés). Les " + plan.keep +
          " plus récents <b>de chaque livrable</b> restent" +
          (plan.deliverables > 1 ? " (" + plan.deliverables + " livrables dans ce projet)" : "") +
          (plan.protected ? ", ainsi que " + plan.protected + " master ou livraison" : "") + ".</p>" +
          '<div class="confirm-list">' + list + "</div>";
        return confirmDialog("Ranger les rendus", body, "Mettre à la corbeille").then(function (ok) {
          if (!ok) { pruneBtn.disabled = false; return; }
          return postJSON("/api/prune", { slug: p.slug, keep: 3 }).then(function (res) {
            toast((res.moved || []).length + " rendus à la corbeille · " + fmtBytes(res.freedBytes || 0) + " libérés");
            msState = null; // les tailles ont changé
            renderDetail(p.slug);
          });
        });
      }).catch(function (e) { toast("Rangement impossible : " + (e.message || "")); pruneBtn.disabled = false; });
    };

    var copyBtn = document.getElementById("copy-path");
    if (copyBtn) copyBtn.onclick = function () {
      var t = p.absPath || "";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(function () { toast("Chemin copié"); },
          function () { fallbackCopy(t); });
      } else fallbackCopy(t);
    };
    var revealBtn = document.getElementById("reveal");
    if (revealBtn) revealBtn.onclick = function () {
      revealBtn.disabled = true;
      postReveal(p.absPath).then(function () { toast("Revealed in Finder"); })
        .catch(function (e) { toast("Reveal failed: " + (e.message || "")); })
        .then(function () { revealBtn.disabled = false; });
    };
  }
  function fallbackCopy(t) {
    var ta = document.createElement("textarea");
    ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Chemin copié"); }
    catch (e) { toast("Copy not supported"); }
    document.body.removeChild(ta);
  }

  // markdown-lite: headings, bold, tables monospaced, bullets, everything else preformatted
  function mdLite(src) {
    var lines = src.replace(/\r\n/g, "\n").split("\n");
    var out = [], i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (/^\|.*\|\s*$/.test(line)) {
        var tbl = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { tbl.push(lines[i]); i++; }
        out.push('<div class="md-table">' + esc(tbl.join("\n")) + "</div>");
        continue;
      }
      var m;
      if ((m = /^###\s+(.*)$/.exec(line))) out.push('<div class="md-h3">' + inline(m[1]) + "</div>");
      else if ((m = /^##\s+(.*)$/.exec(line))) out.push('<div class="md-h2">' + inline(m[1]) + "</div>");
      else if ((m = /^#\s+(.*)$/.exec(line))) out.push('<div class="md-h1">' + inline(m[1]) + "</div>");
      else if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) out.push('<div class="md-li">' + inline(m[1]) + "</div>");
      else if (line.trim() === "") { /* skip blank */ }
      else out.push('<div class="md-p">' + inline(line) + "</div>");
      i++;
    }
    return out.join("");
  }
  function inline(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  // =====================================================================
  // Format detail — rend la spec markdown de formats/
  // =====================================================================
  function renderFormat(id) {
    setActiveNav("libraries");
    summaryStrip.hidden = true;
    if (!/^[A-Za-z0-9_-]+$/.test(id)) { h('<div class="loading">Format inconnu.</div>'); return; }
    var file = "/workspace/formats/" + encodeURIComponent(id) + ".md";
    h('<div class="loading">Loading format&#8230;</div>');
    Promise.all([
      fetch(file).then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        return r.text();
      }),
      api("/api/libraries").catch(function () { return null; })
    ]).then(function (both) {
      var txt = both[0];
      var lib = both[1];
      var fmt = lib && lib.formats ? lib.formats.filter(function (f) { return f.id === id; })[0] : null;
      var ref = fmt && fmt.refs && fmt.refs.length ? fmt.refs[0] : null;
      var exUrl = "/workspace/formats/exemples/" + encodeURIComponent(id) + ".mp4";
      var exPanel = /^\d/.test(id)
        ? '<div class="panel"><div class="panel-head"><h2>Exemple rendu &#183; Référence</h2>' +
          '<span class="hint"><a class="link" href="' + exUrl + '" target="_blank">ouvrir le mp4</a></span></div>' +
          '<div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">' +
          '<div><video controls preload="metadata" src="' + exUrl + '" ' +
          'poster="/workspace/formats/exemples/' + encodeURIComponent(id) + '.jpg" ' +
          'style="width:280px;max-width:100%;border-radius:12px;display:block" ' +
          'onerror="this.closest(&quot;.panel&quot;).style.display=&quot;none&quot;"></video>' +
          '<span class="hint">l\u2019exemple rendu</span></div>' +
          (ref
            ? '<div><a href="/workspace/' + esc(ref) + '" target="_blank">' +
              '<img src="/workspace/' + esc(ref) + '" alt="" style="width:280px;border-radius:12px;display:block"></a>' +
              '<span class="hint">le reel publié de référence</span></div>'
            : "") +
          "</div></div>"
        : "";
      h('<a class="back-link" href="#/libraries">&#8592; Bibliothèques</a>' +
        exPanel +
        '<div class="panel"><div class="panel-head"><h2>formats/' + esc(id) + '.md</h2>' +
        '<span class="hint"><a class="link" href="' + file + '" target="_blank">fichier brut</a></span></div>' +
        '<div class="notes-body">' + mdLite(txt) + "</div></div>");
    }).catch(function () {
      h('<a class="back-link" href="#/libraries">&#8592; Bibliothèques</a>' +
        '<div class="loading">Impossible de lire ' + esc(file) + "</div>");
    });
  }

  // =====================================================================
  // Libraries
  // =====================================================================
  function renderLibraries() {
    setActiveNav("libraries");
    summaryStrip.hidden = true;
    h('<div class="loading">Loading libraries&#8230;</div>');
    api("/api/libraries").then(function (lib) {
      var banner = lib.registryStale
        ? '<div class="lib-banner"><span class="dot" style="width:8px;height:8px;border-radius:50%;background:var(--red)"></span>' +
          "Style registry.json is older than a style.json. Run the registry generator to refresh.</div>"
        : "";

      // Le style maison n'est pas une référence parmi d'autres : c'est celui
      // avec lequel on monte. Les autres sont là pour s'en inspirer. Les
      // mélanger dans une liste à plat efface cette différence.
      var HOUSE = "marc";

      function styleRow(s, house) {
        return '<a class="style-row link' + (house ? " house" : "") + '" href="#/style/' +
          encodeURIComponent(s.id) + '">' +
          '<div class="style-num tnum">' + esc(pad2(s.number)) + "</div>" +
          '<div><div class="style-name">' + esc(s.name) +
            (house ? ' <span class="house-tag">ta charte</span>' : "") + "</div>" +
            '<div class="style-id">' + esc(s.id) + "</div></div>" +
          '<div><span class="style-status ' + esc(s.status) + '">' + esc(s.status || "inconnu") + "</span></div>" +
          '<div class="tnum">' + esc(s.cardCount) + " cartes</div>" +
          '<div class="swatches">' + swatches(s.palette) + "</div>" +
          '<div class="fonts">' + fontsHTML(s.fonts) + "</div>" +
          "</a>";
      }

      var houseList = lib.styles.filter(function (s) { return s.id === HOUSE; });
      var refList   = lib.styles.filter(function (s) { return s.id !== HOUSE; });
      var houseRows = houseList.map(function (s) { return styleRow(s, true); }).join("");
      var rows      = refList.map(function (s) { return styleRow(s, false); }).join("");
      var HEAD_ROW  = '<div class="style-row head"><span>#</span><span>Nom</span>' +
        '<span>État</span><span>Cartes</span><span>Palette</span><span>Polices</span></div>';

      var byType = lib.assets && lib.assets.byType ? lib.assets.byType : {};
      var assetCards = Object.keys(byType).sort(function (a, b) { return byType[b] - byType[a]; }).map(function (t) {
        return '<div class="asset-card"><div class="n tnum">' + esc(byType[t]) + '</div><div class="t">' + esc(t) + "</div></div>";
      }).join("");

      var fmts = lib.formats || [];
      var fmtRows = fmts.map(function (f) {
        var thumb = f.poster
          ? '<img src="/workspace/' + esc(f.poster) + '" alt="" style="width:54px;height:96px;object-fit:cover;border-radius:6px;display:block">'
          : "";
        return '<a class="style-row link" href="#/format/' + encodeURIComponent(f.id) + '">' +
          '<div class="style-num tnum">' + esc(f.number) + "</div>" +
          '<div><div class="style-name">' + esc(f.name) + "</div>" +
            '<div class="style-id">' + esc(f.hook || f.id) + "</div></div>" +
          '<div><span class="style-status ready">' + (f.example ? "exemple" : "spec") + "</span></div>" +
          '<div class="tnum">' + (f.scaffold ? "scaffold" : "&#8212;") + "</div>" +
          "<div>" + thumb + "</div><div></div>" +
          "</a>";
      }).join("");
      var FMT_HEAD = '<div class="style-row head"><span>#</span><span>Format</span>' +
        '<span>État</span><span>Squelette</span><span></span><span></span></div>';
      var fmtPanel = fmts.length
        ? '<div class="panel house-panel"><div class="panel-head"><h2>Formats de reel</h2>' +
            '<span class="hint">la structure d\u2019un reel &#183; <a class="link" href="#/format/README">guide</a>' +
            ' &#183; <a class="link" href="#/format/MESURES">mesures</a></span></div>' +
            FMT_HEAD + fmtRows + "</div>"
        : "";

      h(
        '<div class="view-head"><div><div class="view-title">Bibliothèques</div>' +
        '<div class="view-sub">Les formats de reel, la bibliothèque de styles et le registre des assets.</div></div>' +
        '<div class="head-actions">' +
          '<a class="rev-btn" href="/workspace/style-library/_previews-3d-marker.html" target="_blank">Previews écran 3D + marqueur</a>' +
          '<a class="rev-btn" href="/workspace/style-library/_all-styles.html" target="_blank">Tous les styles</a>' +
        '</div></div>' +
        banner +
        fmtPanel +
        (houseRows
          ? '<div class="panel house-panel"><div class="panel-head"><h2>Ta charte</h2>' +
              '<span class="hint">celle avec laquelle on monte</span></div>' +
              HEAD_ROW + houseRows + "</div>"
          : "") +
        '<div class="panel"><div class="panel-head"><h2>Références</h2>' +
          '<span class="hint tnum">' + esc(refList.length) + " styles &#183; " + esc(lib.cardCount) + " cartes</span></div>" +
          HEAD_ROW + rows +
        "</div>" +
        '<div class="view-head" style="margin-top:26px"><div><div class="view-title" style="font-size:16px">Assets</div>' +
        '<div class="view-sub tnum">' + esc(lib.assets ? lib.assets.assetCount : 0) + " fichiers en cache" + "</div></div></div>" +
        '<div class="asset-cards">' + (assetCards || '<div class="empty">No assets registered.</div>') + "</div>"
      );
    }).catch(showError);
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function swatches(pal) {
    if (!pal) pal = {};
    return ["bg", "fg", "accent", "red", "orange"].map(function (k) {
      var c = pal[k];
      if (!c) return '<span class="sw empty" title="' + k + ': none"></span>';
      return '<span class="sw" style="background:' + esc(c) + '" title="' + k + ": " + esc(c) + '"></span>';
    }).join("");
  }
  function fontsHTML(f) {
    if (!f) f = {};
    return ["display", "body", "mono"].map(function (k) {
      return '<div><span class="f-lbl">' + k + "</span> " + esc(f[k] || "none") + "</div>";
    }).join("");
  }

  // =====================================================================
  // Activity
  // =====================================================================
  var TIER_FR = {
    tier1: "Plein cadre", tier2: "Sur la vidéo", custom: "Sur mesure",
    transitions: "Transitions", variants: "Variantes", social: "Social"
  };
  // On cherche une carte par ce qu'elle FAIT ("il me faut une stat", "un
  // lower-third"), pas par son tier. Le regroupement suit l'intention.
  var PURPOSE_FR = {
    section: "Marqueurs de section", thesis: "Thèses", stat: "Chiffres",
    quote: "Citations", overview: "Vues d'ensemble", label: "Étiquettes",
    list: "Listes", equation: "Équations", definition: "Définitions",
    "lower-third": "Lower-thirds", screen: "Écrans", highlight: "Surlignage",
    compare: "Comparatifs", cta: "Appels à l'action", captions: "Sous-titres",
    media: "Médias", pip: "Médaillons", proof: "Preuves", mascot: "Mascotte",
    ui: "Interfaces", transition: "Transitions"
  };
  var PURPOSE_ORDER = ["screen", "highlight", "section", "thesis", "stat", "overview",
    "quote", "lower-third", "label", "list", "compare", "cta", "captions",
    "media", "pip", "ui", "proof", "definition", "equation", "mascot"];

  // Monte une preview quand sa vignette approche de l'écran, puis joue sa
  // timeline en boucle. Les cartes s'enregistrent en pause (contrat de rendu) :
  // les mettre en lecture est légitime ici, c'est une galerie, pas un rendu.
  // Monte la preview d'une vignette : une iframe qui joue la carte en boucle.
  // Les cartes s'enregistrent en pause (contrat de rendu) ; les jouer est
  // légitime ici, c'est une galerie, pas un rendu.
  function mountThumb(el) {
    if (el.dataset.mounted) return;
    el.dataset.mounted = "1";
    var f = document.createElement("iframe");
    f.setAttribute("scrolling", "no");
    f.setAttribute("title", "aperçu");
    f.addEventListener("load", function () {
      el.classList.add("live");
      observePlayback(el);
    });
    f.src = el.getAttribute("data-src");
    el.appendChild(f);
  }

  // Monte les previews d'un conteneur. Appelée à l'ouverture d'un groupe :
  // un groupe fait au plus une quinzaine de cartes, on les monte toutes plutôt
  // que de dépendre du défilement — une vignette dans un <details> fermé n'a
  // pas de géométrie, et l'observateur ne la voit donc jamais entrer.
  function mountPreviews(scope) {
    var root = scope || document;
    Array.prototype.forEach.call(
      root.querySelectorAll(".cardp-thumb[data-src]:not([data-mounted])"),
      mountThumb
    );
  }

  // --- Un style ---------------------------------------------------------------
  // Chaque carte est une composition autonome : on la monte telle quelle dans
  // une iframe à l'échelle, et on joue sa timeline en boucle. C'est la vraie
  // carte qui tourne, pas une capture — donc ce qu'on voit est ce qu'on aura.
  function renderStyle(id) {
    setActiveNav("libraries");
    summaryStrip.hidden = true;
    h('<div class="loading">Loading style&#8230;</div>');
    api("/api/style/" + encodeURIComponent(id)).then(function (st) {
      // groupé par intention, et chaque groupe se replie : un style peut avoir
      // 130 cartes, tout déplier d'un coup rend la recherche impossible
      var groups = {};
      st.cards.forEach(function (c) {
        var k = c.purpose || "autre";
        (groups[k] = groups[k] || []).push(c);
      });
      var keys = Object.keys(groups).sort(function (a, b) {
        var ia = PURPOSE_ORDER.indexOf(a), ib = PURPOSE_ORDER.indexOf(b);
        if (ia === -1) ia = 99; if (ib === -1) ib = 99;
        return ia - ib || a.localeCompare(b);
      });

      function cardHTML(c) {
        var src = "/workspace/" + c.path.split("/").map(encodeURIComponent).join("/");
        // Une variante est une déclinaison générée d'une carte de base. Elles
        // sont la moitié de la bibliothèque et se ressemblent par construction :
        // on peut les écarter du regard sans rien supprimer.
        var isVar = c.path.indexOf("/variants/") !== -1;
        // Une carte verticale (reels 9:16) a sa vignette verticale — sinon la
        // vignette 320x180 la recadre au lieu de la réduire.
        var vert = c.w && c.h && c.h > c.w;
        var dims = ' data-cw="' + (c.w || 1920) + '" data-ch="' + (c.h || 1080) + '"';
        return '<div class="cardp' + (isVar ? " variant" : "") + (vert ? " vert" : "") + '">' +
          '<button type="button" class="cardp-thumb' + (vert ? " vert" : "") + '" data-src="' + src +
            '" data-card="' + src + '" data-cardtitle="' + esc(c.id) + '"' + dims + "></button>" +
          '<div class="cardp-meta">' +
            '<div class="cardp-id">' + esc(c.id) + "</div>" +
            (c.treatment ? '<div class="cardp-tr">' + esc(c.treatment) + "</div>" : "") +
            (c.slots.length ? '<div class="cardp-slots">' + esc(c.slots.join(" · ")) + "</div>" : "") +
            '<button type="button" class="rev-btn" data-card="' + src +
              '" data-cardtitle="' + esc(c.id) + '"' + dims + ">Voir en grand</button>" +
          "</div></div>";
      }

      // Les deux premiers groupes ouverts : on voit tout de suite à quoi
      // ressemble le style, sans se noyer.
      var sections = keys.map(function (k, i) {
        var nVar = groups[k].filter(function (c) { return c.path.indexOf("/variants/") !== -1; }).length;
        var nBase = groups[k].length - nVar;
        var tierNote = nBase + " de base" + (nVar ? " · " + nVar + " variantes" : "");
        return '<details class="grp"' + (i < 2 ? " open" : "") + ">" +
          '<summary class="grp-head"><span class="grp-name">' + esc(PURPOSE_FR[k] || k) + "</span>" +
            '<span class="grp-count tnum">' + groups[k].length + "</span>" +
            '<span class="grp-note">' + esc(tierNote) + "</span></summary>" +
          '<div class="cardp-grid">' + groups[k].map(cardHTML).join("") + "</div>" +
        "</details>";
      }).join("");

      h('<a class="back-link" href="#/libraries">&#8592; Bibliothèques</a>' +
        '<div class="view-head"><div><div class="view-title">' + esc(st.name) + "</div>" +
        '<div class="view-sub">' + esc(st.summary || "") + "</div></div>" +
        '<div class="head-actions">' +
          '<button type="button" class="rev-btn" id="grp-vars" aria-pressed="false">Masquer les variantes</button>' +
          '<button type="button" class="rev-btn" id="grp-all">Tout ouvrir</button>' +
          '<span class="hint tnum">' + esc(st.cardCount) + " cartes</span>" +
          (st.missing ? '<span class="hint" style="color:var(--err)">' + esc(st.missing) + " manquante(s)</span>" : "") +
        "</div></div>" +
        '<div class="swatches big">' + swatches(st.palette) + "</div>" +
        sections);

      // à l'arrivée : seuls les groupes ouverts. Les autres attendent qu'on
      // les déplie — c'est tout l'intérêt de les avoir repliés.
      Array.prototype.forEach.call(document.querySelectorAll("details.grp[open]"), mountPreviews);

      Array.prototype.forEach.call(document.querySelectorAll("details.grp"), function (d) {
        d.addEventListener("toggle", function () { if (d.open) mountPreviews(d); });
      });
      // Masquer les variantes : c'est un filtre d'affichage, il ne touche à
      // rien sur le disque. Les compteurs de groupe suivent.
      var varBtn = document.getElementById("grp-vars");
      if (varBtn) {
        varBtn.addEventListener("click", function () {
          var hidden = document.body.classList.toggle("hide-variants");
          varBtn.setAttribute("aria-pressed", hidden ? "true" : "false");
          varBtn.textContent = hidden ? "Montrer les variantes" : "Masquer les variantes";
          Array.prototype.forEach.call(document.querySelectorAll("details.grp"), function (d) {
            var shown = d.querySelectorAll(hidden ? ".cardp:not(.variant)" : ".cardp").length;
            d.querySelector(".grp-count").textContent = shown;
            d.hidden = shown === 0;
          });
        });
      }

      var allBtn = document.getElementById("grp-all");
      if (allBtn) {
        allBtn.addEventListener("click", function () {
          var ds = document.querySelectorAll("details.grp");
          var openAll = allBtn.textContent === "Tout ouvrir";
          Array.prototype.forEach.call(ds, function (d) { d.open = openAll; });
          allBtn.textContent = openAll ? "Tout fermer" : "Tout ouvrir";
          if (openAll) mountPreviews();   // tout est déplié : on monte tout
        });
      }
    }).catch(function (e) {
      h('<a class="back-link" href="#/libraries">&#8592; Bibliothèques</a>' +
        '<div class="error-box">Style introuvable : <code>' + esc(id) + "</code><br>" + esc(e.message || "") + "</div>");
    });
  }

  // --- Carte en grand ----------------------------------------------------------
  // Ouvrir une carte la rejoue DEPUIS LE DÉBUT : on vient regarder l'animation,
  // pas tomber au milieu. La vignette, elle, tourne en boucle en fond — les
  // deux sont indépendantes, chacune sa propre iframe.
  var cardEl = null;
  function closeCard() {
    if (!cardEl) return;
    cardEl.remove();
    cardEl = null;
    document.removeEventListener("keydown", onCardKey);
  }
  function onCardKey(e) { if (e.key === "Escape") closeCard(); }

  // Une carte qui joue coûte vraiment : un style fait jusqu'à 300 vignettes, et
  // les faire tourner toutes en même temps fait tomber la page à moins de
  // 10 fps. On ne joue donc que ce qu'on regarde — entrer dans le cadre lance
  // la carte depuis le début, en sortir la met en pause. Le montage, lui, reste
  // commandé par l'ouverture du groupe : un <details> fermé n'a pas de
  // géométrie, aucun observateur n'y verrait jamais entrer quoi que ce soit.
  var playObserver = null;
  function observePlayback(el) {
    if (!window.IntersectionObserver) { driveFrom0(el.querySelector("iframe"), true); return; }
    if (!playObserver) {
      playObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var f = e.target.querySelector("iframe");
          if (!f) return;
          if (e.isIntersecting) driveFrom0(f, true);
          else pauseFrame(f);
        });
      }, { rootMargin: "300px 0px" });   // un peu d'avance sur le défilement
    }
    playObserver.observe(el);
  }

  function pauseFrame(frame) {
    loopers = loopers.filter(function (l) { return l.frame !== frame; });
    try {
      var w = frame.contentWindow;
      if (w && w.__playerReady && w.__player) w.__player.pause();
      else if (w && w.__timelines) {
        Object.keys(w.__timelines).forEach(function (k) { w.__timelines[k].pause(); });
      }
    } catch (err) { /* iframe déjà partie */ }
  }

  // Remet la page à zéro côté lecture : plus de pilotes, plus d'observateur.
  function resetPlayback() {
    loopers = [];
    if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
    if (playObserver) { playObserver.disconnect(); playObserver = null; }
  }

  // Le serveur injecte le moteur HyperFrames dans chaque composition qu'il sert
  // (serveWorkspace). Ce moteur prend la main sur window.__timelines et réécrit
  // leur position à chaque frame : une timeline qu'on met soi-même en lecture
  // avance d'une image, puis le moteur la ramène où IL en est — zéro. Comme les
  // cartes cachent leur contenu au départ (tl.from autoAlpha:0), on obtenait
  // une vignette vide. On pilote donc par son lecteur, window.__player, seule
  // surface qui fasse avancer le temps. Sans moteur (composition servie nue),
  // on garde l'ancien chemin.
  var LOOP_GAP_MS = 1100;   // le temps de lire la carte avant qu'elle reparte

  // Un seul minuteur pour toute la page : un groupe ouvert fait une centaine de
  // vignettes, autant d'intervalles séparés ne servirait qu'à chauffer le CPU.
  var loopers = [];
  var loopTimer = null;
  function watchLoops() {
    if (loopTimer) return;
    loopTimer = setInterval(function () {
      loopers = loopers.filter(function (l) { return l.frame.isConnected; });
      if (!loopers.length) { clearInterval(loopTimer); loopTimer = null; return; }
      loopers.forEach(function (l) {
        if (l.waiting) return;
        var pl = l.player, dur = pl.getDuration();
        // fin de carte : le lecteur s'arrête de lui-même sur la dernière image
        if (!(dur > 0) || pl.isPlaying() || pl.getTime() < dur - 0.05) return;
        l.waiting = true;
        setTimeout(function () {
          l.waiting = false;
          if (!l.frame.isConnected) return;
          pl.seek(0); pl.play();
        }, LOOP_GAP_MS);
      });
    }, 250);
  }

  // joue la composition d'une iframe à partir de zéro, en boucle
  function driveFrom0(frame, loop) {
    var tries = 0;
    // une iframe ne garde qu'un pilote : Rejouer ne doit pas en empiler un autre
    loopers = loopers.filter(function (l) { return l.frame !== frame; });
    (function go() {
      if (!frame.isConnected) return;
      var w = frame.contentWindow;
      var player = w && w.__playerReady && w.__player;
      if (player) {
        player.seek(0);
        player.play();
        if (loop) { loopers.push({ frame: frame, player: player, waiting: false }); watchLoops(); }
        return;
      }
      // Repli : pas de moteur dans cette page, les timelines sont à nous.
      // Le moteur s'installe APRÈS le load de l'iframe, et une composition pose
      // ses timelines avant lui : basculer sur le repli dès qu'on en voit une,
      // c'est se battre contre un moteur qui arrive une seconde plus tard. On
      // lui laisse ~2 s avant de considérer qu'il n'y en a pas.
      var t = w && w.__timelines, keys = t ? Object.keys(t) : [];
      if (tries++ < 150 && (!keys.length || tries < 25)) { setTimeout(go, 80); return; }
      if (!keys.length) return;
      keys.forEach(function (k) {
        var tl = t[k];
        tl.eventCallback("onComplete", loop
          ? function () { setTimeout(function () { tl.restart(); }, LOOP_GAP_MS); }
          : null);
        tl.pause(0);
        tl.play(0);
      });
    })();
  }

  function openCard(src, title, cw, ch) {
    closeCard();
    // La carte (16:9 ou 9:16) mise à l'échelle pour tenir dans la fenêtre.
    cw = cw || 1920; ch = ch || 1080;
    var scale = Math.min(
      Math.min(1400, window.innerWidth - 96) / cw,
      (window.innerHeight - 190) / ch
    );
    var w = Math.round(cw * scale);
    var hh = Math.round(ch * scale);

    cardEl = document.createElement("div");
    cardEl.className = "player-back";
    cardEl.innerHTML =
      '<div class="player-box card-box" role="dialog" aria-label="Aperçu de la carte">' +
        '<div class="player-head"><div class="player-title">' + esc(title || "") + "</div>" +
          '<div class="player-acts">' +
            '<button type="button" class="rev-btn" data-replay="1">Rejouer</button>' +
            '<a class="rev-btn" href="' + src + '" target="_blank">Onglet</a>' +
            '<button type="button" class="rev-btn" data-close="1">Fermer</button>' +
          "</div></div>" +
        '<div class="card-stage" style="width:' + w + "px;height:" + hh + 'px">' +
          '<iframe scrolling="no" title="carte" style="width:' + cw + "px;height:" + ch +
            "px;transform:scale(" + scale + ')"></iframe>' +
        "</div>" +
      "</div>";

    cardEl.addEventListener("click", function (e) {
      if (e.target === cardEl || e.target.getAttribute("data-close")) { closeCard(); return; }
      if (e.target.getAttribute("data-replay")) {
        var fr = cardEl.querySelector("iframe");
        if (fr) driveFrom0(fr, true);
      }
    });
    document.body.appendChild(cardEl);
    document.addEventListener("keydown", onCardKey);

    var f = cardEl.querySelector("iframe");
    f.addEventListener("load", function () { driveFrom0(f, true); });
    f.src = src;
  }

  // --- Lecteur ---------------------------------------------------------------
  // Une lightbox pour regarder un rendu sans quitter le hub. Le fichier est
  // servi par /workspace/ (avec Range), donc la barre de progression répond et
  // on peut naviguer dans la vidéo.
  var playerEl = null;
  function closePlayer() {
    if (!playerEl) return;
    var v = playerEl.querySelector("video");
    if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
    playerEl.remove();
    playerEl = null;
    document.removeEventListener("keydown", onPlayerKey);
  }
  function onPlayerKey(e) { if (e.key === "Escape") closePlayer(); }

  function openPlayer(wsPath, title) {
    closePlayer();
    var src = "/workspace/" + wsPath.split("/").map(encodeURIComponent).join("/");
    playerEl = document.createElement("div");
    playerEl.className = "player-back";
    playerEl.innerHTML =
      '<div class="player-box" role="dialog" aria-label="Lecteur">' +
        '<div class="player-head"><div class="player-title">' + esc(title || wsPath) + "</div>" +
          '<div class="player-acts">' +
            '<a class="rev-btn" href="' + src + '" target="_blank">Onglet</a>' +
            '<button type="button" class="rev-btn" data-close="1">Fermer</button>' +
          "</div></div>" +
        '<video controls autoplay playsinline preload="metadata" src="' + src + '"></video>' +
      "</div>";
    // fermer au clic hors de la boîte, ou sur Fermer
    playerEl.addEventListener("click", function (e) {
      if (e.target === playerEl || e.target.getAttribute("data-close")) closePlayer();
    });
    document.body.appendChild(playerEl);
    document.addEventListener("keydown", onPlayerKey);
  }

  // --- Review -------------------------------------------------------------
  // La liste des projets qui ont une interface de review et un rendu à
  // commenter. On propose par défaut le master le plus récent : c'est celui
  // qu'on regarde pour valider, puisqu'il porte le niveau audio de publication.
  function renderReview() {
    setActiveNav("mission");
    summaryStrip.hidden = true;
    h('<div class="loading">Loading reviews&#8230;</div>');
    api("/api/reviews").then(function (data) {
      var list = data.projects || [];
      if (!list.length) {
        h('<div class="view-head"><div><div class="view-title">Review</div>' +
          '<div class="view-sub">Rien à relire pour l\'instant.</div></div></div>' +
          '<div class="panel"><div class="empty">Aucun projet n\'a encore de rendu. ' +
          'Rends une composition, puis reviens ici.</div></div>');
        return;
      }
      var cards = list.map(function (p) {
        var latest = p.latest;
        var when = latest ? relTime(latest.mtime) : "";
        var size = latest ? (latest.bytes / 1048576).toFixed(1) + " MB" : "";
        var badge = latest
          ? '<span class="style-status draft">frame-by-frame</span>'
          : '<span class="style-status unknown">aucun rendu</span>';
        return '<div class="rev-card" data-slug="' + esc(p.slug) + '">' +
          '<div class="rev-top"><div class="rev-name">' + esc(pretty(p.slug)) + "</div>" + badge + "</div>" +
          '<div class="rev-slug">' + esc(p.slug) + "</div>" +
          (latest
            ? '<div class="rev-meta tnum">' + esc(latest.name) + " &#183; " + esc(size) + " &#183; " + esc(when) + "</div>"
            : '<div class="rev-meta">aucun rendu</div>') +
          '<div class="rev-actions">' +
            (latest
              ? '<a class="rev-btn primary" href="#/review/' + encodeURIComponent(p.slug) + '">Ouvrir la review</a>'
              : "") +
            (latest
              ? '<button type="button" class="rev-btn" data-play="' + esc(latest.path) +
                '" data-title="' + esc(p.slug + " · " + latest.name) + '">Lire le rendu</button>'
              : "") +
            '<a class="rev-btn" href="#/project/' + encodeURIComponent(p.slug) + '">Le projet</a>' +
          "</div>" +
          (p.renderCount > 1 ? '<div class="rev-count tnum">' + esc(p.renderCount) + " rendus</div>" : "") +
          "</div>";
      }).join("");

      h('<div class="view-head"><div><div class="view-title">Review</div>' +
        '<div class="view-sub">Relire un rendu et déposer des retours horodatés. ' +
        'Le rendu proposé est le master le plus récent.</div></div></div>' +
        '<div class="rev-grid">' + cards + "</div>");
    }).catch(function (e) {
      h('<div class="error">Reviews indisponibles : ' + esc(e.message) + "</div>");
    });
  }

  // La review d'un projet, montée en plein cadre. review.html est servi depuis
  // le workspace (/workspace/...), pas depuis public/ : il vit dans le projet,
  // à côté de son MP4.
  function renderReviewOne(slug) {
    setActiveNav("mission");
    summaryStrip.hidden = true;
    // La review est générique et vit dans le hub : un seul fichier pour tous
    // les projets, plus de copie à maintenir dans chacun.
    // Cache-buster : review.html a pu être mis en cache par le navigateur avant
    // qu'on serve l'interface en no-cache. Sans ça, une correction de la review
    // peut rester invisible pendant des jours dans une iframe.
    var src = "/review.html?project=" + encodeURIComponent(slug) + "&t=" + BUILD;
    // Pas de titre ni de sous-titre au-dessus : le projet est déjà écrit dans la
    // review elle-même, et chaque ligne posée ici est prise sur la hauteur de la
    // vidéo. Il ne reste que les deux liens, posés PAR-DESSUS le cadre.
    h('<div class="rev-full">' +
      '<div class="rev-float"><a class="rev-btn" href="#/project/' + encodeURIComponent(slug) + '">&#8592; Le projet</a>' +
      '<a class="rev-btn" href="' + src + '" target="_blank">Plein écran</a></div>' +
      '<iframe src="' + src + '" title="Review"></iframe></div>');
    view.classList.add("review-page");
  }

  // Le Studio HyperFrames, embarqué. On ne refait pas d'éditeur : le Studio a
  // déjà la timeline à pistes avec images-clés, le rasoir, l'aimantation, le
  // mixeur audio avec formes d'onde, l'inspecteur et le lint — et il écrit dans
  // la source par une API transactionnelle qui sauvegarde avant chaque
  // écriture. Le hub apporte ce que le Studio ignore : les projets, les
  // livrables, la review et le pipeline.
  function renderEditor(slug) {
    setActiveNav("mission");
    summaryStrip.hidden = true;
    h('<div class="std-root">' +
        '<div class="std-boot"><div class="std-spin"></div>' +
          "<div>Ouverture du Studio pour <b>" + esc(pretty(slug)) + "</b>…</div>" +
          '<div class="std-sub">Premier lancement : une à trois secondes.</div></div>' +
      "</div>");
    view.classList.add("review-page");

    postJSON("/api/studio/" + encodeURIComponent(slug), {}).then(function (r) {
      // Une bande à nous, au-dessus, plutôt qu'une barre flottante : le Studio
      // a ses propres commandes dans le coin haut droit (Capture, Inspecteur,
      // Export), et les recouvrir serait le rendre inutilisable.
      h('<div class="std-root">' +
          '<div class="std-bar">' +
            '<a class="rev-btn" href="#/project/' + encodeURIComponent(slug) + '">&#8592; Le projet</a>' +
            '<span class="std-name">' + esc(pretty(slug)) + "</span>" +
            '<span class="std-port tnum">' + esc(String(r.port)) + (r.reused ? " · déjà ouvert" : "") + "</span>" +
            '<a class="rev-btn" href="#/review/' + encodeURIComponent(slug) + '">Review</a>' +
            '<a class="rev-btn" href="' + esc(r.url) + '" target="_blank" rel="noopener">Plein écran</a>' +
            '<button type="button" class="rev-btn" id="std-stop">Fermer le Studio</button>' +
          "</div>" +
          '<iframe class="std-frame" src="' + esc(r.url) + '" title="HyperFrames Studio" ' +
            'allow="autoplay; fullscreen; clipboard-write"></iframe>' +
        "</div>");
      view.classList.add("review-page");
      var stop = document.getElementById("std-stop");
      if (stop) stop.onclick = function () {
        stop.disabled = true;
        fetch("/api/studio/" + encodeURIComponent(slug), { method: "DELETE" })
          .then(function () { location.hash = "#/project/" + encodeURIComponent(slug); });
      };
    }).catch(function (e) {
      h('<a class="back-link" href="#/project/' + encodeURIComponent(slug) + '">&#8592; Le projet</a>' +
        '<div class="error-box">Le Studio n\'a pas démarré : ' + esc(e.message) + "<br><br>" +
        "Depuis un terminal, dans le dossier du projet : <code>npx hyperframes preview</code>.</div>");
    });
  }

  function renderActivity() {
    setActiveNav("activity");
    summaryStrip.hidden = true;
    h('<div class="loading">Loading activity&#8230;</div>');
    api("/api/activity").then(function (a) {
      var commits = a.commits.length ? a.commits.map(function (c) {
        return '<div class="commit"><span class="hash tnum">' + esc(c.hash) + "</span>" +
          '<span class="subj">' + esc(c.subject) + "</span>" +
          '<span class="date tnum">' + esc(relTime(c.date)) + "</span></div>";
      }).join("") : '<div class="empty">No commits found.</div>';

      var files = a.recentFiles.length ? a.recentFiles.map(function (f) {
        return '<div class="rfile"><span class="rp">' + esc(f.path) + "</span>" +
          '<span class="rm tnum">' + esc(relTime(f.mtime)) + "</span></div>";
      }).join("") : '<div class="empty">No recent files.</div>';

      h(
        '<div class="view-head"><div><div class="view-title">Activity</div>' +
        '<div class="view-sub">Git state and recently touched project files.</div></div></div>' +
        '<div class="activity-topline">' +
          '<span class="branch-pill"><span class="brand-dot" style="box-shadow:none"></span>' + esc(a.branch) + "</span>" +
          '<span class="dirty-pill ' + (a.dirtyCount ? "" : "clean") + '">' +
            (a.dirtyCount ? esc(a.dirtyCount) + " uncommitted file" + (a.dirtyCount === 1 ? "" : "s") : "working tree clean") +
          "</span>" +
        "</div>" +
        '<div class="activity-cols">' +
          '<div class="panel"><div class="panel-head"><h2>Recent commits</h2><span class="hint">last ' + a.commits.length + "</span></div>" +
            '<div class="panel-body">' + commits + "</div></div>" +
          '<div class="panel"><div class="panel-head"><h2>Recently modified</h2><span class="hint">under video-projects/</span></div>' +
            '<div class="panel-body">' + files + "</div></div>" +
        "</div>"
      );
    }).catch(showError);
  }

  // =====================================================================
  // Router
  // =====================================================================
  function showError(e) {
    summaryStrip.hidden = true;
    h('<div class="error-box"><strong>Could not reach the Editing OS server.</strong><br>' +
      esc(e && e.message ? e.message : "Unknown error") +
      '<br><br>Start it with <code>node editing-os/server.mjs</code>, or append ' +
      '<code>?fixture=1</code> to preview with sample data.</div>');
  }

  function setActiveNav(route) {
    Array.prototype.forEach.call(document.querySelectorAll(".nav-link"), function (l) {
      l.classList.toggle("active", l.getAttribute("data-route") === route);
    });
  }

  var studioMounted = false;
  function leaveStudio() {
    if (studioMounted && window.Studio) { window.Studio.unmount(); }
    studioMounted = false;
  }

  // Un seul délégué pour tout ce qui est lisible, quelle que soit la vue :
  // les lignes de rendu de la fiche projet et les boutons de la vue Review.
  document.addEventListener("click", function (e) {
    var card = e.target.closest ? e.target.closest("[data-card]") : null;
    if (card) {
      e.preventDefault();
      openCard(card.getAttribute("data-card"), card.getAttribute("data-cardtitle"),
        parseInt(card.getAttribute("data-cw"), 10) || 1920,
        parseInt(card.getAttribute("data-ch"), 10) || 1080);
      return;
    }
    var el = e.target.closest ? e.target.closest("[data-play]") : null;
    if (!el) return;
    e.preventDefault();
    openPlayer(el.getAttribute("data-play"), el.getAttribute("data-title"));
  });

  function route() {
    var hash = location.hash || "#/";
    closePlayer();
    closeCard();
    if (hash !== "#/studio") leaveStudio();
    view.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    if (hash.indexOf("#/project/") === 0) {
      renderDetail(decodeURIComponent(hash.slice("#/project/".length)));
    } else if (hash === "#/studio") {
      renderStudio();
    } else if (hash === "#/libraries") {
      renderLibraries();
    } else if (hash.indexOf("#/style/") === 0) {
      renderStyle(decodeURIComponent(hash.slice("#/style/".length)));
    } else if (hash.indexOf("#/format/") === 0) {
      renderFormat(decodeURIComponent(hash.slice("#/format/".length)));
    } else if (hash === "#/review") {
      renderReview();
    } else if (hash.indexOf("#/review/") === 0) {
      renderReviewOne(decodeURIComponent(hash.slice("#/review/".length)));
    } else if (hash.indexOf("#/edit/") === 0) {
      renderEditor(decodeURIComponent(hash.slice("#/edit/".length)));
    } else if (hash === "#/activity") {
      renderActivity();
    } else {
      renderMission();
    }
    // keep fixture flag on internal nav links
    if (FIXTURE) patchFixtureLinks();
  }

  // Studio view: mounts the pixel-art canvas scene (studio.js owns its rAF loop).
  function renderStudio() {
    setActiveNav("studio");
    summaryStrip.hidden = true;
    h('<div class="view-head"><div><div class="view-title">The Studio</div>' +
      '<div class="view-sub">Tes agents de montage au travail. En direct depuis ' +
      (FIXTURE ? "fixture data" : "/api/agents") + ", polled every 8 seconds.</div></div></div>" +
      '<div id="studio-mount"></div>');
    var host = document.getElementById("studio-mount");
    if (window.Studio && host) {
      window.Studio.mount(host);
      studioMounted = true;
    } else if (host) {
      host.innerHTML = '<div class="empty"><h3>Studio unavailable</h3><div>studio.js did not load.</div></div>';
    }
  }

  // ---------- Topbar Studio dot: global 30s /api/agents poll ----------
  var studioDot = document.getElementById("studio-dot");
  function pollStudioDot() {
    if (FIXTURE) {
      // fixture: show the dot so the affordance is visible in preview
      if (studioDot) { studioDot.hidden = false; studioDot.title = "2 agents working"; }
      return;
    }
    // Forward a dev ?force override so screenshots/tests can drive the dot;
    // the real backend derives working state from disk and ignores it.
    var force = new URLSearchParams(location.search).get("force");
    var url = "/api/agents" + (force ? "?force=" + encodeURIComponent(force) : "");
    fetch(url, { headers: { accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (st) {
        if (!studioDot) return;
        var working = st && Array.isArray(st.agents)
          ? st.agents.filter(function (a) { return a.status === "working"; }).length : 0;
        studioDot.hidden = working === 0;
        studioDot.title = working + (working === 1 ? " agent working" : " agents working");
      })
      .catch(function () { if (studioDot) studioDot.hidden = true; });
  }

  function patchFixtureLinks() {
    // hash links don't lose query string, but ensure flag banner is visible
    document.getElementById("fixture-flag").hidden = false;
  }

  // Refresh: POST rescan, drop cache, re-render current view
  refreshBtn.onclick = function () {
    refreshBtn.classList.add("loading");
    postRescan().then(function (r) {
      msState = null;
      document.getElementById("scan-status").textContent =
        FIXTURE ? "fixture snapshot" : "rescanned in " + (r.ms || 0) + " ms";
      route();
      toast(FIXTURE ? "Fixture data reloaded" : "Workspace rescanned");
    }).catch(function (e) {
      toast("Rescan failed: " + (e.message || ""));
    }).then(function () {
      refreshBtn.classList.remove("loading");
    });
  };

  window.addEventListener("hashchange", route);
  document.getElementById("scan-status").textContent = FIXTURE ? "fixture snapshot" : "atelier de montage";
  if (FIXTURE) document.getElementById("fixture-flag").hidden = false;
  route();

  // Global topbar dot poll (30s), the only app-wide agents poll.
  pollStudioDot();
  setInterval(pollStudioDot, 30000);
})();
