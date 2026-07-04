# M08 — 交接协调

> **宏观章节引用**：[00-macro-shared.md](../00-macro-shared.md)  
> **依赖**：M06、M09 | **被依赖**：M02、M05

---

## 文档信息

| 模块编号 | M08 |
| 模块名称 | 交接协调 |
| 版本 | v0.1 |
| 优先级 | P0 |

---

## 模块职责

跨 Lead 结构化协作：上下文摘要 + 资产引用 + 明确请求 + 预期证明 + 回复交接。

---

## 八、字段清单 — Handoff

| 所属模块 | 字段名称 | 字段来源 | 取值说明 | 必填性 | 列表展示 | 详情展示 | 字段说明 |
| -------- | -------- | -------- | -------- | ------ | -------- | -------- | -------- |
| 交接 | 交接ID | 系统生成 | UUID | 必填 | 否 | 是 | |
| 交接 | 发起部门ID | 系统生成 | UUID | 必填 | 是 | 是 | |
| 交接 | 接收部门ID | 系统生成 | UUID | 必填 | 是 | 是 | |
| 交接 | 上下文摘要 | 系统生成 | ≤2000 字符 | 必填 | 否 | 是 | |
| 交接 | 资产引用 | 系统生成 | Asset.id[] | 选填 | 否 | 是 | |
| 交接 | 明确请求 | 用户/Lead | ≤1000 字符 | 必填 | 是 | 是 | HO-01 |
| 交接 | 预期证明类型 | 系统生成 | Proof 类型枚举 | 必填 | 否 | 是 | |
| 交接 | 交接状态 | 系统生成 | sent/accepted/replied/rejected | 必填 | 是 | 是 | |
| 交接 | 回复摘要 | 接收 Lead | ≤2000 字符 | 选填 | 否 | 是 | 回复交接 |

---

## 九、状态机

| 当前 | 目标 | 动作 | 执行方 |
| ---- | ---- | ---- | ------ |
| HOF_SENT | HOF_ACCEPTED | ACT_ACCEPT | 接收 Lead |
| HOF_SENT | HOF_REJECTED | ACT_REJECT | 接收 Lead |
| HOF_ACCEPTED | HOF_REPLIED | ACT_REPLY | 接收 Lead + Proof |

---

## 十一、核心规则

| 编号 | 描述 | 违反处理 |
| ---- | ---- | -------- |
| HO-01 | 必须含摘要+请求+预期证明 | 400 拒绝 |
| HO-02 | 资产引用须属同一 companyId | 校验失败 |
| HO-03 | 发送与回复均写 Transcript | 自动 |

---

## 场景4：Engineering → Marketing Handoff

**流程**：Eng Lead 创建 Handoff → Mkt Lead 接受 → 派发 Worker 写 release notes → Asset 产出 → ACT_REPLY → Eng/Ops 可引用。

---

## 接口契约

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| POST | /api/v1/handoffs | 创建 |
| GET | /api/v1/departments/{id}/handoffs/inbox | 收件箱 |
| POST | /api/v1/handoffs/{id}/accept | 接受 |
| POST | /api/v1/handoffs/{id}/reply | 回复 |
| POST | /api/v1/handoffs/{id}/reject | 拒绝 |
