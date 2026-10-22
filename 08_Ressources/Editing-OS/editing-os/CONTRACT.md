# Editing OS — API CONTRACT v1

Field names below are FINAL. Implementers must not add, rename, or repurpose fields.
All timestamps are epoch milliseconds (number). All sizes are bytes (number).
All `file`/`path` values inside project payloads are project-relative POSIX paths;
`absPath` values are absolute. JSON responses use `Content-Type: application/json`.
Errors: non-2xx with body `{ "error": string }`.

## Endpoints

| Method | Path                  | Response body            | Notes |
|--------|-----------------------|--------------------------|-------|
| GET    | `/`                   | `public/index.html`      | App shell. Also serves `/app.js`, `/style.css` from `public/`. |
| GET    | `/api/state`          | `WorkspaceState`         | Uses cached snapshot if < 60 s old. |
| GET    | `/api/project/:slug`  | `ProjectDetail`          | 404 `{error}` if slug unknown. Reads NOTES.md fresh. |
| GET    | `/api/libraries`      | `LibrariesState`         | |
| GET    | `/api/activity`       | `ActivityState`          | |
| POST   | `/api/rescan`         | `{ ok: true, scannedAt: number, ms: number }` | Forces full rescan. |
| POST   | `/api/reveal`         | `{ ok: true }`           | Body `{ "path": string }` (absolute). |

### /api/reveal security check (mandatory)
1. `const p = path.resolve(body.path)`.
2. Reject 400 unless `p === ROOT` is false AND `p.startsWith(ROOT + path.sep)` where
   `ROOT` is the resolved workspace root.
3. Reject 404 if `!fs.existsSync(p)`.
4. Then `execFile('open', ['-R', p])`. Never pass through a shell.

## Interfaces

```ts
type StageId = 'source' | 'transcript' | 'silences' | 'mistakes' | 'verify'
             | 'motion' | 'broll' | 'render' | 'delivered';
type StageStatusValue = 'done' | 'partial' | 'unknown' | 'n-a';
type EvidenceKind = 'direct' | 'proxy';
type Family = string;  // leading token of the project slug, or 'misc'
type Archetype = 'talking-head' | 'graphics-only' | 'unknown';
type RenderKind = 'final' | 'timestamped' | 'draft' | 'named' | 'delivery';

interface Evidence {
  file: string;          // project-relative
  kind: EvidenceKind;
  mtime: number;
}

interface StageStatus {
  id: StageId;
  status: StageStatusValue;
  evidence: Evidence[];  // empty when unknown or n-a
}

interface RenderInfo {
  file: string;          // relative to project root, e.g. "renders/final.mp4"
  bytes: number;
  mtime: number;
  kind: RenderKind;
  durationMs: number | null;  // from sidecar .meta.json when present
  stale: boolean;             // mtime < newest source mtime (SPEC stale rule)
}

interface DirSizes {
  renders: number;       // bytes, 0 if no renders/
  assets: number;        // bytes, 0 if no assets/
  total: number;         // renders + assets + root files
}

interface ProjectSummary {
  slug: string;
  name: string;          // meta.json name, else slug prettified
  family: Family;
  archetype: Archetype;
  utility: boolean;      // slug starts with "_"
  stages: StageStatus[]; // always all 9, in canonical order
  renders: RenderInfo[]; // sorted mtime desc; includes renders/final/ delivery files
  staleRender: boolean;
  lastTouched: number;
  hasNotes: boolean;
  dirSizes: DirSizes;
}

interface WorkspaceSummary {
  projectCount: number;      // excludes utility projects
  utilityCount: number;
  withRenders: number;
  staleRenderCount: number;
  renderBytes: number;       // sum of dirSizes.renders across all projects
  scannedAt: number;
  scanMs: number;
}

interface WorkspaceState {
  summary: WorkspaceSummary;
  projects: ProjectSummary[];   // sorted lastTouched desc
}

interface ProjectDetail extends ProjectSummary {
  absPath: string;
  notes: string | null;         // raw NOTES.md text
  extraFiles: string[];         // root-level *.mjs generators and NOTES.md, relative
}

interface StylePalette { bg: string|null; fg: string|null; accent: string|null;
                         red: string|null; orange: string|null; }

interface StyleInfo {
  id: string; number: number; name: string; status: string;
  cardCount: number; palette: StylePalette;
  fonts: { display: string|null; body: string|null; mono: string|null };
}

interface LibrariesState {
  styles: StyleInfo[];
  styleCount: number;
  cardCount: number;
  registryMtime: number;
  registryStale: boolean;       // registry.json older than newest style.json
  assets: { assetCount: number; byType: Record<string, number>; registryMtime: number };
}

interface CommitInfo { hash: string; subject: string; date: number; }
interface RecentFile { path: string; mtime: number; }  // path relative to video-projects/

interface ActivityState {
  branch: string;
  dirtyCount: number;
  commits: CommitInfo[];        // max 20
  recentFiles: RecentFile[];    // max 30, mtime desc
}
```

## Frontend rules

- The UI consumes ONLY these endpoints and shapes. No client-side filesystem access,
  no derived server logic duplicated client-side beyond filtering/sorting/formatting.
- Missing/null fields render as "unknown" or are hidden; the UI must not crash on
  empty arrays or null palette/font values.

## Addendum

Phase 2 adds `GET /api/agents`. See STUDIO_CONTRACT.md.
