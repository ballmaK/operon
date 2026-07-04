# Current State — Operon

> Last updated: 2026-07-04 (prd-build-loop session 2)

## Progress

| Phase | Status |
| ----- | ------ |
| Phase 0 Platform | 9 / 12 tasks done |
| Phase 1 Core Loop | not started |
| Phase 2 Core UI | not started |
| Phase 3 Rhythm | not started |

## What exists

- **Monorepo**: pnpm workspaces — `apps/desktop`, `apps/sidecar`, `packages/shared-types`, `packages/db`
- **Sidecar**: Express `GET /health` on port 3721
- **Database**: SQLite WAL — companies, departments, objectives, transcripts
- **Desktop (Tauri 2)**:
  - Spawns Sidecar via `node apps/sidecar/dist/index.js` on startup
  - Polls `/health` until running (30s timeout)
  - System tray: 打开控制室 / 退出；关窗隐藏到托盘
  - Docker Desktop gate — fail blocks Sidecar start (PL-02a)
  - Platform paths: `%APPDATA%/operon`, logs, temp
  - UI shows Sidecar status, env checks, data dirs

## Tests

```bash
pnpm test   # 12 tests passing
```

## Next up

1. M16: ApiCredential encrypted store + GET/PUT /api/v1/credentials
2. M16: Approval list/approve/reject API
3. M16: Default Owner user seed

## Blockers

- None

## Run desktop (dev)

```bash
pnpm --filter @operon/sidecar build
cd apps/desktop && pnpm tauri dev
```

Requires: Node 20+, Rust, Docker Desktop running.
