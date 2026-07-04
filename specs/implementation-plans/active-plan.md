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
- [x] M16: ApiCredential encrypted store + GET/PUT /api/v1/credentials (ref: docs/prd/modules/M16-auth-approval.md)
- [x] M16: Approval entity + list/approve/reject API (ref: docs/prd/modules/M16-auth-approval.md)
- [x] M16: Default Owner user seed on first run (ref: docs/prd/modules/M16-auth-approval.md)

## Phase 1 — Core Loop (M11 → M10 → M07 → M06 → M05)

- [x] M11: ModelConfig table + default routing strategy (ref: docs/prd/modules/M11-model-router.md)
- [x] M11: POST /internal/llm/complete stub with role-based model pick (ref: docs/prd/modules/M11-model-router.md)
- [x] M10: Skill registry — MVP skills list GET /api/v1/skills (ref: docs/prd/modules/M10-runtime-sandbox.md)
- [x] M10: SandboxSession create/destroy lifecycle (ref: docs/prd/modules/M10-runtime-sandbox.md)
- [x] M10: file_write skill via subprocess in company sandbox dir (ref: docs/prd/modules/M10-runtime-sandbox.md)
- [x] M07: WorkerAgent spawn with narrow brief + minimalMemory validation (ref: docs/prd/modules/M07-worker-agent.md)
- [x] M07: Worker ReAct loop stub — invoke skill → submit Proof (ref: docs/prd/modules/M07-worker-agent.md)
- [x] M06: Lead plan — decompose Objective into Task list (ref: docs/prd/modules/M06-lead-agent.md)
- [x] M06: Lead dispatch Worker + synthesize with Memory.md backup (ref: docs/prd/modules/M06-lead-agent.md)
- [x] M05: ControlLoop six-phase state machine (ref: docs/prd/modules/M05-control-loop.md)
- [x] M05: POST start control loop for active Objective (ref: docs/prd/modules/M05-control-loop.md)

## Phase 2 — Core UI (M01 → M02 → M03)

- [x] M01: Company create wizard UI (ref: docs/prd/modules/M01-company-workspace.md)
- [x] M01: Objective CRUD + control room layout shell (ref: docs/prd/modules/M01-company-workspace.md)
- [x] M02: Department list + Task list UI (ref: docs/prd/modules/M02-department-task.md)
- [x] M02: Worker live execution status panel (ref: docs/prd/modules/M02-department-task.md)
- [x] M03: Transcript timeline component (ref: docs/prd/modules/M03-transcript-proof.md)
- [x] M03: Proof wall + asset library UI (ref: docs/prd/modules/M03-transcript-proof.md)

## Phase 3 — Collaboration & Rhythm (M08 → M04)

- [x] M08: Handoff create + accept flow (ref: docs/prd/modules/M08-handoff.md)
- [x] M08: Cross-Lead handoff notification in department UI (ref: docs/prd/modules/M08-handoff.md)
- [x] M04: Daily/weekly rhythm scheduler (ref: docs/prd/modules/M04-rhythm.md)
- [x] M04: Rhythm report + blockers summary UI (ref: docs/prd/modules/M04-rhythm.md)

## Phase 4 — MVP Hardening & P1 (M16 → M10 → M01 → M11 → M03 → M12)

> Source: `docs/prd/00-macro-shared.md` §2.1 P1 + P0 stubs (Playwright/Docker/审批 UI)

- [x] M01: Multi-company switcher dropdown in control room top bar (ref: docs/prd/modules/M01-company-workspace.md P-M01-01)
- [x] M16: Approval center panel — list pending + approve/reject (ref: docs/prd/modules/M16-auth-approval.md P-M16-01)
- [x] M16: Settings — ApiCredential form + masked display (ref: docs/prd/modules/M16-auth-approval.md P-M16-02)
- [x] M10: Playwright skill executor — browser_screenshot stub (ref: docs/prd/modules/M10-runtime-sandbox.md)
- [x] M10: code_run Docker sandbox session lifecycle (ref: docs/prd/modules/M10-runtime-sandbox.md SB-03)
- [x] M03: Asset reveal Tauri IPC — open in Explorer (ref: docs/prd/modules/M03-transcript-proof.md POST reveal)
- [x] M11: Model config settings UI — role routing editor (ref: docs/prd/modules/M11-model-router.md)
- [x] M11: POST /api/v1/model-configs/test connection endpoint (ref: docs/prd/modules/M11-model-router.md)
- [x] M09: KeyResult SQLite schema + KeyResultRepo CRUD (ref: docs/prd/modules/M01-company-workspace.md P1 OKR, C05)
- [x] M01: OKR tree view UI — Objective → Key Results (ref: docs/prd/modules/M01-company-workspace.md)
- [x] M05: ControlLoop progress rolls up KeyResult completion (ref: docs/prd/modules/M05-control-loop.md P1)
- [x] M03: Proof wall P1 — type/status filters + accept/reject proof (ref: docs/prd/modules/M03-transcript-proof.md)
- [x] M12: Tauri auto-update plugin scaffold (ref: docs/prd/modules/M12-platform-shell.md P1)

## Phase 5 — Real Runtime (M11 → M10 → M16 → M05 → M06 → M07 → M12)

> Source: Phase 5 roadmap — stub → production Agent loop

- [x] M11: OpenAI-compatible LLM HTTP client + ModelRouter.complete (ref: docs/prd/modules/M11-model-router.md)
- [x] M11: Ollama localhost chat API (ref: docs/prd/modules/M11-model-router.md MR-04)
- [x] M10: Real Docker code_run via docker run (ref: docs/prd/modules/M10-runtime-sandbox.md)
- [x] M10: Playwright browser_screenshot with playwright-core fallback (ref: docs/prd/modules/M10-runtime-sandbox.md)
- [x] M16+M10: High-risk skill approval gate on sandbox invoke (ref: docs/prd/modules/M16-auth-approval.md AU-01)
- [x] M05: Control loop pause at decide + POST advance API (ref: docs/prd/modules/M05-control-loop.md)
- [x] M06: Lead plan/synthesize via LLM complete (ref: docs/prd/modules/M06-lead-agent.md)
- [x] M07: Worker ReAct multi-step (max 2 skills) + llm usage on run (ref: docs/prd/modules/M07-worker-agent.md)
- [x] M02: Worker panel token/cost display (ref: docs/prd/modules/M02-department-task.md)
- [x] M12: Tray tooltip pending approval count (ref: docs/prd/modules/M12-platform-shell.md P-M12-02)
