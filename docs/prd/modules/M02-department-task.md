# M02 — 部门与任务

> **宏观章节引用**：[00-macro-shared.md](../00-macro-shared.md)  
> **依赖**：M01、M05、M07、M09 | **被依赖**：M08

---

## 文档信息

| 模块编号 | M02 |
| 模块名称 | 部门与任务 |
| 版本 | v0.2 |
| 优先级 | P0 |

---

## 模块职责

1. 部门 CRUD：类型、章程、Lead 绑定、quiet/archived 状态。
2. Task 列表与详情：派发状态、Worker 执行实况。
3. WebSocket/SSE 订阅 AgentRun 日志与截图（连接 M07/M10）。

---

## 八、字段清单

### Department

| 所属模块 | 字段名称 | 字段来源 | 取值说明 | 必填性 | 新增页 | 编辑页 | 列表展示 | 可筛选 | 详情展示 | 字段说明 | 备注 |
| -------- | -------- | -------- | -------- | ------ | ------ | ------ | -------- | ------ | -------- | -------- | ---- |
| 部门任务 | 部门ID | 系统生成 | UUID | 必填 | 不展示 | 只读 | 否 | 精确 | 是 | | |
| 部门任务 | 部门类型 | 用户填写 | product/research/growth/engineering/operations/finance/marketing/design | 必填 | 可编辑 | 只读 | 是 | 多选 | 是 | 公司内唯一 | DR-M02-01 |
| 部门任务 | 部门章程 | 用户填写 | ≤1000 字符 | 必填 | 可编辑 | 可编辑 | 否 | 否 | 是 | 路由边界 | DE-01 |
| 部门任务 | 部门状态 | 系统生成 | active/quiet/archived | 必填 | 不展示 | 只读 | 是 | 多选 | 是 | | |
| 部门任务 | Lead Agent ID | 系统生成 | UUID | 必填 | 不展示 | 只读 | 是 | 否 | 是 | | |

### Task

| 所属模块 | 字段名称 | 字段来源 | 取值说明 | 必填性 | 新增页 | 编辑页 | 列表展示 | 可筛选 | 详情展示 | 字段说明 | 备注 |
| -------- | -------- | -------- | -------- | ------ | ------ | ------ | -------- | ------ | -------- | -------- | ---- |
| 部门任务 | 任务ID | 系统生成 | UUID | 必填 | 不展示 | 只读 | 否 | 精确 | 是 | | |
| 部门任务 | 任务简报 | 系统生成 | ≤3000 字符 | 必填 | 只读 | 只读 | 否 | 否 | 是 | Worker 窄 brief | |
| 部门任务 | 允许技能 | 系统生成 | Skill.code[] | 必填 | 不展示 | 只读 | 否 | 否 | 是 | | SK-01 |
| 部门任务 | 任务状态 | 系统生成 | pending/running/proof/done/failed/cancelled | 必填 | 不展示 | 只读 | 是 | 多选 | 是 | | |
| 部门任务 | 预期证明类型 | 系统生成 | file/screenshot/test/url | 必填 | 不展示 | 只读 | 否 | 否 | 是 | | |

### AgentRun

| 所属模块 | 字段名称 | 字段来源 | 取值说明 | 必填性 | 新增页 | 编辑页 | 列表展示 | 可筛选 | 详情展示 | 字段说明 | 备注 |
| -------- | -------- | -------- | -------- | ------ | ------ | ------ | -------- | ------ | -------- | -------- | ---- |
| 部门任务 | 运行ID | 系统生成 | UUID | 必填 | 不展示 | 只读 | 否 | 精确 | 是 | | |
| 部门任务 | Token 消耗 | 系统生成 | 整数 | 必填 | 不展示 | 只读 | 是 | 范围 | 是 | | CR 见 M11 |
| 部门任务 | 运行成本 | 系统生成 | 美元小数 | 必填 | 不展示 | 只读 | 是 | 否 | 是 | | |

---

## 九、状态机 — Task

| 状态 | 终态 | 关键流转 |
| ---- | ---- | -------- |
| TSK_PENDING | 否 | dispatch → RUNNING |
| TSK_RUNNING | 否 | submit → PROOF；fail → FAILED |
| TSK_PROOF | 否 | accept → DONE；redispatch → RUNNING |
| TSK_DONE | 是 | — |
| TSK_FAILED | 是 | 可新建后续 Task |

---

## 十四、页面规格

### P-M02-01 部门列表

列表：类型、状态、Lead 名、活跃 Task 数、最近活动。行操作：查看详情、归档。

### P-M02-02 部门详情

Tab：章程、Memory 摘要（链 M06）、活跃 Task、Handoff inbox 入口。

### P-M02-03 任务执行实况

```
+----------+------------------------+------------------+
| Task信息 |  实时日志 WebSocket     | 工具轨迹+截图    |
| 技能列表 |  (滚动)                | (预览)           |
+----------+------------------------+------------------+
```

**状态 UI**：RUNNING 动画；PROOF 显示验收按钮（Lead 侧，Owner 只读）；FAILED 红色+跳转转录。

**Phase 5 已实现**：Worker 执行卡片展示 **LLM Tokens（in/out）、预估成本（USD）、ReAct 步数**（来自 `GET /api/v1/workers/{id}` 的 `metrics` 字段）。

---

## 接口契约

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| POST | /api/v1/companies/{id}/departments | 创建部门 |
| GET | /api/v1/departments/{id}/tasks | Task 列表 |
| GET | /api/v1/tasks/{id} | Task 详情 |
| GET | /api/v1/tasks/{id}/runs | AgentRun 列表 |
| GET | /api/v1/workers/{id} | Worker 实况 + metrics |
| WS | /ws/tasks/{id} | 实时日志流（待实现） |

---

## 实现状态（Phase 5）

| 能力 | 状态 | 说明 |
| ---- | ---- | ---- |
| Worker token/成本展示 | ✅ | P-M02-03 `WorkerExecutionPanel` |
| WebSocket 实时日志 | ⏳ | 当前 2s 轮询 |

---

## 跨平台说明

- WebSocket 统一走 localhost Sidecar，Windows 防火墙需本地回环豁免（安装器配置）。
