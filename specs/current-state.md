# Current State — Operon

> Last updated: 2026-07-04 (prd-build-loop session 1)

## Progress

| Phase | Status |
| ----- | ------ |
| Phase 0 Platform | 5 / 12 tasks done |
| Phase 1 Core Loop | not started |
| Phase 2 Core UI | not started |
| Phase 3 Rhythm | not started |

## What exists

- **Monorepo**: pnpm workspaces — `apps/desktop`, `apps/sidecar`, `packages/shared-types`, `packages/db`
- **Sidecar**: Express `GET /health` → `{ status: 'ok', version }` on port 3721
- **Database**: SQLite WAL, tables `companies`, `departments`, `objectives`, `transcripts`
- **Repos**: `CompanyRepo` CRUD, `TranscriptRepo` append-only
- **Desktop**: Tauri 2 + React + Vite scaffold (`com.operon.desktop`), control room placeholder UI

## Tests

```bash
pnpm test   # 8 tests passing across 4 packages
```

## Next up (active-plan)

1. M12: Tauri spawn sidecar + /health polling
2. M12: System tray show/hide/quit
3. M12: Docker Desktop env check gate

## Blockers

- None
