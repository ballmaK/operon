# Active Plan — Operon
# Generated from docs/prd/ — do not edit checkboxes manually during loop

> Source: `docs/prd/README.md` development order Phase 0→3

## Phase 0 — Platform (M12 → M16 → M09)

- [x] Root: pnpm monorepo — apps/desktop, apps/sidecar, packages/shared-types, packages/db (ref: docs/prd/00-macro-shared.md §4.3)
- [x] M12: Sidecar Express app with GET /health → `{ status, version }` (ref: docs/prd/modules/M12-platform-shell.md)
- [x] M09: SQLite migrations — Company, Department, Objective tables + WAL (ref: docs/prd/modules/M09-data-persistence.md)
- [x] M09: TranscriptRepo.append + CompanyRepo CRUD (ref: docs/prd/modules/M09-data-persistence.md)
- [x] M12: Tauri 2 + React desktop shell scaffold in apps/desktop (ref: docs/prd/modules/M12-platform-shell.md)
- [x] M12: Tauri spawn sidecar + /health polling until running (ref: docs/prd/modules/M12-platform-shell.md DF-M12-01/02)
- [x] M12: System tray — show/hide/quit menu (ref: docs/prd/modules/M12-platform-shell.md P-M12-02)
- [x] M12: Docker Desktop env check — fail blocks Sidecar start (ref: M12 PL-02a, C02)
- [x] M12: Platform DATA_DIR / LOG_DIR / TEMP_DIR resolution (ref: docs/prd/modules/M12-platform-shell.md)
- [ ] M16: ApiCredential encrypted store + GET/PUT /api/v1/credentials (ref: docs/prd/modules/M16-auth-approval.md)
- [ ] M16: Approval entity + list/approve/reject API (ref: docs/prd/modules/M16-auth-approval.md)
- [ ] M16: Default Owner user seed on first run (ref: docs/prd/modules/M16-auth-approval.md)

## Phase 1 — Core Loop (M11 → M10 → M07 → M06 → M05)

- [ ] M11: ModelConfig table + default routing strategy (ref: docs/prd/modules/M11-model-router.md)
- [ ] M11: POST /internal/llm/complete stub with role-based model pick (ref: docs/prd/modules/M11-model-router.md)
- [ ] M10: Skill registry — MVP skills list GET /api/v1/skills (ref: docs/prd/modules/M10-runtime-sandbox.md)
- [ ] M10: SandboxSession create/destroy lifecycle (ref: docs/prd/modules/M10-runtime-sandbox.md)
- [ ] M10: file_write skill via subprocess in company sandbox dir (ref: docs/prd/modules/M10-runtime-sandbox.md)
- [ ] M07: WorkerAgent spawn with narrow brief + minimalMemory validation (ref: docs/prd/modules/M07-worker-agent.md)
- [ ] M07: Worker ReAct loop stub — invoke skill → submit Proof (ref: docs/prd/modules/M07-worker-agent.md)
- [ ] M06: Lead plan — decompose Objective into Task list (ref: docs/prd/modules/M06-lead-agent.md)
- [ ] M06: Lead dispatch Worker + synthesize with Memory.md backup (ref: docs/prd/modules/M06-lead-agent.md)
- [ ] M05: ControlLoop six-phase state machine (ref: docs/prd/modules/M05-control-loop.md)
- [ ] M05: POST start control loop for active Objective (ref: docs/prd/modules/M05-control-loop.md)

## Phase 2 — Core UI (M01 → M02 → M03)

- [ ] M01: Company create wizard UI (ref: docs/prd/modules/M01-company-workspace.md)
- [ ] M01: Objective CRUD + control room layout shell (ref: docs/prd/modules/M01-company-workspace.md)
- [ ] M02: Department list + Task list UI (ref: docs/prd/modules/M02-department-task.md)
- [ ] M02: Worker live execution status panel (ref: docs/prd/modules/M02-department-task.md)
- [ ] M03: Transcript timeline component (ref: docs/prd/modules/M03-transcript-proof.md)
- [ ] M03: Proof wall + asset library UI (ref: docs/prd/modules/M03-transcript-proof.md)

## Phase 3 — Collaboration & Rhythm (M08 → M04)

- [ ] M08: Handoff create + accept flow (ref: docs/prd/modules/M08-handoff.md)
- [ ] M08: Cross-Lead handoff notification in department UI (ref: docs/prd/modules/M08-handoff.md)
- [ ] M04: Daily/weekly rhythm scheduler (ref: docs/prd/modules/M04-rhythm.md)
- [ ] M04: Rhythm report + blockers summary UI (ref: docs/prd/modules/M04-rhythm.md)
