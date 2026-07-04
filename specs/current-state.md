# Current State — Operon

> Last updated: 2026-07-05 (prd-build-loop session 7 — Phase 2 complete)

## Progress

| Phase | Status |
| ----- | ------ |
| Phase 0 Platform | 12 / 12 ✅ |
| Phase 1 Core Loop | 11 / 11 ✅ |
| **Phase 2 Core UI** | **6 / 6 ✅** |
| Phase 3 Rhythm | 0 / 4 |

## Phase 2 完整交付

### M02 部门与任务
- **API** `GET /departments/:id/tasks`、`GET /tasks/:id`、`GET /tasks/:id/runs`、`GET /workers/:id`
- **UI** 部门侧栏（活跃任务数）、任务列表、Worker 执行实况面板（2s 轮询）

### M03 转录与证明
- **API** Transcript 筛选（actor/actionType）、`POST /transcripts/correct`
- **API** `GET /companies/:id/proofs`、`GET /companies/:id/assets`、`GET /assets/:id/content`
- **UI** 转录时间线（筛选 + 展开 JSON + Owner 纠正）
- **UI** 证明墙卡片、资产库列表 + 文本预览

### 控制室导航
顶栏 Tab：控制室 | 任务 | 转录 | 证明墙 | 资产库

## Tests

```bash
pnpm test   # 59 tests passing
```

## Next up

1. **Phase 3** M08: Handoff create + accept flow
2. M08: Cross-Lead handoff notification
3. M04: Daily/weekly rhythm scheduler

## Blockers

- None
