# Editing OS — STUDIO SPEC (Phase 2 addendum)

"The Studio": an 8-bit pixel-art co-working office showing the pipeline agents as
characters. New top-nav view between Mission Control and Libraries, hash route
`#/studio`. Everything in SPEC.md v1 stays unchanged; this is purely additive.

## Roster

Five characters at five desks. Ids are frozen (see STUDIO_CONTRACT.md).

| id       | Name  | Role label      | Skill mapped       | Accent hue           |
|----------|-------|-----------------|--------------------|----------------------|
| silences | Snip  | Silence Editor  | cut-silences       | green `#4ADE80`      |
| mistakes | Redo  | Mistake Editor  | cut-mistakes       | amber `#F5B942`      |
| verify   | Vera  | Verifier        | verify-cuts        | purple `#C084FC`     |
| motion   | Mo    | Motion Designer | motion-graphics    | blue `#37BDF8`   |
| broll    | Scout | B-roll Scout    | insert-broll       | orange `#FB923C`     |

The user named four agents; Scout is included because insert-broll is pipeline
Agent 4 and the ask was "all of the working agents". Each character's sprite uses
its accent hue for shirt/headphones plus 2-3 shared neutral tones (skin, hair,
dark clothing) that sit well on the near-black office.

## Activity detection (backend, `lib/agents.mjs`)

Derived from the EXISTING scan snapshot: iterate `state.projects[]`, read each
project's `stages[]` evidence, and attribute evidence files to agents:

- **silences**: evidence of the `silences` stage (direct `*.silence-edl.json` or
  proxy `clean.mp4`).
- **mistakes**: evidence of the `mistakes` stage (approved-cuts, cut-candidates,
  or proxy `clean.mp4`).
- **verify**: evidence of the `verify` stage EXCLUDING `clean.mp4` proxies (only
  `*.verify.json` / `*.checks.json` count; a fresh clean.mp4 means the editors
  worked, not the verifier — without this filter one clean.mp4 lights three desks).
- **motion**: evidence of the `motion` stage across ALL archetypes (index.html,
  cards/*.html, beat-candidates).
- **broll**: evidence of the `broll` stage (broll-candidates, assets/broll).

Per agent: the newest evidence mtime across all projects wins ->
`lastArtifact { file, project, mtime }`, `ago = now - mtime`, `project` = winning slug.

**Freshness without rescans**: the snapshot caches 60 s, so on every `/api/agents`
call re-stat ONLY the <= 5 winning evidence files (abs path reconstructable as
`ROOT/video-projects/<slug>/<file>`) to refresh their mtimes, plus the sessions dir
below. That is <= ~10 stats per call; the studio feels live between rescans. A brand
new artifact file still appears only after the next snapshot rescan (<= 60 s lag) —
acceptable, documented.

**Status tiers** (constants live ONLY in `lib/agents.mjs`):
- `working` if `ago <= WORK_WINDOW_MS` (default 15 min)
- `winding-down` if `ago <= WIND_DOWN_MS` (default 2 h)
- `idle` otherwise (or no artifact ever)

**Session lights**: stat files matching `*.jsonl` directly in
`~/.claude/projects/<workspace-path-slug>/` (stat only, NEVER
read contents; resolve `~` via `os.homedir()`). Newest mtime within
`SESSION_WINDOW_MS` (default 3 min) -> `lightsOn: true`, `sessionActiveAgo` = ms since
that mtime. Directory missing or empty -> `lightsOn: false`, `sessionActiveAgo: null`.
Never throw.

**Dev override (dev-only, for screenshots/tests)**: `GET /api/agents?force=
silences:working,motion:winding-down` overrides ONLY the `status` field of the named
agents. Real project files are never touched to simulate activity. When a forced
agent has `project: null`, the UI labels its tag "demo". Documented as dev-only; no
UI element exposes it.

## Scene (frontend, `public/studio.js`)

- HTML5 `<canvas>`, logical resolution 640x360, drawn at integer scale (2x/3x) to fit
  the view width, `image-rendering: pixelated`, centered on the page with the same
  dark chrome as other views.
- Office matches the OS theme: near-black floor with a subtle grid rug, window strip
  along the top (night sky; brighter when `lightsOn`), five desks in a row with
  monitors + nameplates (name + role under each desk), water cooler right, couch and
  plant left. Restrained ambient pixels: monitor flicker, coffee steam, occasional
  window blink. When `lightsOn` is false the room dims slightly and monitors of idle
  agents go dark.
- Sprites are embedded pixel matrices in studio.js (arrays of palette indices),
  ~16x24 logical px per character frame, rendered 3-4x. NO external images, NO
  network fetches. Frames per character: stand x2, walk x4 (mirror for left), sit x1,
  type x3, stretch x2, sip x2. Desk/prop tiles drawn the same way.
- States:
  - `working`: seated at own desk, typing loop, monitor glow in the agent's accent
    hue, floating tag above the desk: project slug + relative ago ("course-vsl, 4m ago").
  - `winding-down`: seated, dimmer monitor, occasional stretch or coffee sip, no tag
    (tooltip on hover shows lastArtifact).
  - `idle`: free-roam loop between waypoints (water cooler, couch, window, own desk),
    pauses, couch sits. Movement uses a seeded PRNG (e.g. mulberry32) seeded by
    `characterIndex * 1e6 + floor(now / 45000)` so wandering looks varied but stays
    smooth and deterministic within each 45 s bucket. Fixed walk speed, 4-frame walk
    cycle at ~8 animation fps; no teleporting, no jitter.
- Loop: `requestAnimationFrame` at display rate; sprite animation ticks are
  time-based. The rAF loop MUST stop when the studio is not the active hash route or
  the tab is hidden (`visibilitychange`), and resume on return. No background CPU burn.
- Polling: while the studio view is active, fetch `/api/agents` every 8 s and
  transition character states smoothly (an agent finishing work walks from desk to
  couch, not snaps).

## Nav + topbar dot

- New nav item "Studio" between Mission Control and Libraries (`#/studio`).
- Topbar live dot: app.js polls `/api/agents` every 30 s from any view; if any agent
  is `working`, show a small pulsing accent dot next to the Studio nav item (title
  tooltip: "N agents working"). Dot hidden otherwise. This is the only global poll.

## Out of scope

No websockets, no sound, no user-controlled characters, no per-agent history, no
mutation of any workspace file. Existing endpoints and views byte-identical in
behavior.
