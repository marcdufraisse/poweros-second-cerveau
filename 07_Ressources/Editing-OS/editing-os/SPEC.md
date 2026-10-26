# Editing OS — SPEC v1

Live visual operating system for the Video Automation workspace. The filesystem is the
source of truth: the server scans `video-projects/`, `style-library/`, `asset-library/`,
and git state on demand, holds one in-memory snapshot, and serves a dark mission-control
UI. No database, no build step, no new npm dependencies.

## Stack

- Node 20+, single process: `node editing-os/server.mjs`. Only `node:` builtins
  (`http`, `fs`, `path`, `child_process`, `url`). ZERO new npm packages.
- Port `4200` (const `DEFAULT_PORT`), overridable via `PORT` env. Never auto-increment;
  fail loudly if taken (3002-3015 / 8080 / 8090 belong to preview servers).
- Frontend: vanilla HTML/CSS/JS in `editing-os/public/`, served by the same server.
  Hash routing: `#/` (Mission Control), `#/project/<slug>`, `#/libraries`, `#/activity`.
- Workspace root = resolved `path.join(import.meta.dirname, '..')`. All scans are
  relative to it; the server must work regardless of CWD.

## Aesthetic

Dark, premium, mission control. Near-black canvas (#0A0C10 range), accent blue
`#37BDF8`, clean grotesk stack (`-apple-system, "Helvetica Neue", Inter, sans-serif`),
optional subtle grid/vignette background. Status hues: done = accent blue, partial =
amber `#F5B942`, unknown = grey `#5A6472`, n-a = near-invisible, stale = red `#F0564A`.
No em dashes anywhere in UI copy. No emoji. Tabular numerals for sizes/dates.

## Views

### a) Mission Control (`#/`)
- Summary stat header: total projects, projects with renders, stale-render count,
  total render disk usage. Header re-fetches `/api/state` on manual Refresh only
  (a Refresh button that POSTs `/api/rescan` then re-renders).
- Grid of project cards. Each card: display name + slug, family badge, archetype badge,
  9-segment pipeline rail (colored per stage status), newest render age or "no renders",
  stale-render flag, last-touched relative time.
- Filters (client-side over `/api/state`): family (derived from the projects on disk),
  archetype, minimum reached stage, stale-only toggle, hide-utility toggle (default on),
  text search over slug+name. Sort: last-touched desc (default), name, stage progress.
- Clicking a card navigates to Project Detail.

### b) Project Detail (`#/project/<slug>`)
- Header: name, slug, family, archetype, absolute path with Copy button and
  "Reveal in Finder" button (POST `/api/reveal`).
- Pipeline rail expanded: one row per stage with status, and the evidence list
  (file path, kind direct/proxy, mtime) under each stage.
- Renders table: file name, size, mtime, kind, per-render stale flag. Sorted mtime desc.
- NOTES.md (when present) rendered as markdown-lite: headings, bold, tables kept
  monospaced, everything else preformatted text. No external markdown lib.
- Evidence and renders come from `/api/project/<slug>`; no client-side filesystem logic.

### c) Libraries (`#/libraries`)
- Style library: one row per style from `style-library/registry.json`: number, name,
  status, cardCount, palette swatches (bg/fg/accent/red/orange as color chips), fonts.
  Header shows styleCount / cardCount totals and a registry staleness banner when
  registry.json mtime < newest mtime of any `style-library/*/style.json`.
- Asset library: assetCount and byType counts from `asset-library/registry.json`.

### d) Activity (`#/activity`)
- Last 20 git commits (hash, subject, author date) + current branch + dirty file count.
- 30 most recently modified files under `video-projects/`, excluding `renders/`,
  `.thumbnails/`, `.waveform-cache/`, `.hyperframes/`, `node_modules/`, `frames/`,
  `snapshots/`, dotfiles. Shown as project-relative path + mtime.

## Pipeline detection engine

Nine stages in fixed order (ids are final, see CONTRACT.md):
`source, transcript, silences, mistakes, verify, motion, broll, render, delivered`.

Each stage resolves to `{ status, evidence[] }` where status is
`done | partial | unknown | n-a` and evidence items are `{ file, kind, mtime }`
(`file` project-relative, `kind` = `direct` (artifact written by that stage) or
`proxy` (implies the stage happened, e.g. clean.mp4)).

Rules (evaluated per project; "assets JSONs" = JSON files directly in `assets/`,
`transcripts/`, or project root, max 12 files checked, each < 30 MB, sniffed by reading
the first 16 KB and testing for a `"words"` key substring — never full-parse for detection.
(Widened from 4 KB: real ElevenLabs transcripts place a long `text` field first, so the
`"words"` key lands ~7-11 KB in.):

- **source**: done if any `.mp4/.mov/.m4a/.mkv/.wav` in `assets/` whose name is not
  `clean.mp4`, `edited-clean.mp4`, `*.silenced.mp4`. `clean.mp4` alone = proxy done.
  Graphics-only archetype: n-a.
- **transcript**: done if any assets JSON sniffs as ElevenLabs shape (`"words"`).
  Direct evidence. Graphics-only: n-a.
- **silences**: done if `assets/*.silence-edl.json` (direct). Else proxy done via
  `assets/clean.mp4`. Else unknown. Graphics-only: n-a.
- **mistakes**: done if `assets/approved-cuts.json` or `assets/*.approved-cuts.json`
  (direct); partial if only `assets/*.cut-candidates.json`; else proxy done via
  `assets/clean.mp4`; else unknown. Graphics-only: n-a.
- **verify**: proxy done if `assets/*.verify.json` or `assets/*.checks.json`; else proxy
  done via `assets/clean.mp4`; else unknown. (No direct artifact exists on disk today;
  `verify-report.md` becomes direct evidence if it ever appears.) Graphics-only: n-a.
- **motion**: talking-head: done if root `index.html` exists (direct); partial if only
  `assets/*.beat-candidates.json`. Graphics-only: done if `index.html` or any
  `cards/*.html` exists; else unknown.
- **broll**: done if `assets/broll/` dir exists (direct); partial if
  `assets/*.broll-candidates.json`; else unknown. Graphics-only: n-a.
- **render**: done if any `.mp4` directly in `renders/` (all naming conventions count:
  `final.mp4`, `<slug>_<timestamp>.mp4`, human-named). Evidence = each mp4, direct.
  Else unknown. Render kind per file: `draft` if name is `draft.mp4` or contains
  `draft`; `timestamped` if it matches `^.+_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.mp4$`;
  `final` if name is `final.mp4` or ends `-final.mp4`/`-final-v<N>.mp4`; else `named`.
  Read the sidecar `<name>.meta.json` (tiny) for `durationMs` when present.
- **delivered**: done if `renders/final/` exists and contains at least one `.mp4`
  (kind `delivery`, listed in renders[] too); else unknown.

**Archetype**: `talking-head` if `assets/clean.mp4` exists OR (transcript detected AND a
non-clean source media file exists). `graphics-only` if `_gen*.mjs` at root or `cards/`
dir exists and no talking-head signals. Else `unknown` (treated like graphics-only for
n-a purposes but badged Unknown).

**Family** is the leading dash-separated token of the slug, lowercased (`acme-ep1` ->
`acme`). Anything that is not alphanumeric falls back to `misc`. The filter list and the
badge colors are both derived from whatever families exist on disk, so there is no fixed
set. **Utility**: slug starts with `_`.

**Stale render**: let S = newest mtime among root `index.html`, `_gen*.mjs`,
`cards/*.html`, and files directly in `assets/` (excluding anything under `renders/`).
A render is stale if its mtime < S. Project `staleRender` = true if it has >= 1 render
and its newest render is stale.

**lastTouched** = newest mtime seen across everything scanned for the project,
including renders.

## Performance

- Scan is stat-driven: `readdir` + `stat` only. Never read media files. Only reads:
  4 KB sniff of candidate JSONs, tiny render `.meta.json` sidecars, `meta.json`,
  NOTES.md (detail endpoint only), the two library registry.json files.
- Directory sizes (`dirSizes`) come from summing stat sizes one level deep in `assets/`
  and `renders/` plus root files; do not recurse into `frames/`, `.thumbnails/`,
  `.waveform-cache/`, `snapshots/`, `assets/` subdirectories deeper than 2 levels.
- One in-memory snapshot `{ state, scannedAt }`. `/api/state`, `/api/libraries`,
  `/api/activity` reuse it if younger than 60 s, else rescan first.
  `POST /api/rescan` always rescans. Target full scan < 2 s on this machine.
- git calls via `execFile('git', ...)` with the workspace root as cwd, 5 s timeout;
  on failure return empty activity rather than 500.

## Out of scope v1

No file mutation, no render triggering, no websockets/SSE, no thumbnails, no
package.json edits (PM wires an `npm run os` script), no auth (localhost tool).

## Addendum

Phase 2 adds "The Studio" (8-bit agent office view). See STUDIO_SPEC.md.
