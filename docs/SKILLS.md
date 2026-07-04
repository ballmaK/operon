# Skills 安装说明

> GitHub 网络不稳定时，技能已**手动安装**到本地。网络恢复后可重新运行 `npx skills@latest add` 同步官方最新版。

## 已安装 — 全局 (`~/.agents/skills/`)

| Skill | 来源 |
| ----- | ---- |
| grill-me, grilling | mattpocock/skills |
| setup-matt-pocock-skills | mattpocock/skills |
| grill-with-docs | mattpocock/skills |
| to-prd | mattpocock/skills |
| to-issues | mattpocock/skills |
| tdd | mattpocock/skills |
| domain-modeling | mattpocock/skills |
| handoff | mattpocock/skills |
| ralph-init | tradesdontlie/ralph-loop-skills |
| ralph-implement | tradesdontlie/ralph-loop-skills |
| ralph-loop | tradesdontlie/ralph-loop-skills |

## 项目级编排 Skill（独立 GitHub 仓库）

| Skill | 安装源 |
| ----- | ------ |
| **prd-build-loop** + ralph-* | https://github.com/ballmaK/prd-build-loop-skills |

```bash
npx skills@latest add ballmaK/prd-build-loop-skills --agent cursor -y -g
```

或手动复制到目标项目：`.cursor/skills/prd-build-loop/`

## 网络恢复后同步命令

```bash
npx skills@latest add mattpocock/skills \
  --skill setup-matt-pocock-skills --skill grill-with-docs \
  --skill to-issues --skill tdd --skill domain-modeling \
  --skill to-prd --skill handoff --skill grilling --skill grill-me \
  --agent cursor -y -g

npx skills@latest add tradesdontlie/ralph-loop-skills --agent cursor -y -g
```

## 使用流程

```mermaid
flowchart LR
    A[定稿 docs/prd/] --> B["/prd-build-loop"]
    B --> C[生成 active-plan.md]
    C --> D[ralph-implement + tdd]
    D --> E{还有未勾选?}
    E -->|是| F[handoff 或 continue]
    F --> D
    E -->|否| G[完成]

    H[新 Phase N+1] --> I[先改 PRD 增量]
    I --> J[用户确认]
    J --> K[parseN / 追加 plan]
    K --> D

    style B fill:#312e81,stroke:#818cf8,color:#e2e8f0
    style G fill:#14532d,stroke:#4ade80,color:#e2e8f0
    style I fill:#7c2d12,stroke:#fb923c,color:#e2e8f0
```
