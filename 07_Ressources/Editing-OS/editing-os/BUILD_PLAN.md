# Editing OS — BUILD PLAN v1

Two parallel workstreams. Both read SPEC.md + CONTRACT.md first. Neither edits the
other's files. Neither touches package.json or anything outside `editing-os/`.

## Workstream A — Scanner + Server

Files (exact):
- `editing-os/server.mjs` — node:http server, port 4200 (PORT env override), routes per
  CONTRACT, static serving of `editing-os/public/`, snapshot cache + 60 s TTL,
  `/api/reveal` with the mandatory path check, JSON error bodies, graceful EADDRINUSE
  message naming the port.
- `editing-os/lib/scan.mjs` — workspace scanner: enumerate `video-projects/*`, build
  `ProjectSummary` for each (meta.json name fallback, family, archetype, renders,
  dirSizes, lastTouched, staleRender), plus `buildProjectDetail(slug)` (NOTES.md,
  absPath, extraFiles) and library scanning (`LibrariesState` from the two
  registry.json files).
- `editing-os/lib/stages.mjs` — pure stage engine: given the file/stat inventory of one
  project, return the 9 `StageStatus` entries per SPEC rules (incl. JSON 4 KB "words"
  sniff helper). No fs calls except the sniff; keep it unit-testable.
- `editing-os/lib/git.mjs` — `ActivityState` via execFile git (branch, dirty count,
  last 20 commits) + recent-files list computed from scan stats (not a second walk).

Acceptance criteria:
1. `node editing-os/server.mjs` starts; `curl -s localhost:4200/api/state | head -c 400`
   returns valid JSON matching CONTRACT (spot-check: summary present, 70+ projects,
   every project has exactly 9 stages in canonical order).
2. `curl localhost:4200/api/project/course-vsl` shows render evidence incl. the
   timestamped mp4 + durationMs from its sidecar, and staleRender computed.
3. `curl localhost:4200/api/project/summit-day1-sizzle` shows archetype
   graphics-only, notes text non-null, talking-head stages n-a.
4. `/api/libraries` shows 9 styles with palettes; `/api/activity` shows branch
   `add-testimonial-reels` and 20 commits.
5. Full scan < 2 s (log scan ms at startup). No mp4 file is ever opened/read.
6. `POST /api/reveal` with a path outside the workspace returns 400.

## Workstream B — UI

Files (exact):
- `editing-os/public/index.html` — shell: header (title, summary stats, Refresh
  button), nav (Mission Control / Libraries / Activity), `<main id="view">`.
- `editing-os/public/app.js` — hash router, fetch layer for CONTRACT endpoints,
  renderers for the four views, client-side filters/sort/search, relative-time and
  byte formatters, markdown-lite renderer for NOTES.md, copy-path + reveal actions.
- `editing-os/public/style.css` — mission-control theme per SPEC aesthetic section
  (near-black, #37BDF8 accent, status hues, pipeline rail segments, card grid,
  responsive to ~1280px min).

Build against fixture data first: hardcode a `FIXTURE` WorkspaceState (2-3 fake
projects covering all statuses) behind a `?fixture=1` query flag so the UI is testable
before Workstream A lands. Default path fetches the real API.

Acceptance criteria:
1. `#/` renders card grid with 9-segment rails, badges, filters, stat header; utility
   projects hidden by default; search + family filter + stale-only work.
2. `#/project/<slug>` renders stage rows with evidence, renders table with per-render
   stale flags, NOTES.md block, Copy path + Reveal buttons wired to CONTRACT.
3. `#/libraries` renders palette chips; `#/activity` renders commits + recent files.
4. No console errors on empty/null data. No external CDN/fonts/network requests.
5. No em dashes in any UI string.

## Integration checklist (PM runs after both land)

1. `node editing-os/server.mjs` — note logged scan ms.
2. curl each endpoint; validate shapes against CONTRACT (jq spot checks).
3. Playwright screenshot at 1600x1000 of `#/`, one project detail, `#/libraries`,
   `#/activity`; visually review PNGs (rails colored, no overlap/overflow).
4. Cross-check 3 known projects against recon facts: course-p33-workflow (talking-head,
   final.mp4 present), summit-testimonials (graphics-only, no renders),
   course-vsl (timestamped render + sidecar duration).
5. Suggest to user: add `"os": "node editing-os/server.mjs"` to package.json scripts
   (PM asks; do not edit without approval).

