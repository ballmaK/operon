# M03 — 转录与证明（UI + 查询）

> **宏观章节引用**：[00-macro-shared.md](../00-macro-shared.md)  
> **依赖**：M09（数据） | **实体存储定义**：M09

---

## 文档信息

| 模块编号 | M03 |
| 模块名称 | 转录与证明 |
| 版本 | v0.1 |
| 优先级 | P0（UI）/ P1（证明墙增强） |

---

## 模块职责

1. 转录时间线 UI：全公司可读审计轨迹。
2. 证明墙：按 Objective/Task 聚合 Proof 与 Asset。
3. 资产库浏览器：本地文件预览与版本历史。
4. Owner 纠正过期假设（追加 Transcript，见 M09）。

---

## 八、字段清单（展示层）

> 存储字段见 [M09-data-persistence.md](./M09-data-persistence.md)

### Proof（展示聚合）

| 所属模块 | 字段名称 | 字段来源 | 取值说明 | 必填性 | 列表展示 | 可筛选 | 详情展示 | 字段说明 |
| -------- | -------- | -------- | -------- | ------ | -------- | ------ | -------- | -------- |
| 转录证明 | 证明类型 | 系统生成 | file/screenshot/test/url/transcript | 必填 | 是 | 多选 | 是 | |
| 转录证明 | 关联目标 | 系统生成 | Objective 标题 | 必填 | 是 | 多选 | 是 | |
| 转录证明 | 验收状态 | 系统生成 | pending/accepted/rejected | 必填 | 是 | 多选 | 是 | |
| 转录证明 | 资产预览 | 系统生成 | 缩略图/链接 | 选填 | 是 | 否 | 是 | |

### Transcript（展示）

| 所属模块 | 字段名称 | 列表展示 | 可筛选 | 详情展示 |
| -------- | -------- | -------- | ------ | -------- |
| 转录证明 | 时间戳 | 是 | 范围 | 是 |
| 转录证明 | 行为主体 | 是 | 多选 owner/lead/worker/system | 是 |
| 转录证明 | 行为类型 | 是 | 多选 | 是 |
| 转录证明 | 摘要 | 是 | 模糊 | 是 |

---

## 十一、核心规则

| 编号 | 描述 |
| ---- | ---- |
| TR-01 | Transcript 只追加不可删，Owner 纠正用新条目 |
| TR-02 | 证明墙仅展示已关联 Asset 的 Proof |
| PR-01 | 无 Proof 的 Task 不在证明墙显示为已完成 |

---

## 十四、页面规格

### P-M03-01 转录时间线

**筛选**：时间范围、行为主体、行为类型、部门、Objective。  
**行点击**：展开 JSON 载荷 + 跳转关联 Task/Handoff。

### P-M03-02 证明墙

卡片布局：证明类型图标 + 预览 + Objective 标签 + 时间。  
**行操作**：打开资产、跳转转录来源、跳转任务。

### P-M03-03 资产库

列表：名称、类型、版本、来源任务、路径（只读）。  
**预览**：Markdown/图片/代码本地渲染；Windows 路径点击「在资源管理器中显示」。

---

## 接口契约

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | /api/v1/companies/{id}/transcripts | 分页查询 |
| POST | /api/v1/transcripts/correct | Owner 纠正追加 |
| GET | /api/v1/companies/{id}/proofs | 证明墙 |
| GET | /api/v1/assets | 资产列表 |
| GET | /api/v1/assets/{id}/content | 预览内容 |
| POST | /api/v1/assets/{id}/reveal | 打开本地文件夹（M12 IPC） |

---

## 跨平台说明

- 「在资源管理器中显示」：Windows `explorer /select,`；macOS `open -R`；Linux `xdg-open`。
