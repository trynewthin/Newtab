export * from './core/types';
export * from './core/storage';
export * from './modules/ui';
export * from './modules/settings';
export * from './modules/pomodoro';
export * from './modules/todo';
export * from './modules/tag';

import { useSettingsStore } from './modules/settings';
import { usePomodoroStore } from './modules/pomodoro';
import { useTodoStore } from './modules/todo';
import { useTagStore } from './modules/tag';
import { storageRegistry } from './persistence/registry';

// ============================================================================
// Store Binding / Auto-Registration
// ============================================================================
// 这里的代码负责将 Store 的刷新能力 (Rehydration) 绑定到 unified registry。
// 这样做的目的是为了解耦：
// - Modules 不需要知道 Registry 的存在
// - Sync/Backup 只需要和 Registry 交互，不需要导入具体的 Modules
// ============================================================================

storageRegistry.registerRehydrator('app-settings', () => useSettingsStore.persist.rehydrate());
storageRegistry.registerRehydrator('app-pomodoro', () => usePomodoroStore.persist.rehydrate());
storageRegistry.registerRehydrator('app-todos', () => useTodoStore.persist.rehydrate());
storageRegistry.registerRehydrator('app-tags', () => useTagStore.persist.rehydrate());
