/* Editing OS - The Studio (Workstream D)
 * 8-bit pixel-art co-working office. Vanilla JS, single canvas, embedded pixel
 * matrices. No external images, no fonts fetched, no network beyond /api/agents.
 *
 * Exposes window.Studio = { mount(container), unmount(), pollDot(cb) }.
 * app.js drives mount/unmount on the #/studio route and runs the global dot poll.
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------- constants
  var LOGICAL_W = 640;
  var LOGICAL_H = 360;
  var ANIM_FPS = 8;            // sprite animation cadence
  var WALK_SPEED = 26;         // logical px / second
  var POLL_MS = 8000;          // /api/agents while active
  var IDLE_BUCKET_MS = 45000;  // seeded wander re-plan bucket

  var FIXTURE = new URLSearchParams(location.search).get("fixture") === "1";

  // Roster (frozen ids per STUDIO_CONTRACT). deskX is the seated logical x.
  var ROSTER = [
    { id: "silences", name: "Snip",  role: "Silence Editor",  accent: "#4ADE80" },
    { id: "mistakes", name: "Redo",  role: "Mistake Editor",  accent: "#F5B942" },
    { id: "verify",   name: "Vera",  role: "Verifier",        accent: "#C084FC" },
    { id: "motion",   name: "Mo",    role: "Motion Designer", accent: "#37BDF8" },
    { id: "broll",    name: "Scout", role: "B-roll Scout",    accent: "#FB923C" }
  ];

  // ------------------------------------------------------------- deterministic
  // mulberry32 PRNG (per spec) - deterministic wandering within a 45s bucket.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------------- palettes
  // Shared neutral tones that read well on near-black. Index 0 = transparent.
  // Accent-tinted slots (shirt/headphones/monitor) are injected per character.
  var P = {
    _: null,          // 0 transparent
    skin: "#E7B38A",  // skin
    skinS: "#C98F68", // skin shadow
    hair: "#2B2320",  // dark hair
    hairH: "#4A3B33", // hair highlight
    pants: "#2C333F", // dark trousers
    pantsH: "#3A4351",
    shoe: "#15181D",
    white: "#EEF2F6", // eye / highlight
    line: "#0C0E12",  // outline near-black
    band: "#12161E"   // headphone band neutral
  };

  // Build a per-character palette map (index -> hex). Slots:
  // 0 transparent, 1 line, 2 skin, 3 skinS, 4 hair, 5 hairH, 6 pants, 7 pantsH,
  // 8 shoe, 9 white, 10 accent, 11 accentD (dark accent), 12 accentL (light)
  function tint(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { var m = 1 + f; r *= m; g *= m; b *= m; }
    else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    function hx(v) { v = Math.max(0, Math.min(255, Math.round(v))).toString(16); return v.length < 2 ? "0" + v : v; }
    return "#" + hx(r) + hx(g) + hx(b);
  }
  function palFor(accent) {
    return [
      null,        // 0
      P.line,      // 1
      P.skin,      // 2
      P.skinS,     // 3
      P.hair,      // 4
      P.hairH,     // 5
      P.pants,     // 6
      P.pantsH,    // 7
      P.shoe,      // 8
      P.white,     // 9
      accent,      // 10
      tint(accent, -0.42), // 11 dark accent
      tint(accent, 0.45)   // 12 light accent
    ];
  }

  // --------------------------------------------------------------- sprite art
  // Each character frame is 16 wide x 24 tall. Values index into the palette.
  // Legend: . = transparent(0) 1 line 2 skin 3 skinShadow 4 hair 5 hairHi
  //         6 pants 7 pantsHi 8 shoe 9 white a accent b accentDark c accentLight
  //
  // Silhouettes are deliberately distinct: hairstyle, headgear, and shirt
  // shape differ per character so the five read apart at a glance.
  function px(rows) {
    return rows.map(function (r) {
      return r.split("").map(function (ch) {
        if (ch === "." || ch === " ") return 0;
        if (ch === "a") return 10;
        if (ch === "b") return 11;
        if (ch === "c") return 12;
        return parseInt(ch, 10);
      });
    });
  }

  // ---- Base body builder: we author each pose once, per hairstyle variant. ----
  // To keep the file tractable while still giving 5 distinct silhouettes, each
  // character supplies a "head" style; bodies (stand/walk/sit/type/stretch/sip)
  // are shared templates with the shirt drawn in accent. Heads are 16x9, bodies
  // start at row 9. This yields legible, individual characters.

  // Head styles (16 wide x 9 tall). 'h' rows hold hair variation.
  var HEADS = {
    // Snip - short spiky green-tinted crop, headphones
    snip: px([
      "................",
      ".....44444......",
      "....4555554.....",
      "...b4hhhhh4b....",
      "...b122222 1b...",
      "...b129929 1b...",
      "...b122222 1b...",
      "....1233321.....",
      ".....11111......"
    ]),
    // Redo - beanie/cap, rounded
    redo: px([
      "................",
      "....bbbbbbb.....",
      "...baaaaaaab....",
      "...b4444444b....",
      "...1222222 1....",
      "...1299299 1....",
      "...1222222 1....",
      "....1233321.....",
      ".....11111......"
    ]),
    // Vera - long hair down sides, purple tint
    vera: px([
      ".....44444......",
      "....4555554.....",
      "...45hhhhh54....",
      "..4b122221b4....",
      "..45129921 54...",
      "..45122221 54...",
      "..44123332144...",
      "...4411111 44...",
      "....4.....4....."
    ]),
    // Mo - side-part sleek hair, blue tint
    mo: px([
      "................",
      "....555444......",
      "...4hhhhhh4.....",
      "...b122222 b....",
      "...b129929 b....",
      "...b122222 b....",
      "....1233321.....",
      ".....11111......",
      "................"
    ]),
    // Scout - explorer cap with brim, orange
    scout: px([
      "................",
      "...aaaaaaaa.....",
      "..baaaaaaaab....",
      ".ccaaaaaaaacc...",
      "...1222222 1....",
      "...1299299 1....",
      "...1222222 1....",
      "....1233321.....",
      ".....11111......"
    ])
  };

  // Bodies are 16x15 (rows 9..23). Shirt uses accent (a/b/c).
  // torso pose helpers: we hand-author each state's body once.
  var BODIES = {
    stand0: px([
      "....aaaaaa......",
      "...baaaaaab.....",
      "..b2aaaaaa2b....",
      "..b2aaaaaa2b....",
      "...baaaaaab.....",
      "...ba7777ab.....",
      "....6666 66.....",
      "....6666 66.....",
      "....6666 66.....",
      "....6666 66.....",
      "....7666 67.....",
      "....8888 88.....",
      "...18811881.....",
      "................",
      "................"
    ]),
    stand1: px([
      "....aaaaaa......",
      "...baaaaaab.....",
      "..b2aaaaaa2b....",
      "..b2aaaaaa2b....",
      "...baaaaaab.....",
      "...ba7777ab.....",
      "....6666 66.....",
      "....6666 66.....",
      "....6666 66.....",
      "....6667 66.....",
      "....7666 67.....",
      "....8888 88.....",
      "...18811881.....",
      "................",
      "................"
    ]),
    // walk cycle - 4 frames, legs swing
    walk0: px([
      "....aaaaaa......",
      "..2baaaaaab.....",
      "..b2aaaaaa2b....",
      "...baaaaaab.....",
      "...baaaaaab.....",
      "...ba7777ab.....",
      "....666666......",
      "....666666......",
      "...6666.666.....",
      "..666....666....",
      "..7.......67....",
      "..88.....88.....",
      ".188.....188....",
      "................",
      "................"
    ]),
    walk1: px([
      "....aaaaaa......",
      "...baaaaaab2....",
      "..b2aaaaaa2b....",
      "...baaaaaab.....",
      "...baaaaaab.....",
      "...ba7777ab.....",
      "....666666......",
      "....666666......",
      "....666666......",
      "....6666 6......",
      "....766 67......",
      "....88 888......",
      "...18811881.....",
      "................",
      "................"
    ]),
    walk2: px([
      "....aaaaaa......",
      "...baaaaaab.....",
      "..b2aaaaaa2b....",
      "...baaaaaab.....",
      "...baaaaaab.....",
      "...ba7777ab.....",
      "....666666......",
      "....666666......",
      "...666.6666.....",
      "..666....666....",
      "..76.......7....",
      "...88....88.....",
      "..188....881....",
      "................",
      "................"
    ]),
    walk3: px([
      "....aaaaaa......",
      "...baaaaaab.....",
      "..b2aaaaaa2b....",
      "...baaaaaab.....",
      "...baaaaaab.....",
      "...ba7777ab.....",
      "....666666......",
      "....666666......",
      "....666666......",
      "....6 6666......",
      "....76 667......",
      "....888 88......",
      "...18811881.....",
      "................",
      "................"
    ]),
    // seated - legs forward under desk (only upper body visible above desk line)
    sit0: px([
      "....aaaaaa......",
      "...baaaaaab.....",
      "..b2aaaaaa2b....",
      "..b2aaaaaa2b....",
      "...baaaaaab.....",
      "...ba7777ab.....",
      "...c666666c.....",
      "...6666666 .....",
      "...66666666.....",
      "..666....666....",
      "..66......66....",
      "..8........8....",
      "................",
      "................",
      "................"
    ]),
    // typing frames - forearms/hands out toward desk; small vertical bob
    type0: px([
      "....aaaaaa......",
      "...baaaaaab.....",
      "..22aaaaaa22....",
      "..b2aaaaaa2b....",
      "...baaaaaab.....",
      "..2ba7777ab2....",
      "..2c666666c2....",
      "...6666666 .....",
      "...66666666.....",
      "..666....666....",
      "..66......66....",
      "..8........8....",
      "................",
      "................",
      "................"
    ]),
    type1: px([
      "....aaaaaa......",
      "...baaaaaab.....",
      "...2aaaaaa2.....",
      "..b2aaaaaa2b....",
      "..2baaaaaab2....",
      "...ba7777ab.....",
      "..2c666666c2....",
      "..2 666666 2....",
      "...66666666.....",
      "..666....666....",
      "..66......66....",
      "..8........8....",
      "................",
      "................",
      "................"
    ]),
    type2: px([
      "....aaaaaa......",
      "..2baaaaaab.....",
      "..b2aaaaaa22....",
      "..b2aaaaaa2b....",
      "...baaaaaab2....",
      "...ba7777ab.....",
      "..2c666666c2....",
      "...6666666 2....",
      "...66666666.....",
      "..666....666....",
      "..66......66....",
      "..8........8....",
      "................",
      "................",
      "................"
    ]),
    // stretch - arms up
    stretch0: px([
      ".2..aaaaaa..2...",
      ".b2.aaaaaa.2b...",
      "..2baaaaaab2....",
      "...baaaaaab.....",
      "...baaaaaab.....",
      "...ba7777ab.....",
      "...c666666c.....",
      "...6666666 .....",
      "...66666666.....",
      "..666....666....",
      "..66......66....",
      "..8........8....",
      "................",
      "................",
      "................"
    ]),
    stretch1: px([
      "2....aaaaaa...2.",
      ".b...aaaaaa..b..",
      "..2baaaaaab2....",
      "...baaaaaab.....",
      "...baaaaaab.....",
      "...ba7777ab.....",
      "...c666666c.....",
      "...6666666 .....",
      "...66666666.....",
      "..666....666....",
      "..66......66....",
      "..8........8....",
      "................",
      "................",
      "................"
    ]),
    // coffee sip - one arm raised with mug near face
    sip0: px([
      "....aaaaaa......",
      "...baaaaaab.....",
      "..b2aaaaaacc9...",
      "..b2aaaaaa2b9...",
      "...baaaaaab.....",
      "...ba7777ab.....",
      "...c666666c.....",
      "...6666666 .....",
      "...66666666.....",
      "..666....666....",
      "..66......66....",
      "..8........8....",
      "................",
      "................",
      "................"
    ]),
    sip1: px([
      "....aaaaaa......",
      "...baaaaaab.....",
      "..b2aaaaaa2b....",
      "..b2aaaaaa2b....",
      "...baaaaaab.9...",
      "...ba7777ab99...",
      "...c666666c.....",
      "...6666666 .....",
      "...66666666.....",
      "..666....666....",
      "..66......66....",
      "..8........8....",
      "................",
      "................",
      "................"
    ])
  };

  var CHAR_HEAD = { silences: "snip", mistakes: "redo", verify: "vera", motion: "mo", broll: "scout" };

  // Compose a full 16x24 frame from a head + body.
  function compose(head, body) {
    var out = [];
    for (var y = 0; y < 9; y++) out.push(head[y].slice());
    for (var b = 0; b < body.length; b++) out.push(body[b].slice());
    return out;
  }

  // Precompute composed frame sets per character.
  function buildFrames(agentId) {
    var head = HEADS[CHAR_HEAD[agentId]];
    function C(name) { return compose(head, BODIES[name]); }
    return {
      stand: [C("stand0"), C("stand1")],
      walk: [C("walk0"), C("walk1"), C("walk2"), C("walk3")],
      sit: [C("sit0")],
      type: [C("type0"), C("type1"), C("type2")],
      stretch: [C("stretch0"), C("stretch1")],
      sip: [C("sip0"), C("sip1")]
    };
  }

  // --------------------------------------------------------------- rendering
  var canvas, ctx, scale = 2, offX = 0, offY = 0, dpr = 1;
  var container = null;
  var raf = 0;
  var running = false;
  var lastTime = 0;
  var pollTimer = 0;
  window.__studioRAF = 0; // dev counter (rAF ticks); harmless to leave.

  function setupCanvas() {
    canvas = document.createElement("canvas");
    canvas.className = "studio-canvas";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Pixel-art view of the editing agents in a co-working office");
    ctx = canvas.getContext("2d", { alpha: false });
    ctx.imageSmoothingEnabled = false;
  }

  function resize() {
    if (!container || !canvas) return;
    var avail = container.clientWidth || LOGICAL_W;
    // integer scale, at least 1x, target ~ full width but cap so it stays crisp
    var s = Math.max(1, Math.floor(avail / LOGICAL_W));
    // allow up to 3x if space permits for a chunkier look
    if (s > 3) s = 3;
    scale = s;
    dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    var cw = LOGICAL_W * scale;
    var ch = LOGICAL_H * scale;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    offX = 0; offY = 0;
  }

  // draw a pixel matrix at logical (x,y) with a palette; flipX mirrors.
  function blit(mat, x, y, pal, flipX, alpha) {
    var s = scale;
    if (alpha != null) ctx.globalAlpha = alpha;
    var h = mat.length, w = mat[0].length;
    for (var row = 0; row < h; row++) {
      var r = mat[row];
      for (var col = 0; col < w; col++) {
        var v = r[col];
        if (!v) continue;
        var c = pal[v];
        if (!c) continue;
        var dx = flipX ? (x + (w - 1 - col) * s) : (x + col * s);
        ctx.fillStyle = c;
        ctx.fillRect(Math.round(dx), Math.round(y + row * s), s, s);
      }
    }
    if (alpha != null) ctx.globalAlpha = 1;
  }

  // Dark outline pass: for every opaque pixel, paint a slightly larger near-black
  // block underneath so the sprite reads against a bright same-hue backdrop.
  // x,y are already in device pixels (pre-scaled). Cheap: one fillRect per pixel.
  function blitRim(mat, x, y, flipX) {
    var s = scale;
    var h = mat.length, w = mat[0].length;
    ctx.fillStyle = "#05070C";
    ctx.globalAlpha = 0.85;
    var pad = Math.max(1, Math.round(s * 0.5));
    for (var row = 0; row < h; row++) {
      var r = mat[row];
      for (var col = 0; col < w; col++) {
        if (!r[col]) continue;
        var dx = flipX ? (x + (w - 1 - col) * s) : (x + col * s);
        ctx.fillRect(Math.round(dx) - pad, Math.round(y + row * s) - pad, s + pad * 2, s + pad * 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  // filled logical rect helper
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x * scale), Math.round(y * scale), Math.round(w * scale), Math.round(h * scale));
  }

  // ---------------------------------------------------------------- scene geo
  // Layout logic (logical 640x360):
  //  - back wall + window strip up top
  //  - 5 desks in a row across the middle
  //  - foreground floor for roaming; couch bottom-left, plant corner, cooler right
  // Each seat: character sprite (16x24) sits BEHIND its desk; the desk surface +
  // a short monitor are drawn in FRONT, so head+shoulders clear the monitor.
  var FLOOR_Y = 326;          // feet baseline for walking agents (on foreground floor)
  var DESK_SURF = 188;        // y of desk surface top edge
  var DESK_TH = 8;            // desk surface thickness
  var DESK_LEGS = 30;         // leg height below surface
  var DESK_W = 80;
  var DESK_GAP = 12;
  var ROW_LEFT = 96;          // x of first desk (clears the couch on the left)

  var MON_W = 30, MON_H = 20; // monitor is small, sits on the desk to one side

  // per-agent desk geometry (computed once)
  // Seated character is centered on the desk; the monitor sits to the LEFT so
  // the character's head + torso stay fully visible beside the glowing screen.
  var DESKS = ROSTER.map(function (a, i) {
    var x = ROW_LEFT + i * (DESK_W + DESK_GAP);
    var cx = x + DESK_W / 2;
    return {
      id: a.id,
      x: x,                       // desk left
      cx: cx,                     // desk center
      seatX: cx - 8 + 10,         // sprite left: character sits desk-right of monitor
      seatY: DESK_SURF - 32,      // sprite top (head + shoulders clear the surface)
      monX: x + 8, monY: DESK_SURF - MON_H, monW: MON_W, monH: MON_H
    };
  });

  // ------------------------------------------------------------ walkable floor
  // Idlers roam the WHOLE floor, not just the rug. Two bands are walkable:
  //   - front band: the open floor in front of the desk row (feet y 246..322)
  //   - back lane:  a strip behind the desks (feet y 150..176) so characters can
  //     stroll behind the desk fronts (y-sorted so they pass BEHIND the surfaces)
  // Furniture footprints below are avoided when picking/relaxing a waypoint.
  var FRONT_Y_MIN = 246, FRONT_Y_MAX = 322;   // foot-y range of the open front floor
  var BACK_Y_MIN = 150,  BACK_Y_MAX = 176;    // foot-y range of the behind-desk lane
  var WALK_X_MIN = 24,   WALK_X_MAX = 604;     // horizontal roaming bounds

  // Rectangular no-go footprints in FOOT coordinates (a character's feet must not
  // enter these). Desks block the mid band; couch/cooler/plant block their corners.
  function furnitureBlocks() {
    var blocks = [
      // couch (bottom-left) - feet cannot stand on it, they pause in front of it
      { x0: 4, y0: 268, x1: 96, y1: 330, name: "couch" },
      // cooler (bottom-right)
      { x0: 598, y0: 244, x1: 632, y1: 304, name: "cooler" },
      // plant (right, between last desk and cooler) - big monstera
      { x0: 550, y0: 244, x1: 582, y1: 302, name: "plant" },
      // far-left tall floor plant tucked in the back-lane corner behind the couch
      { x0: 66, y0: 148, x1: 92, y1: 200, name: "floorplant" }
    ];
    // desk footprints: a solid mid-floor band per desk (feet blocked from 178..244).
    // The back lane (y < 178) and front floor (y > 244) stay open, so idlers can
    // pass behind or walk in front, but never THROUGH a desk.
    DESKS.forEach(function (d) {
      blocks.push({ x0: d.x - 4, y0: 178, x1: d.x + DESK_W + 4, y1: 244, name: "desk" });
    });
    return blocks;
  }
  var BLOCKS = null; // lazily built after DESKS exist

  function inBlock(x, y) {
    if (!BLOCKS) BLOCKS = furnitureBlocks();
    for (var i = 0; i < BLOCKS.length; i++) {
      var b = BLOCKS[i];
      if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return b;
    }
    return null;
  }

  // A candidate foot position is walkable if in-bounds, on one of the two bands,
  // and clear of furniture.
  function walkable(x, y) {
    if (x < WALK_X_MIN || x > WALK_X_MAX) return false;
    var onFront = y >= FRONT_Y_MIN && y <= FRONT_Y_MAX;
    var onBack = y >= BACK_Y_MIN && y <= BACK_Y_MAX;
    if (!onFront && !onBack) return false;
    if (inBlock(x, y)) return false;
    return true;
  }

  // Named flavor spots - short, so motion still dominates. Each carries an action.
  //   sip:    linger by the cooler (bubble anim plays on the prop)
  //   couch:  sit briefly on the couch cushion
  //   window: face the window and look out
  function flavorSpots() {
    return [
      { name: "cooler", x: 590, y: 300, action: "sip" },
      { name: "couch",  x: 66,  y: 300, action: "couch" },
      { name: "window", x: 300, y: 250, action: "window" }
    ];
  }

  // ---------------------------------------------------------------- state
  var agents = [];          // live agent view-models
  var lightsOn = false;
  var stars = [];           // window night-sky stars (seeded, static)
  var starSeed = 1337;

  function initAgents() {
    agents = ROSTER.map(function (a, i) {
      var d = DESKS[i];
      return {
        id: a.id, name: a.name, role: a.role, accent: a.accent,
        pal: palFor(a.accent),
        frames: buildFrames(a.id),
        status: "idle",
        project: null, ago: null, isDemo: false,
        // motion state
        mode: "seated",        // seated | walking | pausing | couch | window | sip
        x: d.seatX, y: d.seatY,
        // foot position on the floor (roaming). x,y (sprite top-left) are derived.
        fx: d.cx, fy: FRONT_Y_MIN + 30,
        facing: 1,
        target: null,          // {x, y, action}
        pauseUntil: 0,
        stepCount: 0,          // waypoints visited this bucket (for route length)
        planBucket: -1,
        animPhase: Math.random(),
        deskX: d.seatX, deskY: d.seatY,
        deskCx: d.cx,
        idx: i,
        // smooth status transition: when leaving working -> walk to desk first
        wantSeated: true
      };
    });
  }

  function initStars() {
    var rnd = mulberry32(starSeed);
    stars = [];
    for (var i = 0; i < 46; i++) {
      stars.push({
        x: 30 + rnd() * (LOGICAL_W - 60),
        y: 14 + rnd() * 40,
        b: 0.3 + rnd() * 0.7,
        tw: rnd() * Math.PI * 2
      });
    }
  }

  // ---------------------------------------------------------------- data poll
  function agentsUrl() {
    // Forward dev query (?force=..., ?fixture=1 handled separately) to the API.
    var qs = location.search || "";
    // strip a leading '?' then rebuild only pass-through params
    var params = new URLSearchParams(qs);
    var out = new URLSearchParams();
    if (params.get("force")) out.set("force", params.get("force"));
    var s = out.toString();
    return "/api/agents" + (s ? "?" + s : "");
  }

  // Fixture AgentsState for standalone preview (?fixture=1 with no server).
  // Dev-only: append ?lights=off to preview the lights-off (night) look.
  function fixtureAgents() {
    var now = Date.now();
    var lightsParam = new URLSearchParams(location.search).get("lights");
    return {
      lightsOn: lightsParam === "off" ? false : true,
      sessionActiveAgo: 12000,
      agents: [
        { id: "silences", name: "Snip", role: "Silence Editor", status: "working", project: "course-vsl", lastArtifact: { file: "assets/clean.mp4", project: "course-vsl", mtime: now - 240000 }, ago: 240000 },
        { id: "mistakes", name: "Redo", role: "Mistake Editor", status: "winding-down", project: "summit-day2-keynote", lastArtifact: { file: "assets/approved-cuts.json", project: "summit-day2-keynote", mtime: now - 5400000 }, ago: 5400000 },
        { id: "verify", name: "Vera", role: "Verifier", status: "idle", project: null, lastArtifact: null, ago: null },
        { id: "motion", name: "Mo", role: "Motion Designer", status: "working", project: "summit-speaker-cards", lastArtifact: { file: "index.html", project: "summit-speaker-cards", mtime: now - 480000 }, ago: 480000 },
        { id: "broll", name: "Scout", role: "B-roll Scout", status: "idle", project: null, lastArtifact: null, ago: null }
      ]
    };
  }

  function fetchAgents() {
    if (FIXTURE) return Promise.resolve(fixtureAgents());
    return fetch(agentsUrl(), { headers: { accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }

  function applyState(st) {
    if (!st || !Array.isArray(st.agents)) return;
    lightsOn = !!st.lightsOn;
    st.agents.forEach(function (info) {
      var a = agents.filter(function (x) { return x.id === info.id; })[0];
      if (!a) return;
      a.status = info.status || "idle";
      a.project = info.project || null;
      a.ago = (typeof info.ago === "number") ? info.ago : null;
      a.isDemo = (a.status !== "idle") && !a.project;
      // desired seating: working + winding-down stay at the desk; idle roams.
      a.wantSeated = (a.status === "working" || a.status === "winding-down");
      if (a.wantSeated && a.mode !== "seated") {
        // was roaming -> WALK to the desk (front of it) then sit, not teleport.
        if (a.mode === "walking" && a.target && a.target.desk) {
          // already heading home
        } else {
          if (a.fx == null) { a.fx = a.deskCx; a.fy = FRONT_Y_MIN + 24; }
          a.target = { x: a.deskCx, y: FRONT_Y_MIN + 18, desk: true };
          a.mode = "walking";
        }
      }
      if (!a.wantSeated && (a.mode === "seated")) {
        // stand up from the desk and step out onto the front floor, then roam.
        a.fx = a.deskCx;
        a.fy = FRONT_Y_MIN + 18;
        a.planBucket = -1;
        a.stepCount = 0;
        a.mode = "pausing";
        a.pauseUntil = performance.now() + 250 + a.idx * 120;
      }
    });
    updateStatusBar();
  }

  function startPoll() {
    stopPoll();
    fetchAgents().then(applyState).catch(function () { /* keep last known */ });
    pollTimer = setInterval(function () {
      fetchAgents().then(applyState).catch(function () {});
    }, POLL_MS);
  }
  function stopPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = 0; } }

  // -------------------------------------------------------------- idle brain
  // Idlers STROLL: they walk most of the time on varied routes that cover the
  // whole floor, with short pauses. A seeded mulberry32 stream per character per
  // 45s bucket keeps it deterministic but distinct per character. Only one idler
  // may claim each flavor spot (cooler/couch/window) per bucket so they never pile
  // onto the same prop.

  // Reserve one flavor action per bucket, deterministically spread across idlers.
  // Returns "sip" | "couch" | "window" | null for this character this bucket.
  var _flavorClaims = {}; // bucket -> { cooler:idx, couch:idx, window:idx }
  function flavorFor(a, bucket, idleIdxs) {
    if (!_flavorClaims[bucket]) {
      var spots = flavorSpots();
      var rnd = mulberry32(bucket * 2654435761 + 7);
      var claim = {};
      // shuffle idle characters and hand out at most one spot each
      var pool = idleIdxs.slice();
      for (var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }
      // ~55% chance any given spot is used this bucket, keeps motion dominant
      spots.forEach(function (sp, k) {
        if (pool.length && rnd() < 0.55) claim[sp.name] = { idx: pool.shift(), spot: sp };
      });
      _flavorClaims[bucket] = claim;
      // prune old buckets
      Object.keys(_flavorClaims).forEach(function (b) {
        if (Number(b) < bucket - 2) delete _flavorClaims[b];
      });
    }
    var c = _flavorClaims[bucket];
    for (var key in c) if (c[key].idx === a.idx) return c[key].spot;
    return null;
  }

  // Pick the next stroll waypoint for a character. Draws from BOTH bands and the
  // full x-range, offset per character so five idlers fan out. Occasionally the
  // character's reserved flavor spot is returned instead. Always walkable.
  function nextWaypoint(a, now, idleIdxs) {
    var bucket = Math.floor(now / IDLE_BUCKET_MS);
    var rnd = a._rnd;
    if (a.planBucket !== bucket || !rnd) {
      // fresh seeded stream for this bucket; seed spreads characters apart
      a._rnd = mulberry32((a.idx + 1) * 1000003 + bucket * 97 + a.idx * a.idx * 13);
      rnd = a._rnd;
      a.planBucket = bucket;
      a.stepCount = 0;
    }

    // Occasionally take the reserved flavor spot (short), but only every few steps
    // so walking dominates. Roughly 1 in 4 waypoints when a spot is reserved.
    var reserved = flavorFor(a, bucket, idleIdxs);
    if (reserved && a.stepCount > 0 && rnd() < 0.28) {
      return { x: reserved.x, y: reserved.y, action: reserved.action, pause: 900 + rnd() * 1600 };
    }

    // Otherwise a plain stroll point. Bias band + region by character index so
    // routes differ: even idx favor the front floor, odd favor sweeping wide, and
    // ~30% of the time anyone dips into the back lane behind the desks.
    var useBack = rnd() < 0.3;
    var x, y, tries = 0;
    var xBias = (a.idx / 4);              // 0..1 across the roster
    do {
      if (useBack) {
        x = WALK_X_MIN + 90 + rnd() * (WALK_X_MAX - WALK_X_MIN - 180);
        y = BACK_Y_MIN + rnd() * (BACK_Y_MAX - BACK_Y_MIN);
      } else {
        // spread x with a per-character phase so they don't converge on center
        var band = (rnd() + xBias) % 1;
        x = WALK_X_MIN + band * (WALK_X_MAX - WALK_X_MIN);
        y = FRONT_Y_MIN + rnd() * (FRONT_Y_MAX - FRONT_Y_MIN);
      }
      tries++;
    } while (!walkable(x, y) && tries < 24);
    if (!walkable(x, y)) { x = a.deskCx; y = FRONT_Y_MIN + 24; }
    a.stepCount++;
    // short pause on arrival: 60-75% walking means brief stops (0.6-2.4s)
    return { x: x, y: y, action: null, pause: 600 + rnd() * 1800 };
  }

  // Separation: if two idlers are within ~12px, nudge this one's next target away.
  function separate(a, idlers) {
    var SEP = 12;
    for (var i = 0; i < idlers.length; i++) {
      var o = idlers[i];
      if (o === a || o.fx == null) continue;
      var dx = a.fx - o.fx, dy = a.fy - o.fy;
      var d2 = dx * dx + dy * dy;
      if (d2 < SEP * SEP && d2 > 0.001) {
        var d = Math.sqrt(d2);
        var push = (SEP - d);
        // pull the current target away from the neighbor
        if (a.target) {
          a.target.x += (dx / d) * push * 1.6;
          a.target.y += (dy / d) * push * 0.9;
          // clamp back into a walkable spot
          a.target.x = Math.max(WALK_X_MIN, Math.min(WALK_X_MAX, a.target.x));
          if (!walkable(a.target.x, a.target.y)) {
            a.target.y = a.fy; // keep current band if the nudge left the floor
          }
        }
      }
    }
  }

  // Would a straight line from (x0,y0) to (x1,y1) cross a desk footprint? Sampled
  // cheaply; only desks matter for front<->back transits.
  function crossesDesk(x0, y0, x1, y1) {
    var steps = 10;
    for (var s = 1; s < steps; s++) {
      var t = s / steps;
      var b = inBlock(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
      if (b && b.name === "desk") return true;
    }
    return false;
  }

  // Clear vertical corridors between the two bands: the side gaps beside the desk
  // row. Left gap ~x60, right gap ~x572 (both clear of desks; cooler/plant sit
  // lower so the mid-height corridor is open).
  var CORRIDORS = [60, 572];
  function corridorVia(a) {
    // choose the corridor nearest the character's current x, route through mid-y.
    var best = CORRIDORS[0], bd = Infinity;
    for (var i = 0; i < CORRIDORS.length; i++) {
      var d = Math.abs(CORRIDORS[i] - a.fx);
      if (d < bd) { bd = d; best = CORRIDORS[i]; }
    }
    return { x: best, y: (BACK_Y_MAX + FRONT_Y_MIN) / 2 };
  }

  function stepTowardFoot(a, tx, ty, dt) {
    var dx = tx - a.fx, dy = ty - a.fy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var step = WALK_SPEED * dt;
    a.facing = dx < -0.4 ? -1 : (dx > 0.4 ? 1 : a.facing);
    if (dist <= step || dist < 0.5) { a.fx = tx; a.fy = ty; return true; }
    a.fx += (dx / dist) * step;
    a.fy += (dy / dist) * step;
    return false;
  }

  function updateIdle(a, now, dt, idlers) {
    if (a.wantSeated) return; // handled by walk-to-desk logic
    var idleIdxs = idlers.map(function (o) { return o.idx; });

    if (a.mode === "walking" && a.target) {
      separate(a, idlers);
      // route around desks: if a straight path to the target would cross a desk,
      // first walk to a side corridor, then continue to the real target.
      if (!a.target.via && crossesDesk(a.fx, a.fy, a.target.x, a.target.y)) {
        var v = corridorVia(a);
        a.target = { x: v.x, y: v.y, via: true, next: a.target };
      }
      var arrived = stepTowardFoot(a, a.target.x, a.target.y, dt);
      if (arrived) {
        if (a.target.via) { a.target = a.target.next; return; } // resume to real target
        var act = a.target.action;
        a.pauseUntil = now + (a.target.pause || 1200);
        a.target = null;
        if (act === "couch") { a.mode = "couch"; }
        else if (act === "window") { a.mode = "window"; }
        else if (act === "sip") { a.mode = "sip"; }
        else { a.mode = "pausing"; }
      }
      return;
    }

    // paused / flavor states: wait out the pause, then stroll to a new waypoint.
    if (a.mode === "pausing" || a.mode === "couch" || a.mode === "window" || a.mode === "sip") {
      if (now >= a.pauseUntil) {
        a.target = nextWaypoint(a, now, idleIdxs);
        a.mode = "walking";
      }
      return;
    }

    // any other state (e.g. just stood up) -> start strolling
    a.target = nextWaypoint(a, now, idleIdxs);
    a.mode = "walking";
  }

  function updateSeatedWalkBack(a, now, dt) {
    // A working/winding-down agent that is not yet seated WALKS to its desk, then
    // sits. Uses the same foot-based stepping so it never teleports.
    if (!a.wantSeated) return;
    if (a.mode === "seated") return;
    if (!a.target || (!a.target.desk && !a.target.via)) {
      if (a.fx == null) { a.fx = a.deskCx; a.fy = FRONT_Y_MIN + 24; }
      a.target = { x: a.deskCx, y: FRONT_Y_MIN + 18, desk: true };
      a.mode = "walking";
    }
    if (!a.target.via && crossesDesk(a.fx, a.fy, a.target.x, a.target.y)) {
      var v = corridorVia(a);
      a.target = { x: v.x, y: v.y, via: true, next: a.target };
    }
    var arrived = stepTowardFoot(a, a.target.x, a.target.y, dt);
    if (arrived) {
      if (a.target.via) { a.target = a.target.next; return; }
      a.x = a.deskX; a.y = a.deskY; a.mode = "seated"; a.target = null;
    }
  }

  // --------------------------------------------------------------- draw scene
  var WALL_H = 120;           // back wall height (window lives here) - trimmed so the office floor dominates
  var COUCH = { x: 8, y: 292 };
  var COOLER = { x: 604, y: 250 };

  // Bright, warm office palette. Every scene surface pulls its color from here so
  // lights-on = sunny daytime office and lights-off = dimmer warm after-hours mood
  // that is STILL clearly readable (never the old near-black night room). Each
  // entry is [lightsOnHex, lightsOffHex]; SC(name) resolves against lightsOn.
  var SCENE = {
    wallTop:   ["#EAE1CF", "#B9AE98"], // warm cream upper wall / dimmer after hours
    wallBot:   ["#DBCDB4", "#A99C82"], // warm greige wainscot band
    wallSeam:  ["#CDBB9C", "#93876E"], // panel seam line
    rail:      ["#C7B291", "#8C7F66"], // chair-rail moulding
    base:      ["#B59B76", "#7C6E56"], // baseboard
    floor:     ["#D8B283", "#9C8261"], // light oak plank base
    floorPlnk: ["#C89E6E", "#8C7455"], // plank shadow line
    floorHi:   ["#E4C598", "#A78C68"], // plank highlight sheen
    rug:       ["#8FBFB0", "#6E938A"], // soft sage area rug
    rugEdge:   ["#6FA396", "#557C72"], // rug border
    rugLine:   ["#B6D8CC", "#87A79C"], // rug woven grid
    couch:     ["#C98A64", "#9C6C4E"], // warm terracotta couch
    couchHi:   ["#E0A984", "#B08265"],
    couchDk:   ["#A66C4C", "#7E5238"],
    couchArm:  ["#B87A56", "#8C5C41"],
    potTerra:  ["#C86B3E", "#9E5530"],
    potRim:    ["#E08A56", "#AF6C43"],
    leafDk:    ["#2F8F55", "#276F44"],
    leafMd:    ["#43A868", "#357F51"],
    leafHi:    ["#68C88A", "#4F9A6C"],
    woodDk:    ["#9C7040", "#755433"], // furniture wood (shelves/cabinet frame)
    woodMd:    ["#BE8A52", "#8E6A41"],
    metal:     ["#C3C9CF", "#9AA0A6"], // filing cabinet / appliance metal
    metalDk:   ["#9BA2A9", "#787E85"],
    board:     ["#F4F1EA", "#CBC6BB"], // whiteboard surface
    boardFrm:  ["#B9AE98", "#8C8371"],
    deskTop:   ["#C79A62", "#94724A"], // light wood desk surface
    deskTopHi: ["#E0BE8C", "#A98A62"], // desk front edge highlight
    deskTopLo: ["#A87C4A", "#7C5E3A"], // desk under-edge shadow
    deskLeg:   ["#8C6740", "#6A4E30"], // desk legs
    deskPanel: ["#B98D57", "#886842"], // modesty panel
    chairFrm:  ["#4A4038", "#39322C"], // chair frame (warm dark, not black)
    monStand:  ["#4A4A52", "#3A3A40"], // monitor stand
    monBezel:  ["#33333B", "#2A2A30"], // monitor bezel (dark grey, readable)
    monOff:    ["#AFB8C4", "#7E8794"]  // idle screen (light grey-blue, "asleep")
  };
  function SC(name) { var e = SCENE[name]; return lightsOn ? e[0] : e[1]; }

  function drawRoom(now) {
    // full-canvas base = wall color (upper). The floor is painted over the lower
    // portion so the whole diorama reads lit, top to bottom.
    rect(0, 0, LOGICAL_W, LOGICAL_H, SC("wallTop"));
    // back wall: cream upper + a warm wainscot band along the bottom third
    rect(0, 0, LOGICAL_W, WALL_H, SC("wallTop"));
    var railY = Math.round(WALL_H * 0.62);
    rect(0, railY, LOGICAL_W, WALL_H - railY, SC("wallBot"));   // wainscot
    rect(0, railY - 2, LOGICAL_W, 3, SC("rail"));               // chair-rail moulding
    // faint vertical panel seams on the upper wall
    ctx.globalAlpha = 0.45;
    for (var wx2 = 0; wx2 < LOGICAL_W; wx2 += 80) rect(wx2, 6, 1, railY - 10, SC("wallSeam"));
    ctx.globalAlpha = 1;
    // ceiling light fixtures - three warm panel lights casting soft downlight
    drawCeilingLights(now);
    // baseboard where wall meets floor
    rect(0, WALL_H - 3, LOGICAL_W, 3, SC("base"));
    // ---- wood-plank floor ----
    drawFloor();
    // soft warm light pool over the desk row so seats always read
    drawDeskLampWash();

    drawWindow(now);
    drawRug();
    drawCouch();      // couch is scenery: characters sit in front of it
  }

  // Wood-plank floor: horizontal boards with staggered seams + a gentle sheen.
  function drawFloor() {
    rect(0, WALL_H, LOGICAL_W, LOGICAL_H - WALL_H, SC("floor"));
    // subtle top sheen band just below the wall (light bouncing off the floor)
    rect(0, WALL_H, LOGICAL_W, 5, SC("floorHi"));
    // plank rows every 20px; seam highlight above each row, shadow line below
    var rnd = mulberry32(424242);
    for (var py = WALL_H + 20; py < LOGICAL_H; py += 20) {
      rect(0, py, LOGICAL_W, 1, SC("floorPlnk"));
      rect(0, py + 1, LOGICAL_W, 1, SC("floorHi"));
      // staggered vertical board seams within this row
      var off = Math.floor(rnd() * 60);
      for (var vx = off; vx < LOGICAL_W; vx += 96) {
        rect(vx, py - 19, 1, 19, SC("floorPlnk"));
      }
    }
  }

  // Three warm ceiling panel lights near the top of the wall. When the lights are
  // on they glow bright; off, they are dim fixtures with a faint warm ember.
  function drawCeilingLights(now) {
    var xs = [140, 320, 500];
    for (var i = 0; i < xs.length; i++) {
      var lx = xs[i], ly = 6;
      rect(lx - 22, ly, 44, 6, lightsOn ? "#FCEFC6" : "#7C7460");   // fixture panel
      rect(lx - 22, ly, 44, 2, lightsOn ? "#FFF8E2" : "#8E866F");   // hot top edge
      rect(lx - 24, ly - 2, 48, 2, SC("boardFrm"));                 // housing rim
      if (lightsOn) {
        // soft warm downlight cone
        var g = ctx.createRadialGradient(lx * scale, (ly + 4) * scale, 0, lx * scale, (ly + 4) * scale, 70 * scale);
        g.addColorStop(0, "rgba(255,244,210,0.30)");
        g.addColorStop(1, "rgba(255,244,210,0)");
        ctx.fillStyle = g;
        ctx.fillRect((lx - 70) * scale, ly * scale, 140 * scale, 90 * scale);
      }
    }
  }

  // A gentle warm light pool across the desk row + foreground so characters keep
  // good separation from the floor. Warmer + a touch stronger when lights are off.
  function drawDeskLampWash() {
    var cx = LOGICAL_W / 2;
    var cy = DESK_SURF + 26;
    var g = ctx.createRadialGradient(cx * scale, cy * scale, 0, cx * scale, cy * scale, (LOGICAL_W * 0.62) * scale);
    var a = lightsOn ? 0.10 : 0.14;
    g.addColorStop(0, "rgba(255,238,200," + a + ")");
    g.addColorStop(0.6, "rgba(240,214,170," + (a * 0.5) + ")");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, WALL_H * scale, canvas.width, canvas.height);
  }

  function drawProps(now) {
    // foreground props drawn after desks/characters so they sit in front
    drawPlant(now);
    drawCooler(now);
  }

  // Back-wall dressing drawn on the flat wall behind the desks (before desks).
  // Bookshelf, whiteboard, filing cabinet, wall clock, framed posters,
  // kitchenette (coffee machine), hanging plant, big monstera in the corner.
  function drawWallDressing(now) {
    drawBookshelf();
    drawWhiteboard();
    drawFilingCabinet();
    drawWallClock(now);
    drawPosters();
    drawKitchenette(now);
    drawHangingPlant(now);
    drawMonstera(now);
  }

  // A pair of daylight windows on the back wall (a bookshelf/whiteboard occupy the
  // rest). Lights-on = bright blue sky, sun, drifting clouds, green treetops, an
  // open blind valance. Lights-off = warm dusk sky, still clearly a window (never
  // the old black night pane). One window left-of-center, one right-of-center.
  function drawWindow(now) {
    drawWindowPane(56, 16, 150, 78, now);
    drawWindowPane(434, 16, 150, 78, now);
  }

  function drawWindowPane(wx, wy, ww, wh, now) {
    rect(wx - 5, wy - 5, ww + 10, wh + 10, SC("woodDk"));   // outer wood frame
    rect(wx - 3, wy - 3, ww + 6, wh + 6, SC("woodMd"));     // frame inner bevel
    // sky gradient
    var skyTop = lightsOn ? "#8FD0F0" : "#E7A867";  // bright blue / warm dusk
    var skyBot = lightsOn ? "#CFEBFB" : "#F2C88E";  // pale horizon / gold
    rect(wx, wy, ww, wh, skyTop);
    rect(wx, wy + Math.round(wh * 0.45), ww, Math.round(wh * 0.55), skyBot);
    // sun (upper corner of the left-side pane region reads globally)
    var sunX = wx + Math.round(ww * 0.22), sunY = wy + 16;
    var sunC = lightsOn ? "#FFF3C4" : "#FFDCA0";
    rect(sunX - 4, sunY - 4, 8, 8, sunC);
    rect(sunX - 5, sunY - 2, 10, 4, sunC);
    rect(sunX - 2, sunY - 5, 4, 10, sunC);
    ctx.globalAlpha = 0.35;
    var sg = ctx.createRadialGradient(sunX * scale, sunY * scale, 0, sunX * scale, sunY * scale, 26 * scale);
    sg.addColorStop(0, lightsOn ? "rgba(255,250,220,0.9)" : "rgba(255,220,160,0.9)");
    sg.addColorStop(1, "rgba(255,250,220,0)");
    ctx.fillStyle = sg; ctx.fillRect((sunX - 26) * scale, (sunY - 26) * scale, 52 * scale, 52 * scale);
    ctx.globalAlpha = 1;
    // drifting clouds (seeded, gentle horizontal drift)
    var cloud = lightsOn ? "#FFFFFF" : "#FBE6C8";
    var drift = (now / 40) % (ww + 40);
    ctx.globalAlpha = 0.9;
    var cl = [[ww * 0.55, 14, 16], [ww * 0.30, 30, 12]];
    for (var ci = 0; ci < cl.length; ci++) {
      var cxp = wx + ((cl[ci][0] + drift) % (ww + 40)) - 20;
      var cyp = wy + cl[ci][1], cwd = cl[ci][2];
      if (cxp < wx - 8 || cxp > wx + ww) continue;
      rect(cxp, cyp, cwd, 4, cloud);
      rect(cxp + 3, cyp - 3, cwd - 6, 4, cloud);
    }
    ctx.globalAlpha = 1;
    // green treetops along the horizon (a park outside)
    var base = wy + wh - 10;
    var tree = lightsOn ? "#6FB56A" : "#5C7D4E";
    var rnd = mulberry32(90210 + wx);
    var gx = wx + 2;
    while (gx < wx + ww - 2) {
      var bw = 8 + Math.floor(rnd() * 10);
      var bh = 6 + Math.floor(rnd() * 12);
      rect(gx, base - bh, bw, bh + 10, tree);
      rect(gx + 1, base - bh - 2, bw - 2, 3, lightsOn ? "#83C97C" : "#6E9260");
      gx += bw + 1;
    }
    // mullions divide the window into panes
    for (var p = 1; p < 2; p++) rect(wx + Math.round(ww * p / 2) - 1, wy, 2, wh, SC("woodMd"));
    rect(wx, wy + Math.round(wh / 2) - 1, ww, 2, SC("woodMd"));
    // open blind valance across the top
    rect(wx - 3, wy - 3, ww + 6, 6, SC("boardFrm"));
    for (var bl = wx; bl < wx + ww; bl += 4) rect(bl, wy - 2, 1, 4, lightsOn ? "#EDE6D6" : "#B7AE99");
    // sill
    rect(wx - 8, wy + wh + 3, ww + 16, 6, SC("woodMd"));
    rect(wx - 8, wy + wh + 3, ww + 16, 2, SC("woodDk"));
    // a tiny succulent on the sill
    rect(wx + ww - 18, wy + wh - 2, 8, 5, SC("potTerra"));
    rect(wx + ww - 17, wy + wh - 6, 2, 5, SC("leafMd"));
    rect(wx + ww - 14, wy + wh - 7, 2, 6, SC("leafHi"));
    rect(wx + ww - 11, wy + wh - 6, 2, 5, SC("leafMd"));
  }

  // Soft sage area rug that warms the wood floor. Woven grid + a border stripe.
  function drawRug() {
    var rx = 120, rw = 400, ry = 286, rh = 66;
    rect(rx, ry, rw, rh, SC("rug"));
    rect(rx + 4, ry + 4, rw - 8, rh - 8, tint(SC("rug"), 0.08)); // inner field
    // woven grid
    ctx.globalAlpha = lightsOn ? 0.5 : 0.4;
    ctx.strokeStyle = SC("rugLine");
    ctx.lineWidth = Math.max(1, Math.floor(scale));
    for (var gx = rx + 4; gx <= rx + rw - 4; gx += 24) {
      ctx.beginPath(); ctx.moveTo(gx * scale, (ry + 4) * scale); ctx.lineTo(gx * scale, (ry + rh - 4) * scale); ctx.stroke();
    }
    for (var gy = ry + 4; gy <= ry + rh - 4; gy += 24) {
      ctx.beginPath(); ctx.moveTo((rx + 4) * scale, gy * scale); ctx.lineTo((rx + rw - 4) * scale, gy * scale); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // border stripe
    ctx.strokeStyle = SC("rugEdge");
    ctx.lineWidth = Math.max(2, Math.floor(2 * scale));
    ctx.strokeRect((rx + 2) * scale, (ry + 2) * scale, (rw - 4) * scale, (rh - 4) * scale);
  }

  // Warm terracotta couch with a couple of throw pillows, recolored to fit the
  // brighter palette. Characters sit on the cushion in front of it.
  function drawCouch() {
    var cx = COUCH.x, cy = COUCH.y;
    rect(cx - 3, cy - 20, 8, 52, SC("couchArm"));   // left arm
    rect(cx + 79, cy - 20, 8, 52, SC("couchArm"));  // right arm
    rect(cx - 3, cy - 20, 8, 3, SC("couchHi"));     // arm top highlight
    rect(cx + 79, cy - 20, 8, 3, SC("couchHi"));
    rect(cx + 3, cy - 22, 76, 16, SC("couchDk"));   // backrest
    rect(cx + 3, cy - 22, 76, 3, SC("couchHi"));    // backrest top light
    rect(cx + 3, cy - 6, 76, 20, SC("couch"));      // seat base
    rect(cx + 6, cy - 4, 34, 12, SC("couchHi"));    // cushion L
    rect(cx + 44, cy - 4, 32, 12, SC("couchHi"));   // cushion R
    // throw pillows (two accent-y colors that harmonize)
    rect(cx + 8, cy - 20, 14, 12, "#E8C77C");       // mustard pillow
    rect(cx + 10, cy - 18, 10, 8, "#F0D897");
    rect(cx + 58, cy - 20, 14, 12, "#7FB0C4");      // dusty-blue pillow
    rect(cx + 60, cy - 18, 10, 8, "#9CC6D6");
    rect(cx + 6, cy + 32, 5, 6, SC("woodDk"));      // wooden legs
    rect(cx + 74, cy + 32, 5, 6, SC("woodDk"));
  }

  // Big potted monstera in the right foreground corner: broad split leaves that
  // sway gently. Foreground prop (drawn in drawProps, in front of the desk row).
  function drawPlant(now, x0, y0) {
    var px0 = 552, py = 250; // right corner, between last desk and the cooler
    var sway = Math.round(Math.sin(now / 1400) * 1.5);
    // trunk stems
    rect(px0 + 12, py - 6, 2, 40, SC("woodMd"));
    rect(px0 + 16, py + 2, 2, 32, SC("woodMd"));
    // big split leaves (fenestrated monstera look via notch gaps)
    var leaf = function (lx, ly, lw, lh, dark) {
      var c = dark ? SC("leafDk") : SC("leafMd");
      rect(lx, ly, lw, lh, c);
      rect(lx + Math.floor(lw / 2), ly + 2, 1, lh - 4, SC("potTerra")); // midrib gap
      rect(lx + 2, ly + Math.floor(lh / 2), lw - 4, 1, tint(c, -0.25)); // notch
    };
    leaf(px0 + 2 + sway, py - 8, 14, 16, false);   // upper-left leaf
    leaf(px0 + 14 - sway, py - 12, 14, 16, true);  // upper-right leaf (behind)
    leaf(px0 - 2 + sway, py + 4, 12, 14, true);    // lower-left
    leaf(px0 + 18 - sway, py + 4, 12, 14, false);  // lower-right
    leaf(px0 + 8, py - 16, 12, 14, false);         // top crown
    rect(px0 + 9, py - 18, 4, 4, SC("leafHi"));    // new shoot highlight
    // terracotta pot
    rect(px0 + 2, py + 30, 26, 20, SC("potTerra"));
    rect(px0, py + 28, 30, 5, SC("potRim"));
    rect(px0 + 2, py + 30, 26, 2, tint(SC("potTerra"), 0.2));
    // soil
    rect(px0 + 4, py + 30, 22, 2, "#5A3A24");
  }

  // Water cooler, recolored lighter/cleaner to fit the bright palette.
  function drawCooler(now) {
    var wx = COOLER.x, wy = COOLER.y;
    rect(wx + 3, wy - 20, 16, 22, "rgba(150,205,235,0.55)");  // bottle
    rect(wx + 5, wy - 18, 12, 18, "rgba(180,225,250,0.5)");
    var by = wy - 6 - ((now / 260) % 14);                      // rising bubble
    rect(wx + 10, by, 2, 2, "rgba(220,245,255,0.85)");
    rect(wx, wy + 2, 22, 44, "#DDE4EA");                       // body (light grey)
    rect(wx + 2, wy + 4, 18, 40, "#EEF2F6");
    rect(wx + 2, wy + 4, 18, 3, "#FFFFFF");                    // top sheen
    rect(wx + 4, wy + 22, 5, 5, "#8FB7C4");                    // spout
    rect(wx + 13, wy + 22, 5, 5, "#D08A5C");                   // warm tap
    rect(wx - 2, wy + 46, 26, 5, SC("metalDk"));               // base
  }

  // ---- back-wall props (drawn on the flat wall behind the desk row) ----

  // Bookshelf with colorful book spines, sitting against the wall far left.
  function drawBookshelf() {
    var bx = 8, by = 40, bw = 46, bh = 78;
    rect(bx - 2, by - 2, bw + 4, bh + 4, SC("woodDk"));   // case frame
    rect(bx, by, bw, bh, tint(SC("woodMd"), 0.1));        // back panel
    var shelfYs = [by + 24, by + 50, by + 76];
    var spineCols = ["#D06B57", "#E0A94E", "#5FA8C9", "#7BB369", "#B27BC0", "#D98A62", "#6C93C4", "#E4C05A"];
    var rnd = mulberry32(7788);
    for (var s = 0; s < shelfYs.length; s++) {
      var shy = shelfYs[s];
      // books stacked on the shelf above the plank
      var bxp = bx + 2;
      while (bxp < bx + bw - 3) {
        var sw = 3 + Math.floor(rnd() * 3);
        var shh = 16 + Math.floor(rnd() * 4);
        var col = spineCols[Math.floor(rnd() * spineCols.length)];
        rect(bxp, shy - shh, sw, shh, col);
        rect(bxp, shy - shh, sw, 2, tint(col, 0.25)); // top cap
        bxp += sw + 1;
      }
      rect(bx, shy, bw, 3, SC("woodDk")); // shelf plank
    }
    // a small potted succulent on the very top
    rect(bx + bw - 16, by - 8, 8, 6, SC("potTerra"));
    rect(bx + bw - 15, by - 13, 2, 6, SC("leafMd"));
    rect(bx + bw - 12, by - 14, 2, 7, SC("leafHi"));
    rect(bx + bw - 9, by - 13, 2, 6, SC("leafMd"));
  }

  // Whiteboard with pixel scribbles + a few sticky notes.
  function drawWhiteboard() {
    var wbx = 214, wby = 30, wbw = 120, wbh = 60;
    rect(wbx - 3, wby - 3, wbw + 6, wbh + 6, SC("boardFrm"));  // frame
    rect(wbx, wby, wbw, wbh, SC("board"));                     // surface
    rect(wbx, wby, wbw, 2, "#FFFFFF");                         // top gloss
    // scribbled marker lines (blue + a red underline + a little diagram)
    ctx.strokeStyle = "#5B86C9"; ctx.lineWidth = Math.max(1, Math.floor(scale));
    var scr = [[wbx + 8, wby + 12, wbx + 70, wby + 12], [wbx + 8, wby + 20, wbx + 54, wby + 20],
               [wbx + 8, wby + 28, wbx + 62, wby + 28]];
    scr.forEach(function (l) { ctx.beginPath(); ctx.moveTo(l[0] * scale, l[1] * scale); ctx.lineTo(l[2] * scale, l[3] * scale); ctx.stroke(); });
    ctx.strokeStyle = "#D06B57";
    ctx.beginPath(); ctx.moveTo((wbx + 8) * scale, (wby + 42) * scale); ctx.lineTo((wbx + 44) * scale, (wby + 42) * scale); ctx.stroke();
    // little box-and-arrow diagram, right side
    rect(wbx + 82, wby + 10, 14, 10, "#7BB369");
    rect(wbx + 82, wby + 34, 14, 10, "#E0A94E");
    ctx.strokeStyle = "#8A8375";
    ctx.beginPath(); ctx.moveTo((wbx + 89) * scale, (wby + 20) * scale); ctx.lineTo((wbx + 89) * scale, (wby + 34) * scale); ctx.stroke();
    // sticky notes
    rect(wbx + wbw - 26, wby + 6, 12, 12, "#F4E06A");
    rect(wbx + wbw - 14, wby + 40, 12, 12, "#F29CC0");
  }

  // Filing cabinet against the wall, right-of-center. Two drawers + handles.
  function drawFilingCabinet() {
    var fx = 348, fy = 54, fw = 30, fh = 64;
    rect(fx - 1, fy - 1, fw + 2, fh + 2, SC("metalDk"));
    rect(fx, fy, fw, fh, SC("metal"));
    rect(fx, fy, fw, 3, "#FFFFFF");                    // top sheen
    for (var d = 0; d < 3; d++) {
      var dy = fy + 4 + d * 20;
      rect(fx + 2, dy, fw - 4, 16, tint(SC("metal"), 0.08));
      rect(fx + 2, dy, fw - 4, 1, SC("metalDk"));      // seam
      rect(fx + fw / 2 - 4, dy + 6, 8, 3, SC("metalDk")); // handle
    }
    // a small green succulent on top
    rect(fx + 6, fy - 7, 8, 6, SC("potTerra"));
    rect(fx + 7, fy - 11, 2, 5, SC("leafMd"));
    rect(fx + 10, fy - 12, 2, 6, SC("leafHi"));
    rect(fx + 13, fy - 11, 2, 5, SC("leafMd"));
  }

  // Round wall clock with moving hands.
  function drawWallClock(now) {
    var cx = 404, cy = 44, r = 12;
    // face
    ctx.fillStyle = "#FBF8F1"; ctx.beginPath(); ctx.arc(cx * scale, cy * scale, r * scale, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = SC("woodDk"); ctx.lineWidth = Math.max(2, Math.floor(2 * scale));
    ctx.beginPath(); ctx.arc(cx * scale, cy * scale, r * scale, 0, Math.PI * 2); ctx.stroke();
    // tick marks
    ctx.fillStyle = "#8A8375";
    for (var t = 0; t < 12; t++) {
      var a = (t / 12) * Math.PI * 2;
      rect(cx + Math.sin(a) * (r - 2) - 0.5, cy - Math.cos(a) * (r - 2) - 0.5, 1, 1, "#8A8375");
    }
    // hands (slow, deterministic-ish from now)
    var minA = ((now / 1000 / 60) % 60) / 60 * Math.PI * 2;
    var hrA = ((now / 1000 / 720) % 60) / 60 * Math.PI * 2;
    ctx.strokeStyle = "#3A3630"; ctx.lineWidth = Math.max(1, Math.floor(scale));
    ctx.beginPath(); ctx.moveTo(cx * scale, cy * scale);
    ctx.lineTo((cx + Math.sin(hrA) * (r - 6)) * scale, (cy - Math.cos(hrA) * (r - 6)) * scale); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx * scale, cy * scale);
    ctx.lineTo((cx + Math.sin(minA) * (r - 3)) * scale, (cy - Math.cos(minA) * (r - 3)) * scale); ctx.stroke();
    rect(cx - 0.5, cy - 0.5, 1, 1, "#D06B57");
  }

  // Two framed posters/art on the wall (abstract color blocks).
  function drawPosters() {
    // poster near far right, above the kitchenette
    var p1x = 590, p1y = 34, pw = 34, ph = 44;
    rect(p1x - 2, p1y - 2, pw + 4, ph + 4, SC("woodDk"));
    rect(p1x, p1y, pw, ph, "#FBF8F1");
    rect(p1x + 3, p1y + 3, pw - 6, 16, "#5FA8C9");     // sky block
    rect(p1x + 3, p1y + 19, pw - 6, ph - 22, "#7BB369"); // ground block
    rect(p1x + pw - 12, p1y + 6, 5, 5, "#F4D06A");      // sun dot
    // small square art near left of whiteboard
    var p2x = 176, p2y = 44, s2 = 26;
    rect(p2x - 2, p2y - 2, s2 + 4, s2 + 4, SC("woodDk"));
    rect(p2x, p2y, s2, s2, "#FBF8F1");
    rect(p2x + 4, p2y + 4, s2 - 8, s2 - 8, "#E08A62");
    rect(p2x + 8, p2y + 8, s2 - 16, s2 - 16, "#F0C065");
  }

  // Kitchenette corner: counter, coffee machine, two mugs, steam wisp.
  function drawKitchenette(now) {
    var kx = 566, ky = 92, kw = 66, kh = 26;
    // counter
    rect(kx, ky, kw, kh, SC("woodMd"));
    rect(kx, ky, kw, 3, tint(SC("woodMd"), 0.2));
    rect(kx, ky, kw, 1, "#FFFFFF");
    // coffee machine
    var mx = kx + 6, my = ky - 22;
    rect(mx, my, 16, 22, SC("metalDk"));
    rect(mx + 1, my + 1, 14, 20, "#3A3630");
    rect(mx + 2, my + 3, 12, 6, "#5FA8C9");        // display glow
    rect(mx + 4, my + 14, 8, 6, "#6B4A32");        // carafe
    rect(mx + 5, my + 14, 6, 2, "#8A5C3E");
    // steam wisp
    var sy = my - 2 - ((now / 300) % 8);
    ctx.globalAlpha = 0.5; rect(mx + 7, sy, 1, 3, "#FFFFFF"); ctx.globalAlpha = 1;
    // two mugs
    rect(kx + 30, ky - 8, 8, 8, "#D06B57"); rect(kx + 37, ky - 6, 2, 4, "#D06B57");
    rect(kx + 44, ky - 8, 8, 8, "#7BB369"); rect(kx + 51, ky - 6, 2, 4, "#7BB369");
  }

  // Hanging plant trailing from the ceiling near center-left.
  function drawHangingPlant(now) {
    var hx = 96, hy = 12;
    rect(hx, hy, 1, 6, SC("woodDk"));               // hook cord
    rect(hx - 8, hy + 6, 18, 8, SC("potTerra"));    // hanging pot
    rect(hx - 8, hy + 6, 18, 2, SC("potRim"));
    var sway = Math.round(Math.sin(now / 1600) * 1.5);
    // trailing vines
    var vines = [[hx - 5, 26], [hx, 34], [hx + 5, 24]];
    vines.forEach(function (v, i) {
      var vx = v[0] + (i === 1 ? 0 : sway);
      rect(vx, hy + 14, 1, v[1], SC("leafMd"));
      rect(vx - 1, hy + 14 + Math.floor(v[1] * 0.4), 3, 3, SC("leafHi"));
      rect(vx - 1, hy + 14 + Math.floor(v[1] * 0.8), 3, 3, SC("leafDk"));
    });
  }

  // Small monstera silhouette is the foreground plant (drawPlant). This is a
  // second, tall floor plant tucked at the far-left baseboard behind the couch.
  function drawMonstera(now) {
    var mx = 70, my = 150;
    var sway = Math.round(Math.sin(now / 1500 + 1) * 1.5);
    rect(mx + 8, my - 2, 2, 40, SC("woodMd"));      // stem
    var leaf = function (lx, ly, lw, lh) {
      rect(lx, ly, lw, lh, SC("leafDk"));
      rect(lx + Math.floor(lw / 2), ly + 1, 1, lh - 2, SC("base")); // midrib slit
    };
    leaf(mx + sway, my - 6, 8, 14);
    leaf(mx + 10 - sway, my - 10, 8, 14);
    leaf(mx + 2 + sway, my + 4, 8, 12);
    leaf(mx + 14 - sway, my + 4, 6, 12);
    rect(mx + 3, my + 34, 14, 14, SC("potTerra")); // pot
    rect(mx + 1, my + 32, 18, 4, SC("potRim"));
  }

  // Desk base (legs + surface + chair), drawn BEHIND the seated character.
  function drawDeskBase(d, a) {
    // Owner-tinted chair: ALWAYS drawn (even for an empty desk) so the seat reads
    // as "Snip's desk" / "Mo's desk" at a glance via its accent color.
    var accent = a ? a.accent : "#8792A2";
    var chx = d.seatX + 3;
    rect(chx, d.seatY + 6, 12, 22, SC("chairFrm"));        // chair frame (warm dark)
    rect(chx, d.seatY + 6, 12, 3, accent);                 // accent chair-back top
    rect(chx + 1, d.seatY + 9, 10, 15, tint(accent, -0.30)); // accent cushion
    rect(chx + 1, d.seatY + 22, 10, 2, SC("chairFrm"));    // seat lip
    // legs
    rect(d.x + 5, DESK_SURF + DESK_TH, 6, DESK_LEGS, SC("deskLeg"));
    rect(d.x + DESK_W - 11, DESK_SURF + DESK_TH, 6, DESK_LEGS, SC("deskLeg"));
    // modesty panel (fills gap so we don't see the floor through the desk)
    rect(d.x + 4, DESK_SURF + DESK_TH, DESK_W - 8, DESK_LEGS - 4, SC("deskPanel"));
    rect(d.x + 4, DESK_SURF + DESK_TH, DESK_W - 8, 1, SC("deskTopLo"));
  }

  // Desk surface + monitor + a little clutter, drawn IN FRONT of the character.
  function drawDeskFront(a, d, now) {
    // light wood surface
    rect(d.x, DESK_SURF, DESK_W, DESK_TH, SC("deskTop"));
    rect(d.x, DESK_SURF, DESK_W, 2, SC("deskTopHi"));
    rect(d.x, DESK_SURF + DESK_TH - 2, DESK_W, 2, SC("deskTopLo"));
    // accent mousepad under the keyboard - a small owner-colored desk accent so
    // the desk reads as its owner's even when the seat is empty.
    rect(d.cx + 3, DESK_SURF + 1, 26, 5, tint(a.accent, -0.15));
    rect(d.cx + 4, DESK_SURF + 2, 24, 3, tint(a.accent, 0.05));
    // keyboard hint on the surface
    rect(d.cx + 6, DESK_SURF + 2, 20, 2, "#3A3630");
    // desk clutter: a paper stack + a mug + a tiny succulent, alternating by index
    // so the five desks feel individually lived-in. Kept desk-LEFT of the monitor
    // side, small, and never over the seat/keyboard.
    var i = a.idx;
    if (i % 2 === 0) {
      // paper stack + coffee mug
      rect(d.x + 3, DESK_SURF - 5, 10, 5, "#FBF8F1");      // papers
      rect(d.x + 4, DESK_SURF - 4, 8, 1, "#C9C2B4");
      rect(d.x + 3, DESK_SURF - 6, 6, 1, "#FFFFFF");
    } else {
      // little succulent in a pot
      rect(d.x + 4, DESK_SURF - 5, 7, 5, SC("potTerra"));
      rect(d.x + 5, DESK_SURF - 8, 2, 4, SC("leafMd"));
      rect(d.x + 8, DESK_SURF - 9, 2, 5, SC("leafHi"));
    }
    // mug on the far side for everyone (accent-lid)
    rect(d.x + DESK_W - 10, DESK_SURF - 5, 6, 5, "#FBF8F1");
    rect(d.x + DESK_W - 5, DESK_SURF - 4, 2, 3, "#FBF8F1"); // handle
    rect(d.x + DESK_W - 10, DESK_SURF - 6, 6, 1, tint(a.accent, 0.1));
    drawMonitor(a, d, now);
  }

  function drawMonitor(a, d, now) {
    var mx = d.monX, my = d.monY, mw = d.monW, mh = d.monH;
    // stand
    rect(mx + mw / 2 - 2, my + mh, 4, 6, SC("monStand"));
    rect(mx + mw / 2 - 7, my + mh + 6, 14, 3, SC("monStand"));
    // bezel
    rect(mx - 2, my - 2, mw + 4, mh + 4, SC("monBezel"));
    rect(mx - 1, my - 1, mw + 2, 1, tint(SC("monBezel"), 0.3));
    var isWork = a.status === "working", isWind = a.status === "winding-down";
    var screen;
    if (isWork) screen = tint(a.accent, -0.30);
    else if (isWind) screen = tint(a.accent, -0.48);
    else screen = SC("monOff");
    rect(mx, my, mw, mh, screen);
    if (isWork) {
      // glow halo first (behind the crisp UI lines). Kept tight around the screen
      // so it does not flood the seat and camouflage a same-hue character.
      drawGlow(mx + mw / 2, my + mh / 2, a.accent, 0.44, mw * 0.9);
      var t = Math.floor(now / 220);
      for (var li = 0; li < 4; li++) {
        var lw = 5 + ((t + li * 4) % (mw - 8));
        rect(mx + 3, my + 3 + li * 4, Math.min(lw, mw - 6), 2, tint(a.accent, 0.35));
      }
    } else if (isWind) {
      drawGlow(mx + mw / 2, my + mh / 2, a.accent, 0.16, mw);
      rect(mx + 3, my + 4, mw - 10, 2, tint(a.accent, -0.05));
      rect(mx + 3, my + 9, mw - 16, 2, tint(a.accent, -0.2));
    }
  }

  function drawGlow(cx, cy, color, alpha, size) {
    var g = ctx.createRadialGradient(cx * scale, cy * scale, 0, cx * scale, cy * scale, size * scale);
    var c = hexToRgba(color, alpha);
    g.addColorStop(0, c);
    g.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect((cx - size) * scale, (cy - size) * scale, size * 2 * scale, size * 2 * scale);
  }

  function hexToRgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  var NAMEPLATE_Y = DESK_SURF + DESK_TH + DESK_LEGS + 6;
  function drawNameplate(a, d) {
    // Light nameplate card so it belongs to the bright office. Accent header strip
    // + accent name (dark-enough accents read; light ones get a darkened variant)
    // and a warm-grey role line. High contrast, no dark hole under the desk.
    var npw = DESK_W + 4, nph = 24, npx = d.cx - npw / 2, npy = NAMEPLATE_Y;
    rect(npx, npy, npw, nph, "#FBF6EC");              // cream card
    rect(npx, npy, npw, nph, "#FBF6EC");
    rect(npx, npy, npw, 3, a.accent);                 // accent header strip
    rect(npx, npy + 3, npw, 1, tint(a.accent, -0.2));
    ctx.strokeStyle = "rgba(90,80,60,0.35)";
    ctx.lineWidth = Math.max(1, Math.floor(scale));
    ctx.strokeRect(npx * scale, npy * scale, npw * scale, nph * scale);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 " + (9 * scale) + "px " + PIXEL_FONT;
    // darken the accent for the name text so light accents (amber/green) stay legible on cream
    ctx.fillStyle = tint(a.accent, -0.45);
    ctx.fillText(a.name.toUpperCase(), d.cx * scale, (npy + 9) * scale);
    ctx.font = "500 " + (7 * scale) + "px " + PIXEL_FONT;
    ctx.fillStyle = "#6B6353";
    ctx.fillText(a.role, d.cx * scale, (npy + 18) * scale);
    ctx.textAlign = "left";
  }

  var PIXEL_FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  function drawTag(a, d, now) {
    if (a.status !== "working") return;
    var slug = a.isDemo ? "demo" : (a.project || "working");
    var ago = a.ago != null ? relAgo(a.ago) : "";
    var label = ago ? (slug + ", " + ago) : slug;
    // measure
    ctx.font = "600 " + (8 * scale) + "px " + PIXEL_FONT;
    var textW = ctx.measureText(label).width / scale;
    var padX = 6;
    var tagW = Math.min(textW + padX * 2, DESK_W + 44); // clamp so long slugs fit
    // if still too wide, truncate slug
    if (textW + padX * 2 > tagW) {
      while (label.length > 6 && (ctx.measureText(label).width / scale) + padX * 2 > tagW) {
        label = label.slice(0, -2);
      }
      label = label.replace(/[.,\s]+$/, "") + "…";
    }
    var tagH = 15;
    var bob = Math.round(Math.sin(now / 600 + a.idx) * 1.5);
    var tx = Math.round(d.cx - tagW / 2);
    var ty = (a.deskY - 26) + bob;
    // bubble
    ctx.fillStyle = "rgba(10,13,19,0.94)";
    roundRect(tx, ty, tagW, tagH, 3);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(a.accent, 0.55);
    ctx.lineWidth = Math.max(1, scale);
    roundRect(tx, ty, tagW, tagH, 3);
    ctx.stroke();
    // little tail
    ctx.fillStyle = "rgba(10,13,19,0.94)";
    ctx.beginPath();
    ctx.moveTo((d.cx - 3) * scale, (ty + tagH) * scale);
    ctx.lineTo((d.cx + 3) * scale, (ty + tagH) * scale);
    ctx.lineTo(d.cx * scale, (ty + tagH + 4) * scale);
    ctx.closePath();
    ctx.fill();
    // text
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#E6EAF0";
    ctx.font = "600 " + (8 * scale) + "px " + PIXEL_FONT;
    ctx.fillText(label, d.cx * scale, (ty + tagH / 2) * scale);
    ctx.textAlign = "left";
    // status dot
    ctx.fillStyle = a.accent;
    ctx.beginPath();
    ctx.arc((tx + 5) * scale, (ty + tagH / 2) * scale, 1.6 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    var s = scale;
    x *= s; y *= s; w *= s; h *= s; r *= s;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function relAgo(ms) {
    var s = Math.floor(ms / 1000);
    if (s < 60) return s + "s ago";
    var m = Math.floor(s / 60);
    if (m < 60) return m + "m ago";
    var h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    return Math.floor(h / 24) + "d ago";
  }

  // ---------------------------------------------------------- character draw
  function pickCharFrame(a, now) {
    var f = a.frames;
    var tick = Math.floor(now / (1000 / ANIM_FPS));
    if (a.status === "working" && a.mode === "seated") {
      return { mat: f.type[tick % 3], flip: false };
    }
    if (a.status === "winding-down" && a.mode === "seated") {
      // occasional stretch / sip based on a slow cycle
      var cyc = (Math.floor(now / 1000) % 12);
      if (cyc < 2) return { mat: f.stretch[tick % 2], flip: false };
      if (cyc >= 6 && cyc < 8) return { mat: f.sip[Math.floor(now / 500) % 2], flip: false };
      return { mat: f.sit[0], flip: false };
    }
    if (a.mode === "couch") {
      return { mat: f.sit[0], flip: false };
    }
    if (a.mode === "sip") {
      return { mat: f.sip[Math.floor(now / 500) % 2], flip: a.facing < 0 };
    }
    if (a.mode === "window") {
      // face the window (up): a slow stand bob reads as looking out
      return { mat: f.stand[tick % 2], flip: false };
    }
    if (a.mode === "walking") {
      return { mat: f.walk[tick % 4], flip: a.facing < 0 };
    }
    if (a.mode === "pausing" || a.mode === "seated") {
      // idle standing near a waypoint: gentle stand bob
      return { mat: f.stand[tick % 2], flip: a.facing < 0 };
    }
    return { mat: f.stand[0], flip: a.facing < 0 };
  }

  function drawShadow(x, w, footY) {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#000";
    var cx = (x + w / 2) * scale, cy = footY * scale;
    ctx.beginPath();
    ctx.ellipse(cx, cy, (w * 0.55) * scale, 2.4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawCharacter(a, now) {
    var fr = pickCharFrame(a, now);
    // roaming characters are positioned by feet (fx, fy); derive sprite top-left.
    var sx = (a.fx != null ? a.fx - 8 : a.x);
    var sy = (a.fy != null ? a.fy - 24 : a.y);
    if (a.mode === "couch") { sy = COUCH.y - 20; }        // seat on the cushion
    var footY = sy + 24;
    if (a.mode === "couch") footY = COUCH.y + 6;
    drawShadow(sx, 16, footY + 1);
    blit(fr.mat, Math.round(sx * scale), Math.round(sy * scale), a.pal, fr.flip, null);
  }

  // ------------------------------------------------------------------ frame
  function frame(t) {
    if (!running) return;
    window.__studioRAF++;
    var now = t || performance.now();
    var dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
    lastTime = now;

    // build the current roaming set (idlers) for separation + motion
    var idlers = [];
    for (var k = 0; k < agents.length; k++) {
      if (!agents[k].wantSeated) idlers.push(agents[k]);
    }

    // update motion
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];
      if (a.wantSeated) updateSeatedWalkBack(a, now, dt);
      else updateIdle(a, now, dt, idlers);
    }

    // draw
    ctx.imageSmoothingEnabled = false;
    drawRoom(now);
    drawWallDressing(now);   // wall props behind the desk row + back-lane roamers

    // Partition: seated at own desk vs roaming; and among roamers, which are in
    // the BACK lane (behind the desk fronts) vs the FRONT floor (in front).
    var seated = [], roamBack = [], roamFront = [];
    for (i = 0; i < agents.length; i++) {
      var aa = agents[i];
      if (aa.mode === "seated" && aa.wantSeated) { seated.push(aa); continue; }
      // a roamer with feet up in the back lane passes BEHIND the desk surfaces.
      if (aa.fy != null && aa.fy < DESK_SURF) roamBack.push(aa);
      else roamFront.push(aa);
    }
    // y-sort each floor group so nearer characters overlap farther ones correctly.
    function byFoot(p, q) { return (p.fy || 0) - (q.fy || 0); }
    roamBack.sort(byFoot); roamFront.sort(byFoot);

    // Layer 1: desk bases + nameplates (behind everyone).
    for (i = 0; i < DESKS.length; i++) { drawDeskBase(DESKS[i], agents[i]); drawNameplate(agents[i], DESKS[i]); }

    // Layer 1.5: roamers strolling BEHIND the desk row (drawn before desk fronts).
    roamBack.forEach(function (aa) { drawCharacter(aa, now); });

    // Layer 2: seated characters (torso rises above desk surface).
    seated.forEach(function (aa) {
      var di = DESKS[aa.idx];
      var frm = pickCharFrame(aa, now);
      var sx = Math.round(di.seatX * scale), sy = Math.round(di.seatY * scale);
      // Dark rim behind the sprite so it separates from its own monitor glow
      // (fixes same-hue camouflage, e.g. Snip's green on the green screen wash).
      blitRim(frm.mat, sx, sy, frm.flip);
      blit(frm.mat, sx, sy, aa.pal, frm.flip, null);
    });

    // Layer 3: desk fronts + monitors (occlude the seated lap + back-lane roamers).
    for (i = 0; i < DESKS.length; i++) drawDeskFront(agents[i], DESKS[i], now);

    // Layer 4: roaming/couch characters on the foreground floor (in front).
    roamFront.forEach(function (aa) { drawCharacter(aa, now); });

    // Layer 5: foreground props (couch, plant, cooler).
    drawProps(now);

    // Layer 6: floating tags for working agents, above everything.
    for (i = 0; i < agents.length; i++) drawTag(agents[i], DESKS[i], now);

    // Ambient: vignette + dim overlay when the lights are off.
    drawVignette();
    if (!lightsOn) {
      // Moody night tint, but light enough that characters stay readable.
      ctx.fillStyle = "rgba(6,9,18,0.16)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    raf = requestAnimationFrame(frame);
  }

  function drawVignette() {
    var g = ctx.createRadialGradient(
      canvas.width / 2, canvas.height * 0.5, 0,
      canvas.width / 2, canvas.height * 0.5, canvas.width * 0.68);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.72, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // ------------------------------------------------------------- status bar
  var statusBar = null;
  function buildStatusBar() {
    statusBar = document.createElement("div");
    statusBar.className = "studio-status";
    return statusBar;
  }
  function updateStatusBar() {
    if (!statusBar) return;
    var working = agents.filter(function (a) { return a.status === "working"; }).length;
    var wind = agents.filter(function (a) { return a.status === "winding-down"; }).length;
    var lightTxt = lightsOn ? "lights on" : "lights off";
    var chips = agents.map(function (a) {
      var slug = a.isDemo ? "demo" : (a.project || "");
      var detail = a.status === "working" && slug ? " on " + slug : "";
      return '<span class="sd-chip sd-' + a.status.replace(/[^a-z]/g, "-") + '">' +
        '<span class="sd-dot" style="background:' + a.accent + '"></span>' +
        '<b>' + esc(a.name) + '</b> ' + esc(labelStatus(a.status)) + esc(detail) + "</span>";
    }).join("");
    statusBar.innerHTML =
      '<div class="sd-summary"><span class="sd-light ' + (lightsOn ? "on" : "off") + '">' +
      '<span class="sd-bulb"></span>' + lightTxt + "</span>" +
      '<span class="sd-count">' + working + " working, " + wind + " winding down</span></div>" +
      '<div class="sd-chips">' + chips + "</div>";
  }
  function labelStatus(s) {
    return s === "working" ? "working" : s === "winding-down" ? "winding down" : "idle";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ------------------------------------------------------------------- mount
  var resizeHandler = null, visHandler = null;

  function mount(host) {
    if (running) return;
    container = document.createElement("div");
    container.className = "studio-wrap";

    var stage = document.createElement("div");
    stage.className = "studio-stage";
    setupCanvas();
    stage.appendChild(canvas);

    var caption = document.createElement("div");
    caption.className = "studio-caption";
    caption.textContent = "The Studio - your editing agents, live. Working agents type at lit desks; idle agents wander the office.";

    container.appendChild(stage);
    container.appendChild(buildStatusBar());
    container.appendChild(caption);
    host.appendChild(container);

    if (!agents.length) { initAgents(); initStars(); }
    resize();
    updateStatusBar();

    resizeHandler = function () { resize(); };
    window.addEventListener("resize", resizeHandler);

    visHandler = function () {
      if (document.hidden) pauseLoop();
      else if (isActiveRoute()) resumeLoop();
    };
    document.addEventListener("visibilitychange", visHandler);

    running = true;
    lastTime = performance.now();
    startPoll();
    raf = requestAnimationFrame(frame);
  }

  function unmount() {
    pauseLoop();
    stopPoll();
    if (resizeHandler) { window.removeEventListener("resize", resizeHandler); resizeHandler = null; }
    if (visHandler) { document.removeEventListener("visibilitychange", visHandler); visHandler = null; }
    if (container && container.parentNode) container.parentNode.removeChild(container);
    container = null; statusBar = null; canvas = null; ctx = null;
  }

  function pauseLoop() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  function resumeLoop() {
    if (running) return;
    if (!canvas) return;
    running = true;
    lastTime = performance.now();
    // refresh data immediately on resume
    fetchAgents().then(applyState).catch(function () {});
    raf = requestAnimationFrame(frame);
  }

  function isActiveRoute() {
    return (location.hash || "#/") === "#/studio";
  }

  window.Studio = { mount: mount, unmount: unmount, isActiveRoute: isActiveRoute };

  // Dev-only introspection for screenshot/verification harnesses. Read-only; does
  // not affect rendering. Returns each agent's status, mode, and foot position.
  window.__studioDebug = function () {
    return agents.map(function (a) {
      return {
        id: a.id, status: a.status, mode: a.mode, wantSeated: a.wantSeated,
        fx: a.fx != null ? Math.round(a.fx) : null,
        fy: a.fy != null ? Math.round(a.fy) : null,
        facing: a.facing
      };
    });
  };
})();
