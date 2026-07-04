# Current State — Operon

> Last updated: 2026-07-05 (prd-build-loop session 5)

## Progress

| Phase | Status |
| ----- | ------ |
| Phase 0 Platform | 12 / 12 ✅ |
| **Phase 1 Core Loop** | **11 / 11 ✅** |
| Phase 2 Core UI | 0 / 6 |
| Phase 3 Rhythm | 0 / 4 |

## Phase 1 新增（本轮 M07/M06/M05）

- **M07** `WorkerService.spawn` — brief ≤3000、minimalMemory ≤2KB、技能白名单校验
- **M07** `WorkerService.runReactStub` — file_write → Proof → 销毁 sandbox
- **M06** `LeadService.plan` — LLM stub 分解 Objective 为 Task
- **M06** `LeadService.dispatch` + `synthesize` — 派发 Worker、Memory.md 追加与备份
- **M05** `ControlLoopService` — 六阶段状态机 stub 流水线（understand→decide）
- **M05** `POST /api/v1/objectives/:id/loop/start` + `GET .../loop`
- **DB** migration `004_control_loop.sql` — tasks、worker_runs、control_loops 表

## Sidecar API（Phase 1 完整）

```
GET  /health
GET  /api/v1/owner
GET/PUT /api/v1/credentials
GET/POST /api/v1/approvals (+ approve/reject)
GET  /api/v1/model-configs
GET  /api/v1/skills
POST /internal/llm/complete
POST/DELETE /internal/sandbox/sessions
POST /internal/sandbox/invoke
POST /internal/workers/spawn
GET  /internal/workers/:id/status
POST /internal/leads/plan|dispatch|synthesize
POST /api/v1/objectives/:id/loop/start
GET  /api/v1/objectives/:id/loop
```

## Tests

```bash
pnpm test   # 36 tests passing
```

## Next up

1. **Phase 2** M01: Company create wizard UI
2. M01: Objective CRUD + control room layout shell
3. M02: Department list + Task list UI

## Blockers

- None
