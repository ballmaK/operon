# M11 — 模型路由

> **宏观章节引用**：[00-macro-shared.md](../00-macro-shared.md)  
> **依赖**：M12、M16 | **被依赖**：M06、M07

---

## 文档信息

| 模块编号 | M11 |
| 模块名称 | 模型路由 |
| 版本 | v0.1 |
| 优先级 | P0（路由）/ P1（UI 配置）

---

## 模块职责

1. 按 **角色**（Lead/Worker）和 **任务类型** 选择 LLM。
2. 统一 OpenAI-compatible / Anthropic API 适配。
3. Token 计量与成本估算（供 M02 展示、P2 VPTD）。
4. 失败降级与重试。

---

## 八、字段清单 — ModelConfig

| 所属模块 | 字段名称 | 字段来源 | 取值说明 | 编辑页 | 字段说明 |
| -------- | -------- | -------- | -------- | ------ | -------- |
| 模型路由 | 配置ID | 系统生成 | UUID | 只读 | |
| 模型路由 | 角色 | 用户填写 | lead_plan/lead_synth/worker_code/worker_research/worker_default | 可编辑 | |
| 模型路由 | 提供商 | 用户填写 | openai/anthropic/deepseek/ollama | 可编辑 | |
| 模型路由 | 模型名 | 用户填写 | 字符串 | 可编辑 | 如 gpt-4o |
| 模型路由 | API 基址 | 用户填写 | URL，Ollama 本地可选 | 可编辑 | Windows localhost |
| 模型路由 | 温度 | 用户填写 | 0-2，默认 Lead 0.3 Worker 0.1 | 可编辑 | |
| 模型路由 | 最大 Token | 用户填写 | 整数 | 可编辑 | |
| 模型路由 | 输入单价 | 用户填写 | $/1M tokens | 可编辑 | 可自动拉取 P2 |
| 模型路由 | 输出单价 | 用户填写 | $/1M tokens | 可编辑 | |

---

## 默认路由策略（MVP）

| 角色/场景 | 默认模型 | 降级 |
| --------- | -------- | ---- |
| Lead 规划 | claude-sonnet-4 / gpt-4o | deepseek-chat |
| Lead 综合 | 同规划 | 同 |
| Worker 代码 | gpt-4o / deepseek-coder | ollama codellama |
| Worker 研究 | gpt-4o-mini | deepseek-chat |
| Worker 默认 | gpt-4o-mini | 本地 ollama |

---

## 十一、核心规则

| 编号 | 描述 |
| ---- | ---- |
| MR-01 | 调用前检查 M16 ApiCredential 存在 |
| MR-02 | 单 Worker 运行 token 预算默认 100k [待确认] |
| MR-03 | 5xx 重试 3 次指数退避 |
| MR-04 | 支持 Ollama 离线模式（Windows localhost:11434） |

---

## 计算规则

| 编号 | 公式 |
| ---- | ---- |
| CR-M11-01 | cost = inputTokens×inputPrice/1e6 + outputTokens×outputPrice/1e6 |

---

## 接口契约

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET/PUT | /api/v1/model-configs | 配置列表 |
| POST | /internal/llm/complete | 内部统一补全 |
| POST | /api/v1/model-configs/test | 测试连接 |

```typescript
interface LlmCompleteRequest {
  role: 'lead_plan' | 'lead_synth' | 'worker_code' | 'worker_research' | 'worker_default';
  messages: Message[];
  tools?: ToolDefinition[];
  agentRunId: string;
}
```

---

## 跨平台说明

- **Ollama**：Windows 可选本地推理，减 API 成本；检测 `http://127.0.0.1:11434`。
- **代理**：读取系统环境变量 `HTTP_PROXY`（Windows 企业网络常见）。
