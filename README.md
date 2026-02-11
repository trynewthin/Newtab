# Newtab

一个基于 `React + Vite + Chrome Extension (MV3)` 的新标签页项目，当前开发分支为 `dev`。  
项目目标是提供可扩展的启动台（App + 组件）体验，并保持简约、统一的界面语言。

## 当前状态

- 应用内部版本：`v0.2`（`src/platform/core/constants.ts`）
- 扩展清单版本：`1.0.0`（`manifest.json`）
- 包管理与脚本：`bun`

## v0.2 重点更新

- 主页与应用容器升级为三层模型：背景层 / 内容层 / 浮动层。
- 统一 App Surface 基建：支持 `free` / `semi` / `sidebar` 形态。
- 启动台网格与拖拽补位算法重构，支持多比例组件与更稳定的补位行为。
- 组件体系独立化：组件可独立于 App 存在，并支持多尺寸展示。
- 时钟组件升级（多比例适配 + 信息密度优化）。
- 设置页数据体系升级：导出备份携带版本，导入时自动迁移处理。
- UI 视觉方向收敛为简约中性风格（减少高饱和彩色干扰）。
- 移除部分旧模块：`todo`、`pomodoro`、`paper`。

## 快速开始

```bash
bun install
bun run dev
```

默认开发端口：`5173`

## 构建

```bash
bun run build
bun run preview
```

## 作为 Chrome 扩展使用

1. 执行 `bun run build`
2. 打开 `chrome://extensions`
3. 开启开发者模式
4. 选择“加载已解压的扩展程序”
5. 选择项目下的 `dist` 目录

## 目录概览

- `src/surfaces/newtab`：新标签页主界面（背景层/内容层/浮动层/路由）
- `src/apps/launcher`：启动台核心（网格、拖拽、文件夹、系统应用、组件）
- `src/apps/settings`：设置中心（外观、功能、数据、关于）
- `src/platform/shared`：通用 UI 基建（modal/sidebar/surface/layout）
- `src/platform/state`：状态与持久化（含备份导入导出）
- `src/components`：视觉与效果组件（GlassSurface、GradualBlur 等）

## 开发说明

- 系统 App 可在 `src/apps/launcher/system/appManifest.ts` 里按需启用/屏蔽。
- 更新日志与版本展示由 `APP_METADATA` 驱动（`src/platform/core/constants.ts`）。
- 当前项目已全面切换为 Bun 工作流，默认使用 `bun` 执行脚本。
