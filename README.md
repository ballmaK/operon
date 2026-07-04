# Operon

跨平台 **0 人 Agent 公司**桌面应用（Windows 优先，Tauri 2）。

Inspired by [Matrix](https://matrix.build/zh/guide) — Operon 为独立实现，非官方 Matrix 产品。

## 文档

- [模块化 PRD 索引](docs/prd/README.md)
- [宏观共享 PRD](docs/prd/00-macro-shared.md)
- [Skills 安装说明](docs/SKILLS.md)

## 技术栈（规划）

| 层 | 选型 |
| --- | --- |
| 桌面壳 | Tauri 2 + React |
| 本地服务 | Sidecar（Rust/Node） |
| 存储 | SQLite + 本地文件（`%APPDATA%/operon/`） |
| 沙箱 | Docker Desktop（必选） |

## 开发

PRD 定稿后，使用 [prd-build-loop-skills](https://github.com/ballmaK/prd-build-loop-skills) 自动生成实现计划并循环编码：

```
/prd-build-loop
```

## 许可证

MIT
