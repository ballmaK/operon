# M10 — 运行时沙箱

> **宏观章节引用**：[00-macro-shared.md](../00-macro-shared.md)  
> **依赖**：M12、M11、M16 | **被依赖**：M07

---

## 文档信息

| 模块编号 | M10 |
| 模块名称 | 运行时沙箱 |
| 版本 | v0.3 |
| 优先级 | P0 |

---

## 模块职责

1. **技能注册表**：search、extract、browser、code、document 等。
2. **Playwright 浏览器自动化**（三平台）。
3. **代码沙箱**：**Docker 容器（MVP 必选，无降级）**。
4. **工具轨迹**：每次调用记录 input/output/耗时/截图。
5. **高风险技能**对接 M16 审批。

---

## 八、字段清单

### Skill

| 所属模块 | 字段名称 | 取值说明 | 字段说明 |
| -------- | -------- | -------- | -------- |
| 沙箱 | 技能编码 | 唯一 snake_case | 如 `web_search` |
| 沙箱 | 技能名称 | 展示名 | |
| 沙箱 | 风险等级 | low/medium/high | high 走审批 |
| 沙箱 | 所需运行时 | playwright/docker/subprocess | |
| 沙箱 | 支持平台 | win32/darwin/linux[] | 空=全平台 |

### SkillInvocation

| 所属模块 | 字段名称 | 取值说明 | 字段说明 |
| -------- | -------- | -------- | -------- |
| 沙箱 | 调用ID | UUID | |
| 沙箱 | 技能编码 | Skill.code | |
| 沙箱 | 输入参数 | JSON | |
| 沙箱 | 输出结果 | JSON | |
| 沙箱 | 耗时毫秒 | 整数 | |
| 沙箱 | 截图路径 | 相对路径 | browser 类 |

### SandboxSession

| 所属模块 | 字段名称 | 取值说明 | 字段说明 |
| -------- | -------- | -------- | -------- |
| 沙箱 | 会话ID | UUID | |
| 沙箱 | 运行时类型 | docker/subprocess/playwright | |
| 沙箱 | 工作目录 | 相对路径 | 公司隔离 |

---

## 技能清单（MVP）

| 编码 | 名称 | 运行时 | 风险 | Windows |
| ---- | ---- | ------ | ---- | ------- |
| web_search | 网页搜索 | playwright | low | ✅ |
| web_extract | 页面提取 | playwright | low | ✅ |
| browser_screenshot | 浏览器截图 | playwright | low | ✅ |
| file_write | 写本地文件 | subprocess | medium | ✅ |
| code_run | 执行代码 | docker | high | ✅ 仅 Docker |
| doc_generate | 生成文档 | subprocess | low | ✅ |

---

## 九、SandboxSession 状态机

| 状态 | 说明 |
| ---- | ---- |
| SBX_CREATING | 创建环境 |
| SBX_READY | 可执行 |
| SBX_RUNNING | 执行中 |
| SBX_DESTROYED | 已回收 |

---

## 十一、核心规则

| 编号 | 描述 |
| ---- | ---- |
| SB-01 | 每 Worker 独立 SandboxSession，结束销毁 |
| SB-02 | 工作目录限制在 `{DATA_DIR}/sandboxes/{runId}` |
| SB-03 | **Docker 为 MVP 硬依赖**（C02）；不可用则禁止派发含 `code_run` 的 Task |
| SB-04 | 网络访问仅允许 HTTP/HTTPS [待确认是否允许内网] |
| SB-05 | `file_write`/`doc_generate` 可用 subprocess；**`code_run` 仅 Docker** |
| SB-06 | Playwright 浏览器首次运行自动下载 Chromium |

---

## 跨平台实现矩阵

| 能力 | Windows | macOS | Linux |
| ---- | ------- | ----- | ----- |
| Playwright | `npx playwright install chromium` | 同 | 同 |
| Docker 沙箱 | Docker Desktop + WSL2 后端（**必选**） | Docker Desktop（**必选**） | Docker CE（**必选**） |
| 非容器文件技能 | subprocess 写文件/文档 | 同 | 同 |
| 路径长度 | 注意 MAX_PATH，启用长路径 [待确认] | — | — |

### Windows 特别说明

1. **首次启动**：M12 强制检测 Docker Desktop **已安装且运行中**（C02）。
2. **无 Docker**：禁止进入控制室；`code_run` 不可用，不降级子进程。
3. **Playwright**：使用 bundled Chromium，不依赖本机 Edge（可选 Edge Channel）。

---

## 场景8：Docker 未就绪阻断

见 [00-macro-shared.md](../00-macro-shared.md) 场景8。

---

## 接口契约

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | /api/v1/skills | 技能列表 |
| POST | /internal/sandbox/sessions | 创建会话 |
| POST | /internal/sandbox/invoke | 执行技能 |
| DELETE | /internal/sandbox/sessions/{id} | 销毁 |

```typescript
// invoke 请求结构
interface InvokeRequest {
  sessionId: string;
  skillCode: string;
  params: Record<string, unknown>;
  agentRunId: string;
}
```

---

## 十一、异常

| 编码 | 处理 |
| ---- | ---- |
| E-SB-01 | Playwright 浏览器未安装 | 引导一键安装 |
| E-SB-02 | Docker 未运行 | **阻断** Sidecar 启动；引导用户启动 Docker Desktop |
| E-SB-03 | 技能审批被拒 | 返回 403 + `approvalId`；M07 failed |

---

## 实现状态（Phase 5）

| 能力 | 状态 | 说明 |
| ---- | ---- | ---- |
| `browser_screenshot` Playwright | ✅ | `playwright-runner.ts`；optional 依赖 |
| Playwright 不可用时 PNG stub | ✅ | `OPERON_PLAYWRIGHT_STUB=1` |
| `code_run` Docker `node:20-alpine` | ✅ | `docker-runner.ts` |
| Docker 不可用时 stdout stub | ✅ | `OPERON_DOCKER_STUB=1`（测试） |
| 高风险 `code_run` 审批 gate（AU-01） | ✅ | `sandbox.ts` invoke 403 |
| web_search / web_extract | ⏳ | 注册表有，invoke 501 |
| SB-06 Chromium 自动下载 | ⏳ | 需用户/CI 安装 playwright 浏览器 |
