# Editing OS — STUDIO CONTRACT (Phase 2 addendum to CONTRACT.md)

Field names below are FINAL. All timestamps epoch ms, durations ms. Errors follow
CONTRACT.md (`{ "error": string }`). All CONTRACT.md v1 endpoints are unchanged.

## Endpoint

| Method | Path          | Response body | Notes |
|--------|---------------|---------------|-------|
| GET    | `/api/agents` | `AgentsState` | Cheap: reuses the snapshot; re-stats only the winning evidence files + the sessions dir per call. |

Dev-only query param: `?force=<id>:<status>[,<id>:<status>...]` overrides only the
`status` field of the named agents (e.g. `?force=silences:working,motion:working`).
Invalid ids/statuses in `force` are ignored silently. For screenshots and tests only;
never simulate activity by touching real project files.

## Interfaces

```ts
type AgentId = 'silences' | 'mistakes' | 'verify' | 'motion' | 'broll';
type AgentStatus = 'working' | 'winding-down' | 'idle';

interface LastArtifact {
  file: string;      // project-relative, e.g. "assets/1.silence-edl.json"
  project: string;   // project slug
  mtime: number;
}

interface AgentInfo {
  id: AgentId;
  name: string;              // e.g. "Snip"
  role: string;              // e.g. "Silence Editor"
  status: AgentStatus;
  project: string | null;    // slug of newest-artifact project, null if none
  lastArtifact: LastArtifact | null;
  ago: number | null;        // ms since lastArtifact.mtime, null if none
}

interface AgentsState {
  lightsOn: boolean;             // a Claude session touched this workspace recently
  sessionActiveAgo: number | null; // ms since newest session jsonl mtime, null if none
  agents: AgentInfo[];           // always all 5, in AgentId order above
}
```

## Thresholds (server-side constants, single source of truth in `lib/agents.mjs`)

| Constant            | Default        | Meaning |
|---------------------|----------------|---------|
| `WORK_WINDOW_MS`    | 900000 (15 m)  | ago <= this -> `working` |
| `WIND_DOWN_MS`      | 7200000 (2 h)  | ago <= this -> `winding-down` |
| `SESSION_WINDOW_MS` | 180000 (3 m)   | session jsonl mtime within this -> `lightsOn` |

## Frontend rules

- The studio view consumes ONLY `/api/agents` (plus existing endpoints untouched).
- The UI must not crash on `agents` with all-null artifacts, `lightsOn: false`, or a
  missing sessions directory (server already normalizes these).
- No client-side re-derivation of status tiers; render what the server says.
