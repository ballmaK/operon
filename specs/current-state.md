# Current State — Operon

> Last updated: 2026-07-05 (prd-build-loop — **Phase 5 complete, all 56/56 tasks**)

## Progress

| Phase | Status |
| ----- | ------ |
| Phase 0 Platform | 12 / 12 ✅ |
| Phase 1 Core Loop | 11 / 11 ✅ |
| Phase 2 Core UI | 6 / 6 ✅ |
| Phase 3 Collaboration & Rhythm | 4 / 4 ✅ |
| Phase 4 MVP Hardening & P1 | 13 / 13 ✅ |
| **Phase 5 Real Runtime** | **10 / 10 ✅** |

**Active plan: 56 / 56 tasks complete.**

## Phase 5 交付

### 真实运行时
- **ModelRouter.complete** — OpenAI 兼容 HTTP + Ollama，测试/离线自动 stub 回退
- **Sandbox** — 真实 `docker run` + Playwright 截图（optional），`OPERON_*_STUB` 测试开关
- **审批门控** — 高风险技能 `code_run` invoke 需 Owner 批准（AU-01）
- **ControlLoop** — decide 阶段暂停 `waiting_owner`，`POST /control-loops/:id/advance` 完成
- **Lead/Worker** — plan/synthesize/ReAct 走 LLM；Worker metrics 表 + 面板 token/成本展示
- **托盘** — 待审批计数同步到 tooltip

## Tests

```bash
pnpm test   # run after Phase 5 merge
```

## Blockers

- None

## Next up

PRD Phase 0–5 全部实现完毕。可选：生产 LLM 密钥管理、Playwright 浏览器安装、P2 云同步。