## Verification commands

```bash
node editing-os/server.mjs &
curl -s localhost:4200/api/state | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const s=JSON.parse(d);console.log(s.summary, s.projects.length, s.projects[0])})'
curl -s localhost:4200/api/project/course-vsl | head -c 1200
curl -s -X POST localhost:4200/api/reveal -H 'content-type: application/json' -d '{"path":"/etc"}'   # expect 400
```

# Phase 2: Studio (8-bit agent office)

Read STUDIO_SPEC.md + STUDIO_CONTRACT.md first. Two parallel workstreams. Phase 1
behavior must remain byte-identical apart from the listed wiring diffs. The live
4200 instance stays untouched during development: test on `PORT=4201`.

## Workstream C — Agents backend

Files (exact):
- `editing-os/lib/agents.mjs` (NEW) — `buildAgentsState(snapshot, forceParam)` per
  STUDIO_SPEC: evidence-to-agent attribution from the existing snapshot (verify
  excludes clean.mp4 proxies), re-stat of winning evidence files + sessions dir per
  call, tier constants `WORK_WINDOW_MS` / `WIND_DOWN_MS` / `SESSION_WINDOW_MS`
  (single source of truth), dev-only `force` override of status only.
- `editing-os/server.mjs` (MINIMAL DIFF, the only existing file this workstream may
  touch) — route `GET /api/agents` wired to lib/agents.mjs, passing the `force`
  query param through.

Acceptance criteria:
1. `curl 'localhost:4201/api/agents'` returns valid `AgentsState`: all 5 agents in
   canonical id order, statuses computed, `lastArtifact` populated for agents with
   any on-disk evidence (silences/mistakes should resolve via _adobe-transfer-edit
   or clean.mp4 proxies; motion via a recent index.html).
2. `curl 'localhost:4201/api/agents?force=silences:working,motion:working'` flips
   exactly those two statuses; invalid force tokens are ignored.
3. Verify agent never cites clean.mp4 as its lastArtifact.
4. Sessions dir handling: endpoint returns `lightsOn` boolean without error whether
   or not `~/.claude/projects/<workspace-path-slug>/` exists.
5. Call cost: no full rescan triggered when snapshot is fresh (log/verify <= ~10
   stats per call). All Phase 1 endpoints still pass their v1 acceptance checks.

## Workstream D — Studio frontend

Files (exact):
- `editing-os/public/studio.js` (NEW) — canvas scene, embedded pixel-matrix sprites
  (no external images), character state machine (working / winding-down / idle with
  seeded free-roam), 8 s polling while active, rAF paused when view inactive or tab
  hidden.
- `editing-os/public/index.html` (MINIMAL DIFF) — "Studio" nav item between Mission
  Control and Libraries, `<script src="studio.js">`, view container.
- `editing-os/public/app.js` (MINIMAL DIFF) — `#/studio` route mounting/unmounting
  the scene, 30 s global `/api/agents` poll for the topbar dot.
- `editing-os/public/style.css` (MINIMAL DIFF) — studio view chrome, pixelated
  canvas rules, topbar dot styles.

Acceptance criteria:
1. `#/studio` renders the office: 5 desks with nameplates (name + role), water
   cooler, couch, plant, window strip; chunky integer-scaled pixels.
2. With `?force=silences:working,motion:working` (fetch layer must forward the page
   query to /api/agents in dev): Snip and Mo seated and typing with glowing monitors
   and floating project tags; others idle-roaming or seated calm.
3. Idle characters visibly wander between waypoints, smoothly, no jitter/teleport.
4. rAF loop provably stops when navigating away (add a counter check or console
   probe during dev, removed after).
5. Topbar dot appears on Mission Control when any agent is working, absent otherwise.
6. Zero console errors; no network fetches besides /api/agents and existing
   endpoints; no em dashes in UI copy.

## Phase 2 integration checklist (PM runs after both land)

1. `PORT=4201 node editing-os/server.mjs` — Phase 1 curl checks still pass on 4201.
2. curl `/api/agents` with and without `force`; validate against STUDIO_CONTRACT.
3. Playwright screenshots at 1600x1000: studio all-idle, studio with
   `?force=silences:working,motion:working`, and Mission Control showing the topbar
   dot under the same force. Review PNGs (sprite legibility, tag readability, no
   canvas blur — verify pixelated rendering).
4. Kill 4201; restart the user's live instance on 4200 only after sign-off.

