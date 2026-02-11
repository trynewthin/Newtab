# App System Architecture Report (2026-02-11)

## Goal
保留 app 的三层结构（背景层 / 内容层 / 浮动层），并让 `modal` 与 `sidebar` 通过统一底层适配承载，避免 app 代码和承载形态强耦合。

## 核心问题（改造前）
1. 元数据和运行时配置分散：manifest、registry、host 多处重复。
2. 承载策略分裂：`SystemDialogHost` 与 `SidebarPane` 分别硬编码 app 分支。
3. app 内部直接操作全局 UI store：难以在 modal/sidebar/page 之间复用。
4. 图标层重复包装：多个 `*AppIcon` 文件仅做同构透传，维护噪音高。

## 目标架构
1. **单一事实源（Manifest）**
- `src/apps/launcher/system/appManifest.ts`
- 统一 app id、图标、承载能力、默认启动策略。

2. **统一启动入口（Launcher）**
- `src/apps/launcher/system/useAppLauncher.ts`
- 所有 app 启动（modal/sidebar/page）走同一 hook。

3. **统一运行时注册（Runtime Registry）**
- `src/apps/launcher/system/appRuntimeRegistry.tsx`
- modal/sidebar 渲染器集中注册，host 不再写死分支。

4. **统一承载桥接（Surface Bridge）**
- `src/apps/launcher/system/appSurfaceBridge.tsx`
- 向 app 暴露 `openSurface/close/supports`，隔离对全局 store 的直接依赖。

5. **三层底座（Layer Shell）**
- `src/platform/shared/components/surface/AppLayerShell.tsx`
- 统一背景层、内容层、浮动层装配。

## 已落地改造
### Host 层
- `src/apps/launcher/system/SystemDialogHost.tsx`
  - 从“硬编码每个 dialog”改为“按 runtime registry 挂载”。
- `src/surfaces/sidepanel/App.tsx`
  - side panel 页面按 `?app=` + runtime registry 动态挂载，不再依赖 newtab 内抽屉 host。

### App 层
- `src/apps/paper/PaperEditor.tsx`
  - modal/sidebar/page 切换改为调用 surface bridge/launcher，不再直接耦合 UI store。
- `src/apps/ai-companion/sidepanel/AiSideApp.tsx`
  - 增加 `onClose` 适配能力，纳入统一 sidebar runtime。

### 侧栏三层
- `src/platform/shared/components/sidepanel/BaseSidePage.tsx`
  - 切换到 `AppLayerShell`，并统一顶部 app 切换行为走 launcher。

### 精简与收敛
- 删除重复 `*AppIcon` 包装与 `launcher/registry.tsx`。
- `GridItem` 统一使用 `SystemAppItem`。
- 修复 `SystemAppItem` 点击事件吞没，确保 Ctrl/Alt 启动策略生效。

### 路由与分包（第二阶段）
- `src/surfaces/newtab/AppRouter.tsx`
  - page 路由改为从 manifest + runtime registry 自动挂载。
- `src/apps/launcher/system/appRuntimeRegistry.tsx`
  - 增加 DEV 契约校验：manifest 声明支持 modal/sidebar/page 的 app 必须有对应 renderer。
- `src/apps/paper/PaperEditor.tsx` + `src/apps/paper/PaperMarkdownEditor.tsx`
  - markdown 编辑器拆为二级懒加载模块，Paper 壳层与重依赖解耦。

### 类型契约与侧栏轻量化（第三阶段）
- `src/apps/launcher/system/appManifest.ts`
  - 改为 `as const satisfies`，保留 surface 字面量类型。
- `src/apps/launcher/system/appRuntimeRegistry.tsx`
  - 基于 manifest 字面量推导 surface 覆盖编译期约束（不满足直接编译报错）。
- `src/apps/paper/PaperEditor.tsx`
  - 在 `isSidebar=true` 路径使用轻量 textarea，避免侧栏交互触发重编辑器模块加载。

### Paper 重包压缩（第四阶段）
- `src/apps/paper/PaperMarkdownEditor.tsx`
  - 切换到 `@uiw/react-md-editor/nohighlight` 入口。
- 体积结果（minified）
  - `PaperMarkdownEditor`：`1547.98 kB` -> `275.97 kB`。
- 体积结果（gzip）
  - `545.73 kB` -> `88.77 kB`。
- 构建输出
  - 已不再出现 `>500 kB` 的 chunk 告警。

### Modal 首开体感优化（第五阶段）
- 问题定位
  - 首次点击 app 打开 modal 时，延迟主要来自首次 lazy runtime 加载（非动画实现问题）。
- 方案
  - 空闲预热：`src/surfaces/newtab/pages/DashboardView.tsx` 在 idle 时调用 `warmupModalRuntimes`。
  - 悬停预热：`src/apps/launcher/system/SystemAppItem.tsx` 在 hover/focus/touchstart 单次触发预热。
  - 点击兜底：`src/apps/launcher/system/useAppLauncher.ts` 在 modal 打开前再触发一次 `preloadModalRuntime`。
- 结果
  - 未修改原有 modal 动画参数与组件，优化仅作用于资源就绪时机。

### Side Panel 语义纠正（第六阶段）
- 问题
  - 之前将 `sidebar` 实现为 newtab 内右侧抽屉，和产品语义（浏览器 side panel 页面）不一致。
- 修正
  - `useAppLauncher` 的 `sidebar` surface 绑定 `chrome.sidePanel.setOptions/open`。
  - `src/surfaces/sidepanel/App.tsx` 改为按 `?app=` 参数动态挂载 sidebar app。
  - 移除 newtab 内右侧抽屉承载（删除 `SidebarPane`）。
- 结果
  - `sidebar` 承载语义与浏览器原生 side panel 对齐，后续架构扩展路径清晰。

### 状态残留清理（第七阶段）
- `src/apps/launcher/store/ui.ts`
  - 移除 `activeSidebarPanel/setSidebarPanel`，避免历史语义残留。
- `src/apps/launcher/system/useAppLauncher.ts`
  - `sidebar` 路径仅负责 browser side panel 打开与切换，不再写入本地侧栏状态。
- `src/platform/shared/components/sidepanel/BaseSidePage.tsx`
  - app 选中态来源统一为 surface bridge 当前 app。

## 设计准则（后续新增 app 必须遵守）
1. app 元数据只加在 `appManifest.ts`。
2. app modal/sidebar 渲染器只加在 `appRuntimeRegistry.tsx`。
3. app 内承载切换只通过 bridge（`openSurface`），不直接改 UI store。
4. 侧栏/弹窗 host 不写 app-specific 分支。
5. 三层视图优先通过 `AppLayerShell` 或同等三层容器实现。

## 后续迁移建议
1. 将更多 app（如 settings、todo）按同样 bridge 模式逐步迁移。
2. 将 DEV 契约校验升级为单元测试/CI 检查，避免回归依赖运行时告警。
3. 对 `PaperMarkdownEditor` 进一步做功能分级（编辑/预览分离）以继续压缩重包。
