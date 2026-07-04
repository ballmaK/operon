# M06 — Lead Agent 服务

> **宏观章节引用**：[00-macro-shared.md](../00-macro-shared.md)  
> **依赖**：M09、M11、M07 | **被依赖**：M05、M08

---

## 文档信息

| 模块编号 | M06 |
| 模块名称 | Lead Agent 服务 |
| 版本 | v0.2 |
| 优先级 | P0 |

---

## 模块职责

1. **持久 Agent**：每部门一个 Lead，跨会话保留上下文。
2. **规划**：将 Objective 分解为 Task 列表与允许 Skills。
3. **派发**：调用 M07 创建 Worker，仅传 narrow brief + minimalMemory。
4. **综合**：收集 Proof，生成决策请求，更新 Memory。
5. **记忆**：读写 M09 Memory.md。

---

## 七、实体 — LeadAgent

| 属性 | 说明 |
| ---- | ---- |
| id | UUID |
| departmentId | 1:1 部门 |
| modelProfile | 引用 M11 规划型模型 |
| systemPrompt | 含章程注入 |

---

## 八、字段清单 — Memory（Lead 读写）

| 所属模块 | 字段名称 | 字段来源 | 取值说明 | 字段说明 |
| -------- | -------- | -------- | -------- | -------- |
| Lead | 记忆内容 | 系统+Lead | Markdown ≤100KB | Memory.md 全文 |
| Lead | 版本号 | 系统生成 | 整数递增 | 每次 Lead 更新 +1 |
| Lead | 决策记录 | Lead 写入 | MD 列表项 | 重要决策 |
| Lead | 未决阻塞 | Lead 写入 | MD 列表项 | 未解决项 |
| Lead | 交接摘要 | Lead 写入 | MD 列表项 | 来自 Handoff |

---

## 十一、核心规则

| 编号 | 描述 |
| ---- | ---- |
| LE-01 | Worker 仅接收 minimalMemory（≤2KB 摘要），禁止全量 Memory |
| LE-02 | Lead 更新 Memory 必须 append 决策段落，禁止静默覆盖 |
| LE-03 | 规划模型默认 claude-sonnet / gpt-4 级别 [可配置 M11] |
| LE-04 | Memory 超 80KB 触发自动摘要压缩 |

---

## 场景6：一个月后记忆恢复

**流程**：Owner 打开 Objective → 请求摘要 → M06 读 Memory.md → 返回定位/异议/未决包装 → Owner 纠正 → append Transcript + 更新 Memory。

---

## 接口契约（内部）

| 函数 | 输入 | 输出 |
| ---- | ---- | ---- |
| `lead.plan(objectiveId, departmentId)` | 意图+Memory | `Promise<Task[]>` |
| `lead.dispatch(taskId, minimalMemory)` | Task | `Promise<{ taskId, workerRunId }>` |
| `lead.synthesize(objectiveId, departmentId)` | Proof[] | `Promise<SynthesisReport>` |
| `lead.readMemory(deptId)` | — | Markdown |
| `lead.patchMemory(deptId, delta)` | 结构化 delta | version |

**HTTP 路由**（Sidecar）：`POST /api/v1/leads/plan|dispatch|synthesize`

---

## 实现状态（Phase 5）

| 能力 | 状态 | 说明 |
| ---- | ---- | ---- |
| plan 走 M11 `lead_plan` LLM | ✅ | brief 取自 LLM 输出 |
| synthesize 走 M11 `lead_synth` LLM | ✅ | summary 写入 Memory.md |
| LE-04 Memory 80KB 自动压缩 | ⏳ | 未实现 |

---

## Prompt 结构（AI 编码参考）

```
[System] 你是 {department} Lead。章程：{charter}
[Memory] {memory.md 全文或摘要}
[Objective] {title} 约束：{constraints}
[Instruction] 生成 Task 列表，每 Task 含 brief、allowedSkills、expectedProof
```
