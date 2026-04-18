# Newtab

一个基于 `React + Vite + Chrome Extension (MV3)` 的新标签页项目，当前开发分支为 `dev`。  
项目目标是提供可扩展的启动台（App + 组件）体验，并保持简约、统一的界面语言。

## 当前状态

- 扩展清单版本：`1.0.0`（`manifest.json`）
- 包管理与脚本：`bun`

## v0.3 重点更新

- 新增首次运行引导向导（5 步），支持备份恢复、语言/材质/主题偏好设置。
- 默认背景切换为动态色带流形（color-bends），默认材质切换为磨砂玻璃（mac-frosted）。
- AlertDialog 与 ContextMenu 接入 AppSurface 玻璃材质体系，修复浅色模式下颜色可读性问题。
- 设置页新增「重置并重新初始化」功能，含二次确认对话框。
- 备份 schema 升级至 V3，支持自动迁移（`isFirstRun` 兼容）。
- 构建流程优化：启用 terser 混淆压缩，chunk 文件名 hash 化。

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

生产构建使用 terser 混淆压缩，chunk 文件名自动 hash 化。

## 作为 Chrome 扩展使用

1. 执行 `bun run build`
2. 打开 `chrome://extensions`
3. 开启开发者模式
4. 选择"加载已解压的扩展程序"
5. 选择项目下的 `dist` 目录

## 目录概览

- `src/surfaces/newtab`：新标签页主界面（背景层/内容层/浮动层/路由）
- `src/launcher`：启动台核心（网格、拖拽、文件夹、系统应用、组件）
- `src/apps`：应用模块（settings、search、onboarding 等）
- `src/components`：通用 UI primitive 与基础控件
- `src/platform`：平台层 UI、持久化、i18n、存储适配
- `src/config`：用户偏好与 app-state
- `src/shared` / `src/core`：共享类型、常量、纯工具、视觉计算

## 开发说明

- 系统 App 可在 `src/launcher/registry/appManifest.ts` 里按需启用/屏蔽。
- 当前项目已全面切换为 Bun 工作流，默认使用 `bun` 执行脚本。
- 国际化资源位于 `src/platform/i18n`。
