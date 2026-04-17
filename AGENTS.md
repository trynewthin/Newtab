# Newtab Project Rules

## Core Goals
- 保持模块低耦合，模块应能被低成本删除。
- 保持清晰分层，修改 UI、状态、运行时注册、持久化时不要互相缠绕。
- 保持基础代码质量，避免继续累积明显的类型、副作用、hooks 债务。

## Module Boundaries
- 跨模块引用必须优先走该模块的公开出口 `index.ts`。
- 不要从模块外部深层引用 `@/apps/*/store`、`@/apps/*/manifest`、`@/apps/*/dialog` 这类内部文件。
- 模块内部可以引用本模块内部文件；模块外部只能依赖公开 API。

## Layering
- `surfaces` 负责页面/扩展入口装配，不承载业务实现细节。
- `launcher` 负责启动台运行时、注册、布局和交互编排。
- `apps` 负责具体功能模块，尽量通过 manifest/store/dialog/index 暴露能力。
- `platform` 负责持久化、UI 容器、平台适配、跨上下文同步。
- `shared` / `core` 放通用类型、常量、纯工具；不要反向依赖上层业务模块。

## Removability
- 新增/删除 app 时，优先把改动限制在：
  - `src/apps/<feature>`
  - `src/launcher/registry/appManifest.ts`
  - 必要的公开出口 `index.ts`
- 避免把 feature-specific 逻辑散落到 `surfaces`、`platform`、`shared`。

## Quality Bar
- 新代码默认不用 `any`，除非有明确边界理由。
- effect 只做同步外部系统或订阅，不在 effect 里堆业务流程。
- 避免 render 阶段写 `ref`、动态声明组件、跨层直接操作内部状态。
- 改动后至少验证受影响范围；如果全量 lint 失败，要说明是存量问题还是新增问题。

## Working Rules
- 不要回退用户已有改动。
- 先收口边界，再做功能修改。
- 涉及架构调整时，优先减少 import 耦合和隐式依赖。
